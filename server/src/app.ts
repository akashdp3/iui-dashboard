import cors from 'cors'
import express, { type ErrorRequestHandler } from 'express'
import type { Db } from './db.js'
import { healthRouter } from './routes/health.js'

export function createApp(db: Db) {
  const app = express()
  app.use(cors())
  app.use(express.json())

  app.use('/api', healthRouter(db))

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' })
  })

  const onError: ErrorRequestHandler = (err, _req, res, _next) => {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
  app.use(onError)

  return app
}
