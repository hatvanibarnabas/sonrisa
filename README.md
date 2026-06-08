# Sonrisa — World Event Alert System

A full-stack alert & notification system built from a vague product brief. Users define rules for "important world events" (breaking news, market movements) and get notified via Email and/or Slack.

**This repo is a process submission** — see [DECISION_LOG.md](./DECISION_LOG.md) and [PROMPT_HISTORY.md](./PROMPT_HISTORY.md) for how the solution was scoped, built, and validated.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Next.js    │────▶│  PostgreSQL  │     │  NewsAPI        │
│  (UI + API) │     │  (Prisma)    │     │  Yahoo Finance  │
└──────┬──────┘     └──────────────┘     └────────▲────────┘
       │                                            │
       │              ┌──────────────┐              │
       └─────────────▶│  BullMQ      │──────────────┘
                      │  Worker      │
                      │  (Redis)     │
                      └──────┬───────┘
                             │
                    ┌────────┴────────┐
                    ▼                 ▼
               Email (SMTP)      Slack (webhook)
```

## Quick Start (Local Dev)

### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL + Redis)

### 1. Start infrastructure

```bash
docker compose up db redis -d
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` — at minimum set `JWT_SECRET`. For live news alerts, add a [NewsAPI](https://newsapi.org) key.

### 3. Install & migrate

```bash
npm install
npx prisma db push
npm run db:seed   # optional: creates admin@example.com / admin12345
```

### 4. Run the app (two terminals)

```bash
# Terminal 1 — web app
npm run dev

# Terminal 2 — background worker (polling + notifications)
npm run worker
```

Open [http://localhost:3000](http://localhost:3000).

The **first registered user** automatically becomes admin. Or use the seeded admin account.

## Features

| Feature | Status |
|---|---|
| User auth (email + password, JWT cookie) | ✅ |
| News alerts (keyword matching via NewsAPI) | ✅ |
| Market alerts (ticker + % threshold via Yahoo Finance) | ✅ |
| Email notifications (SMTP) | ✅ |
| Slack notifications (webhook) | ✅ |
| Extensible channel interface | ✅ |
| Admin dashboard (users, alerts, logs, queues) | ✅ |
| Event deduplication | ✅ |
| Docker Compose (db + redis + app + worker) | ✅ |

## Adding a New Notification Channel

1. Add enum value to `ChannelType` in `prisma/schema.prisma`
2. Create `src/channels/my-channel.ts` implementing `NotificationChannel`
3. Register in `src/channels/registry.ts`

No changes needed to the alert engine or worker.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `JWT_SECRET` | Yes | Secret for session tokens |
| `NEWSAPI_KEY` | For news | NewsAPI.org API key |
| `SMTP_HOST` | For email | SMTP server hostname |
| `SMTP_PORT` | For email | SMTP port (default 587) |
| `SMTP_USER` / `SMTP_PASS` | For email | SMTP credentials |
| `SMTP_FROM` | For email | Sender address |
| `SLACK_WEBHOOK_URL` | For Slack | Default Slack incoming webhook |

## Docker (Full Stack)

```bash
# Set env vars in .env, then:
docker compose up --build
```

App: `http://localhost:3000`

## Project Structure

```
prisma/schema.prisma    — DB models
src/channels/           — Notification channel implementations
src/services/           — External API clients (NewsAPI, Yahoo Finance)
src/workers/            — BullMQ background jobs
src/app/                — Next.js pages + API routes
src/lib/                — Shared utilities (auth, db, queue)
DECISION_LOG.md         — Ambiguity resolution & design decisions
PROMPT_HISTORY.md       — AI prompts used during development
```

## Known Gaps (Documented, Not Solved)

- NewsAPI free tier: 100 requests/day
- No per-user rate limiting on notifications
- No real-time UI updates (admin polls on page load)
- SMTP/Slack must be configured for actual delivery; without them, email logs a warning and Slack throws

## Milestone Commits

| Commit | Milestone |
|---|---|
| `feat: add decision_log.md file` | M1 — Decision log |
| `feat: add database schema and docker compose` | M2 — Foundation |
| `feat: add event detection engine with BullMQ workers` | M3 — Polling |
| `feat: add email and slack notification channels` | M4 — Channels |
| `feat: add next.js ui with alerts and admin dashboard` | M5 — UI |
| `docs: add readme and prompt history` | M6 — Documentation |
