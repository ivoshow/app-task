// Monta a aplicação Express com as camadas de segurança em ordem.
import cors from "cors"
import express from "express"
import helmet from "helmet"
import { env } from "./config/env.js"
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js"
import { apiLimiter } from "./middlewares/rateLimit.js"
import { authRoutes } from "./routes/authRoutes.js"
import { taskRoutes } from "./routes/taskRoutes.js"
import { userRoutes } from "./routes/userRoutes.js"

export function createApp() {
  const app = express()

  app.disable("x-powered-by") // não anuncia que é Express
  app.set("trust proxy", env.trustProxy)

  // 1. Cabeçalhos HTTP de segurança (CSP, HSTS, noSniff, frameguard...)
  app.use(helmet())

  // 2. CORS: só origens conhecidas (o app nativo não envia Origin, então passa)
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin || env.corsOrigins.includes(origin)) return cb(null, true)
        return cb(null, false)
      },
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
      maxAge: 600
    })
  )

  // 3. Corpo JSON com tamanho máximo (evita payloads gigantes)
  app.use(express.json({ limit: "10kb" }))

  // 4. Respostas da API nunca devem ficar em cache (dados pessoais)
  app.use("/api", (_req, res, next) => {
    res.set("Cache-Control", "no-store")
    next()
  })

  // 5. Log simples (sem corpo, para não registrar senhas/tokens)
  if (!env.isTest) {
    app.use((req, res, next) => {
      const start = Date.now()
      res.on("finish", () => console.log(`${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`))
      next()
    })
  }

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }))

  // 6. Limite de requisições por IP
  app.use("/api", apiLimiter)

  app.use("/api/auth", authRoutes)
  app.use("/api/users", userRoutes)
  app.use("/api/tasks", taskRoutes)

  app.use(notFoundHandler)
  app.use(errorHandler)
  return app
}
