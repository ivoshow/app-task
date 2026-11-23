import React from "react"
import { StyleSheet, Text, View } from "react-native"

// Pequena "etiqueta" colorida (status, prioridade...)
export default function Selo({ texto, cor, fundo }: { texto: string; cor: string; fundo: string }) {
  return (
    <View style={[styles.selo, { backgroundColor: fundo }]}>
      <Text style={[styles.texto, { color: cor }]}>{texto}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  selo: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, alignSelf: "flex-start" },
  texto: { fontSize: 12, fontWeight: "700" }
})
