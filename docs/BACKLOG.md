# SalesFlow CRM — Product Backlog

**Owner:** Sudiip Mathur  
**Format:** `[Priority] [Effort] — Title` → Description → Acceptance criteria

Priority: 🔴 P0 · 🟠 P1 · 🟡 P2 · 🟢 P3  
Effort: XS (<1d) · S (1-2d) · M (3-5d) · L (1-2w) · XL (>2w)

---

## 🗂️ EPIC 1 — Developer Portal & Backlog (Internal)

### 🟠 P1 · L — Developer Portal (`/dev`) with Kanban backlog

**What:** A password-protected `/dev` route showing this backlog as a live Kanban board. Items move through: `Backlog → Ready → In Progress → Review → Done`. Product owner can reprioritise via drag-and-drop. AI assistant can suggest priority order based on user impact and dev effort.

**Acceptance criteria:**
- [ ] `/dev` login gated by a `DEV_SECRET` env var (not linked from main app)
- [ ] Kanban columns match the states above
- [ ] Each card shows: title, priority, effort, tags, description
- [ ] Drag to reorder within a column and move between columns
- [ ] "AI Prioritise" button: sends backlog to Claude → returns ranked list with reasoning
- [ ] Changes persisted to a `BacklogItem` table in the database
- [ ] Filterable by epic, effort, tag

