import { env } from "../config/env.js"
import { AppError } from "../utils/AppError.js"

export function notFoundHandler(req, _res, next) {
  next(new AppError(`Rota não encontrada: ${req.method} ${req.path}`, 404, "NOT_FOUND"))
}

// Tratador central de erros: NUNCA vaza stack trace ou detalhes internos para o cliente.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  // JSON malformado / corpo grande demais (erros do express.json)
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ error: { code: "INVALID_JSON", message: "JSON inválido" } })
  }
  if (err?.type === "entity.too.large") {
    return res.status(413).json({ error: { code: "PAYLOAD_TOO_LARGE", message: "Requisição muito grande" } })
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, ...(err.details && { details: err.details }) }
    })
  }

  // Erro inesperado: loga no servidor, responde genérico
  if (!env.isTest) console.error(`[ERRO] ${req.method} ${req.originalUrl}`, err)
  return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Erro interno do servidor" } })
}
