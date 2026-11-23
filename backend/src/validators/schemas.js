// Validação de entrada com Zod.
// z.strictObject REJEITA campos desconhecidos: ninguém consegue enviar "user_id"
// ou "token_version" no corpo e alterar o que não deveria (mass assignment).
import { z } from "zod"

export const TASK_STATUS = ["pendente", "em_andamento", "concluida"]
export const TASK_PRIORITY = ["baixa", "media", "alta"]

const email = z
  .string({ error: "E-mail é obrigatório" })
  .trim()
  .toLowerCase()
  .max(254, { error: "E-mail muito longo" })
  .pipe(z.email({ error: "E-mail inválido" }))

// Política de senha: 8+ caracteres, com letra e número. Limite de 72 bytes (limite do bcrypt).
const password = z
  .string({ error: "Senha é obrigatória" })
  .min(8, { error: "A senha deve ter pelo menos 8 caracteres" })
  .max(72, { error: "A senha deve ter no máximo 72 caracteres" })
  .refine(v => /[A-Za-z]/.test(v) && /\d/.test(v), {
    error: "A senha deve conter letras e números"
  })

const name = z
  .string({ error: "Nome é obrigatório" })
  .trim()
  .min(2, { error: "Nome muito curto" })
  .max(80, { error: "Nome muito longo" })

// Data no formato AAAA-MM-DD e que exista de verdade (31/02 não passa)
const dueDate = z.iso.date({ error: "Data de vencimento inválida (use AAAA-MM-DD)" })

export const registerSchema = z.strictObject({ name, email, password })

export const loginSchema = z.strictObject({
  email,
  password: z.string({ error: "Senha é obrigatória" }).min(1).max(200)
})

export const refreshSchema = z.strictObject({
  refreshToken: z.string({ error: "refreshToken é obrigatório" }).min(20).max(200)
})

export const updateProfileSchema = z.strictObject({ name })

export const changePasswordSchema = z
  .strictObject({
    currentPassword: z.string().min(1, { error: "Informe a senha atual" }).max(200),
    newPassword: password
  })
  .refine(d => d.currentPassword !== d.newPassword, {
    error: "A nova senha deve ser diferente da atual",
    path: ["newPassword"]
  })

export const deleteAccountSchema = z.strictObject({
  password: z.string().min(1, { error: "Confirme sua senha" }).max(200)
})

const title = z
  .string({ error: "Título é obrigatório" })
  .trim()
  .min(1, { error: "Título é obrigatório" })
  .max(120, { error: "Título deve ter no máximo 120 caracteres" })

const description = z.string().trim().max(2000, { error: "Descrição muito longa" })

export const createTaskSchema = z.strictObject({
  title,
  description: description.optional().default(""),
  status: z.enum(TASK_STATUS, { error: "Status inválido" }).optional().default("pendente"),
  priority: z.enum(TASK_PRIORITY, { error: "Prioridade inválida" }).optional().default("media"),
  dueDate: dueDate.nullable().optional().default(null)
})

export const updateTaskSchema = z
  .strictObject({
    title: title.optional(),
    description: description.optional(),
    status: z.enum(TASK_STATUS, { error: "Status inválido" }).optional(),
    priority: z.enum(TASK_PRIORITY, { error: "Prioridade inválida" }).optional(),
    dueDate: dueDate.nullable().optional()
  })
  .refine(d => Object.keys(d).length > 0, { error: "Nada para atualizar" })

export const statusSchema = z.strictObject({
  status: z.enum(TASK_STATUS, { error: "Status inválido" })
})

export const listTasksQuerySchema = z.object({
  status: z.enum(TASK_STATUS).optional(),
  priority: z.enum(TASK_PRIORITY).optional(),
  search: z.string().trim().max(100).optional(),
  overdue: z.enum(["true", "false"]).optional(),
  today: dueDate.optional(),
  sort: z.enum(["due_date", "created_at", "priority", "title"]).optional().default("due_date"),
  order: z.enum(["asc", "desc"]).optional().default("asc"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50)
})

export const summaryQuerySchema = z.object({ today: dueDate.optional() })

// IDs são UUID: qualquer outra coisa nem chega ao banco
export const idParamSchema = z.object({ id: z.uuid({ error: "ID inválido" }) })
