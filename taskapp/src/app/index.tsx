import { router, Stack, useFocusEffect } from "expo-router"
import React, { useCallback, useEffect, useRef, useState } from "react"
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native"
import Botao from "../components/Botao"
import ListItens from "../components/ListItens"
import ResumoTarefas, { type FiltroLista } from "../components/ResumoTarefas"
import SeletorOpcoes from "../components/SeletorOpcoes"
import { useAuth } from "../contexts/AuthContext"
import { ROTAS } from "../routes"
import { mensagemDeErro } from "../services/api"
import { taskService, type FiltrosTarefa } from "../services/taskService"
import { cores } from "../theme/cores"
import type { Resumo, Tarefa } from "../types"
import { avisar } from "../utils/confirmar"

type Ordem = "due_date" | "priority" | "created_at"
const opcoesOrdem: { valor: Ordem; rotulo: string }[] = [
  { valor: "due_date", rotulo: "Vencimento" },
  { valor: "priority", rotulo: "Prioridade" },
  { valor: "created_at", rotulo: "Mais recentes" }
]

const mensagensVazias: Record<FiltroLista, string> = {
  todas: "Você ainda não tem tarefas.\nToque em “+ Nova tarefa” para começar!",
  pendente: "Nenhuma tarefa pendente.",
  em_andamento: "Nenhuma tarefa em andamento.",
  concluida: "Nenhuma tarefa concluída ainda.",
  vencidas: "Nenhuma tarefa vencida. Muito bem! 🎉"
}

