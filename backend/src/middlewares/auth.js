// Middleware de autenticação: só deixa passar quem tem um access token válido.
import { findUserById } from "../services/userService.js"
import { verifyAccessToken } from "../services/tokenService.js"
import { unauthorized } from "../utils/AppError.js"

export function requireAuth(req, _res, next) {
  const header = req.headers.authorization ?? ""
  const [scheme, token] = header.split(" ")
  if (scheme !== "Bearer" || !token) {
    throw unauthorized("Token de acesso ausente")
  }

  let payload
  try {
    payload = verifyAccessToken(token)
  } catch (error) {
    const expired = error?.name === "TokenExpiredError"
    const err = unauthorized(expired ? "Token expirado" : "Token inválido")
    if (expired) err.code = "TOKEN_EXPIRED" // o app usa isso para renovar a sessão
    throw err
  }

  // O usuário ainda existe e o token não foi invalidado (ex.: troca de senha)?
  const user = findUserById(payload.sub)
  if (!user || user.token_version !== payload.ver) {
    throw unauthorized("Sessão inválida, faça login novamente")
  }

  req.user = { id: user.id, email: user.email, name: user.name }
  next()
}
