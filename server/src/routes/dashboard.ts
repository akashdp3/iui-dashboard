import { Router } from 'express'
import type { Db } from '../db.js'
import { detectAnomalies } from '../lib/anomalies.js'

const EVENT_TYPES = ['view', 'click', 'filter', 'export', 'dismiss'] as const

export function dashboardRouter(db: Db) {
  const router = Router()

  router.get('/users', (_req, res) => {
    res.json(db.prepare('SELECT id, name, role FROM users ORDER BY id').all())
  })

  router.get('/metrics', (_req, res) => {
    const rows = db
      .prepare(
        'SELECT name, value, recorded_at AS date FROM metrics ORDER BY name, recorded_at',
      )
      .all() as { name: string; value: number; date: string }[]
    const byName = Map.groupBy(rows, (r) => r.name)
    const metrics = [...byName].map(([name, points]) => ({
      name,
      points: points.map(({ date, value }) => ({ date, value })),
      anomalies: detectAnomalies(points.map((p) => p.value)).map(
        ({ index, z }) => ({
          date: points[index].date,
          value: points[index].value,
          z,
        }),
      ),
    }))
    res.json({ metrics })
  })

  router.get('/users/:id/usage', (req, res) => {
    const userId = Number(req.params.id)
    const rows = db
      .prepare(
        `SELECT w.key, w.title, w.category, e.type, COUNT(*) AS n
         FROM events e JOIN widgets w ON w.id = e.widget_id
         WHERE e.user_id = ? GROUP BY w.id, e.type`,
      )
      .all(userId) as {
      key: string
      title: string
      category: string
      type: string
      n: number
    }[]

    const actions: Record<string, number> = {}
    const widgets = [...Map.groupBy(rows, (r) => r.key)].map(([key, group]) => {
      for (const r of group) actions[r.type] = (actions[r.type] ?? 0) + r.n
      const top = group.reduce((a, b) => (b.n > a.n ? b : a))
      return {
        key,
        title: group[0].title,
        category: group[0].category,
        total: group.reduce((s, r) => s + r.n, 0),
        topAction: top.type,
      }
    })
    widgets.sort((a, b) => b.total - a.total)
    res.json({
      userId,
      totalEvents: widgets.reduce((s, w) => s + w.total, 0),
      widgets,
      actions,
    })
  })

  router.post('/events', (req, res) => {
    const { userId, widgetKey, type } = req.body ?? {}
    const widget = db
      .prepare('SELECT id FROM widgets WHERE key = ?')
      .get(widgetKey) as { id: number } | undefined
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId)
    if (!widget || !user || !EVENT_TYPES.includes(type)) {
      res.status(400).json({ error: 'Invalid userId, widgetKey or type' })
      return
    }
    db.prepare(
      'INSERT INTO events (user_id, widget_id, type, duration_ms, created_at) VALUES (?, ?, ?, 0, ?)',
    ).run(userId, widget.id, type, new Date().toISOString())
    res.status(201).json({ ok: true })
  })

  return router
}
