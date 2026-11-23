import React from "react"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { cores } from "../theme/cores"

type Opcao<T extends string> = { valor: T; rotulo: string }

type Props<T extends string> = {
  rotulo?: string
  opcoes: Opcao<T>[]
  valor: T | null
  onChange: (valor: T) => void
  rolavel?: boolean
}

// Grupo de "chips" onde só um fica selecionado (funciona como radio button)
export default function SeletorOpcoes<T extends string>({ rotulo, opcoes, valor, onChange, rolavel }: Props<T>) {
  const chips = opcoes.map(o => {
    const ativo = o.valor === valor
    return (
      <Pressable
        key={o.valor}
        onPress={() => onChange(o.valor)}
        accessibilityRole="radio"
        accessibilityState={{ checked: ativo }}
        accessibilityLabel={rotulo ? `${rotulo}: ${o.rotulo}` : o.rotulo}
        style={({ pressed }) => [styles.chip, ativo && styles.chipAtivo, pressed && { opacity: 0.7 }]}
      >
        <Text style={[styles.texto, ativo && styles.textoAtivo]}>{o.rotulo}</Text>
      </Pressable>
    )
  })

  return (
    <View style={styles.grupo} accessibilityRole="radiogroup" accessibilityLabel={rotulo}>
      {rotulo && <Text style={styles.rotulo}>{rotulo}</Text>}
      {rolavel ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.linha}>
          {chips}
        </ScrollView>
      ) : (
        <View style={[styles.linha, styles.quebra]}>{chips}</View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  grupo: { marginBottom: 14 },
  rotulo: { fontSize: 14, fontWeight: "600", color: cores.texto, marginBottom: 6 },
  linha: { flexDirection: "row", gap: 8 },
  quebra: { flexWrap: "wrap" },
  chip: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.superficie,
    justifyContent: "center"
  },
  chipAtivo: { backgroundColor: cores.primaria, borderColor: cores.primaria },
  texto: { color: cores.texto, fontWeight: "600" },
  textoAtivo: { color: "#fff" }
})
