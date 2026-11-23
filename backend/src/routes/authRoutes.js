import { Router } from "express"
import { requireAuth } from "../middlewares/auth.js"
import { authLimiter } from "../middlewares/rateLimit.js"
import { validate } from "../middlewares/validate.js"
import { issueSession, revokeRefreshToken, rotateRefreshToken } from "../services/tokenService.js"
import { authenticate, createUser, findUserById, toPublicUser } from "../services/userService.js"
import { loginSchema, refreshSchema, registerSchema } from "../validators/schemas.js"

export const authRoutes = Router()

// POST /api/auth/register  → cria conta e já devolve a sessão
authRoutes.post("/register", authLimiter, validate(registerSchema), async (req, res) => {
  const user = await createUser(req.validated.body)
  res.status(201).json({ user: toPublicUser(user), ...issueSession(user) })
})

// POST /api/auth/login
authRoutes.post("/login", authLimiter, validate(loginSchema), async (req, res) => {
  const { email, password } = req.validated.body
  const user = await authenticate(email, password)
  res.json({ user: toPublicUser(user), ...issueSession(user) })
})

// POST /api/auth/refresh  → troca o refresh token por um novo par
authRoutes.post("/refresh", authLimiter, validate(refreshSchema), (req, res) => {
  res.json(rotateRefreshToken(req.validated.body.refreshToken))
})

// POST /api/auth/logout  → revoga o refresh token desta sessão
authRoutes.post("/logout", validate(refreshSchema), (req, res) => {
  revokeRefreshToken(req.validated.body.refreshToken)
  res.status(204).end()
})

// GET /api/auth/me
authRoutes.get("/me", requireAuth, (req, res) => {
  res.json({ user: toPublicUser(findUserById(req.user.id)) })
})
