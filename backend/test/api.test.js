// Testes de ponta a ponta da API usando o test runner nativo do Node.
// Rode com: npm test
import assert from "node:assert/strict"
import { after, before, describe, it } from "node:test"

process.env.NODE_ENV = "test"
delete process.env.JWT_SECRET
const { createApp } = await import("../src/app.js")

let server
let base

before(async () => {
  server = createApp().listen(0)
  await new Promise(r => server.once("listening", r))
  base = `http://127.0.0.1:${server.address().port}/api`
})
after(() => server.close())

async function api(method, path, { body, token } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` })
    },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body)
  })
  const text = await res.text()
  return { status: res.status, body: text ? JSON.parse(text) : null, headers: res.headers }
}

const register = (n, extra = {}) =>
  api("POST", "/auth/register", { body: { name: `Usuário ${n}`, email: `u${n}@teste.com`, password: "senha1234", ...extra } })

describe("Autenticação", () => {
  it("cadastra, faz login e retorna /me sem expor o hash da senha", async () => {
    const r = await register(1)
    assert.equal(r.status, 201)
    assert.ok(r.body.accessToken && r.body.refreshToken)
    assert.equal(r.body.user.password_hash, undefined)

    const login = await api("POST", "/auth/login", { body: { email: "U1@TESTE.com", password: "senha1234" } })
    assert.equal(login.status, 200)

    const me = await api("GET", "/auth/me", { token: login.body.accessToken })
    assert.equal(me.status, 200)
    assert.equal(me.body.user.email, "u1@teste.com")
  })

  it("rejeita e-mail duplicado, senha fraca e campos extras", async () => {
    assert.equal((await register(1)).status, 409)
    assert.equal((await register(2, { password: "abc" })).status, 422)
    assert.equal((await register(3, { password: "somenteletras" })).status, 422)
    const extra = await register(4, { isAdmin: true })
    assert.equal(extra.status, 422)
    assert.match(extra.body.error.message, /não permitido/)
  })

  it("mensagem genérica para e-mail inexistente ou senha errada", async () => {
    const a = await api("POST", "/auth/login", { body: { email: "naoexiste@teste.com", password: "x" } })
    const b = await api("POST", "/auth/login", { body: { email: "u1@teste.com", password: "errada123" } })
    assert.equal(a.status, 401)
    assert.equal(a.body.error.message, b.body.error.message)
  })

  it("bloqueia a conta após 5 tentativas erradas", async () => {
    await register(5)
    for (let i = 0; i < 5; i++) {
      await api("POST", "/auth/login", { body: { email: "u5@teste.com", password: "errada123" } })
    }
    const r = await api("POST", "/auth/login", { body: { email: "u5@teste.com", password: "senha1234" } })
    assert.equal(r.status, 423)
  })

  it("rejeita token ausente, adulterado e com alg none", async () => {
    assert.equal((await api("GET", "/tasks")).status, 401)
    const { body } = await api("POST", "/auth/login", { body: { email: "u1@teste.com", password: "senha1234" } })
    const tampered = body.accessToken.slice(0, -3) + "abc"
    assert.equal((await api("GET", "/tasks", { token: tampered })).status, 401)

    const [, payload] = body.accessToken.split(".")
    const none = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString("base64url")}.${payload}.`
    assert.equal((await api("GET", "/tasks", { token: none })).status, 401)
  })

  it("rotaciona o refresh token e detecta reuso (revoga a família)", async () => {
    const { body } = await api("POST", "/auth/login", { body: { email: "u1@teste.com", password: "senha1234" } })
    const r1 = await api("POST", "/auth/refresh", { body: { refreshToken: body.refreshToken } })
    assert.equal(r1.status, 200)
    assert.notEqual(r1.body.refreshToken, body.refreshToken)

    // Reuso do token antigo → 401 e o novo também deixa de funcionar
    assert.equal((await api("POST", "/auth/refresh", { body: { refreshToken: body.refreshToken } })).status, 401)
    assert.equal((await api("POST", "/auth/refresh", { body: { refreshToken: r1.body.refreshToken } })).status, 401)
  })

  it("logout revoga o refresh token", async () => {
    const { body } = await api("POST", "/auth/login", { body: { email: "u1@teste.com", password: "senha1234" } })
    assert.equal((await api("POST", "/auth/logout", { body: { refreshToken: body.refreshToken } })).status, 204)
    assert.equal((await api("POST", "/auth/refresh", { body: { refreshToken: body.refreshToken } })).status, 401)
  })

  it("trocar a senha invalida tokens antigos", async () => {
    const reg = await register(6)
    const old = reg.body
    const r = await api("PUT", "/users/me/password", {
      token: old.accessToken,
      body: { currentPassword: "senha1234", newPassword: "novaSenha99" }
    })
    assert.equal(r.status, 200)
    assert.equal((await api("GET", "/auth/me", { token: old.accessToken })).status, 401)
    assert.equal((await api("POST", "/auth/refresh", { body: { refreshToken: old.refreshToken } })).status, 401)
    assert.equal((await api("GET", "/auth/me", { token: r.body.accessToken })).status, 200)
  })
})

