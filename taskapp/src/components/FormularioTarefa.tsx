import React, { useState } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from "react-native"
import { ApiError, mensagemDeErro } from "../services/api"
import { cores } from "../theme/cores"
import { PRIORIDADE_LABEL, STATUS_LABEL, type DadosTarefa, type TaskPriority, type TaskStatus } from "../types"
import Botao from "./Botao"
import Campo from "./Campo"
import CampoData from "./CampoData"
import SeletorOpcoes from "./SeletorOpcoes"

type Props = {
  inicial?: Partial<DadosTarefa>
  textoBotao: string
  onSalvar: (dados: DadosTarefa) => Promise<void>
  rodape?: React.ReactNode
}

const opcoesStatus = (Object.keys(STATUS_LABEL) as TaskStatus[]).map(v => ({ valor: v, rotulo: STATUS_LABEL[v] }))
const opcoesPrioridade = (Object.keys(PRIORIDADE_LABEL) as TaskPriority[]).map(v => ({
  valor: v,
  rotulo: PRIORIDADE_LABEL[v]
}))

// Formulário usado tanto para CRIAR quanto para EDITAR tarefas
export default function FormularioTarefa({ inicial, textoBotao, onSalvar, rodape }: Props) {
  const [title, setTitle] = useState(inicial?.title ?? "")
  const [description, setDescription] = useState(inicial?.description ?? "")
  const [status, setStatus] = useState<TaskStatus>(inicial?.status ?? "pendente")
  const [priority, setPriority] = useState<TaskPriority>(inicial?.priority ?? "media")
  const [dueDate, setDueDate] = useState<string | null>(inicial?.dueDate ?? null)
  const [dataInvalida, setDataInvalida] = useState(false)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [erroGeral, setErroGeral] = useState("")
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    // Validação no app (rápida para o usuário). A API valida DE NOVO — nunca confie só no cliente.
    const novosErros: Record<string, string> = {}
    if (!title.trim()) novosErros.title = "Digite o título da tarefa"
    else if (title.trim().length > 120) novosErros.title = "Máximo de 120 caracteres"
    if (description.length > 2000) novosErros.description = "Máximo de 2000 caracteres"
    if (dataInvalida) novosErros.dueDate = "Complete a data (DD/MM/AAAA) ou escolha “Sem prazo”"
    setErros(novosErros)
    setErroGeral("")
    if (Object.keys(novosErros).length) return

    setSalvando(true)
    try {
      await onSalvar({ title: title.trim(), description: description.trim(), status, priority, dueDate })
    } catch (e) {
      if (e instanceof ApiError && e.details) setErros(e.erroPorCampo)
      setErroGeral(mensagemDeErro(e))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Campo
          rotulo="Título *"
          placeholder="Ex.: Estudar React Native"
          value={title}
          onChangeText={setTitle}
          erro={erros.title}
          maxLength={120}
          returnKeyType="next"
        />
        <Campo
          rotulo="Descrição"
          placeholder="Detalhes da tarefa (opcional)"
          value={description}
          onChangeText={setDescription}
          erro={erros.description}
          multiline
          maxLength={2000}
          style={styles.multilinha}
          textAlignVertical="top"
        />
        <SeletorOpcoes rotulo="Status" opcoes={opcoesStatus} valor={status} onChange={setStatus} />
        <SeletorOpcoes rotulo="Prioridade" opcoes={opcoesPrioridade} valor={priority} onChange={setPriority} />
        <CampoData
          valor={dueDate}
          onChange={d => {
            setDueDate(d)
            setErros(e => ({ ...e, dueDate: "" }))
          }}
          onInvalido={setDataInvalida}
          erro={erros.dueDate}
        />

        {!!erroGeral && (
          <Text style={styles.erroGeral} accessibilityRole="alert">
            {erroGeral}
          </Text>
        )}

        <Botao titulo={textoBotao} onPress={salvar} carregando={salvando} />
        {rodape}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, backgroundColor: cores.fundo, flexGrow: 1 },
  multilinha: { minHeight: 96, paddingTop: 12 },
  erroGeral: {
    color: cores.erro,
    backgroundColor: cores.erroFundo,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12
  }
})
