import React, { useState } from "react"
import { ScrollView, StyleSheet, Text, View } from "react-native"
import Botao from "../components/Botao"
import Campo from "../components/Campo"
import { useAuth } from "../contexts/AuthContext"
import { API_URL, mensagemDeErro } from "../services/api"
import { authService } from "../services/authService"
import { cores } from "../theme/cores"
import { avisar, confirmar } from "../utils/confirmar"
import { validarSenha } from "../utils/validacoes"

// Perfil: editar nome, trocar senha, sair e excluir a conta
export default function Perfil() {
  const { usuario, sair, atualizarUsuario, aplicarNovaSessao } = useAuth()

  const [nome, setNome] = useState(usuario?.name ?? "")
  const [salvandoNome, setSalvandoNome] = useState(false)

  const [senhaAtual, setSenhaAtual] = useState("")
  const [novaSenha, setNovaSenha] = useState("")
  const [confirmacao, setConfirmacao] = useState("")
  const [errosSenha, setErrosSenha] = useState<Record<string, string>>({})
  const [salvandoSenha, setSalvandoSenha] = useState(false)

  const [senhaExclusao, setSenhaExclusao] = useState("")
  const [excluindo, setExcluindo] = useState(false)

  async function salvarNome() {
    if (nome.trim().length < 2) return avisar("Atenção", "Digite um nome válido.")
    setSalvandoNome(true)
    try {
      const { user } = await authService.atualizarNome(nome.trim())
      await atualizarUsuario(user)
      avisar("Pronto", "Nome atualizado.")
    } catch (e) {
      avisar("Erro", mensagemDeErro(e))
    } finally {
      setSalvandoNome(false)
    }
  }

  async function trocarSenha() {
    const e: Record<string, string> = {}
    if (!senhaAtual) e.currentPassword = "Informe a senha atual"
    const erroNova = validarSenha(novaSenha)
    if (erroNova) e.newPassword = erroNova
    if (confirmacao !== novaSenha) e.confirmacao = "As senhas não conferem"
    setErrosSenha(e)
    if (Object.keys(e).length) return

    setSalvandoSenha(true)
    try {
      // A API encerra TODAS as sessões e devolve uma nova só para este aparelho
      await aplicarNovaSessao(await authService.trocarSenha(senhaAtual, novaSenha))
      setSenhaAtual("")
      setNovaSenha("")
      setConfirmacao("")
      avisar("Senha alterada", "Por segurança, os outros aparelhos foram desconectados.")
    } catch (err) {
      avisar("Erro", mensagemDeErro(err))
    } finally {
      setSalvandoSenha(false)
    }
  }

  async function excluirConta() {
    if (!senhaExclusao) return avisar("Atenção", "Digite sua senha para confirmar.")
    const ok = await confirmar(
      "Excluir conta",
      "Sua conta e TODAS as suas tarefas serão apagadas permanentemente. Deseja continuar?",
      "Excluir tudo"
    )
    if (!ok) return
    setExcluindo(true)
    try {
      await authService.excluirConta(senhaExclusao)
      await sair()
    } catch (e) {
      avisar("Erro", mensagemDeErro(e))
      setExcluindo(false)
    }
  }

  async function confirmarSaida() {
    if (await confirmar("Sair", "Deseja sair da sua conta?", "Sair")) await sair()
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.cabecalho}>
        <Text style={styles.avatar}>{usuario?.name.charAt(0).toUpperCase()}</Text>
        <Text style={styles.nome} accessibilityRole="header">
          {usuario?.name}
        </Text>
        <Text style={styles.email}>{usuario?.email}</Text>
      </View>

      <Secao titulo="Dados pessoais">
        <Campo rotulo="Nome" value={nome} onChangeText={setNome} maxLength={80} autoComplete="name" />
        <Botao titulo="Salvar nome" variante="secundario" onPress={salvarNome} carregando={salvandoNome} />
      </Secao>

      <Secao titulo="Trocar senha">
        <Campo rotulo="Senha atual" value={senhaAtual} onChangeText={setSenhaAtual} senha erro={errosSenha.currentPassword} />
        <Campo
          rotulo="Nova senha"
          value={novaSenha}
          onChangeText={setNovaSenha}
          senha
          erro={errosSenha.newPassword}
          dica="Mínimo de 8 caracteres, com letras e números."
        />
        <Campo rotulo="Confirmar nova senha" value={confirmacao} onChangeText={setConfirmacao} senha erro={errosSenha.confirmacao} />
        <Botao titulo="Alterar senha" variante="secundario" onPress={trocarSenha} carregando={salvandoSenha} />
      </Secao>

      <Botao titulo="Sair da conta" onPress={confirmarSaida} style={{ marginBottom: 24 }} />

      <Secao titulo="Zona de perigo" perigo>
        <Text style={styles.textoPerigo}>Excluir a conta apaga todas as suas tarefas. Esta ação não pode ser desfeita.</Text>
        <Campo rotulo="Confirme sua senha" value={senhaExclusao} onChangeText={setSenhaExclusao} senha />
        <Botao titulo="Excluir minha conta" variante="perigo" onPress={excluirConta} carregando={excluindo} />
      </Secao>

      <Text style={styles.versao}>API: {API_URL}</Text>
    </ScrollView>
  )
}

function Secao({ titulo, perigo, children }: { titulo: string; perigo?: boolean; children: React.ReactNode }) {
  return (
    <View style={[styles.secao, perigo && styles.secaoPerigo]}>
      <Text style={[styles.secaoTitulo, perigo && { color: cores.erro }]} accessibilityRole="header">
        {titulo}
      </Text>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, width: "100%", maxWidth: 600, alignSelf: "center" },
  cabecalho: { alignItems: "center", marginBottom: 20 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: cores.primaria,
    color: "#fff",
    fontSize: 32,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: 72,
    overflow: "hidden",
    marginBottom: 8
  },
  nome: { fontSize: 20, fontWeight: "800", color: cores.texto },
  email: { color: cores.textoSuave },
  secao: { backgroundColor: cores.superficie, borderRadius: 12, padding: 16, marginBottom: 16 },
  secaoPerigo: { borderWidth: 1, borderColor: cores.erro },
  secaoTitulo: { fontSize: 16, fontWeight: "800", color: cores.texto, marginBottom: 12 },
  textoPerigo: { color: cores.textoSuave, marginBottom: 12 },
  versao: { textAlign: "center", color: cores.textoSuave, fontSize: 12, marginTop: 8 }
})
