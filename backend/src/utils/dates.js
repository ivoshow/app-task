// Data local de "hoje" no formato AAAA-MM-DD (usada para calcular tarefas vencidas).
// O cliente pode enviar o próprio "hoje" (?today=) para respeitar o fuso dele.
export function todayISO() {
  const d = new Date()
  const pad = n => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function nowISO() {
  return new Date().toISOString()
}
