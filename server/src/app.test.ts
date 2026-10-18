import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from './app.js'
import { openDb } from './db.js'
import { seedDb } from './seed.js'

describe('app', () => {
  const app = createApp(openDb(':memory:'))

  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok' })
  })

  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/nope')
    expect(res.status).toBe(404)
  })
})

describe('seedDb', () => {
  it('populates all tables and is repeatable', () => {
    const db = openDb(':memory:')
    const counts = seedDb(db)
    expect(counts).toEqual({ users: 5, widgets: 9, events: 1500, metrics: 540 })
    expect(seedDb(db)).toEqual(counts)
  })
})

describe('dashboard api', () => {
  const db = openDb(':memory:')
  seedDb(db)
  const app = createApp(db)

  it('lists users', async () => {
    const res = await request(app).get('/api/users')
    expect(res.body).toHaveLength(5)
  })

  it('flags the injected anomalies and little else', async () => {
    const res = await request(app).get('/api/metrics')
    const byName = Object.fromEntries(
      res.body.metrics.map(
        (m: { name: string; anomalies: { date: string }[] }) => [
          m.name,
          m.anomalies,
        ],
      ),
    )
    expect(byName.api_latency_ms.length).toBeGreaterThan(0)
    expect(byName.error_rate.length).toBeGreaterThan(0)
    expect(byName.revenue.length).toBeGreaterThan(0)
    expect(byName.ticket_volume.length).toBeGreaterThan(0)
    expect(byName.active_users).toHaveLength(0)
  })

  it('reports per-user usage sorted by total', async () => {
    const res = await request(app).get('/api/users/4/usage')
    expect(res.body.widgets[0].key).toBe('api_latency')
    expect(res.body.totalEvents).toBe(300)
  })

  it('records an event and rejects bad input', async () => {
    const ok = await request(app)
      .post('/api/events')
      .send({ userId: 1, widgetKey: 'revenue_trend', type: 'click' })
    expect(ok.status).toBe(201)
    const bad = await request(app)
      .post('/api/events')
      .send({ userId: 1, widgetKey: 'nope', type: 'click' })
    expect(bad.status).toBe(400)
  })
})
