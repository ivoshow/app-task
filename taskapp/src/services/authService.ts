import type { Sessao, Usuario } from "../types"
import { request } from "./api"

type RespostaSessao = Sessao & { user: Usuario }

export const authService = {
  login: (email: string, password: string) =>
    request<RespostaSessao>("/auth/login", { method: "POST", body: { email, password }, autenticado: false }),

  cadastrar: (name: string, email: string, password: string) =>
    request<RespostaSessao>("/auth/register", {
      method: "POST",
      body: { name, email, password },
      autenticado: false
    }),

  logout: (refreshToken: string) =>
    request<void>("/auth/logout", { method: "POST", body: { refreshToken }, autenticado: false }),

  eu: () => request<{ user: Usuario }>("/auth/me"),

  atualizarNome: (name: string) => request<{ user: Usuario }>("/users/me", { method: "PATCH", body: { name } }),

  trocarSenha: (currentPassword: string, newPassword: string) =>
    request<RespostaSessao>("/users/me/password", { method: "PUT", body: { currentPassword, newPassword } }),

  excluirConta: (password: string) => request<void>("/users/me", { method: "DELETE", body: { password } })
}
