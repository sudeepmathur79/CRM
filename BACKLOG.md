# CRM Product Backlog

Last updated: 2026-06-25

Items are grouped by theme and roughly ordered by priority within each group.
Status: `[ ]` = todo · `[~]` = in progress · `[x]` = done

---

## 🔴 P1 — Table Stakes (Competitive blockers)

### Data & Migration
- [x] **CSV import for leads** — fuzzy column matching, preview with error/duplicate report, sample template download.
- [x] **CSV export** — full lead export respecting current status filter.
- [x] **Duplicate detection on import** — matches on email or phone, skips with count in report.

### Pipeline & Dashboard
- [ ] **Pipeline $ value** — replace "count by stage" with total deal value per stage. Requires a `value` field on leads.
- [ ] **Deal value field on Lead** — optional numeric field (currency). Used in pipeline value, forecasting, and won/lost reporting.
- [ ] **Dashboard: conversion rate funnel** — visual drop-off from New → Contacted → Qualified → Proposal → Won.
- [ ] **Dashboard: agent performance panel** — leads owned, closed this month, follow-ups overdue, conversion rate per agent (admin-only).
- [ ] **Dashboard: stale leads alert** — leads with no activity in N days (configurable, default 14).
- [ ] **Dashboard: unassigned leads queue** — dedicated count + quick-assign from dashboard.

### Follow-up & Reminders
- [ ] **Follow-up reminder notifications** — browser/email notification when a lead's `nextFollowUp` date arrives.
- [ ] **Overdue follow-up flag** — visual indicator on lead cards and list when follow-up date has passed.
- [ ] **Sequence / drip reminders** — scheduled reminder chain (e.g. follow up in 2 days, then 7 days, then 14 days) triggered on status change.

---

## 🟠 P2 — Differentiators (What makes you worth paying for)

### AI & Conversation Intelligence
- [ ] **AI lead scoring** — score each lead 1-10 based on transcript sentiment, engagement, recency. Show on lead card.
- [ ] **AI-suggested next action** — surface the most relevant next step based on transcript + last activity.
- [ ] **AI email draft** — one-click draft follow-up email based on last conversation summary.
- [ ] **Bulk AI analysis** — run AI analysis across all leads with unanalysed transcripts in one click (admin action).

### Email Integration
- [ ] **Email open/click tracking** — send tracked emails from within the CRM, see when they're opened. (Requires own SMTP or Mailgun/Resend).
- [ ] **Gmail / Outlook BCC logging** — auto-log sent emails to lead timeline by BCC to a CRM address.
- [ ] **Email compose in Lead Detail** — send email directly from lead page, auto-logged to activity timeline.

### Mobile & UX
- [ ] **Progressive Web App (PWA)** — installable on iOS/Android home screen, offline-capable for reading leads.
- [ ] **Quick-add lead from mobile** — one-tap floating button opens minimal form (name + phone only).
- [ ] **Swipe actions on mobile lead cards** — swipe right to call, swipe left to mark contacted.

---

## 🟡 P3 — Product Depth (Makes it stickier)

### Lead Management
- [ ] **Custom fields** — admin can define extra fields per lead (e.g. "Property Type" for real estate, "Job Title" for recruiting). Stored as JSON.
- [ ] **Lead source tracking & attribution** — which sources convert best. Tie `source` field to won/lost outcomes.
- [ ] **Merge duplicate leads** — detect and merge leads with matching email or phone.
- [ ] **Lead scoring rules** — admin-configurable rules (e.g. +10 for file uploaded, +5 for follow-up set, -10 for 14 days inactive).
- [ ] **Bulk reassign** — admin picks an agent, sees all their leads, reassigns to another in one action.
- [ ] **Lead import from web form** — embeddable HTML form that POSTs to `/api/leads/inbound?token=xxx`. Zero-code website integration.

### Recordings & Files
- [ ] **Audio recording in-browser** — record a call or voice memo directly from the lead page (MediaRecorder API).
- [ ] **Whisper transcription** — auto-transcribe audio files via OpenAI Whisper API (currently text-only upload).
- [ ] **File preview** — inline preview for PDFs and images in the recordings panel.

### Reporting
- [ ] **Saved filters** — save a lead list filter as a named view (e.g. "My overdue leads", "Hot prospects").
- [ ] **Activity report** — log of all actions across the team in a given date range. Exportable.
- [ ] **Won/lost reason tracking** — optional dropdown when closing a lead, aggregated in dashboard.

---

## 🟢 P4 — Growth & Commercial

