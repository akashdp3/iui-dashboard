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
