import { randomUUID } from "node:crypto"
import bcrypt from "bcryptjs"
import { env } from "../config/env.js"
import { db, transaction } from "../db/database.js"
import { AppError, unauthorized } from "../utils/AppError.js"
import { nowISO } from "../utils/dates.js"
import { revokeAllUserSessions } from "./tokenService.js"

// Hash "falso" usado quando o e-mail não existe: assim o tempo de resposta é parecido
// e um atacante não descobre quais e-mails estão cadastrados medindo o tempo.
const DUMMY_HASH = bcrypt.hashSync("senha-ficticia-para-tempo-constante", env.bcryptRounds)

/** Dados do usuário que podem ir para o cliente (nunca o hash da senha). */
export function toPublicUser(user) {
  return { id: user.id, name: user.name, email: user.email, createdAt: user.created_at }
}

export function findUserById(id) {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id)
}

export async function createUser({ name, email, password }) {
  const exists = db.prepare("SELECT 1 FROM users WHERE email = ?").get(email)
  if (exists) throw new AppError("Este e-mail já está cadastrado", 409, "EMAIL_IN_USE")

  const id = randomUUID()
  const passwordHash = await bcrypt.hash(password, env.bcryptRounds)
  db.prepare("INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)").run(
    id,
    name,
    email,
    passwordHash
  )
  return findUserById(id)
}

export async function authenticate(email, password) {
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email)

  if (user?.locked_until && user.locked_until > nowISO()) {
    throw new AppError(
      "Conta temporariamente bloqueada por excesso de tentativas. Tente mais tarde.",
      423,
      "ACCOUNT_LOCKED"
    )
  }

  const ok = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH)

  if (!user || !ok) {
    if (user) registerFailedAttempt(user)
    // Mensagem genérica: não revela se o erro foi no e-mail ou na senha
    throw unauthorized("E-mail ou senha incorretos")
  }

  db.prepare("UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?").run(user.id)
  return user
}

function registerFailedAttempt(user) {
  const attempts = user.failed_attempts + 1
  const lockedUntil =
    attempts >= env.maxLoginAttempts ? new Date(Date.now() + env.lockMinutes * 60 * 1000).toISOString() : null
  db.prepare("UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?").run(
    lockedUntil ? 0 : attempts,
    lockedUntil,
    user.id
  )
}

export function updateName(userId, name) {
  db.prepare("UPDATE users SET name = ?, updated_at = ? WHERE id = ?").run(name, nowISO(), userId)
  return findUserById(userId)
}

async function assertPassword(user, password) {
  const ok = await bcrypt.compare(password, user.password_hash)
  if (!ok) throw new AppError("Senha atual incorreta", 400, "INVALID_PASSWORD")
}

/** Troca a senha e derruba TODAS as sessões (tokens antigos deixam de valer). */
export async function changePassword(userId, currentPassword, newPassword) {
  const user = findUserById(userId)
  await assertPassword(user, currentPassword)
  const hash = await bcrypt.hash(newPassword, env.bcryptRounds)

  return transaction(() => {
    db.prepare(
      "UPDATE users SET password_hash = ?, token_version = token_version + 1, updated_at = ? WHERE id = ?"
    ).run(hash, nowISO(), userId)
    revokeAllUserSessions(userId)
    return findUserById(userId)
  })
}

/** Exclui a conta (e, por CASCADE, todas as tarefas e sessões). */
export async function deleteUser(userId, password) {
  const user = findUserById(userId)
  await assertPassword(user, password)
  db.prepare("DELETE FROM users WHERE id = ?").run(userId)
}
