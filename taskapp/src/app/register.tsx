import { router } from "expo-router"
import React, { useState } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native"
import Botao from "../components/Botao"
import Campo from "../components/Campo"
import { useAuth } from "../contexts/AuthContext"
import { ROTAS } from "../routes"
import { ApiError, mensagemDeErro } from "../services/api"
import { cores } from "../theme/cores"
import { validarEmail, validarSenha } from "../utils/validacoes"

export default function Register() {
  const { cadastrar } = useAuth()
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [confirmacao, setConfirmacao] = useState("")
  const [erros, setErros] = useState<Record<string, string>>({})
  const [erroGeral, setErroGeral] = useState("")
  const [carregando, setCarregando] = useState(false)

  async function criarConta() {
    const e: Record<string, string> = {}
    if (nome.trim().length < 2) e.name = "Digite seu nome"
    const erroEmail = validarEmail(email)
    if (erroEmail) e.email = erroEmail
    const erroSenha = validarSenha(senha)
    if (erroSenha) e.password = erroSenha
    if (confirmacao !== senha) e.confirmacao = "As senhas não conferem"
    setErros(e)
    setErroGeral("")
    if (Object.keys(e).length) return

    setCarregando(true)
    try {
      await cadastrar(nome, email, senha) // ao logar, o layout leva para a lista sozinho
    } catch (err) {
      if (err instanceof ApiError && err.details) setErros(err.erroPorCampo)
      setErroGeral(mensagemDeErro(err))
    } finally {
      setCarregando(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.cartao}>
          <Campo rotulo="Nome" placeholder="Seu nome" value={nome} onChangeText={setNome} erro={erros.name} autoComplete="name" />
          <Campo
            rotulo="E-mail"
            placeholder="voce@email.com"
            value={email}
            onChangeText={setEmail}
            erro={erros.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Campo
            rotulo="Senha"
            placeholder="Crie uma senha"
            value={senha}
            onChangeText={setSenha}
            erro={erros.password}
            dica="Mínimo de 8 caracteres, com letras e números."
            senha
            autoComplete="new-password"
            textContentType="newPassword"
          />
          <Campo
            rotulo="Confirmar senha"
            placeholder="Repita a senha"
            value={confirmacao}
            onChangeText={setConfirmacao}
            erro={erros.confirmacao}
            senha
            onSubmitEditing={criarConta}
          />

          {!!erroGeral && (
            <Text style={styles.erro} accessibilityRole="alert">
              {erroGeral}
            </Text>
          )}

          <Botao titulo="Criar conta" onPress={criarConta} carregando={carregando} />
          <Botao titulo="Já tenho conta" variante="link" onPress={() => (router.canGoBack() ? router.back() : router.replace(ROTAS.login))} style={{ marginTop: 8 }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", padding: 20 },
  cartao: {
    backgroundColor: cores.superficie,
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 440,
    alignSelf: "center"
  },
  erro: { color: cores.erro, backgroundColor: cores.erroFundo, padding: 12, borderRadius: 8, marginBottom: 12 }
})
