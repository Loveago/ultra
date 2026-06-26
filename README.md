# Ultra App Backend - Module 1

Express + TypeScript foundation for a scalable multi-vendor marketplace backend.

## Folder Structure

```text
backend/
├─ prisma/
│  ├─ schema.prisma
│  ├─ migrations/
│  └─ seed.ts
├─ src/
│  ├─ common/
│  │  ├─ errors/
│  │  └─ middleware/
│  ├─ config/
│  ├─ infrastructure/
│  │  ├─ cache/
│  │  ├─ db/
│  │  ├─ queue/
│  │  └─ socket/
│  ├─ modules/
│  │  ├─ health/
│  │  └─ system/
│  ├─ routes/
│  ├─ app.ts
│  └─ server.ts
├─ tests/
└─ docker-compose.yml
```

## Quick Start (Native — No Docker needed for API)

### Option A: PostgreSQL + Redis installed natively

1. Copy `.env.example` to `.env` and adjust DB/Redis URLs if needed
2. `npm run setup`  (install + prisma generate + migrate)
3. `npm run dev`

### Option B: Use Docker only for DB + Redis (API stays native)

1. Copy `.env.example` to `.env`
2. `npm run dev:full`  (starts Docker DB/Redis, runs setup, then dev server)

### Option C: Cloud services (no local infra at all)

1. Set `DATABASE_URL` to your cloud Postgres (e.g. Neon, Supabase)
2. Set `REDIS_URL` to your cloud Redis (e.g. Upstash)
3. `npm run setup`
4. `npm run dev`

### Convenience scripts

| Script | What it does |
|---|---|
| `npm run db:up` | Start Postgres + Redis in Docker |
| `npm run db:down` | Stop Docker containers |
| `npm run setup` | Install deps + Prisma generate + migrate |
| `npm run dev:full` | db:up + setup + dev (one command) |
| `npm run dev` | Start API only (assumes DB/Redis are running) |

## API Documentation

- Swagger UI: `http://localhost:4000/docs`
- Health endpoint: `GET /api/v1/health`
- Validation demo endpoint: `POST /api/v1/system/echo`

## Security Baseline

- Helmet headers
- CORS allowlist by env
- Global rate limiting
- Centralized error handling (no stack leak)
- Request payload size limits
- Env validation at startup
