// Utilitários de data. A API trabalha com AAAA-MM-DD; o usuário vê DD/MM/AAAA.

const pad = (n: number) => String(n).padStart(2, "0")

export function paraISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function hojeISO(): string {
  return paraISO(new Date())
}

export function somarDias(iso: string, dias: number): string {
  const [a, m, d] = iso.split("-").map(Number)
  return paraISO(new Date(a, m - 1, d + dias))
}

/** "2026-11-22" → "22/11/2026" */
export function isoParaBR(iso: string | null): string {
  if (!iso) return ""
  const [a, m, d] = iso.split("-")
  return `${d}/${m}/${a}`
}

/** "22/11/2026" → "2026-11-22" (ou null se a data não existir, ex.: 31/02) */
export function brParaISO(br: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br)
  if (!match) return null
  const [, d, m, a] = match.map(Number)
  const data = new Date(a, m - 1, d)
  const valida = data.getFullYear() === a && data.getMonth() === m - 1 && data.getDate() === d
  return valida ? paraISO(data) : null
}

/** Aplica a máscara DD/MM/AAAA enquanto o usuário digita. */
export function mascararData(texto: string): string {
  const n = texto.replace(/\D/g, "").slice(0, 8)
  if (n.length <= 2) return n
  if (n.length <= 4) return `${n.slice(0, 2)}/${n.slice(2)}`
  return `${n.slice(0, 2)}/${n.slice(2, 4)}/${n.slice(4)}`
}

function diferencaEmDias(iso: string): number {
  const [a, m, d] = iso.split("-").map(Number)
  const alvo = new Date(a, m - 1, d).getTime()
  const [ha, hm, hd] = hojeISO().split("-").map(Number)
  const hoje = new Date(ha, hm - 1, hd).getTime()
  return Math.round((alvo - hoje) / 86_400_000)
}

export type SituacaoPrazo = "vencida" | "hoje" | "breve" | "normal" | "concluida" | "sem_prazo"

/** Texto amigável e "situação" do prazo de uma tarefa. */
export function descreverPrazo(dueDate: string | null, concluida: boolean): { texto: string; situacao: SituacaoPrazo } {
  if (!dueDate) return { texto: "Sem prazo", situacao: "sem_prazo" }
  const dias = diferencaEmDias(dueDate)
  const dataBR = isoParaBR(dueDate)

  if (concluida) return { texto: `Prazo: ${dataBR}`, situacao: "concluida" }
  if (dias < 0) {
    const n = Math.abs(dias)
    return { texto: `Venceu há ${n} dia${n > 1 ? "s" : ""} (${dataBR})`, situacao: "vencida" }
  }
  if (dias === 0) return { texto: "Vence hoje", situacao: "hoje" }
  if (dias === 1) return { texto: "Vence amanhã", situacao: "breve" }
  if (dias <= 3) return { texto: `Vence em ${dias} dias`, situacao: "breve" }
  return { texto: `Vence em ${dataBR}`, situacao: "normal" }
}
