import type { DadosTarefa, Paginado, Resumo, TaskStatus, Tarefa } from "../types"
import { hojeISO } from "../utils/datas"
import { request } from "./api"

export type FiltrosTarefa = {
  status?: TaskStatus
  overdue?: boolean
  search?: string
  sort?: "due_date" | "created_at" | "priority" | "title"
  order?: "asc" | "desc"
  page?: number
}

// Enviamos o "hoje" do aparelho para a API calcular "vencidas" no fuso do usuário
export const taskService = {
  listar: (f: FiltrosTarefa = {}) =>
    request<Paginado<Tarefa>>("/tasks", {
      query: {
        status: f.status,
        overdue: f.overdue ? "true" : undefined,
        search: f.search?.trim() || undefined,
        sort: f.sort,
        order: f.order,
        page: f.page,
        limit: 30,
        today: hojeISO()
      }
    }),

  resumo: () => request<Resumo>("/tasks/summary", { query: { today: hojeISO() } }),

  buscar: (id: string) => request<Tarefa>(`/tasks/${encodeURIComponent(id)}`),

  criar: (dados: DadosTarefa) => request<Tarefa>("/tasks", { method: "POST", body: dados }),

  atualizar: (id: string, dados: Partial<DadosTarefa>) =>
    request<Tarefa>(`/tasks/${encodeURIComponent(id)}`, { method: "PATCH", body: dados }),

  mudarStatus: (id: string, status: TaskStatus) =>
    request<Tarefa>(`/tasks/${encodeURIComponent(id)}/status`, { method: "PATCH", body: { status } }),

  excluir: (id: string) => request<void>(`/tasks/${encodeURIComponent(id)}`, { method: "DELETE" })
}
