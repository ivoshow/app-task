import { SplashScreen, Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import React from "react"
import { AuthProvider, useAuth } from "../contexts/AuthContext"
import { cores } from "../theme/cores"

// Mantém a splash na tela enquanto verificamos se existe sessão salva
SplashScreen.preventAutoHideAsync()

function SplashController() {
  const { carregando } = useAuth()
  if (!carregando) SplashScreen.hide()
  return null
}

// Rotas protegidas: sem login só existem "login" e "register";
// com login, só as telas do app. O Expo Router redireciona sozinho.
// (Isso é só a camada visual: quem protege os DADOS de verdade é a API.)
function Navegacao() {
  const { usuario, carregando } = useAuth()
  if (carregando) return null
  const logado = !!usuario

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: cores.primaria },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
        contentStyle: { backgroundColor: cores.fundo }
      }}
    >
      <Stack.Protected guard={logado}>
        <Stack.Screen name="index" options={{ title: "Minhas tarefas" }} />
        <Stack.Screen name="new-task" options={{ title: "Nova tarefa", presentation: "modal" }} />
        <Stack.Screen name="task/[id]" options={{ title: "Detalhes da tarefa" }} />
        <Stack.Screen name="profile" options={{ title: "Meu perfil" }} />
      </Stack.Protected>

      <Stack.Protected guard={!logado}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ title: "Criar conta" }} />
      </Stack.Protected>
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <SplashController />
      <Navegacao />
    </AuthProvider>
  )
}
