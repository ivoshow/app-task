import { router, useLocalSearchParams } from "expo-router"
import React, { useEffect, useState } from "react"
import { ActivityIndicator, StyleSheet, Text, View } from "react-native"
import Botao from "../../components/Botao"
import FormularioTarefa from "../../components/FormularioTarefa"
import { mensagemDeErro } from "../../services/api"
import { taskService } from "../../services/taskService"
import { cores } from "../../theme/cores"
import type { Tarefa } from "../../types"
import { avisar, confirmar } from "../../utils/confirmar"

const formatarDataHora = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })

// Detalhes / edição de uma tarefa (rota "/task/:id")
export default function DetalheTarefa() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [tarefa, setTarefa] = useState<Tarefa | null>(null)
  const [erro, setErro] = useState("")
  const [excluindo, setExcluindo] = useState(false)

  useEffect(() => {
    taskService
      .buscar(id)
      .then(setTarefa)
      .catch(e => setErro(mensagemDeErro(e)))
  }, [id])

  async function excluir() {
    if (!tarefa) return
    const ok = await confirmar("Excluir tarefa", `Deseja excluir “${tarefa.title}”? Isso não pode ser desfeito.`, "Excluir")
    if (!ok) return
    setExcluindo(true)
    try {
      await taskService.excluir(tarefa.id)
      router.back()
    } catch (e) {
      avisar("Erro", mensagemDeErro(e))
      setExcluindo(false)
    }
  }

  if (erro) {
    return (
      <View style={styles.centro}>
        <Text style={styles.erro} accessibilityRole="alert">
          {erro}
        </Text>
        <Botao titulo="Voltar" variante="secundario" onPress={() => router.back()} />
      </View>
    )
  }

  if (!tarefa) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={cores.primaria} accessibilityLabel="Carregando tarefa" />
      </View>
    )
  }

  return (
    <FormularioTarefa
      inicial={tarefa}
      textoBotao="Salvar alterações"
      onSalvar={async dados => {
        await taskService.atualizar(tarefa.id, dados)
        router.back()
      }}
      rodape={
        <View style={styles.rodape}>
          <Text style={styles.meta}>Criada em {formatarDataHora(tarefa.createdAt)}</Text>
          <Text style={styles.meta}>Atualizada em {formatarDataHora(tarefa.updatedAt)}</Text>
          {tarefa.completedAt && <Text style={styles.meta}>Concluída em {formatarDataHora(tarefa.completedAt)}</Text>}
          <Botao titulo="Excluir tarefa" variante="perigo" onPress={excluir} carregando={excluindo} style={{ marginTop: 16 }} />
        </View>
      }
    />
  )
}

const styles = StyleSheet.create({
  centro: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, gap: 16 },
  erro: { color: cores.erro, fontSize: 16, textAlign: "center" },
  rodape: { marginTop: 24, borderTopWidth: 1, borderTopColor: cores.borda, paddingTop: 16 },
  meta: { color: cores.textoSuave, fontSize: 13, marginBottom: 2 }
})
