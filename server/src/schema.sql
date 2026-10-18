CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('analyst', 'manager', 'executive', 'ops')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS widgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('sales', 'traffic', 'support', 'ops'))
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users (id),
  widget_id INTEGER NOT NULL REFERENCES widgets (id),
  type TEXT NOT NULL CHECK (type IN ('view', 'click', 'filter', 'export', 'dismiss')),
  duration_ms INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  value REAL NOT NULL,
  recorded_at TEXT NOT NULL,
  UNIQUE (name, recorded_at)
);

CREATE INDEX IF NOT EXISTS idx_events_user ON events (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_events_widget ON events (widget_id);
CREATE INDEX IF NOT EXISTS idx_metrics_name ON metrics (name, recorded_at);
