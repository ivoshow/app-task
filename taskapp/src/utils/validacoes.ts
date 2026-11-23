// Mesmas regras da API (que valida de novo do lado do servidor).
export function validarSenha(senha: string): string | undefined {
  if (senha.length < 8) return "A senha deve ter pelo menos 8 caracteres"
  if (senha.length > 72) return "A senha deve ter no máximo 72 caracteres"
  if (!/[A-Za-z]/.test(senha) || !/\d/.test(senha)) return "A senha deve conter letras e números"
}

export function validarEmail(email: string): string | undefined {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "E-mail inválido"
}
