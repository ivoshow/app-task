import { createApp } from "./app.js"
import { env } from "./config/env.js"
import { purgeOldRefreshTokens } from "./services/tokenService.js"

const app = createApp()

const server = app.listen(env.port, env.host, () => {
  console.log(`🚀 TaskApp API rodando em http://${env.host}:${env.port}/api`)
})

// Limpa refresh tokens velhos ao subir e a cada 6 horas
purgeOldRefreshTokens()
setInterval(purgeOldRefreshTokens, 6 * 60 * 60 * 1000).unref()

// Desligamento gracioso
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    console.log(`\n${signal} recebido, encerrando...`)
    server.close(() => process.exit(0))
  })
}