**Data model:**
```prisma
model BacklogItem {
  id          String   @id @default(cuid())
  title       String
  description String?
  epic        String?
  priority    Int      @default(2) // 0=P0 1=P1 2=P2 3=P3
  effort      String   @default("M") // XS S M L XL
  status      String   @default("backlog") // backlog|ready|in_progress|review|done
  tags        String[] @default([])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## 🗂️ EPIC 2 — Architecture: Cloud-Native Multi-Tenant SaaS

### 🟠 P1 · XL — Migrate to per-paid-org isolated instances on AWS/GCP free tier

**What:** Current architecture is a single shared Render deployment. For paid plans, spin up a dedicated instance per org with its own Postgres database. Free/trial orgs remain on the shared instance.

**Recommended architecture:**
- **Free/Trial:** Current Render monolith (shared Neon Postgres, row-level org isolation)
- **Pro/Premium:** AWS ECS Fargate (free tier) + RDS Postgres per org (or Neon per-org branch)
- **Provisioning:** When a Stripe `checkout.session.completed` webhook fires for a paid plan, call a provisioning Lambda that:
  1. Creates a Neon project/branch for the org
  2. Launches an ECS task with `ORG_ID` + `DATABASE_URL` env vars
  3. Registers a subdomain: `{slug}.crm-mjky.onrender.com` → CloudFront → ECS
  4. Runs `prisma migrate deploy` in the new container
  5. Seeds the admin user

**Acceptance criteria:**
- [ ] ADR written and approved (see `docs/adr/`)
- [ ] Provisioning Lambda with IaC (Terraform or CDK)
- [ ] Free-to-paid upgrade triggers provisioning automatically
- [ ] Org data migrated from shared to dedicated instance on upgrade
- [ ] Health checks and auto-restart configured per instance
- [ ] Cost target: <$0 on AWS free tier for first 12 months per org

**ADR reference:** `docs/adr/001-multi-tenant-isolation.md`

---

### 🟡 P2 · M — CDN + edge caching for static assets

**What:** Serve frontend from a CDN (CloudFront or Cloudflare Pages) instead of Express. Backend stays on Render/ECS.

**Acceptance criteria:**
- [ ] Vite build output uploaded to S3 / Cloudflare Pages on deploy
- [ ] Cache headers set: `index.html` = no-cache, assets = 1 year immutable
- [ ] CORS configured for API on `api.{domain}`

---

### 🟡 P2 · M — Background job queue (BullMQ + Redis)

**What:** Move AI calls, email sends, and CSV exports off the HTTP request path into a queue so API responses stay fast.

**Acceptance criteria:**
- [ ] BullMQ + Redis (Upstash free tier) set up
- [ ] Jobs: `ai-extract`, `send-email`, `csv-export`, `hubspot-sync`
- [ ] Job status visible in developer portal
- [ ] Failed jobs retry 3× with exponential backoff

---

### 🟢 P3 · S — Structured logging + error tracking

**What:** Replace `console.log` with structured JSON logs. Add Sentry (free tier) for error tracking.

**Acceptance criteria:**
- [ ] `pino` logger replacing all console calls
- [ ] Log levels: error, warn, info, debug
- [ ] Sentry DSN configured, errors auto-reported with org/user context
- [ ] `/api/health` endpoint returns `{ status, version, uptime }`

---

## 🗂️ EPIC 3 — "What's New" Feature

### 🟠 P1 · S — In-app "What's New" modal after major/minor releases

**What:** After each MINOR or MAJOR release, users see a one-time modal showing the new features. Tracks per-user which version they last acknowledged.

**Data model:**
```prisma
// Add to User model:
lastSeenVersion  String?  // e.g. "1.3.0"
```

**Implementation:**
- `VITE_APP_VERSION` env var set at build time from `package.json` version
- On app load, if `user.lastSeenVersion !== APP_VERSION`, show the modal
- Modal content fetched from `/api/changelog/latest` (parses `CHANGELOG.md`)
- User closes modal → `PATCH /api/auth/me` sets `lastSeenVersion`

**Acceptance criteria:**
- [ ] Modal shows on first login after a new MINOR or MAJOR release
- [ ] Never shown for patch releases (x.x.PATCH)
- [ ] Content pulled from CHANGELOG.md automatically (no manual copy-paste)
- [ ] "Don't show again" dismisses permanently for that version

---

## 🗂️ EPIC 4 — Mobile App (Flutter)

### 🟡 P2 · M — Leads list with stage update on mobile

**Acceptance criteria:**
- [ ] Swipe left on a lead → quick stage change drawer
- [ ] Pull-to-refresh
- [ ] Offline queue: if no network, save voice capture locally and sync on reconnect

### 🟡 P2 · M — Push notifications (FCM + APNs)

**Acceptance criteria:**
- [ ] New lead assigned → agent receives push
- [ ] Lead reply in inbox → push notification
- [ ] Token stored per device in `DeviceToken` table

### 🟢 P3 · L — App Store + Play Store submission

**Acceptance criteria:**
- [ ] Apple Developer account configured
- [ ] Google Play Console configured
- [ ] Privacy policy URL in store listing points to `/privacy`
- [ ] Screenshot set created for both stores

---

## 🗂️ EPIC 5 — Product & Growth

### 🟡 P2 · S — Usage analytics dashboard (admin)

**What:** Show admin: DAU, leads created per week, AI calls used, storage used.

### 🟡 P2 · M — Onboarding checklist

**What:** First-time setup wizard: upload logo → invite team → add first lead → make first AI call. Progress bar in sidebar until complete.

### 🟢 P3 · M — Zapier / Make.com integration

**What:** Webhook endpoint so leads can be pushed to/from 5000+ apps.

### 🟢 P3 · S — CSV import with column mapping UI

**What:** Upload CSV → map columns to lead fields → preview → import.

---

## 🗂️ EPIC 6 — Security & Compliance

### 🟠 P1 · S — Audit log (admin view)

**What:** Every data-mutating action (lead created/updated/deleted, user role changed, branding changed) written to an `AuditLog` table. Visible in Settings → Audit.

### 🟡 P2 · M — GDPR / Privacy: data export + right-to-erasure

**What:** Admin can export all org data as JSON/CSV. Individual users can request deletion.

### 🟢 P3 · S — IP allowlist per org

**What:** Admin can restrict logins to specific IP ranges.

---

## Architecture Decision Records

Located in `docs/adr/`. Each ADR follows the [MADR template](https://adr.github.io/madr/).

| # | Title | Status |
|---|-------|--------|
| 001 | Multi-tenant isolation strategy | 📋 Proposed |
| 002 | Mobile: Flutter vs React Native | ✅ Decided (Flutter) |
| 003 | Background jobs: BullMQ vs Inngest | 📋 Proposed |
| 004 | File storage: local vs S3 | 📋 Proposed |

---

## Release Planning

| Version | Theme | Status | Target |
|---------|-------|--------|--------|
| 1.0.0 | Initial release | ✅ Shipped | Jun 2026 |
| 1.1.0 | Mobile + AI pipeline | ✅ Shipped | Jun 2026 |
| 1.2.0 | Superadmin + support roles | ✅ Shipped | Jun 2026 |
| 1.3.0 | White-label branding | ✅ Shipped | Jun 2026 |
| 1.4.0 | Developer portal + backlog | 🔵 Planned | Jul 2026 |
| 1.5.0 | What's New modal | 🔵 Planned | Jul 2026 |
| 2.0.0 | Multi-instance cloud architecture | 🔵 Planned | Q3 2026 |
