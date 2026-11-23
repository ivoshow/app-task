// Tipos compartilhados entre telas, componentes e serviços.

export type TaskStatus = "pendente" | "em_andamento" | "concluida"
export type TaskPriority = "baixa" | "media" | "alta"

export type Tarefa = {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  dueDate: string | null // AAAA-MM-DD
  completedAt: string | null
  createdAt: string
  updatedAt: string
  isOverdue: boolean
}

export type DadosTarefa = {
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  dueDate: string | null
}

export type Usuario = {
  id: string
  name: string
  email: string
  createdAt: string
}

export type Sessao = {
  accessToken: string
  refreshToken: string
}

export type Resumo = {
  total: number
  pendente: number
  emAndamento: number
  concluida: number
  vencidas: number
  venceHoje: number
}

export type Paginado<T> = {
  data: T[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export const STATUS_LABEL: Record<TaskStatus, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluida: "Concluída"
}

export const PRIORIDADE_LABEL: Record<TaskPriority, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta"
}
