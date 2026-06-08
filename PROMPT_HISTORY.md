# Prompt History — AI-Assisted Development

This file records the prompts used during the project, per submission requirements.

---

## Session 1 — Initial Scoping (Human + Claude)

**Prompt:**
> I have this product brief: [full brief text]. Help me identify every ambiguity, propose decisions for each, and challenge my initial instinct to use Express + separate React frontend.

**What AI produced:** Structured ambiguity analysis, stack recommendation (Next.js + Prisma + BullMQ), channel interface design.

**What I rejected:**
- Separate Express backend — unnecessary given Next.js API routes
- GDELT as news source — too complex for MVP
- Full RBAC for admin — over-scoped

**What I kept:** BullMQ + Redis for background jobs, PostgreSQL, NotificationChannel interface.

---

## Session 2 — Decision Log Draft (Human + Claude)

**Prompt:**
> Write a decision log documenting: how I read the brief, ambiguities identified, options considered, decisions made, what was rejected, stack choices, out-of-scope items, and a milestone plan.

**Output:** `DECISION_LOG.md` (M1 deliverable)

---

## Session 3 — Schema & Docker (Human + Cursor Agent)

**Prompt:**
> Continue building M2: Prisma schema, Docker Compose with PostgreSQL + Redis + app + worker, project scaffold with Next.js 15, TypeScript.

**Output:** `prisma/schema.prisma`, `docker-compose.yml`, `package.json`, config files.

**Course-correction:** Moved `schema.prisma` from repo root to `prisma/` — Prisma convention. Removed duplicate root-level `registry.ts` and `types.ts` after copying to `src/channels/`.

---

## Session 4 — Event Detection Engine (Cursor Agent)

**Prompt:**
> Build M3: BullMQ workers for news polling (NewsAPI), market polling (yahoo-finance2), and notification dispatch. Schedule recurring jobs every 5 minutes. Deduplicate events via `DetectedEvent.externalId`.

**Validation checks I ran:**
- Verified NewsAPI response shape matches our `NewsArticle` interface (checked [NewsAPI docs](https://newsapi.org/docs))
- Confirmed `yahoo-finance2` `quote()` returns `regularMarketChangePercent` — not `chart()` which needs date ranges
- Checked dedup logic: `upsert` on `(sourceType, externalId)` + `notificationLog` check before queueing

**What I rejected from AI:**
- AI initially suggested using `yahooFinance.chart()` with 1-day interval — switched to `quote()` for simpler real-time threshold check
- AI suggested notifying on every poll cycle regardless of prior sends — added `notificationLog` guard

---

## Session 5 — Notification Channels (Cursor Agent)

**Prompt:**
> Implement Email (nodemailer/SMTP) and Slack (incoming webhook) channels implementing the NotificationChannel interface. Email should gracefully warn when SMTP is not configured (dev mode). Slack should accept per-alert webhook or env fallback.

**Validation:**
- Tested `validate()` rejects malformed emails and non-Slack URLs
- Confirmed Slack webhook URL pattern starts with `https://hooks.slack.com/`

---

## Session 6 — UI & Admin (Cursor Agent)

**Prompt:**
> Build M5: Next.js pages for login, register, alert list, alert creation, admin dashboard. JWT cookie auth. Admin shows users, all alerts, notification logs, BullMQ queue counts.

**Course-correction:**
- Added `export const dynamic = "force-dynamic"` on DB/Redis-dependent pages — AI's initial version would fail at build time without live Redis
- Fixed logout redirect to use request origin instead of hardcoded `NEXTAUTH_URL` (leftover from docker-compose draft)

---

## Session 7 — Documentation & Submission (Cursor Agent)

**Prompt:**
> Complete M6: README with architecture diagram and quick-start, update DECISION_LOG with AI usage log for each milestone, create milestone commits.

---

## Ongoing Validation Practices

Throughout the project, I applied these checks before accepting AI output:

1. **API shape verification** — cross-referenced NewsAPI and yahoo-finance2 docs, not trusting AI's assumed response fields
2. **Build-time safety** — ran `npm run build` to catch static generation issues with Redis/DB calls
3. **Scope discipline** — rejected features not implied by brief (webhooks channel impl, SMS, RBAC, websocket UI)
4. **Convention check** — matched existing file structure (`src/channels/`, `src/lib/`) rather than AI's occasional root-level file placement
5. **Duplicate cleanup** — removed root-level copies of files that belong in `src/` or `prisma/`
