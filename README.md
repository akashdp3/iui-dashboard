# iui-dashboard

Dashboard for an intelligent user interface project. npm-workspaces monorepo:

- `client/` – React + Vite + TypeScript + Tailwind (Vitest + Testing Library)
- `server/` – Express + TypeScript + SQLite (better-sqlite3, Vitest + supertest)

## Setup

```sh
npm install
cp .env.example .env   # optional
npm run dev            # client :5173, server :3001 (client proxies /api)
```

## Scripts

| Script           | Description                    |
| ---------------- | ------------------------------ |
| `npm run dev`    | Run client and server together |
| `npm run build`  | Build both workspaces          |
| `npm test`       | Run all tests                  |
| `npm run lint`   | oxlint (client), tsc (server)  |
| `npm run format` | Prettier                       |

## API

`GET /api/users`, `GET /api/metrics` (with detected anomalies), `GET /api/users/:id/usage`, `POST /api/events`.

## Database

SQLite file at `server/data/app.db` (gitignored; schema in `server/src/schema.sql`).

```sh
npm run db:init   # create the file and tables
npm run db:seed   # reset and fill with deterministic demo data
```

Demo data: 5 users with distinct usage patterns, 9 widgets, 1,500 interaction events (30 days), and 90 days of 6 metrics with injected anomalies.
