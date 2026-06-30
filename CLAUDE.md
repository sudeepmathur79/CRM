# SalesFlow CRM — AI Developer Context

This file is the single source of truth for any AI coding assistant (Claude Code, Cursor, Aider, Windsurf, Copilot, etc.) picking up development on this project. Read it fully before making any change.

---

## What This Is

SalesFlow CRM is a multi-tenant B2B CRM SaaS with AI features built into the core product. It is in active production at **https://crm-mjky.onrender.com** with a staging environment at **https://crm-staging-sn50.onrender.com**.

The codebase is a React SPA (Vite) + Express.js API + Prisma/Neon Postgres monorepo, deployed via Docker on Render.

---

## Repository Layout

```
crm/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # DB schema — source of truth for all models
│   │   └── seed.js              # Demo data seed
│   └── src/
│       ├── index.js             # Express app entry, middleware, route mounting
│       ├── middleware/
│       │   └── auth.middleware.js   # JWT authenticate + requireRole
│       ├── routes/              # One file per resource
│       ├── services/            # Business logic (lead.service.js, ai.service.js, etc.)
│       └── uploads/             # Local file storage (dev only — prod uses R2)
├── frontend/
│   └── src/
│       ├── main.jsx             # React entry
│       ├── App.jsx              # Router (React Router v6)
│       ├── pages/               # One folder per route
│       ├── components/          # Shared UI components
│       ├── hooks/               # Custom React hooks
│       └── lib/                 # API client, utils
├── docs/
│   └── USER_MANUAL.md           # End-user manual (keep updated when features change)
├── tests/k6/                    # Performance test scenarios
├── .github/workflows/           # CI/CD (ci.yml, nfr.yml, docs-check.yml)
├── Dockerfile                   # Multi-stage: frontend Vite build → Node backend
└── CLAUDE.md                    # ← this file
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, @tanstack/react-query, @dnd-kit, lucide-react |
| Backend | Node.js, Express.js, Prisma ORM |
| Database | Neon Postgres (serverless, connection pooling via pgBouncer URL) |
| Auth | JWT (access + refresh tokens), Google OAuth, Cloudflare Turnstile CAPTCHA |
| Real-time | Socket.IO |
| AI | Groq (llama-3.3-70b / llama-3.1-8b), Anthropic Claude (drag-to-build), OpenRouter |
| File storage | Cloudflare R2 (S3-compatible) |
| Email | Resend (transactional), Brevo/SMTP |
| Payments | Stripe |
| Error tracking | Sentry |
| Deployment | Docker, Render (two services) |
| CI/CD | GitHub Actions, k6 (performance tests) |

---

## Environments

| Environment | URL | Branch | Render Service ID |
|---|---|---|---|
| Production | https://crm-mjky.onrender.com | `main` | `srv-d8uetdj7uimc73e49k9g` |
| Staging | https://crm-staging-sn50.onrender.com | `dev` | `srv-d90t0fvavr4c7390pou0` |

**Branch workflow:** develop on `dev` → staging auto-deploys → promote via PR to `main` or use Dev Portal "Deploy Now".

Both environments share the **same Neon database**. Staging has its own JWT secrets (different from prod) so sessions are isolated.

---

## Database Models

```
Organisation   — tenant root; all data is org-scoped
User           — role: superadmin | admin | agent | viewer
Lead           — core CRM entity; scoped to org; agents see only assigned leads
LeadNote       — timeline notes on a lead; supports @mentions
Activity       — immutable audit log per lead
Recording      — voice capture; stores transcript + AI summary
AgentConfig    — AI automation rules (trigger + prompt + action)
AgentRun       — log of each agent execution
BacklogItem    — dev portal backlog (priority 0-3, status: backlog/ready/in_progress/review/done)
Message        — internal team messages
Tag            — labels for leads
VoiceDraft     — in-progress voice recordings before commit
SupportSession — superadmin support tickets
```

---

## Role-Based Access Control

| Role | Leads | Settings | Team | Superadmin Console |
|---|---|---|---|---|
| `superadmin` | ❌ 403 (cross-org protection) | ✅ | ✅ | ✅ |
| `admin` | ✅ all org leads | ✅ | ✅ | ❌ |
| `agent` | ✅ own assigned leads only | ❌ | ❌ | ❌ |
| `viewer` | ✅ read-only | ❌ | ❌ | ❌ |

**Critical:** Agent-created leads auto-assign to themselves (`lead.service.js: assignedToId: data.assignedToId || (userRole === 'agent' ? userId : null)`).

---

## Key Patterns & Conventions

### Backend

- All routes use `authenticate` middleware from `auth.middleware.js`. Role gates use `requireRole('admin')`.
- Org scoping: `req.orgId` is set by `authenticate` from the JWT. All DB queries must include `orgId` in the where clause.
- Error handling: routes use `try/catch` + `next(e)`. There's a global error handler in `index.js`.
- `isProd` is `process.env.NODE_ENV !== 'development'` — not `=== 'production'` — because staging uses `NODE_ENV=staging`.
- The frontend is served from `backend/frontend/dist` (copied there by Docker). The catch-all `app.get('*')` injects `window.__APP_CONFIG__` into `index.html` at serve time.

### Frontend

- All API calls go through `src/lib/api.js` (axios instance with auth header interceptor).
- React Query for all server state. No Redux.
- Tailwind for all styling. Dark mode via `dark:` classes — toggle stored in localStorage.
- Page-level components in `src/pages/`, shared UI in `src/components/`.
- Route protection via `<ProtectedRoute>` wrapper in `App.jsx`.

### Prisma / DB

- Never use raw SQL — use Prisma client only.
- `BacklogItem.priority` is always 0-3. The backend clamps it: `Math.max(0, Math.min(3, parseInt(priority, 10)))`.
- All Prisma calls use the pooled connection string (includes `?sslmode=require&channel_binding=require`).

---

## Dev Portal (`/dev`)

The Dev Portal is a separate authenticated section (`DEV_SECRET` env var) that gives full control over the product backlog and has AI-powered build automation.

**Endpoints** (all require `Authorization: Bearer <devToken>`):
- `POST /api/dev/auth` — login with DEV_SECRET, returns JWT
- `GET /api/dev/items` — all backlog items
- `PATCH /api/dev/items/:id` — update item (priority clamped 0-3)
- `POST /api/dev/ai-prioritise` — Groq analyses all items, returns suggested priorities
- `GET /api/dev/takeover` — SSE stream; AI autonomously builds top P0/P1 items
- `POST /api/dev/build/:id` — build a single item
- `POST /api/dev/deploy-now` — triggers Render production deploy via API
- `POST /api/dev/push-to-production` — opens GitHub PR dev→main

**Groq rate limits (on-demand tier):** 70b model = 12k TPM, 8b model = 6k TPM. `groqChat()` in `dev.routes.js` retries up to 3× on 429, parsing exact wait time from the error message.

---

## Environment Variables

All secrets are stored locally. Never commit them. See memory file `crm_secrets.md` (local only).

Key vars every environment needs:
```
DATABASE_URL          # Neon Postgres pooled URL
JWT_SECRET            # Access token signing key (different per env)
JWT_REFRESH_SECRET    # Refresh token key (different per env)
NODE_ENV              # 'development' | 'staging' | 'production'
GROQ_API_KEY          # For AI features
ANTHROPIC_API_KEY     # For drag-to-build in dev portal
TURNSTILE_SECRET_KEY  # Cloudflare CAPTCHA validation
TURNSTILE_SITE_KEY    # Passed to frontend via /api/config
DEV_SECRET            # Dev portal login password
MIGRATE_SECRET        # Protects /api/migrate/* endpoints (value: Salesflow2026)
RENDER_API_KEY        # For Deploy Now button
GITHUB_TOKEN          # For Push to Production PR creation
GITHUB_REPO           # sudeepmathur79/CRM
```

---

## Render API Rules

**NEVER use `PUT /env-vars`** — it wipes all environment variables.

Always use the individual variable endpoint:
```bash
# Set a single var
curl -X PUT "https://api.render.com/v1/services/{serviceId}/env-vars/{key}" \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"value": "new-value"}'

