// Erro "esperado" da aplicação: tem status HTTP e mensagem segura para o cliente.
export class AppError extends Error {
  constructor(message, statusCode = 400, code = "BAD_REQUEST", details) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}

export const notFound = (msg = "Recurso não encontrado") => new AppError(msg, 404, "NOT_FOUND")
export const unauthorized = (msg = "Não autenticado") => new AppError(msg, 401, "UNAUTHORIZED")
