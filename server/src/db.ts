import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'

export function openDb(dbPath = process.env.DB_PATH ?? './data/app.db') {
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  }
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      payload TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  return db
}

export type Db = ReturnType<typeof openDb>
