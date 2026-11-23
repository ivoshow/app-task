import { router } from "expo-router"
import React from "react"
import FormularioTarefa from "../components/FormularioTarefa"
import { taskService } from "../services/taskService"

// Tela de nova tarefa (rota "/new-task")
export default function NewTask() {
  return (
    <FormularioTarefa
      textoBotao="Salvar tarefa"
      onSalvar={async dados => {
        await taskService.criar(dados)
        router.back() // a lista recarrega sozinha ao voltar (useFocusEffect)
      }}
    />
  )
}
