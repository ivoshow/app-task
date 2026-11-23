import React from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { cores } from "../theme/cores"
import type { Resumo } from "../types"

export type FiltroLista = "todas" | "pendente" | "em_andamento" | "concluida" | "vencidas"

type Props = {
  resumo: Resumo | null
  filtro: FiltroLista
  onFiltrar: (f: FiltroLista) => void
}

// Painel de contadores. Cada cartão também é um atalho de filtro.
export default function ResumoTarefas({ resumo, filtro, onFiltrar }: Props) {
  const itens: { chave: FiltroLista; rotulo: string; valor: number; cor: string }[] = [
    { chave: "todas", rotulo: "Todas", valor: resumo?.total ?? 0, cor: cores.primaria },
    { chave: "pendente", rotulo: "Pendentes", valor: resumo?.pendente ?? 0, cor: cores.alerta },
    { chave: "em_andamento", rotulo: "Andamento", valor: resumo?.emAndamento ?? 0, cor: cores.info },
    { chave: "concluida", rotulo: "Concluídas", valor: resumo?.concluida ?? 0, cor: cores.sucesso },
    { chave: "vencidas", rotulo: "Vencidas", valor: resumo?.vencidas ?? 0, cor: cores.erro }
  ]

  return (
    <View style={styles.grade} accessibilityRole="tablist">
      {itens.map(i => {
        const ativo = filtro === i.chave
        return (
          <Pressable
            key={i.chave}
            onPress={() => onFiltrar(i.chave)}
            accessibilityRole="tab"
            accessibilityState={{ selected: ativo }}
            accessibilityLabel={`${i.rotulo}: ${i.valor}`}
            style={[styles.cartao, ativo && { borderColor: i.cor, backgroundColor: cores.primariaClara }]}
          >
            <Text style={[styles.valor, { color: i.cor }]}>{i.valor}</Text>
            <Text style={styles.rotulo} numberOfLines={1}>
              {i.rotulo}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  grade: { flexDirection: "row", gap: 6, marginBottom: 12 },
  cartao: {
    flex: 1,
    backgroundColor: cores.superficie,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "transparent",
    paddingVertical: 10,
    alignItems: "center",
    minHeight: 64
  },
  valor: { fontSize: 20, fontWeight: "800" },
  rotulo: { fontSize: 11, color: cores.textoSuave, fontWeight: "600" }
})
