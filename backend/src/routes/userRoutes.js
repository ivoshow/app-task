import { Router } from "express"
import { requireAuth } from "../middlewares/auth.js"
import { authLimiter } from "../middlewares/rateLimit.js"
import { validate } from "../middlewares/validate.js"
import { issueSession } from "../services/tokenService.js"
import { changePassword, deleteUser, toPublicUser, updateName } from "../services/userService.js"
import { changePasswordSchema, deleteAccountSchema, updateProfileSchema } from "../validators/schemas.js"

export const userRoutes = Router()
userRoutes.use(requireAuth)

// PATCH /api/users/me  → altera o nome
userRoutes.patch("/me", validate(updateProfileSchema), (req, res) => {
  res.json({ user: toPublicUser(updateName(req.user.id, req.validated.body.name)) })
})

// PUT /api/users/me/password  → troca a senha, encerra as outras sessões e devolve uma nova
userRoutes.put("/me/password", authLimiter, validate(changePasswordSchema), async (req, res) => {
  const { currentPassword, newPassword } = req.validated.body
  const user = await changePassword(req.user.id, currentPassword, newPassword)
  res.json({ user: toPublicUser(user), ...issueSession(user) })
})

// DELETE /api/users/me  → exclui a conta (exige a senha)
userRoutes.delete("/me", authLimiter, validate(deleteAccountSchema), async (req, res) => {
  await deleteUser(req.user.id, req.validated.body.password)
  res.status(204).end()
})
