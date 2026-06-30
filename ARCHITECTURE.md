# SalesFlow CRM — Architecture

## System Overview

```
Browser → Render CDN → Docker Container (Express + React SPA)
                              ↓
                       Neon Postgres (pooled)
                              ↓
                    Groq API / Anthropic API
                    Cloudflare R2 (files)
                    Resend (email)
                    Stripe (billing)
```

The frontend (React SPA) and backend (Express API) are bundled into a **single Docker container**. The Vite build output is copied into `backend/frontend/dist` at Docker build time. Express serves the static files via `express.static()` and a catch-all that injects `window.__APP_CONFIG__` into `index.html`.

---

## Request Flow

```
1. Browser hits /                     → Express catch-all → serves index.html (with injected config)
2. React Router renders the right page
3. Page component calls API           → /api/leads, /api/auth/login, etc.
4. Express route → middleware → service → Prisma → Neon Postgres
5. Response → React Query cache → UI update
6. Socket.IO events pushed for real-time updates (lead:created, lead:updated, mention:new)
```

---

## Auth Flow

```
Login form → POST /api/auth/login
           → bcrypt.compare password
           → issue accessToken (15min) + refreshToken (7 days)
           → client stores both in memory / httpOnly cookie

Every request → Authorization: Bearer <accessToken>
             → authenticate middleware decodes JWT
             → sets req.user { id, role, orgId }
             → sets req.orgId

Token refresh → POST /api/auth/refresh with refreshToken
             → issues new accessToken

Google SSO → frontend gets Google ID token
           → POST /api/auth/google with token
           → backend verifies with Google, looks up user by email, issues JWT
```

---

## Multi-Tenancy

Every piece of data (Lead, Note, Activity, AgentConfig, etc.) belongs to an Organisation. The `orgId` is embedded in the JWT and enforced at the route level via `req.orgId`. There is no middleware that automatically scopes queries — each service function must explicitly include `orgId` in its Prisma `where` clause.

Violation of this pattern = data leak. Always check when adding a new resource.

---

## AI Agent System

```
AgentConfig (trigger, prompt, action, enabled)
    ↓
agent.service.js: triggerAgents(event, lead, orgId, io)
    ↓
Filters configs by trigger + enabled + orgId
    ↓
Runs each: interpolates lead data into prompt → Groq API → parse action
    ↓
Actions: add_note | send_email | score | tag | update_stage
    ↓
AgentRun logged (success/error, output)
```

Triggers: `on_lead_created`, `on_stage_change`, `on_note_added`

The scheduler in `backend/src/services/agents.js` runs per-org on configurable intervals (default 30min). It also fires `deal_coach` daily at 10am and `follow_up_reminder` every 15min.

---

## Dev Portal Architecture

The Dev Portal at `/dev` is completely separate from the main app auth. It uses a shared secret (`DEV_SECRET`) to issue its own JWT. It's a kanban board backed by the `BacklogItem` model with AI automation on top.

```
/dev login (DEV_SECRET) → devToken (separate JWT secret)
    ↓
BacklogItem CRUD (priority 0-3, status: backlog/ready/in_progress/review/done)
    ↓
AI Prioritise: Groq reads all items → suggests P0-P3 distribution → user applies
    ↓
AI Take Over (SSE stream):
    1. Pick top P0/P1 items not in 'done'
    2. For each item: generate implementation → smoke test staging → mark done
    3. 30s mandatory cooldown between waves (Groq rate limit)
    ↓
Deploy Now: POST Render API → triggers production deploy
Push to Production: GitHub API → creates PR dev→main
```

**Groq rate limits** (on-demand tier): 70b = 12,000 TPM, 8b = 6,000 TPM. `groqChat()` parses the exact wait time from 429 errors and retries up to 3×.

---

## Docker Build

```dockerfile
Stage 1 (frontend-builder):
  node:20-alpine
  COPY frontend/ → npm ci → npm run build → /frontend/dist

Stage 2 (production):
  node:20-alpine + openssl + dumb-init
  COPY backend/package*.json → npm ci --only=production
  COPY backend/prisma → npx prisma generate
  COPY backend/src
  COPY --from=frontend-builder /frontend/dist → ./frontend/dist
  USER appuser (non-root)
  CMD: prisma db push → seed if empty → node src/index.js
```

The backend serves the frontend from `path.join(__dirname, '../frontend/dist')` which resolves to `/app/frontend/dist` inside the container.

---

## Real-Time (Socket.IO)

The Socket.IO server is attached to the same HTTP server as Express. Events:

| Event | Payload | When |
|---|---|---|
| `lead:created` | lead object | new lead created |
| `lead:updated` | lead object | lead updated |
| `lead:deleted` | `{ id }` | lead deleted |
| `mention:new` | `{ note, lead, from }` | @mention in note |

Clients join `user:<userId>` room on connect for private events (mentions).

---

## File Storage

Local dev: files saved to `backend/uploads/` served at `/uploads/*`.

Production: files uploaded to Cloudflare R2 (S3-compatible). The `AWS_*` env vars point to R2. The upload service (`recording.routes.js`) streams to R2 using the AWS SDK.

---

## CI/CD Pipeline

```
Push to dev branch
    → GitHub Actions ci.yml
    → k6 smoke test against crm-staging-sn50.onrender.com
    → (staging auto-deploys from dev branch via Render)

PR: dev → main
    → GitHub Actions ci.yml (full suite: smoke + load)
    → Manual merge
    → Production auto-deploys from main branch via Render
    → OR: Dev Portal "Deploy Now" button (skips PR, direct Render API deploy)
```

---

## Performance Characteristics

- Neon Postgres cold-start: ~300ms on first query after idle (free tier). Use the pooled connection string, not the direct URL.
- Render free tier: cold-start ~30s after 15min idle. Paid plan keeps it warm.
- Groq API: 70b model latency ~2-4s, 8b ~0.5-1s.
- Socket.IO: in-process, same Node.js instance. Not horizontally scalable without Redis adapter (not currently needed at this scale).

---

## Security Layers

1. **WAF** — Cloudflare/Render blocks known attack patterns at edge
2. **CAPTCHA** — Cloudflare Turnstile on login (12s timeout fallback built in)
3. **Rate limiting** — 500 req/15min on all `/api/*` routes (express-rate-limit)
4. **Helmet** — CSP, HSTS, X-Frame-Options, X-Content-Type-Options
5. **JWT** — short-lived access tokens (15min), refresh tokens (7 days)
6. **Bcrypt** — passwords hashed with cost factor 12
7. **Org scoping** — every DB query enforces orgId
8. **Non-root container** — Docker runs as `appuser`
9. **Prisma parameterised queries** — no raw SQL = no SQL injection
