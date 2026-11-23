// Cliente HTTP do app.
// - Coloca o access token em cada requisição.
// - Se o token expirou (401), renova UMA vez com o refresh token e repete a requisição.
// - Várias requisições ao mesmo tempo compartilham a MESMA renovação (o refresh é rotacionado).
// - Timeout para não deixar a tela carregando para sempre.
import Constants from "expo-constants"
import { Platform } from "react-native"
import type { Sessao } from "../types"
import * as storage from "./storage"

const CHAVE_REFRESH = "taskapp.refreshToken"

/**
 * URL da API:
 * 1. EXPO_PUBLIC_API_URL (arquivo .env), se definida;
 * 2. senão, o mesmo IP do computador que roda o Expo (funciona no celular com Expo Go);
 * 3. senão, localhost.
 */
function descobrirUrlApi(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL
  const host = Constants.expoConfig?.hostUri?.split(":")[0]
  if (host && Platform.OS !== "web") return `http://${host}:3333/api`
  return "http://localhost:3333/api"
}

export const API_URL = descobrirUrlApi()

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public details?: { field: string; message: string }[]
  ) {
    super(message)
  }

  /** Erros de validação por campo: { email: "E-mail inválido", ... } */
  get erroPorCampo(): Record<string, string> {
    const map: Record<string, string> = {}
    for (const d of this.details ?? []) if (!map[d.field]) map[d.field] = d.message
    return map
  }
}

// ---- Estado da sessão (o access token fica só na memória) ----
let accessToken: string | null = null
let refreshToken: string | null = null
let renovacaoEmAndamento: Promise<boolean> | null = null
let aoExpirarSessao: () => void = () => {}

export function definirAoExpirarSessao(fn: () => void) {
  aoExpirarSessao = fn
}

export async function definirSessao(sessao: Sessao | null) {
  accessToken = sessao?.accessToken ?? null
  refreshToken = sessao?.refreshToken ?? null
  if (sessao) await storage.salvar(CHAVE_REFRESH, sessao.refreshToken)
  else await storage.remover(CHAVE_REFRESH)
}

export async function carregarRefreshSalvo(): Promise<string | null> {
  refreshToken = await storage.ler(CHAVE_REFRESH)
  return refreshToken
}

export function refreshAtual() {
  return refreshToken
}

type Opcoes = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  body?: unknown
  query?: Record<string, string | number | undefined>
  autenticado?: boolean
}

async function fetchComTimeout(url: string, init: RequestInit, ms = 15000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } catch (e) {
    const timeout = (e as Error)?.name === "AbortError"
    throw new ApiError(
      timeout ? "O servidor demorou para responder." : "Sem conexão com o servidor. Verifique sua internet.",
      0,
      timeout ? "TIMEOUT" : "NETWORK_ERROR"
    )
  } finally {
    clearTimeout(timer)
  }
}

/** Renova a sessão. Retorna false se o refresh token não vale mais. */
export function renovarSessao(): Promise<boolean> {
  if (!renovacaoEmAndamento) {
    renovacaoEmAndamento = (async () => {
      if (!refreshToken) return false
      const res = await fetchComTimeout(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken })
      })
      if (!res.ok) {
        if (res.status === 401) await definirSessao(null)
        return false
      }
      await definirSessao(await res.json())
      return true
    })().finally(() => {
      renovacaoEmAndamento = null
    })
  }
  return renovacaoEmAndamento
}

export async function request<T>(caminho: string, opcoes: Opcoes = {}, tentativa = 0): Promise<T> {
  const { method = "GET", body, query, autenticado = true } = opcoes

  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined && v !== "") params.append(k, String(v))
  const url = `${API_URL}${caminho}${params.size ? `?${params}` : ""}`

  const headers: Record<string, string> = { Accept: "application/json" }
  if (body !== undefined) headers["Content-Type"] = "application/json"
  if (autenticado && accessToken) headers.Authorization = `Bearer ${accessToken}`

  const res = await fetchComTimeout(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  })

  // Token expirado/ausente → tenta renovar uma vez e repetir
  if (res.status === 401 && autenticado && tentativa === 0) {
    const renovou = await renovarSessao()
    if (renovou) return request<T>(caminho, opcoes, 1)
    aoExpirarSessao()
    throw new ApiError("Sua sessão expirou. Entre novamente.", 401, "SESSION_EXPIRED")
  }

  if (res.status === 204) return undefined as T

  const dados = await res.json().catch(() => null)
  if (!res.ok) {
    const erro = dados?.error
    throw new ApiError(erro?.message ?? "Erro inesperado", res.status, erro?.code ?? "UNKNOWN", erro?.details)
  }
  return dados as T
}

/** Mensagem amigável para mostrar ao usuário a partir de qualquer erro. */
export function mensagemDeErro(e: unknown): string {
  if (e instanceof ApiError) return e.message
  return "Algo deu errado. Tente novamente."
}
