import React, { useState } from "react"
import { Modal, Pressable, StyleSheet, Text, View } from "react-native"
import { cores } from "../theme/cores"
import { hojeISO, paraISO } from "../utils/datas"

type Props = {
  visivel: boolean
  valor: string | null // AAAA-MM-DD
  onSelecionar: (iso: string) => void
  onFechar: () => void
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]
const DIAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"]
const DIAS_SEMANA_EXTENSO = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"]

/** Primeiro dia do mês da data informada (ou de hoje). */
function inicioDoMes(iso: string | null) {
  const [a, m] = (iso ?? hojeISO()).split("-").map(Number)
  return new Date(a, m - 1, 1)
}

/** Monta a grade do mês: semanas de 7 dias, com null nas casas vazias. */
function montarGrade(mes: Date): (Date | null)[] {
  const ano = mes.getFullYear()
  const m = mes.getMonth()
  const totalDias = new Date(ano, m + 1, 0).getDate()
  const casas: (Date | null)[] = Array(mes.getDay()).fill(null)
  for (let d = 1; d <= totalDias; d++) casas.push(new Date(ano, m, d))
  while (casas.length % 7) casas.push(null)
  return casas
}

// Calendário mensal feito só com componentes do React Native:
// sem biblioteca nativa, então funciona no Expo Go, Android, iOS e na web (Vercel).
export default function Calendario({ visivel, valor, onSelecionar, onFechar }: Props) {
  const [mes, setMes] = useState(() => inicioDoMes(valor))
  const [aberto, setAberto] = useState(visivel)

  // Ao abrir, mostra o mês da data já escolhida
  if (visivel !== aberto) {
    setAberto(visivel)
    if (visivel) setMes(inicioDoMes(valor))
  }

  const hoje = hojeISO()
  const grade = montarGrade(mes)
  const mudarMes = (delta: number) => setMes(new Date(mes.getFullYear(), mes.getMonth() + delta, 1))

  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={onFechar}>
      <Pressable style={styles.fundo} onPress={onFechar} accessibilityLabel="Fechar calendário">
        {/* Pressable interno impede que o toque no cartão feche o modal */}
        <Pressable style={styles.cartao} onPress={() => {}} accessible={false}>
          <View style={styles.cabecalho}>
            <Pressable
              onPress={() => mudarMes(-1)}
              style={styles.seta}
              accessibilityRole="button"
              accessibilityLabel="Mês anterior"
            >
              <Text style={styles.setaTexto}>‹</Text>
            </Pressable>
            <Text style={styles.titulo} accessibilityRole="header">
              {MESES[mes.getMonth()]} {mes.getFullYear()}
            </Text>
            <Pressable
              onPress={() => mudarMes(1)}
              style={styles.seta}
              accessibilityRole="button"
              accessibilityLabel="Próximo mês"
            >
              <Text style={styles.setaTexto}>›</Text>
            </Pressable>
          </View>

          <View style={styles.linha}>
            {DIAS_SEMANA.map((d, i) => (
              <Text key={i} style={styles.diaSemana} importantForAccessibility="no">
                {d}
              </Text>
            ))}
          </View>

          <View style={styles.grade}>
            {grade.map((data, i) => {
              if (!data) return <View key={i} style={styles.casa} />
              const iso = paraISO(data)
              const selecionado = iso === valor
              const ehHoje = iso === hoje
              const passado = iso < hoje
              return (
                <Pressable
                  key={i}
                  onPress={() => onSelecionar(iso)}
                  style={[styles.casa, styles.dia, ehHoje && styles.hoje, selecionado && styles.selecionado]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selecionado }}
                  accessibilityLabel={`${DIAS_SEMANA_EXTENSO[data.getDay()]}, ${data.getDate()} de ${MESES[data.getMonth()]}${ehHoje ? ", hoje" : ""}`}
                >
                  <Text
                    style={[
                      styles.diaTexto,
                      passado && styles.diaPassado,
                      ehHoje && styles.hojeTexto,
                      selecionado && styles.selecionadoTexto
                    ]}
                  >
                    {data.getDate()}
                  </Text>
                </Pressable>
              )
            })}
          </View>

          <View style={styles.rodape}>
            <Pressable onPress={() => onSelecionar(hoje)} style={styles.botao} accessibilityRole="button">
              <Text style={styles.botaoTexto}>Hoje</Text>
            </Pressable>
            <Pressable onPress={onFechar} style={styles.botao} accessibilityRole="button">
              <Text style={styles.botaoTexto}>Cancelar</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center", padding: 16 },
  cartao: { width: "100%", maxWidth: 360, backgroundColor: cores.superficie, borderRadius: 16, padding: 16 },
  cabecalho: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  titulo: { fontSize: 17, fontWeight: "bold", color: cores.texto },
  seta: { width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: 24 },
  setaTexto: { fontSize: 28, color: cores.primaria, fontWeight: "bold" },
  linha: { flexDirection: "row" },
  diaSemana: { width: `${100 / 7}%`, textAlign: "center", color: cores.textoSuave, fontWeight: "600", paddingVertical: 6 },
  grade: { flexDirection: "row", flexWrap: "wrap" },
  casa: { width: `${100 / 7}%`, aspectRatio: 1, padding: 2 },
  dia: { alignItems: "center", justifyContent: "center", borderRadius: 999 },
  diaTexto: { fontSize: 15, color: cores.texto },
  diaPassado: { color: cores.textoSuave },
  hoje: { borderWidth: 2, borderColor: cores.primaria },
  hojeTexto: { color: cores.primaria, fontWeight: "bold" },
  selecionado: { backgroundColor: cores.primaria, borderColor: cores.primaria },
  selecionadoTexto: { color: "#fff", fontWeight: "bold" },
  rodape: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 8 },
  botao: { minHeight: 44, paddingHorizontal: 16, justifyContent: "center", borderRadius: 8 },
  botaoTexto: { color: cores.primaria, fontWeight: "bold", fontSize: 15 }
})
