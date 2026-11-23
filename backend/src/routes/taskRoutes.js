import { Router } from "express"
import { requireAuth } from "../middlewares/auth.js"
import { validate } from "../middlewares/validate.js"
import * as tasks from "../services/taskService.js"
import {
  createTaskSchema,
  idParamSchema,
  listTasksQuerySchema,
  statusSchema,
  summaryQuerySchema,
  updateTaskSchema
} from "../validators/schemas.js"

export const taskRoutes = Router()
taskRoutes.use(requireAuth) // todas as rotas de tarefa exigem login

const uid = req => req.user.id // o dono SEMPRE vem do token, nunca do corpo/URL
const tid = req => req.validated.params.id

taskRoutes.get("/", validate(listTasksQuerySchema, "query"), (req, res) => {
  res.json(tasks.listTasks(uid(req), req.validated.query))
})

taskRoutes.get("/summary", validate(summaryQuerySchema, "query"), (req, res) => {
  res.json(tasks.getSummary(uid(req), req.validated.query.today))
})

taskRoutes.get("/:id", validate(idParamSchema, "params"), (req, res) => {
  res.json(tasks.getTask(uid(req), tid(req)))
})

taskRoutes.post("/", validate(createTaskSchema), (req, res) => {
  res.status(201).json(tasks.createTask(uid(req), req.validated.body))
})

taskRoutes.patch("/:id", validate(idParamSchema, "params"), validate(updateTaskSchema), (req, res) => {
  res.json(tasks.updateTask(uid(req), tid(req), req.validated.body))
})

taskRoutes.patch("/:id/status", validate(idParamSchema, "params"), validate(statusSchema), (req, res) => {
  res.json(tasks.updateTask(uid(req), tid(req), req.validated.body))
})

taskRoutes.delete("/:id", validate(idParamSchema, "params"), (req, res) => {
  tasks.deleteTask(uid(req), tid(req))
  res.status(204).end()
})