# Get current vars first before changing anything
curl "https://api.render.com/v1/services/{serviceId}/env-vars" \
  -H "Authorization: Bearer $RENDER_API_KEY"
```

---

## Running Locally

```bash
# Backend
cd backend
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET, etc.
npm install
npx prisma db push
npx prisma db seed
node src/index.js      # runs on port 3000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev            # runs on port 5173, proxies /api to :3000
```

The frontend Vite config proxies `/api/*` to `http://localhost:3000` so you don't need CORS configuration locally.

---

## CI/CD

- `.github/workflows/ci.yml` — runs smoke k6 test on every push to `dev`, full suite on PR to `main`
- `.github/workflows/nfr.yml` — on-demand performance tests (smoke/load/stress/soak/spike)
- `.github/workflows/docs-check.yml` — reminds to update USER_MANUAL.md when frontend/routes change
- k6 tests use `TEST_BYPASS_TOKEN=k6-nfr-bypass-2026` to skip Turnstile in CI

---

## Pending Work (Backlog)

As of June 2026, 2 items remain in the backlog:
1. **App Store + Play Store submission** (P2, Large) — Flutter mobile app packaging
2. **CSV import with column mapping UI** (P2, Small) — frontend drag-to-map columns

Full detailed backlog is visible in the Dev Portal at `/dev` (use DEV_SECRET to log in).

Larger items tracked but not yet started:
- Neon database branching for true staging isolation (requires Neon API key)
- Agent interval Settings UI (frontend picker — backend already accepts the value)
- Superadmin delete-org with typed challenge + 2FA
- Superadmin TOTP 2FA enforcement
- "What's New" modal (v1.5.0)
- Audit log UI (Settings → Audit tab)

---

## Demo Accounts (Staging)

| Role | Email | Password |
|---|---|---|
| Superadmin | admin@crm.com | password123 |
| Org Admin | demoadmin@salesflow.demo | Demo@2026 |
| Agent | gopal2@crm.com | gopal_user |

---

## What NOT to Do

- Do not use `PUT /env-vars` on Render (wipes everything)
- Do not rotate secrets — owner has explicitly deferred rotation until post-launch
- Do not set `isProd = process.env.NODE_ENV === 'production'` — staging uses `NODE_ENV=staging`
- Do not add `BacklogItem.priority` values outside 0-3 — always clamp
- Do not add comments explaining what code does — only add comments for non-obvious WHY
- Do not push directly to `main` without testing on staging first (except hotfixes via Deploy Now)
