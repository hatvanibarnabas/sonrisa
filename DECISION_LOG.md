# Decision Log — Alert & Notification System

**Author:** [Your name]  
**Date:** 2025-06-08  
**Status:** Living document — updated as decisions are made or revised

---

## 1. How I Read the Brief

The brief as given:

> "We want users to be able to set up alerts so they get notified when something important happens in the world — like breaking news, market movements, natural disasters, that kind of thing. Should work for both email and Slack. Make it flexible enough that we can add more channels later. We need an admin view too."

This is intentionally vague. Before writing a single line of code, I documented every ambiguity I found and the decision I made to resolve it. These decisions are mine — not confirmed with a PM — and I would revisit them in a real project with stakeholders.

---

## 2. Ambiguities Identified

### 2.1 What is an "important event"?

**The problem:** The brief gives examples (breaking news, market movements, natural disasters) but no definition of what qualifies, no threshold, no source.

**Options considered:**
- Let users define their own keywords/topics and poll news APIs
- Use a pre-scored "importance" feed (e.g. GDELT)
- Build a rule engine where admins define event categories

**Decision:** Keyword-based alert rules, sourced from two external APIs:
- **NewsAPI** (newsapi.org) for breaking news and natural disaster coverage — free tier supports MVP
- **Yahoo Finance API** (via `yahoo-finance2` npm package) for market movement alerts with configurable percentage thresholds

**Why this decision:**
- Most flexible for users: they define what matters to them
- Both sources are free or low-cost for MVP/demo purposes
- Avoids the complexity of building an importance-scoring model
- Market data and news are the two most concrete examples from the brief

**What I rejected:** GDELT — powerful but complex to query, overkill for an MVP. Real-time websocket feeds — unnecessary complexity at this stage.

**Open risk:** NewsAPI free tier rate-limits at 100 requests/day. For production, this needs a paid tier or alternative source. Documented, not solved.

---

### 2.2 What does "flexible enough to add more channels later" mean?

**The problem:** The brief says Email and Slack now, "more channels later." This implies an abstraction, but doesn't specify what it looks like.

**Decision:** Define a `NotificationChannel` interface with two methods: `send(alert, event)` and `validate(config)`. Email and Slack are concrete implementations. Adding a new channel (e.g. SMS, PagerDuty, webhooks) requires only a new class implementing the interface — no changes to the core alert engine.

```typescript
interface NotificationChannel {
  send(alert: Alert, event: DetectedEvent): Promise<void>;
  validate(config: ChannelConfig): boolean;
}
```

**Why this decision:** The Open/Closed Principle applies here — the system is open for extension, closed for modification. This is also the most credible answer to "flexible" from an engineering standpoint.

**What I rejected:** A plugin/registry system — more powerful but significantly more complex. Not justified for an MVP. A simple switch/case over channel type — works, but makes adding channels a modification, not an extension.

---

### 2.3 What is the "admin view"?

**The problem:** The brief mentions an admin view with no further specification. Could mean: user management, system monitoring, alert moderation, audit logging, or all of the above.

**Decision for MVP:**
- `/admin` route, gated by a simple `isAdmin` boolean on the user record
- Shows: all users, all alerts (with status), all notification logs (sent/failed), system job queue status
- No role hierarchy, no permission management — a user either is or isn't an admin

**What I rejected:** Full RBAC (role-based access control) — correct for production, wrong for MVP scope. Building a separate admin app — unnecessary complexity.

**Open question documented:** The brief doesn't say how admins are created. Decision: first user registered gets admin status, or manual DB flag. Not a user-facing feature.

---

### 2.4 What does "users" mean — is there authentication?

**The problem:** The brief implies multiple users but says nothing about auth.

**Decision:** Include basic auth (email + password, JWT tokens) because without it, the alert system has no way to know which user to notify or to protect the admin view.

**What I rejected:** No-auth/single-user mode — would make the admin view meaningless and the channel configuration per-user impossible. OAuth/SSO — out of scope for MVP.

---

## 3. Stack Decisions

### 3.1 Why Next.js (fullstack)

- React familiarity on the frontend
- API Routes eliminate the need for a separate backend service
- One repo, one deploy, one Docker container for the app
- File-based routing makes the `/admin` path trivial to add

**Rejected:** Express + separate React SPA — more flexible but more overhead. FastAPI — would require context-switching from JS ecosystem.

### 3.2 Why PostgreSQL

The data is inherently relational:
- Users own Alerts
- Alerts have one or more ChannelConfigs
- Events trigger NotificationLogs referencing both an Alert and an Event

A document store (MongoDB) would work but offers no advantages here and loses the referential integrity guarantees that matter for an audit log.

**Rejected:** SQLite — no concurrency guarantees when the BullMQ worker and the API both write simultaneously. MongoDB — no benefit over relational for this schema.

### 3.3 Why BullMQ + Redis

Event polling (checking NewsAPI every N minutes) and notification sending are async, time-based background jobs. These cannot live in a Next.js API route because:
- API routes are stateless and request-triggered
- There is no persistent timer in a serverless-style handler
- A failed notification needs retry logic

BullMQ provides: job scheduling, retries with backoff, job status visibility (useful for the admin view), and concurrency control.

**Rejected:** `node-cron` in a standalone process — simpler but no retry, no visibility, no queue. A managed service (AWS SQS, etc.) — unnecessary for local Docker deployment.

### 3.4 Why Docker Compose

Three services need to run together: Next.js app, PostgreSQL, Redis. Docker Compose makes this reproducible with a single command. The evaluators can run this without installing anything beyond Docker.

---

## 4. What Is Out of Scope (and Why)

| Feature | Reason excluded |
|---|---|
| SMS / push notifications | Not mentioned; extensible via channel interface later |
| Real-time websocket updates in UI | Nice to have; polling every 30s is sufficient for MVP |
| Alert deduplication (same event → don't notify twice) | Important for production; documented as known gap |
| Rate limiting on notifications | Important; left as TODO with a note in the codebase |
| Email template customization | Out of scope; plain-text email is sufficient |
| Multi-tenancy / organizations | Not implied by brief |
| GDPR / data deletion | Important for production; not in MVP |

---

## 5. Milestone Plan

| Milestone | Deliverable | Why this order |
|---|---|---|
| M1 | Decision log (this doc) | Resolve ambiguity before building |
| M2 | DB schema + Prisma models + Docker Compose skeleton | Foundation everything else depends on |
| M3 | Event detection engine (BullMQ jobs, API polling) | Core value of the system |
| M4 | Notification sending (Email + Slack) | Delivers the "so they get notified" part |
| M5 | Next.js UI — alert management + admin view | Makes the system usable |
| M6 | Integration testing + README | Makes the submission evaluable |

---

## 6. AI Usage Log

This section is updated throughout the project. For each major AI-assisted step, I record:
- What I asked
- What the AI produced
- What I rejected or changed and why

### M1 — Decision log
- Used Claude to help structure the ambiguity analysis and challenge my initial stack choices
- Rejected Claude's initial suggestion to use a separate Express backend — unnecessary complexity given Next.js API routes cover the same ground
- Kept the BullMQ + Redis suggestion after verifying it's the standard pattern for persistent job queues in Node.js

---

*This document will be updated at each milestone commit.*