describe("Tarefas", () => {
  let ana
  let bia

  before(async () => {
    ana = (await register(10)).body.accessToken
    bia = (await register(11)).body.accessToken
  })

  it("CRUD completo com status e vencimento", async () => {
    const c = await api("POST", "/tasks", {
      token: ana,
      body: { title: "Estudar Node", dueDate: "2020-01-10", priority: "alta" }
    })
    assert.equal(c.status, 201)
    assert.equal(c.body.status, "pendente")
    assert.equal(c.body.isOverdue, true)

    const u = await api("PATCH", `/tasks/${c.body.id}/status`, { token: ana, body: { status: "concluida" } })
    assert.equal(u.body.status, "concluida")
    assert.ok(u.body.completedAt)
    assert.equal(u.body.isOverdue, false)

    const e = await api("PATCH", `/tasks/${c.body.id}`, { token: ana, body: { title: "Estudar Express", dueDate: null } })
    assert.equal(e.body.title, "Estudar Express")
    assert.equal(e.body.dueDate, null)

    assert.equal((await api("DELETE", `/tasks/${c.body.id}`, { token: ana })).status, 204)
    assert.equal((await api("GET", `/tasks/${c.body.id}`, { token: ana })).status, 404)
  })

  it("valida datas e status", async () => {
    assert.equal((await api("POST", "/tasks", { token: ana, body: { title: "x", dueDate: "2025-02-31" } })).status, 422)
    assert.equal((await api("POST", "/tasks", { token: ana, body: { title: "x", status: "feito" } })).status, 422)
    assert.equal((await api("POST", "/tasks", { token: ana, body: { title: "   " } })).status, 422)
    assert.equal((await api("GET", "/tasks/123", { token: ana })).status, 422)
  })

  it("um usuário NÃO vê nem altera tarefas de outro", async () => {
    const t = (await api("POST", "/tasks", { token: ana, body: { title: "Segredo da Ana" } })).body

    assert.equal((await api("GET", `/tasks/${t.id}`, { token: bia })).status, 404)
    assert.equal((await api("PATCH", `/tasks/${t.id}`, { token: bia, body: { title: "hack" } })).status, 404)
    assert.equal((await api("DELETE", `/tasks/${t.id}`, { token: bia })).status, 404)
    const list = await api("GET", "/tasks", { token: bia })
    assert.equal(list.body.data.length, 0)

    // Não dá para "injetar" o dono pelo corpo
    const inj = await api("POST", "/tasks", { token: bia, body: { title: "x", userId: "outro" } })
    assert.equal(inj.status, 422)

    assert.equal((await api("GET", `/tasks/${t.id}`, { token: ana })).body.title, "Segredo da Ana")
  })

  it("filtra, busca, resume e pagina", async () => {
    await api("POST", "/tasks", { token: bia, body: { title: "Comprar pão", status: "em_andamento", dueDate: "2999-01-01" } })
    await api("POST", "/tasks", { token: bia, body: { title: "Pagar boleto", dueDate: "2000-01-01" } })
    await api("POST", "/tasks", { token: bia, body: { title: "100% feito", status: "concluida" } })

    assert.equal((await api("GET", "/tasks?status=em_andamento", { token: bia })).body.data.length, 1)
    assert.equal((await api("GET", "/tasks?overdue=true", { token: bia })).body.data[0].title, "Pagar boleto")
    assert.equal((await api("GET", "/tasks?search=%25", { token: bia })).body.data.length, 1) // % literal
    assert.equal((await api("GET", "/tasks?limit=2&page=2", { token: bia })).body.data.length, 1)

    const s = (await api("GET", "/tasks/summary", { token: bia })).body
    assert.deepEqual(s, { total: 3, pendente: 1, emAndamento: 1, concluida: 1, vencidas: 1, venceHoje: 0 })
  })

  it("excluir a conta apaga as tarefas do usuário", async () => {
    const reg = (await register(12)).body
    await api("POST", "/tasks", { token: reg.accessToken, body: { title: "x" } })
    assert.equal((await api("DELETE", "/users/me", { token: reg.accessToken, body: { password: "errada" } })).status, 400)
    assert.equal((await api("DELETE", "/users/me", { token: reg.accessToken, body: { password: "senha1234" } })).status, 204)
    assert.equal((await api("GET", "/tasks", { token: reg.accessToken })).status, 401)
  })
})

describe("Aplicação", () => {
  it("envia cabeçalhos de segurança e não expõe o Express", async () => {
    const r = await api("GET", "/health")
    assert.equal(r.headers.get("x-powered-by"), null)
    assert.equal(r.headers.get("x-content-type-options"), "nosniff")
  })

  it("trata JSON inválido, corpo enorme e rota inexistente", async () => {
    assert.equal((await api("POST", "/auth/login", { body: "{oops" })).status, 400)
    assert.equal((await api("POST", "/auth/login", { body: { email: "a@a.com", password: "x".repeat(20000) } })).status, 413)
    assert.equal((await api("GET", "/nada")).status, 404)
  })
})
