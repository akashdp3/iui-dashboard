import { Router } from 'express'
import type { Db } from '../db.js'

export function healthRouter(db: Db) {
  const router = Router()
  router.get('/health', (_req, res) => {
    db.prepare('SELECT 1').get()
    res.json({ status: 'ok' })
  })
  return router
}