### Demo & Onboarding
- [ ] **Demo seed mode** — `SEED_DEMO=true` env flag auto-populates realistic fake leads, recordings, and activity on container start. Used for prospect demos.
- [ ] **Onboarding checklist** — first-login wizard: add a lead, upload a file, invite a teammate. Dismissible.
- [ ] **In-app contextual help** — tooltip overlays on first visit to each major section.

### White-label & Branding
- [ ] **Logo upload** — admin can upload a logo shown in the sidebar and on login page.
- [ ] **Brand colour config** — primary colour picker in Settings, stored in DB, applied via CSS variable. No deploy needed.
- [ ] **Custom app name** — rename "CRM" to client's product name, shown in title bar and emails.
- [ ] **White-label login page** — custom domain support (CNAME) + branded login screen per client.

### Industry Packs (Config-driven, no code fork)
- [ ] **Industry config file schema** — define custom stage names, default tags, field labels, source options per industry.
- [ ] **Real estate pack** — stages: Enquiry → Viewing → Offer → Under Contract → Settled. Custom fields: property address, budget, bedrooms.
- [ ] **Recruiting pack** — stages: Applied → Screened → Interview → Offer → Placed. Custom fields: role, salary, notice period.
- [ ] **Home services pack** — stages: Lead → Quote Sent → Booked → In Progress → Invoiced. Custom fields: job type, address, quoted value.
- [ ] **Financial services pack** — stages: Prospect → KYC → Proposal → Compliance → Onboarded. Custom fields: AUM, product interest.

---

## 🔵 P5 — Infrastructure & Scale (Backlog until traction)

### Multi-tenancy
- [ ] **Tenant model design** — decide: shared DB with `tenantId` row-level isolation vs. separate DB per tenant. Recommendation: `tenantId` on all models first, separate DB later when needed.
- [ ] **Tenant provisioner script** — CLI script to create a new tenant (DB row, admin user, branding defaults).
- [ ] **Tenant-aware middleware** — resolve `tenantId` from subdomain or JWT claim on every request.
- [ ] **Subdomain routing** — `clientname.yourcrm.com` maps to correct tenant. Nginx/Caddy config.
- [ ] **Tenant data isolation audit** — ensure no query returns cross-tenant data. Automated test suite.

### Client Onboarding & Billing
- [ ] **Stripe Checkout integration** — subscription plans (per-seat or flat). Webhook updates tenant `plan` field.
- [ ] **Plan-gated features** — feature flags per plan. E.g. AI features on Pro+, white-label on Enterprise.
- [ ] **Self-serve signup** — public `/signup` flow: company name → email → password → Stripe → tenant created.
- [ ] **Admin portal** — super-admin view of all tenants, usage, MRR, ability to suspend/activate.
- [ ] **Usage metering** — track AI calls, file storage, and seat count per tenant for billing.

### Infrastructure
- [ ] **Managed Postgres** — move off Render's free Postgres (90-day data retention limit) to Neon or Supabase free tier. Zero cost, no data loss risk.
- [ ] **Background job queue** — move AI analysis off the HTTP request path. BullMQ + Redis (Upstash free tier) so uploads return instantly.
- [ ] **Email delivery** — transactional email via Resend free tier (3,000/mo free) for follow-up notifications and user invites.
- [ ] **Error monitoring** — Sentry free tier. Catch production errors before users report them.
- [ ] **Health check endpoint** — `GET /api/health` returns DB status. Used by Render's health checks to avoid bad deploys staying up.

---

## ✅ Done (recent)

- [x] JWT auth with refresh tokens, role-based access (admin / agent / viewer)
- [x] Lead pipeline with Kanban drag-and-drop
- [x] AI conversation analysis — Groq with OpenRouter/Mistral fallback
- [x] Multi-day transcript parsing — chronological, latest first
- [x] File/recording upload to Cloudflare R2
- [x] Notes timeline — manual + AI summaries, collapsible
- [x] Activity log — all lead events timestamped
- [x] Mobile responsive — bottom tab bar, card lists, sheet modals
- [x] Voice-to-text in Smart Add (Web Speech API)
- [x] Safe area insets for iOS Safari
- [x] Recordings page — global view across all leads
- [x] Dashboard stats excluding archived leads
- [x] Disabled users sorted below active in Settings
- [x] Admin users excluded from lead assignment
- [x] Profile edit + logout in Settings (accessible on mobile)
- [x] Re-enable disabled users
- [x] Demo data archive / soft-delete
