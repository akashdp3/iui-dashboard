import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'

const schema = fs.readFileSync(
  path.join(import.meta.dirname, 'schema.sql'),
  'utf8',
)

export function openDb(dbPath = process.env.DB_PATH ?? './data/app.db') {
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  }
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(schema)
  return db
}

export type Db = ReturnType<typeof openDb>
