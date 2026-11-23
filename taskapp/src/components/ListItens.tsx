import React from "react"
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native"
import { cores } from "../theme/cores"
import type { Tarefa } from "../types"
import TaskItem from "./TaskItem"

type ListItensProps = {
  tarefas: Tarefa[]
  atualizando: boolean
  carregandoMais: boolean
  onAtualizar: () => void
  onCarregarMais: () => void
  onAbrir: (tarefa: Tarefa) => void
  onAlternarConcluida: (tarefa: Tarefa) => void
  cabecalho?: React.ReactElement
  mensagemVazia: string
}

export default function ListItens(props: ListItensProps) {
  return (
    <FlatList
      data={props.tarefas}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <TaskItem
          tarefa={item}
          onPress={() => props.onAbrir(item)}
          onAlternarConcluida={() => props.onAlternarConcluida(item)}
        />
      )}
      ListHeaderComponent={props.cabecalho}
      ListEmptyComponent={
        props.atualizando ? undefined : (
          <View style={styles.vazio}>
            <Text style={styles.vazioEmoji}>📋</Text>
            <Text style={styles.vazioTexto}>{props.mensagemVazia}</Text>
          </View>
        )
      }
      ListFooterComponent={props.carregandoMais ? <ActivityIndicator style={{ margin: 16 }} color={cores.primaria} /> : undefined}
      refreshControl={
        <RefreshControl refreshing={props.atualizando} onRefresh={props.onAtualizar} colors={[cores.primaria]} />
      }
      onEndReached={props.onCarregarMais}
      onEndReachedThreshold={0.3}
      contentContainerStyle={styles.lista}
      keyboardShouldPersistTaps="handled"
    />
  )
}

const styles = StyleSheet.create({
  lista: { padding: 16, paddingBottom: 100 },
  vazio: { alignItems: "center", padding: 32, gap: 8 },
  vazioEmoji: { fontSize: 40 },
  vazioTexto: { color: cores.textoSuave, fontSize: 15, textAlign: "center" }
})
