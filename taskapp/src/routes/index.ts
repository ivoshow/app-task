// Arquivo central de ROTAS do app.
//
// O Expo Router cria as rotas a partir dos arquivos em src/app/ (roteamento por arquivos):
//   src/app/index.tsx      → "/"
//   src/app/login.tsx      → "/login"
//   src/app/task/[id].tsx  → "/task/123"
//
// Este arquivo reúne TODOS os caminhos num só lugar, para que nenhuma tela escreva
// "/profile" ou "/task/..." solto no código. Se uma rota mudar, muda só aqui.
// Quem decide quais rotas são públicas ou privadas é o src/app/_layout.tsx (Stack.Protected).
import type { Href } from "expo-router"

export const ROTAS = {
  // Públicas (só aparecem para quem NÃO está logado)
  login: "/login",
  cadastro: "/register",

  // Privadas (só aparecem para quem está logado)
  inicio: "/",
  novaTarefa: "/new-task",
  perfil: "/profile",
  detalheTarefa: (id: string): Href => ({ pathname: "/task/[id]", params: { id } })
} as const
