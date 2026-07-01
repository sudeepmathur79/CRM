# SalesFlow CRM — AI Developer Context

This file is the single source of truth for **any AI coding assistant** picking up development on this project — Claude Code, Cursor, Aider, Windsurf, Copilot, Gemini, or any future tool. The project is intentionally **model-neutral and tool-neutral**: no workflow step requires a specific AI model or IDE. Read this file fully before making any change.

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
│       │   └── Dev/             # Dev portal (index.jsx + devApi.js)
│       ├── components/          # Shared UI components
│       ├── hooks/               # Custom React hooks
│       └── lib/                 # API client, utils
├── docs/
│   └── USER_MANUAL.md           # End-user manual (keep updated when features change)
├── tests/
│   ├── k6/                      # Performance test scenarios
│   └── playwright/              # E2E UI tests (Python, targets staging)
│       ├── conftest.py          # Browser fixture, warm-up, screenshots
│       ├── helpers/auth.py      # Token injection helpers
│       ├── requirements.txt
│       └── tests/               # test_01_ … test_08_ (22 tests total)
├── .github/workflows/
│   ├── ci.yml                   # k6 smoke on dev push, full suite on PR to main
│   ├── nfr.yml                  # On-demand performance tests
│   ├── docs-check.yml           # Reminds to update USER_MANUAL.md
│   └── staging-readiness.yml    # Playwright E2E on every push to dev → gates Ship It
├── Dockerfile                   # Multi-stage: frontend Vite build → Node backend
├── CLAUDE.md                    # ← this file
└── ARCHITECTURE.md              # Deep system map
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
| CI/CD | GitHub Actions, k6 (performance), Playwright (E2E) |

---

## Environments

| Environment | URL | Branch | Render Service ID |
|---|---|---|---|
| Production | https://crm-mjky.onrender.com | `main` | `srv-d8uetdj7uimc73e49k9g` |
| Staging | https://crm-staging-sn50.onrender.com | `dev` | `srv-d90t0fvavr4c7390pou0` |

**Branch workflow:**
1. Develop on `dev` → Render auto-deploys staging
2. GitHub Actions runs 22 Playwright E2E tests against staging automatically
3. Open dev portal → "Push to Production" → "Ship It" button — only enabled when tests are green
4. Ship It auto-merges `dev → main` via GitHub API → Render deploys production

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
- Auth is stored in `localStorage` under key `accessToken`. `AuthContext` calls `authApi.me()` on mount — always wait for `loading` to resolve before rendering route guards (see `App.jsx`).

### Drag-and-drop (Dev Portal)

- Uses `@dnd-kit/core` + `@dnd-kit/sortable`.
- Sensors: `PointerSensor` + `TouchSensor` + `KeyboardSensor`, all with `{ delay: 150, tolerance: 5 }`.
- Drag listeners are on the **full card div** (not just the grip handle) so dragging works from anywhere on the card.
- Tap (< 150ms hold) = opens edit modal. Hold + move = drag. This is intentional.

### Prisma / DB

- Never use raw SQL — use Prisma client only.
- `BacklogItem.priority` is always 0-3. The backend clamps it: `Math.max(0, Math.min(3, parseInt(priority, 10)))`.
- All Prisma calls use the pooled connection string (includes `?sslmode=require&channel_binding=require`).

---

## Dev Portal (`/dev`)

The Dev Portal is a separate authenticated section (`DEV_SECRET` env var) that gives full control over the product backlog, AI-powered build automation, and one-click production deployment.

**Endpoints** (all require `Authorization: Bearer <devToken>`):
- `POST /api/dev/auth` — login with DEV_SECRET, returns token
- `GET /api/dev/items` — all backlog items
- `POST /api/dev/items` — create item
- `PATCH /api/dev/items/:id` — update item (priority clamped 0-3)
- `DELETE /api/dev/items/:id` — delete item
- `POST /api/dev/ai-prioritise` — Groq analyses all items, returns suggested priorities
- `POST /api/dev/ai-chat` — conversational AI that classifies asks into backlog items
- `GET /api/dev/takeover` — SSE stream; AI autonomously builds top P0/P1 items
- `POST /api/dev/takeover/:id/pause` / `resume` / `DELETE` — control takeover session
- `POST /api/dev/build/:id` — generate implementation plan for one item
- `GET /api/dev/stats` — backlog summary counts
- `GET /api/dev/branch-status` — compare dev vs main (commits ahead/behind)
- `GET /api/dev/test-status` — latest staging-readiness CI run result for dev branch
- `POST /api/dev/ship` — verify tests passed, auto-merge dev→main via GitHub API
- `POST /api/dev/deploy-now` — trigger immediate Render production deploy (no PR)
- `POST /api/dev/push-to-production` — open GitHub PR dev→main (without auto-merge)