// Tela inicial (rota "/"): lista as tarefas DO USUÁRIO LOGADO
export default function Home() {
  const { usuario } = useAuth()
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [resumo, setResumo] = useState<Resumo | null>(null)
  const [filtro, setFiltro] = useState<FiltroLista>("todas")
  const [ordem, setOrdem] = useState<Ordem>("due_date")
  const [busca, setBusca] = useState("")
  const [buscaAplicada, setBuscaAplicada] = useState("")
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [atualizando, setAtualizando] = useState(true)
  const [carregandoMais, setCarregandoMais] = useState(false)
  const [erro, setErro] = useState("")
  const requisicaoAtual = useRef(0) // ignora respostas antigas se o filtro mudar no meio

  // Espera o usuário parar de digitar (400 ms) antes de buscar
  useEffect(() => {
    const t = setTimeout(() => setBuscaAplicada(busca), 400)
    return () => clearTimeout(t)
  }, [busca])

  const montarFiltros = useCallback(
    (page: number): FiltrosTarefa => ({
      status: filtro === "todas" || filtro === "vencidas" ? undefined : filtro,
      overdue: filtro === "vencidas",
      search: buscaAplicada,
      sort: ordem,
      order: ordem === "created_at" ? "desc" : "asc",
      page
    }),
    [filtro, buscaAplicada, ordem]
  )

  const carregar = useCallback(async () => {
    const id = ++requisicaoAtual.current
    setAtualizando(true)
    setErro("")
    try {
      const [lista, r] = await Promise.all([taskService.listar(montarFiltros(1)), taskService.resumo()])
      if (id !== requisicaoAtual.current) return
      setTarefas(lista.data)
      setPagina(1)
      setTotalPaginas(lista.pagination.totalPages)
      setResumo(r)
    } catch (e) {
      if (id === requisicaoAtual.current) setErro(mensagemDeErro(e))
    } finally {
      if (id === requisicaoAtual.current) setAtualizando(false)
    }
  }, [montarFiltros])

  // Recarrega ao voltar para esta tela (ex.: depois de criar/editar) e quando o filtro muda
  useFocusEffect(
    useCallback(() => {
      carregar()
    }, [carregar])
  )

  async function carregarMais() {
    if (carregandoMais || atualizando || pagina >= totalPaginas) return
    const id = requisicaoAtual.current
    setCarregandoMais(true)
    try {
      const lista = await taskService.listar(montarFiltros(pagina + 1))
      if (id !== requisicaoAtual.current) return
      setTarefas(atual => [...atual, ...lista.data.filter(n => !atual.some(a => a.id === n.id))])
      setPagina(lista.pagination.page)
      setTotalPaginas(lista.pagination.totalPages)
    } catch (e) {
      avisar("Erro", mensagemDeErro(e))
    } finally {
      setCarregandoMais(false)
    }
  }

  // Marca/desmarca como concluída com "atualização otimista" (a tela muda na hora)
  async function alternarConcluida(t: Tarefa) {
    const novoStatus = t.status === "concluida" ? "pendente" : "concluida"
    const anterior = tarefas
    setTarefas(lista => lista.map(x => (x.id === t.id ? { ...x, status: novoStatus, isOverdue: false } : x)))
    try {
      const atualizada = await taskService.mudarStatus(t.id, novoStatus)
      setTarefas(lista => lista.map(x => (x.id === t.id ? atualizada : x)))
      setResumo(await taskService.resumo())
    } catch (e) {
      setTarefas(anterior) // desfaz se deu erro
      avisar("Não foi possível atualizar", mensagemDeErro(e))
    }
  }

  const primeiroNome = usuario?.name.split(" ")[0] ?? ""

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              onPress={() => router.push(ROTAS.perfil)}
              accessibilityRole="button"
              accessibilityLabel="Abrir meu perfil"
              hitSlop={10}
              style={styles.botaoPerfil}
            >
              <Text style={styles.avatar}>{primeiroNome.charAt(0).toUpperCase() || "?"}</Text>
            </Pressable>
          )
        }}
      />

      <ListItens
        tarefas={tarefas}
        atualizando={atualizando}
        carregandoMais={carregandoMais}
        onAtualizar={carregar}
        onCarregarMais={carregarMais}
        onAbrir={t => router.push(ROTAS.detalheTarefa(t.id))}
        onAlternarConcluida={alternarConcluida}
        mensagemVazia={buscaAplicada ? `Nada encontrado para “${buscaAplicada}”.` : mensagensVazias[filtro]}
        cabecalho={
          <View>
            <Text style={styles.saudacao} accessibilityRole="header">
              Olá, {primeiroNome}! 👋
            </Text>
            {!!resumo?.venceHoje && (
              <Text style={styles.aviso}>
                Você tem {resumo.venceHoje} tarefa{resumo.venceHoje > 1 ? "s" : ""} vencendo hoje.
              </Text>
            )}

            <ResumoTarefas resumo={resumo} filtro={filtro} onFiltrar={setFiltro} />

            <TextInput
              style={styles.busca}
              placeholder="🔎 Buscar tarefas..."
              placeholderTextColor={cores.textoSuave}
              value={busca}
              onChangeText={setBusca}
              accessibilityLabel="Buscar tarefas por título ou descrição"
              returnKeyType="search"
              clearButtonMode="while-editing"
              maxLength={100}
            />

            <SeletorOpcoes rotulo="Ordenar por" opcoes={opcoesOrdem} valor={ordem} onChange={setOrdem} rolavel />

            {!!erro && (
              <View style={styles.erro} accessibilityRole="alert">
                <Text style={styles.erroTexto}>{erro}</Text>
                <Botao titulo="Tentar novamente" variante="secundario" onPress={carregar} />
              </View>
            )}
          </View>
        }
      />

      <View style={styles.rodape}>
        <Botao titulo="+ Nova tarefa" onPress={() => router.push(ROTAS.novaTarefa)} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  saudacao: { fontSize: 22, fontWeight: "800", color: cores.texto, marginBottom: 4 },
  aviso: {
    color: cores.alerta,
    backgroundColor: cores.alertaFundo,
    padding: 10,
    borderRadius: 8,
    marginVertical: 8,
    fontWeight: "600"
  },
  busca: {
    minHeight: 48,
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    color: cores.texto,
    marginBottom: 12
  },
  erro: { backgroundColor: cores.erroFundo, padding: 12, borderRadius: 8, gap: 8, marginBottom: 12 },
  erroTexto: { color: cores.erro },
  rodape: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 20
  },
  botaoPerfil: { marginRight: 4 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#fff",
    color: cores.primaria,
    fontWeight: "900",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 34,
    overflow: "hidden"
  }
})
