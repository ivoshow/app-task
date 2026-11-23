import React from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { cores, corPrioridade, corStatus } from "../theme/cores"
import { PRIORIDADE_LABEL, STATUS_LABEL, type Tarefa } from "../types"
import { descreverPrazo, type SituacaoPrazo } from "../utils/datas"
import Selo from "./Selo"

type TaskItemProps = {
  tarefa: Tarefa
  onPress: () => void
  onAlternarConcluida: () => void
}

const corPrazo: Record<SituacaoPrazo, string> = {
  vencida: cores.erro,
  hoje: cores.alerta,
  breve: cores.alerta,
  normal: cores.textoSuave,
  concluida: cores.textoSuave,
  sem_prazo: cores.textoSuave
}

// Cartão de uma tarefa na lista
export default function TaskItem({ tarefa, onPress, onAlternarConcluida }: TaskItemProps) {
  const concluida = tarefa.status === "concluida"
  const prazo = descreverPrazo(tarefa.dueDate, concluida)

  return (
    <View style={[styles.cartao, prazo.situacao === "vencida" && styles.cartaoVencido]}>
      {/* Caixa de seleção: marca/desmarca como concluída */}
      <Pressable
        onPress={onAlternarConcluida}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: concluida }}
        accessibilityLabel={`Marcar "${tarefa.title}" como ${concluida ? "não concluída" : "concluída"}`}
        hitSlop={10}
        style={[styles.check, concluida && styles.checkAtivo]}
      >
        {concluida && <Text style={styles.checkMarca}>✓</Text>}
      </Pressable>

      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.conteudo, pressed && { opacity: 0.6 }]}
        accessibilityRole="button"
        accessibilityLabel={`${tarefa.title}. ${STATUS_LABEL[tarefa.status]}. Prioridade ${PRIORIDADE_LABEL[tarefa.priority]}. ${prazo.texto}`}
        accessibilityHint="Abre os detalhes da tarefa"
      >
        <Text style={[styles.titulo, concluida && styles.tituloConcluido]} numberOfLines={2}>
          {tarefa.title}
        </Text>
        {!!tarefa.description && (
          <Text style={styles.descricao} numberOfLines={1}>
            {tarefa.description}
          </Text>
        )}
        <View style={styles.selos}>
          <Selo texto={STATUS_LABEL[tarefa.status]} cor={corStatus[tarefa.status].texto} fundo={corStatus[tarefa.status].fundo} />
          <Selo
            texto={`Prioridade ${PRIORIDADE_LABEL[tarefa.priority].toLowerCase()}`}
            cor={corPrioridade[tarefa.priority].texto}
            fundo={corPrioridade[tarefa.priority].fundo}
          />
        </View>
        <Text style={[styles.prazo, { color: corPrazo[prazo.situacao] }]}>
          {prazo.situacao === "vencida" ? "⚠ " : ""}
          {prazo.texto}
        </Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  cartao: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: cores.superficie,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: cores.borda,
    gap: 12
  },
  cartaoVencido: { borderLeftWidth: 4, borderLeftColor: cores.erro },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: cores.primaria,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2
  },
  checkAtivo: { backgroundColor: cores.sucesso, borderColor: cores.sucesso },
  checkMarca: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  conteudo: { flex: 1, gap: 6 },
  titulo: { fontSize: 16, fontWeight: "700", color: cores.texto },
  tituloConcluido: { textDecorationLine: "line-through", color: cores.textoSuave },
  descricao: { fontSize: 14, color: cores.textoSuave },
  selos: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  prazo: { fontSize: 13, fontWeight: "600" }
})
