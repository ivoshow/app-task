import { Link } from "expo-router"
import React, { useRef, useState } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native"
import Botao from "../components/Botao"
import Campo, { type TextInputRef } from "../components/Campo"
import { useAuth } from "../contexts/AuthContext"
import { ROTAS } from "../routes"
import { mensagemDeErro } from "../services/api"
import { cores } from "../theme/cores"

export default function Login() {
  const { entrar } = useAuth()
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [erro, setErro] = useState("")
  const [carregando, setCarregando] = useState(false)
  const senhaRef = useRef<TextInputRef>(null)

  async function fazerLogin() {
    setErro("")
    if (!email.trim() || !senha) {
      setErro("Preencha e-mail e senha.")
      return
    }
    setCarregando(true)
    try {
      await entrar(email, senha) // ao logar, o layout troca as telas automaticamente
    } catch (e) {
      setErro(mensagemDeErro(e))
      setSenha("")
    } finally {
      setCarregando(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.topo}>
          <Text style={styles.logo} accessibilityRole="header">
            TaskApp
          </Text>
          <Text style={styles.subtitulo}>Organize suas tarefas com segurança</Text>
        </View>

        <View style={styles.cartao}>
          <Campo
            rotulo="E-mail"
            placeholder="voce@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            onSubmitEditing={() => senhaRef.current?.focus()}
          />
          <Campo
            ref={senhaRef}
            rotulo="Senha"
            placeholder="Sua senha"
            value={senha}
            onChangeText={setSenha}
            senha
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={fazerLogin}
          />

          {!!erro && (
            <Text style={styles.erro} accessibilityRole="alert" accessibilityLiveRegion="assertive">
              {erro}
            </Text>
          )}

          <Botao titulo="Entrar" onPress={fazerLogin} carregando={carregando} />

          <View style={styles.rodape}>
            <Text style={styles.rodapeTexto}>Não tem conta?</Text>
            <Link href={ROTAS.cadastro} style={styles.link} accessibilityRole="link">
              Cadastre-se
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", padding: 20, backgroundColor: cores.primaria },
  topo: { alignItems: "center", marginBottom: 24 },
  logo: { fontSize: 36, fontWeight: "900", color: "#fff" },
  subtitulo: { color: "#E4E1FA", fontSize: 15, marginTop: 4 },
  cartao: {
    backgroundColor: cores.superficie,
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 440,
    alignSelf: "center"
  },
  erro: { color: cores.erro, backgroundColor: cores.erroFundo, padding: 12, borderRadius: 8, marginBottom: 12 },
  rodape: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 16 },
  rodapeTexto: { color: cores.textoSuave },
  link: { color: cores.primaria, fontWeight: "700", padding: 8 }
})
