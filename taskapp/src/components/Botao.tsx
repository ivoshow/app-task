import React from "react"
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from "react-native"
import { cores } from "../theme/cores"

type Variante = "primario" | "secundario" | "perigo" | "link"

type BotaoProps = {
  titulo: string
  onPress: () => void
  variante?: Variante
  carregando?: boolean
  desabilitado?: boolean
  style?: ViewStyle
  accessibilityHint?: string
}

const visual: Record<Variante, { fundo: ViewStyle; corTexto: string }> = {
  primario: { fundo: { backgroundColor: cores.primaria }, corTexto: "#fff" },
  secundario: {
    fundo: { backgroundColor: cores.primariaClara, borderWidth: 1, borderColor: cores.primaria },
    corTexto: cores.primaria
  },
  perigo: { fundo: { backgroundColor: cores.erro }, corTexto: "#fff" },
  link: { fundo: { backgroundColor: "transparent" }, corTexto: cores.primaria }
}

// Botão padrão do app: mesmo visual em Android, iOS e web, com estado de carregamento
export default function Botao({
  titulo,
  onPress,
  variante = "primario",
  carregando = false,
  desabilitado = false,
  style,
  accessibilityHint
}: BotaoProps) {
  const inativo = desabilitado || carregando
  const { fundo, corTexto } = visual[variante]

  return (
    <Pressable
      onPress={onPress}
      disabled={inativo}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inativo, busy: carregando }}
      style={({ pressed }) => [styles.botao, fundo, pressed && styles.pressionado, inativo && styles.inativo, style]}
    >
      {carregando ? (
        <ActivityIndicator color={corTexto} />
      ) : (
        <Text style={[styles.texto, { color: corTexto }]}>{titulo}</Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  botao: {
    minHeight: 48, // área de toque confortável (acessibilidade)
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center"
  },
  pressionado: { opacity: 0.75 },
  inativo: { opacity: 0.5 },
  texto: { fontSize: 16, fontWeight: "bold" }
})
