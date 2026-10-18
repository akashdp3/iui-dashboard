import type { Db } from './db.js'

type EventType = 'view' | 'click' | 'filter' | 'export' | 'dismiss'

const DAY_MS = 24 * 60 * 60 * 1000

const WIDGETS = [
  ['revenue_trend', 'Revenue Trend', 'sales'],
  ['sales_by_region', 'Sales by Region', 'sales'],
  ['conversion_funnel', 'Conversion Funnel', 'sales'],
  ['traffic_overview', 'Traffic Overview', 'traffic'],
  ['top_pages', 'Top Pages', 'traffic'],
  ['open_tickets', 'Open Tickets', 'support'],
  ['csat_score', 'CSAT Score', 'support'],
  ['api_latency', 'API Latency', 'ops'],
  ['error_rate', 'Error Rate', 'ops'],
] as const

// Each user favors certain widgets and actions, so usage patterns are learnable.
const USERS = [
  {
    name: 'Alice Chen',
    role: 'analyst',
    weights: {
      revenue_trend: 5,
      sales_by_region: 5,
      conversion_funnel: 3,
      top_pages: 1,
    },
    actions: { view: 3, filter: 4, export: 3, click: 2, dismiss: 0 },
  },
  {
    name: 'Ben Okafor',
    role: 'analyst',
    weights: {
      traffic_overview: 5,
      top_pages: 5,
      conversion_funnel: 2,
      csat_score: 1,
    },
    actions: { view: 3, filter: 4, export: 2, click: 3, dismiss: 0 },
  },
  {
    name: 'Carla Diaz',
    role: 'manager',
    weights: {
      revenue_trend: 3,
      csat_score: 4,
      open_tickets: 4,
      sales_by_region: 2,
    },
    actions: { view: 6, filter: 1, export: 1, click: 3, dismiss: 1 },
  },
  {
    name: 'Dev Patel',
    role: 'ops',
    weights: { api_latency: 6, error_rate: 6, open_tickets: 3 },
    actions: { view: 3, filter: 1, export: 0, click: 6, dismiss: 1 },
  },
  {
    name: 'Erin Walsh',
    role: 'executive',
    weights: { revenue_trend: 6, csat_score: 3, traffic_overview: 2 },
    actions: { view: 9, filter: 0, export: 1, click: 1, dismiss: 2 },
  },
] as const

// metric: base value, daily trend, weekly seasonality amplitude (fraction), noise (fraction)
const METRICS = [
  { name: 'revenue', base: 12000, trend: 40, season: 0.15, noise: 0.05 },
  { name: 'active_users', base: 3400, trend: 12, season: 0.2, noise: 0.04 },
  {
    name: 'conversion_rate',
    base: 3.2,
    trend: 0.004,
    season: 0.08,
    noise: 0.05,
  },
  { name: 'ticket_volume', base: 140, trend: 0.3, season: 0.25, noise: 0.1 },
  { name: 'api_latency_ms', base: 180, trend: 0.2, season: 0.05, noise: 0.08 },
  { name: 'error_rate', base: 0.8, trend: 0, season: 0.1, noise: 0.15 },
] as const

// Injected anomalies: [metric, days ago, multiplier]
const ANOMALIES = [
  ['revenue', 12, 0.55],
  ['api_latency_ms', 5, 3.2],
  ['ticket_volume', 20, 2.1],
  ['error_rate', 5, 4.5],
] as const

// mulberry32: small deterministic PRNG so reseeding is repeatable
function prng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T extends string>(
  rand: () => number,
  weights: Partial<Record<T, number>>,
): T {
  const entries = Object.entries(weights) as [T, number][]
  let r = rand() * entries.reduce((sum, [, w]) => sum + w, 0)
  for (const [key, w] of entries) {
    if ((r -= w) < 0) return key
  }
  return entries[entries.length - 1][0]
}

export function seedDb(db: Db, now = new Date('2026-10-18T12:00:00Z')) {
  const rand = prng(42)
  const iso = (ms: number) => new Date(ms).toISOString()

  db.transaction(() => {
    for (const table of ['events', 'metrics', 'widgets', 'users']) {
      db.exec(`DELETE FROM ${table}`)
    }
    db.exec(`DELETE FROM sqlite_sequence`)

    const insWidget = db.prepare(
      'INSERT INTO widgets (key, title, category) VALUES (?, ?, ?)',
    )
    const widgetId = new Map<string, number>()
    for (const [key, title, category] of WIDGETS) {
      widgetId.set(
        key,
        Number(insWidget.run(key, title, category).lastInsertRowid),
      )
    }

    const insUser = db.prepare(
      'INSERT INTO users (name, role, created_at) VALUES (?, ?, ?)',
    )
    const insEvent = db.prepare(
      'INSERT INTO events (user_id, widget_id, type, duration_ms, created_at) VALUES (?, ?, ?, ?, ?)',
    )
    for (const user of USERS) {
      const userId = Number(
        insUser.run(user.name, user.role, iso(now.getTime() - 60 * DAY_MS))
          .lastInsertRowid,
      )
      for (let i = 0; i < 300; i++) {
        const key = pick(rand, user.weights)
        const type = pick<EventType>(rand, user.actions)
        const duration =
          type === 'view'
            ? 2000 + Math.floor(rand() * 40000)
            : Math.floor(rand() * 3000)
        // activity skews toward working hours (08:00-18:00 UTC) of the last 30 days
        const day = Math.floor(rand() * 30)
        const hour = 8 + Math.floor(rand() * 10)
        const at =
          now.getTime() -
          day * DAY_MS -
          (12 - hour) * 3600_000 +
          Math.floor(rand() * 3600_000)
        insEvent.run(
          userId,
          widgetId.get(key)!,
          type,
          duration,
          iso(Math.min(at, now.getTime())),
        )
      }
    }

    const insMetric = db.prepare(
      'INSERT INTO metrics (name, value, recorded_at) VALUES (?, ?, ?)',
    )
    for (const m of METRICS) {
      for (let d = 89; d >= 0; d--) {
        const date = new Date(now.getTime() - d * DAY_MS)
        const weekly = Math.sin(((date.getUTCDay() - 1) / 7) * 2 * Math.PI)
        let value =
          (m.base + m.trend * (89 - d)) *
          (1 + m.season * weekly) *
          (1 + m.noise * (rand() * 2 - 1))
        for (const [name, daysAgo, factor] of ANOMALIES) {
          if (name === m.name && daysAgo === d) value *= factor
        }
        insMetric.run(
          m.name,
          Math.round(value * 100) / 100,
          date.toISOString().slice(0, 10),
        )
      }
    }
  })()

  const count = (table: string) =>
    (db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n
  return {
    users: count('users'),
    widgets: count('widgets'),
    events: count('events'),
    metrics: count('metrics'),
  }
}