**Ship It flow:** `GET /api/dev/test-status` checks GitHub Actions `staging-readiness.yml` run on `dev`. `POST /api/dev/ship` blocks if tests didn't pass, then creates + merges the PR automatically.

**Groq rate limits (on-demand tier):** 70b model = 12k TPM, 8b model = 6k TPM. `groqChat()` in `dev.routes.js` retries up to 3× on 429, parsing the exact wait time from the error message.

---

## Playwright E2E Tests

**Location:** `tests/playwright/`
**Target:** staging (`https://crm-staging-sn50.onrender.com`) — never production
**Run:** `python3 -m pytest --tb=short -q` from `tests/playwright/`
**CI trigger:** every push to `dev` via `.github/workflows/staging-readiness.yml`

**22 tests across 8 files:**

| File | Coverage |
|---|---|
| `test_01_login_page.py` | Login page UI elements |
| `test_02_invalid_login.py` | Wrong credentials rejected, no token stored |
| `test_03_dashboard.py` | KPI cards, date, Get Started checklist |
| `test_04_leads.py` | Leads page, Smart Add button, lead create via API |
| `test_05_kanban.py` | Kanban columns, New Lead button |
| `test_06_settings.py` | Settings page, Sign Out in header, nav link |
| `test_07_agent_rbac.py` | Agent sees own leads only, no Team tab, Smart Add visible |
| `test_08_dev_portal.py` | Login, auth rejection, all columns, CRUD, drag-and-drop persistence, AI prioritise, branch status, test status, Ship It modal |

**Auth injection pattern:** Tests use `page.context.add_init_script()` to seed `localStorage.accessToken` before React mounts. This avoids Turnstile and is required because `App.jsx` reads the token on first render.

**Key conftest settings:**
- Session-scoped warm-up fixture pings staging before any tests run (handles Render cold-start)
- `context.set_default_timeout(60_000)` — staging can be slow
- All heading/button assertions use `expect().to_be_visible(timeout=5_000)` not `.count() > 0`
- Screenshots saved to `tests/playwright/evidence/` after every test (gitignored)

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
MIGRATE_SECRET        # Protects /api/migrate/* endpoints
RENDER_API_KEY        # For Deploy Now button
GITHUB_TOKEN          # For Ship It (branch compare + auto-merge)
GITHUB_REPO           # sudeepmathur79/CRM
```

Staging-only additions:
```
STAGING_URL           # https://crm-staging-sn50.onrender.com (used by takeover health check)
```

---

## Render API Rules

**NEVER use `PUT /env-vars`** — it wipes all environment variables at once.

Always use the individual variable endpoint:
```bash
# Set a single var (safe)
curl -X PUT "https://api.render.com/v1/services/{serviceId}/env-vars/{KEY}" \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"value": "new-value"}'

# Always GET first to see current state
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

# Playwright tests (targets staging, not local)
cd tests/playwright
pip install -r requirements.txt
playwright install chromium
python3 -m pytest --tb=short -q
```

The frontend Vite config proxies `/api/*` to `http://localhost:3000` so you don't need CORS configuration locally.

---

## CI/CD Pipeline

```
push to dev
  → Render deploys staging automatically
  → staging-readiness.yml: waits for staging, runs 22 Playwright tests
  → GitHub emails on failure
  → Dev portal "Ship It" enabled only when tests green

Ship It clicked in dev portal
  → POST /api/dev/ship verifies test-status via GitHub API
  → Creates PR dev→main + auto-merges
  → Render deploys production automatically (~3 min)
```

Other workflows:
- `ci.yml` — k6 smoke test on `dev` push, full k6 suite on PR to `main`
- `nfr.yml` — on-demand performance tests (smoke/load/stress/soak/spike)
- `docs-check.yml` — reminds to update `USER_MANUAL.md` when frontend/routes change
- k6 tests use `TEST_BYPASS_TOKEN=k6-nfr-bypass-2026` to skip Turnstile in CI

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
- Do not push directly to `main` without running tests on staging first (except hotfixes via Deploy Now)
- Do not use `page.locator(...).count() > 0` in Playwright tests — use `expect().to_be_visible()` with a timeout
- Do not put dnd-kit drag listeners only on a grip icon — put them on the full card div with delay activation constraint
