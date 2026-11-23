// Contexto de autenticação: guarda o usuário logado e expõe login, cadastro e logout
// para qualquer tela via useAuth().
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import {
  ApiError,
  carregarRefreshSalvo,
  definirAoExpirarSessao,
  definirSessao,
  refreshAtual,
  renovarSessao
} from "../services/api"
import { authService } from "../services/authService"
import * as storage from "../services/storage"
import type { Sessao, Usuario } from "../types"

const CHAVE_USUARIO = "taskapp.usuario"

type AuthContextType = {
  usuario: Usuario | null
  carregando: boolean
  entrar: (email: string, senha: string) => Promise<void>
  cadastrar: (nome: string, email: string, senha: string) => Promise<void>
  sair: () => Promise<void>
  atualizarUsuario: (usuario: Usuario) => Promise<void>
  aplicarNovaSessao: (sessao: Sessao & { user: Usuario }) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [carregando, setCarregando] = useState(true)

  const guardarUsuario = useCallback(async (u: Usuario | null) => {
    setUsuario(u)
    if (u) await storage.salvar(CHAVE_USUARIO, JSON.stringify(u))
    else await storage.remover(CHAVE_USUARIO)
  }, [])

  const limparSessaoLocal = useCallback(async () => {
    await definirSessao(null)
    await guardarUsuario(null)
  }, [guardarUsuario])

  // Ao abrir o app: tenta restaurar a sessão a partir do refresh token salvo
  useEffect(() => {
    definirAoExpirarSessao(() => void limparSessaoLocal())

    async function restaurar() {
      try {
        if (!(await carregarRefreshSalvo())) return
        if (await renovarSessao()) {
          const { user } = await authService.eu()
          await guardarUsuario(user)
        } else {
          await limparSessaoLocal()
        }
      } catch (e) {
        // Sem internet: mantém o usuário em cache; as requisições tentam renovar depois
        if (e instanceof ApiError && e.status === 0) {
          const salvo = await storage.ler(CHAVE_USUARIO)
          if (salvo) setUsuario(JSON.parse(salvo))
        } else {
          await limparSessaoLocal()
        }
      } finally {
        setCarregando(false)
      }
    }
    restaurar()
  }, [guardarUsuario, limparSessaoLocal])

  const aplicarNovaSessao = useCallback(
    async ({ user, accessToken, refreshToken }: Sessao & { user: Usuario }) => {
      await definirSessao({ accessToken, refreshToken })
      await guardarUsuario(user)
    },
    [guardarUsuario]
  )

  const entrar = useCallback(
    async (email: string, senha: string) => {
      await aplicarNovaSessao(await authService.login(email.trim(), senha))
    },
    [aplicarNovaSessao]
  )

  const cadastrar = useCallback(
    async (nome: string, email: string, senha: string) => {
      await aplicarNovaSessao(await authService.cadastrar(nome.trim(), email.trim(), senha))
    },
    [aplicarNovaSessao]
  )

  const sair = useCallback(async () => {
    const token = refreshAtual()
    // Avisa o servidor para revogar o refresh token (se falhar, sai mesmo assim)
    if (token) await authService.logout(token).catch(() => {})
    await limparSessaoLocal()
  }, [limparSessaoLocal])

  const valor = useMemo(
    () => ({
      usuario,
      carregando,
      entrar,
      cadastrar,
      sair,
      atualizarUsuario: guardarUsuario,
      aplicarNovaSessao
    }),
    [usuario, carregando, entrar, cadastrar, sair, guardarUsuario, aplicarNovaSessao]
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>")
  return ctx
}
