// Limites de requisições por IP: dificulta força bruta e abuso da API.
import rateLimit from "express-rate-limit"
import { env } from "../config/env.js"

const message = code => ({
  error: { code, message: "Muitas requisições. Tente novamente em alguns minutos." }
})

// Limite geral da API
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip: () => env.isTest,
  message: message("RATE_LIMITED")
})

// Login/cadastro: bem mais restrito (só conta tentativas que falharam)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: () => env.isTest,
  message: message("AUTH_RATE_LIMITED")
})
