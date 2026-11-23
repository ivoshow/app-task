// Regras das tarefas.
// SEGURANÇA: TODA consulta filtra por user_id. Um usuário nunca lê, altera ou apaga
// tarefa de outro. Se a tarefa for de outra pessoa, respondemos 404 (e não 403),
// para nem revelar que aquele ID existe.
import { randomUUID } from "node:crypto"
import { db } from "../db/database.js"
import { notFound } from "../utils/AppError.js"
import { nowISO, todayISO } from "../utils/dates.js"

/** Converte a linha do banco (snake_case) para o formato da API (camelCase). */
function toTask(row, today = todayISO()) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isOverdue: Boolean(row.due_date && row.status !== "concluida" && row.due_date < today)
  }
}

function findOwnedRow(userId, taskId) {
  const row = db.prepare("SELECT * FROM tasks WHERE id = ? AND user_id = ?").get(taskId, userId)
  if (!row) throw notFound("Tarefa não encontrada")
  return row
}

// Colunas de ordenação vêm de uma lista fechada (nunca do usuário diretamente)
const SORT_SQL = {
  due_date: "due_date IS NULL, due_date", // sem data vão para o fim
  created_at: "created_at",
  title: "title COLLATE NOCASE",
  priority: "CASE priority WHEN 'alta' THEN 0 WHEN 'media' THEN 1 ELSE 2 END"
}

export function listTasks(userId, q) {
  const today = q.today ?? todayISO()
  const where = ["user_id = ?"]
  const params = [userId]

  if (q.status) {
    where.push("status = ?")
    params.push(q.status)
  }
  if (q.priority) {
    where.push("priority = ?")
    params.push(q.priority)
  }
  if (q.search) {
    // Escapa os curingas do LIKE para a busca ser literal
    const term = q.search.replace(/[\\%_]/g, c => `\\${c}`)
    where.push("(title LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\')")
    params.push(`%${term}%`, `%${term}%`)
  }
  if (q.overdue === "true") {
    where.push("due_date IS NOT NULL AND due_date < ? AND status != 'concluida'")
    params.push(today)
  }

  const whereSql = where.join(" AND ")
  const order = q.order === "desc" ? "DESC" : "ASC"
  const orderSql = SORT_SQL[q.sort]
    .split(", ")
    .map(part => (part.endsWith("IS NULL") ? part : `${part} ${order}`))
    .join(", ")

  const { total } = db.prepare(`SELECT COUNT(*) AS total FROM tasks WHERE ${whereSql}`).get(...params)
  const rows = db
    .prepare(`SELECT * FROM tasks WHERE ${whereSql} ORDER BY ${orderSql}, created_at DESC LIMIT ? OFFSET ?`)
    .all(...params, q.limit, (q.page - 1) * q.limit)

  return {
    data: rows.map(r => toTask(r, today)),
    pagination: { page: q.page, limit: q.limit, total, totalPages: Math.max(1, Math.ceil(total / q.limit)) }
  }
}

export function getSummary(userId, today = todayISO()) {
  const row = db
    .prepare(
      `SELECT
         COUNT(*) AS total,
         COALESCE(SUM(status = 'pendente'), 0) AS pendente,
         COALESCE(SUM(status = 'em_andamento'), 0) AS emAndamento,
         COALESCE(SUM(status = 'concluida'), 0) AS concluida,
         COALESCE(SUM(status != 'concluida' AND due_date < ?), 0) AS vencidas,
         COALESCE(SUM(status != 'concluida' AND due_date = ?), 0) AS venceHoje
       FROM tasks WHERE user_id = ?`
    )
    .get(today, today, userId)
  return { ...row }
}

export function getTask(userId, taskId) {
  return toTask(findOwnedRow(userId, taskId))
}

export function createTask(userId, data) {
  const id = randomUUID()
  const now = nowISO()
  db.prepare(
    `INSERT INTO tasks (id, user_id, title, description, status, priority, due_date, completed_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    userId,
    data.title,
    data.description,
    data.status,
    data.priority,
    data.dueDate,
    data.status === "concluida" ? now : null,
    now,
    now
  )
  return getTask(userId, id)
}

export function updateTask(userId, taskId, data) {
  const current = findOwnedRow(userId, taskId)
  const next = {
    title: data.title ?? current.title,
    description: data.description ?? current.description,
    status: data.status ?? current.status,
    priority: data.priority ?? current.priority,
    due_date: data.dueDate === undefined ? current.due_date : data.dueDate
  }

  // completed_at acompanha o status
  let completedAt = current.completed_at
  if (next.status === "concluida" && current.status !== "concluida") completedAt = nowISO()
  if (next.status !== "concluida") completedAt = null

  db.prepare(
    `UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?, due_date = ?,
            completed_at = ?, updated_at = ?
      WHERE id = ? AND user_id = ?`
  ).run(
    next.title,
    next.description,
    next.status,
    next.priority,
    next.due_date,
    completedAt,
    nowISO(),
    taskId,
    userId
  )
  return getTask(userId, taskId)
}

export function deleteTask(userId, taskId) {
  const result = db.prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?").run(taskId, userId)
  if (result.changes === 0) throw notFound("Tarefa não encontrada")
}
