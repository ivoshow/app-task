// Paleta do app. Combinações de texto/fundo pensadas para bom contraste (WCAG AA).
export const cores = {
  primaria: "#342988",
  primariaClara: "#ECEAF8",
  fundo: "#F5F5FA",
  superficie: "#FFFFFF",
  texto: "#1C1B29",
  textoSuave: "#5B5A6E",
  borda: "#D6D5E3",
  erro: "#B3261E",
  erroFundo: "#FCE8E6",
  sucesso: "#1E7A3C",
  sucessoFundo: "#E3F4E8",
  alerta: "#8A5A00",
  alertaFundo: "#FFF3D6",
  info: "#1D5FA8",
  infoFundo: "#E3EEFB"
}

export const corStatus = {
  pendente: { texto: cores.alerta, fundo: cores.alertaFundo },
  em_andamento: { texto: cores.info, fundo: cores.infoFundo },
  concluida: { texto: cores.sucesso, fundo: cores.sucessoFundo }
} as const

export const corPrioridade = {
  baixa: { texto: cores.textoSuave, fundo: "#EEEEF3" },
  media: { texto: cores.info, fundo: cores.infoFundo },
  alta: { texto: cores.erro, fundo: cores.erroFundo }
} as const
