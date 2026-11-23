import React, { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { cores } from "../theme/cores"
import { brParaISO, hojeISO, isoParaBR, mascararData, somarDias } from "../utils/datas"
import Calendario from "./Calendario"
import Campo from "./Campo"

type Props = {
  valor: string | null // AAAA-MM-DD
  onChange: (iso: string | null) => void
  onInvalido?: (invalido: boolean) => void // avisa o formulário se a data digitada está incompleta/errada
  erro?: string
}

// Campo de data de vencimento: digitação com máscara, calendário e atalhos rápidos.
// Não precisa de biblioteca nativa, então funciona no Expo Go e na web.
export default function CampoData({ valor, onChange, onInvalido, erro }: Props) {
  const [texto, setTexto] = useState(isoParaBR(valor))
  const [erroLocal, setErroLocal] = useState<string>()
  const [ultimoValor, setUltimoValor] = useState(valor)
  const [calendarioAberto, setCalendarioAberto] = useState(false)

  // Se o valor mudou "de fora" (ex.: atalho), atualiza o texto exibido.
  // Ajustar estado durante o render é o padrão recomendado pelo React (evita useEffect).
  if (valor !== ultimoValor) {
    setUltimoValor(valor)
    setTexto(isoParaBR(valor))
  }

  function emitir(iso: string | null, invalido: boolean) {
    setUltimoValor(iso)
    onChange(iso)
    onInvalido?.(invalido)
  }

  function digitar(t: string) {
    const mascarado = mascararData(t)
    setTexto(mascarado)
    if (mascarado === "") {
      setErroLocal(undefined)
      return emitir(null, false)
    }
    const iso = mascarado.length === 10 ? brParaISO(mascarado) : null
    setErroLocal(iso || mascarado.length < 10 ? undefined : "Data inválida")
    emitir(iso, !iso)
  }

  const hoje = hojeISO()
  const atalhos: { rotulo: string; valor: string | null }[] = [
    { rotulo: "Hoje", valor: hoje },
    { rotulo: "Amanhã", valor: somarDias(hoje, 1) },
    { rotulo: "Em 7 dias", valor: somarDias(hoje, 7) },
    { rotulo: "Sem prazo", valor: null }
  ]

  return (
    <View>
      <Campo
        rotulo="Data de vencimento"
        placeholder="DD/MM/AAAA"
        keyboardType="number-pad"
        maxLength={10}
        value={texto}
        onChangeText={digitar}
        erro={erroLocal ?? erro}
        dica="Opcional. Digite a data, abra o calendário ou use um atalho."
      />
      <Pressable
        onPress={() => setCalendarioAberto(true)}
        accessibilityRole="button"
        accessibilityLabel="Escolher data no calendário"
        style={styles.botaoCalendario}
      >
        <Text style={styles.botaoCalendarioTexto}>📅 Escolher no calendário</Text>
      </Pressable>
      <Calendario
        visivel={calendarioAberto}
        valor={valor}
        onFechar={() => setCalendarioAberto(false)}
        onSelecionar={iso => {
          setCalendarioAberto(false)
          setErroLocal(undefined)
          onInvalido?.(false)
          onChange(iso)
        }}
      />
      <View style={styles.atalhos}>
        {atalhos.map(a => {
          const ativo = a.valor === valor
          return (
            <Pressable
              key={a.rotulo}
              onPress={() => {
                setErroLocal(undefined)
                onInvalido?.(false)
                onChange(a.valor)
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: ativo }}
              accessibilityLabel={`Vencimento: ${a.rotulo}`}
              style={[styles.atalho, ativo && styles.atalhoAtivo]}
            >
              <Text style={[styles.atalhoTexto, ativo && styles.atalhoTextoAtivo]}>{a.rotulo}</Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  botaoCalendario: {
    minHeight: 48,
    marginTop: -4,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: cores.primaria,
    alignItems: "center",
    justifyContent: "center"
  },
  botaoCalendarioTexto: { color: cores.primaria, fontWeight: "bold", fontSize: 15 },
  atalhos: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  atalho: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: cores.primariaClara,
    justifyContent: "center"
  },
  atalhoAtivo: { backgroundColor: cores.primaria },
  atalhoTexto: { color: cores.primaria, fontWeight: "600", fontSize: 13 },
  atalhoTextoAtivo: { color: "#fff" }
})
