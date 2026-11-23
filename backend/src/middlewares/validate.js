import { AppError } from "../utils/AppError.js"

// Valida body / query / params com um schema Zod e substitui pelo valor "limpo".
export function validate(schema, source = "body") {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source] ?? {})
    if (!result.success) {
      const details = result.error.issues.map(i => ({
        field: i.path.join(".") || source,
        message: i.code === "unrecognized_keys" ? `Campo(s) não permitido(s): ${i.keys.join(", ")}` : i.message
      }))
      throw new AppError(details[0].message, 422, "VALIDATION_ERROR", details)
    }
    // Em Express 5, req.query é somente leitura: guardamos o valor validado em req.validated
    req.validated = { ...req.validated, [source]: result.data }
    next()
  }
}
