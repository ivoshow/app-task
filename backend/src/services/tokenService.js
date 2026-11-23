// Tokens:
//  - ACCESS TOKEN (JWT, 15 min): vai em cada requisição no header Authorization.
//  - REFRESH TOKEN (aleatório, 30 dias): serve só para pegar um novo access token.
//    É guardado no banco apenas como hash SHA-256 e é ROTACIONADO a cada uso.
//    Se um refresh token já usado aparecer de novo, é sinal de roubo: derrubamos
//    toda a "família" de sessões daquele login.
import { createHash, randomBytes, randomUUID } from "node:crypto"
import jwt from "jsonwebtoken"
import { env } from "../config/env.js"
import { db, transaction } from "../db/database.js"
import { nowISO } from "../utils/dates.js"
import { unauthorized } from "../utils/AppError.js"

const sha256 = value => createHash("sha256").update(value).digest("hex")

export function signAccessToken(user) {
  return jwt.sign({ ver: user.token_version }, env.jwtSecret, {
    subject: user.id,
    algorithm: "HS256",
    expiresIn: env.accessTokenTtl,
    issuer: env.jwtIssuer,
    audience: env.jwtAudience
  })
}

export function verifyAccessToken(token) {
  // algorithms fixo: impede ataques do tipo "alg: none"
  return jwt.verify(token, env.jwtSecret, {
    algorithms: ["HS256"],
    issuer: env.jwtIssuer,
    audience: env.jwtAudience
  })
}

function createRefreshToken(userId, familyId = randomUUID()) {
  const token = randomBytes(48).toString("base64url")
  const expiresAt = new Date(Date.now() + env.refreshTokenDays * 24 * 60 * 60 * 1000).toISOString()
  db.prepare(
    `INSERT INTO refresh_tokens (id, user_id, token_hash, family_id, expires_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(randomUUID(), userId, sha256(token), familyId, expiresAt)
  return token
}

/** Gera o par de tokens de uma nova sessão (login/cadastro). */
export function issueSession(user, familyId) {
  return {
    accessToken: signAccessToken(user),
    refreshToken: createRefreshToken(user.id, familyId),
    expiresIn: env.accessTokenTtl
  }
}

/** Troca um refresh token válido por um novo par (rotação). */
export function rotateRefreshToken(refreshToken) {
  const result = transaction(() => {
    const stored = db
      .prepare(
        `SELECT rt.*, u.token_version, u.id AS uid
           FROM refresh_tokens rt JOIN users u ON u.id = rt.user_id
          WHERE rt.token_hash = ?`
      )
      .get(sha256(refreshToken))

    if (!stored) return { error: "Sessão inválida" }

    if (stored.revoked_at) {
      // Reuso de token já rotacionado → possível roubo. Revoga a família inteira.
      // (Não lançamos erro aqui dentro: o ROLLBACK desfaria a revogação.)
      revokeFamily(stored.family_id)
      return { error: "Sessão inválida" }
    }

    if (stored.expires_at < nowISO()) {
      return { error: "Sessão expirada, faça login novamente" }
    }

    db.prepare("UPDATE refresh_tokens SET revoked_at = ? WHERE id = ?").run(nowISO(), stored.id)
    return { session: issueSession({ id: stored.uid, token_version: stored.token_version }, stored.family_id) }
  })

  if (result.error) throw unauthorized(result.error)
  return result.session
}

export function revokeRefreshToken(refreshToken) {
  db.prepare("UPDATE refresh_tokens SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL").run(
    nowISO(),
    sha256(refreshToken)
  )
}

function revokeFamily(familyId) {
  db.prepare("UPDATE refresh_tokens SET revoked_at = ? WHERE family_id = ? AND revoked_at IS NULL").run(
    nowISO(),
    familyId
  )
}

export function revokeAllUserSessions(userId) {
  db.prepare("UPDATE refresh_tokens SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL").run(
    nowISO(),
    userId
  )
}

/** Limpeza periódica de tokens vencidos/revogados há mais de 1 dia. */
export function purgeOldRefreshTokens() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  db.prepare("DELETE FROM refresh_tokens WHERE expires_at < ? OR revoked_at < ?").run(nowISO(), cutoff)
}
