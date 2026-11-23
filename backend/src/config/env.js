// Centraliza e VALIDA as variáveis de ambiente.
// Se algo essencial estiver faltando ou fraco, o servidor nem sobe (fail fast).

const isProduction = process.env.NODE_ENV === "production"
const isTest = process.env.NODE_ENV === "test"

function required(name, fallbackForDev) {
  const value = process.env[name] ?? (isProduction ? undefined : fallbackForDev)
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`)
  }
  return value
}

const jwtSecret = required("JWT_SECRET", isTest ? "segredo-de-teste-com-mais-de-32-caracteres!!" : undefined)
if (jwtSecret.length < 32) {
  throw new Error("JWT_SECRET deve ter pelo menos 32 caracteres")
}

export const env = {
  isProduction,
  isTest,
  port: Number(process.env.PORT ?? 3333),
  host: process.env.HOST ?? "0.0.0.0",
  databaseFile: process.env.DATABASE_FILE ?? (isTest ? ":memory:" : "./data/taskapp.db"),

  jwtSecret,
  jwtIssuer: "taskapp-api",
  jwtAudience: "taskapp-mobile",
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL ?? "15m",
  refreshTokenDays: Number(process.env.REFRESH_TOKEN_DAYS ?? 30),

  bcryptRounds: isTest ? 4 : Number(process.env.BCRYPT_ROUNDS ?? 12),

  // Bloqueio de conta após tentativas de login erradas
  maxLoginAttempts: Number(process.env.MAX_LOGIN_ATTEMPTS ?? 5),
  lockMinutes: Number(process.env.LOCK_MINUTES ?? 15),

  // Origens permitidas no CORS (apps nativos não enviam Origin; isso vale para o Expo Web)
  // Em produção é obrigatório informar o domínio real (ex.: https://taskapp.vercel.app)
  corsOrigins: required("CORS_ORIGINS", "http://localhost:8081,http://localhost:19006")
    .split(",")
    .map(o => o.trim())
    .filter(Boolean),

  // Quantos proxies confiáveis existem na frente da API (para o rate limit ver o IP real)
  trustProxy: Number(process.env.TRUST_PROXY ?? 0)
}
