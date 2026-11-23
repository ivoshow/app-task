import React, { useState } from "react"
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from "react-native"
import { cores } from "../theme/cores"

export type TextInputRef = React.ComponentRef<typeof TextInput>

type CampoProps = TextInputProps & {
  ref?: React.Ref<TextInputRef>
  rotulo: string
  erro?: string
  dica?: string
  senha?: boolean // mostra botão "Mostrar/Ocultar"
}

// Campo de formulário com rótulo, mensagem de erro e dica — tudo lido pelo leitor de tela.
// (No React 19, "ref" é uma prop comum: não precisa mais de forwardRef.)
export default function Campo({ ref, rotulo, erro, dica, senha, style, ...props }: CampoProps) {
  const [visivel, setVisivel] = useState(false)
  const [foco, setFoco] = useState(false)

  return (
    <View style={styles.grupo}>
      <Text style={styles.rotulo}>{rotulo}</Text>
      <View style={[styles.caixa, foco && styles.caixaFoco, !!erro && styles.caixaErro]}>
        <TextInput
          {...props}
          ref={ref}
          style={[styles.input, style]}
          placeholderTextColor={cores.textoSuave}
          secureTextEntry={senha && !visivel}
          autoCapitalize={senha ? "none" : props.autoCapitalize}
          autoCorrect={senha ? false : props.autoCorrect}
          accessibilityLabel={rotulo}
          accessibilityHint={erro ?? dica}
          onFocus={e => {
            setFoco(true)
            props.onFocus?.(e)
          }}
          onBlur={e => {
            setFoco(false)
            props.onBlur?.(e)
          }}
        />
        {senha && (
          <Pressable
            onPress={() => setVisivel(v => !v)}
            accessibilityRole="button"
            accessibilityLabel={visivel ? "Ocultar senha" : "Mostrar senha"}
            hitSlop={8}
            style={styles.olho}
          >
            <Text style={styles.olhoTexto}>{visivel ? "Ocultar" : "Mostrar"}</Text>
          </Pressable>
        )}
      </View>
      {erro ? (
        <Text style={styles.erro} accessibilityLiveRegion="polite" accessibilityRole="alert">
          {erro}
        </Text>
      ) : dica ? (
        <Text style={styles.dica}>{dica}</Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  grupo: { marginBottom: 14 },
  rotulo: { fontSize: 14, fontWeight: "600", color: cores.texto, marginBottom: 6 },
  caixa: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 10,
    backgroundColor: cores.superficie
  },
  caixaFoco: { borderColor: cores.primaria, borderWidth: 2 },
  caixaErro: { borderColor: cores.erro },
  input: { flex: 1, minHeight: 48, paddingHorizontal: 12, fontSize: 16, color: cores.texto },
  olho: { paddingHorizontal: 12, minHeight: 48, justifyContent: "center" },
  olhoTexto: { color: cores.primaria, fontWeight: "600" },
  erro: { color: cores.erro, fontSize: 13, marginTop: 4 },
  dica: { color: cores.textoSuave, fontSize: 13, marginTop: 4 }
})
