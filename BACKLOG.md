# CRM Product Backlog

Last updated: 2026-06-27

Items are grouped by theme and roughly ordered by priority within each group.
Status: `[ ]` = todo · `[~]` = in progress · `[x]` = done

---

## 🔴 P1 — Table Stakes (Competitive blockers)

### Data & Migration
- [x] **CSV import for leads** — fuzzy column matching, preview with error/duplicate report, sample template download.
- [x] **CSV export** — full lead export respecting current status filter.
- [x] **Duplicate detection on import** — matches on email or phone, skips with count in report.

### Pipeline & Dashboard
- [x] **Pipeline $ value** — total deal value per stage on dashboard and Kanban columns.
- [x] **Deal value field on Lead** — optional numeric field, shown on Kanban cards, included in CSV.
- [x] **Dashboard: conversion rate funnel** — visual drop-off from New → Contacted → Qualified → Proposal → Won.
- [x] **Dashboard: agent performance panel** — leads owned, closed this month, follow-ups overdue, conversion rate per agent (admin-only).
- [x] **Dashboard: stale leads alert** — leads with no activity in 14 days, configurable threshold.
- [x] **Dashboard: unassigned leads queue** — dedicated count + quick-assign from dashboard.
- [x] **Negotiation pipeline stage** — added between Proposal and Closed Won across all views.

### Follow-up & Reminders
- [x] **Follow-up reminder notifications** — browser notification when a lead's `nextFollowUp` date arrives.
- [x] **Overdue follow-up flag** — visual indicator on lead cards and list when follow-up date has passed.
- [ ] **Sequence / drip reminders** — scheduled reminder chain (e.g. follow up in 2 days, then 7 days, then 14 days) triggered on status change.

### Auth & Security
- [x] **TOTP 2FA** — setup, enable, disable via authenticator app.
- [x] **Email verification on self-signup** — token-based, Brevo SMTP delivery.
- [x] **Cloudflare Turnstile CAPTCHA** — on signup and login, Managed mode.
- [x] **RBAC** — agents see only their assigned leads; CSV/import/Kanban/SmartAdd gated to admin.

---

## 🟠 P2 — Differentiators (What makes you worth paying for)

### AI & Conversation Intelligence
- [x] **AI lead scoring** — score each lead 1–10 based on transcript sentiment, engagement, recency.
- [x] **AI suggested next action** — surface the most relevant next step based on transcript + last activity.
- [x] **AI Smart Add** — create a lead from plain English description.
- [x] **AI auto-tagging** — background agent tags leads from transcript content.
- [x] **AI management recommendations** — admin dashboard AI commentary on agent performance and stale deals.
- [x] **Activity log with field-level detail** — logs which fields changed on each update.
- [ ] **AI email draft** — one-click draft follow-up email based on last conversation summary.
- [ ] **Bulk AI analysis** — run AI analysis across all leads with unanalysed transcripts in one click (admin action).

### CRM Integration
- [x] **BCC email export to HubSpot / Salesforce / Zoho** — after AI analysis, auto-sends formatted HTML activity log to user's BCC address for their CRM.
- [x] **CRM type selector in Settings** — user picks HubSpot, Salesforce, Zoho, or Other; auto-export toggle.
- [x] **Professional HTML activity log formatter** — `crmExporter.js` formats AI output into email-compatible HTML with summary, next steps, transcript excerpt.
- [ ] **Native HubSpot API push** — push leads and activities directly via HubSpot API (no BCC workaround needed).
- [ ] **Native Salesforce API push** — Salesforce REST API integration.
- [ ] **Gmail / Outlook BCC logging** — auto-log sent emails to lead timeline by BCC to a CRM address.
- [ ] **Email compose in Lead Detail** — send email directly from lead page, auto-logged to activity timeline.
- [ ] **Email open/click tracking** — send tracked emails from within the CRM, see when they're opened.

### Meta / Wearables
- [x] **Ray-Ban Meta Smart Glasses HUD** — `/hud` route, 600×600 high-contrast display showing stale leads, top scores, live clock.
- [ ] **Meta Lead Ads webhook** — receive new leads from Facebook/Instagram Lead Ads directly into the pipeline via webhook.
- [ ] **WhatsApp Business API** — send and receive WhatsApp messages from the lead detail page, logged to activity timeline.

### Mobile & UX
- [x] **Progressive Web App (PWA)** — installable on iOS/Android home screen.
- [x] **Mobile responsive** — bottom tab nav, sheet modals, card lists, safe-area insets for iOS Safari.
- [x] **Voice capture (mobile)** — record voice memo from sidebar mic button; AI transcribes and logs to lead.
- [x] **Voice dictation in Smart Add** — Web Speech API for hands-free lead creation.
- [x] **Unresolved voice draft badge** — sidebar badge + daily reminder + 24h escalation to admin.
- [ ] **Quick-add lead from mobile** — one-tap floating button opens minimal form (name + phone only).
- [ ] **Swipe actions on mobile lead cards** — swipe right to call, swipe left to mark contacted.

### Geolocation
- [x] **Nearby stale leads** — `POST /api/geo/nearby-stale` finds stale leads near current GPS coordinates (Haversine).
- [x] **Lead geolocation** — set lat/lng/address on a lead for field sales reps.
- [ ] **Map view** — visual map of leads pinned by location, filterable by status/assignee.

### Messaging
- [x] **Internal messaging** — team chat with @mentions, threaded by deal context.
- [x] **@mention notifications** — toast alert when mentioned in a message or note.
- [x] **Message from lead detail** — pre-attach lead reference when messaging a teammate from a lead page.

---

## 🟡 P3 — Product Depth (Makes it stickier)

### Lead Management
- [ ] **Custom fields** — admin defines extra fields per lead (e.g. "Property Type"). Stored as JSON.
- [ ] **Lead source tracking & attribution** — which sources convert best. Tie `source` field to won/lost outcomes.
- [ ] **Merge duplicate leads** — detect and merge leads with matching email or phone.
- [ ] **Lead scoring rules** — admin-configurable rules (e.g. +10 for file uploaded, +5 for follow-up set).
- [ ] **Bulk reassign** — admin picks an agent, reassigns all their leads to another in one action.
- [ ] **Lead import from web form** — embeddable HTML form that POSTs to `/api/leads/inbound?token=xxx`.
- [ ] **Won/lost reason tracking** — optional dropdown when closing a lead, aggregated in dashboard.
- [ ] **Saved filters** — save a lead list filter as a named view (e.g. "My overdue leads").

### Lead List UX (P3 QA findings)
- [ ] **Lead list columns** — add AI Score, Next Follow-up, Assigned To columns (toggleable).
- [ ] **Extended filters** — Source, Unassigned Only, Stale (14+ days), Show Archived.
- [ ] **Kanban: + New Lead button** — add at top of New column or in Kanban header.

### Recordings & Files
- [ ] **Audio recording in-browser** — record a call or voice memo via MediaRecorder API from lead page.
- [ ] **Whisper transcription** — auto-transcribe audio files via OpenAI Whisper API.
- [ ] **File preview** — inline preview for PDFs and images in the recordings panel.
- [ ] **Files page upload button** — upload from `/recordings` page with lead-assignment step.

### Reporting
- [ ] **Activity report** — log of all actions across the team in a date range. Exportable.

---

## 🟢 P4 — Growth & Commercial

### Demo & Onboarding
- [x] **Demo seed mode** — Archive Demo Data button; demo data seeded on org creation.
- [x] **First-time setup flow** — `/setup` page creates admin on empty DB; login auto-redirects.
- [ ] **Onboarding checklist** — first-login wizard: add a lead, upload a file, invite a teammate. Dismissible.
- [ ] **In-app contextual help** — tooltip overlays on first visit to each major section.

### White-label & Branding
- [ ] **Logo upload** — admin uploads logo shown in sidebar and on login page.
- [ ] **Brand colour config** — primary colour picker in Settings, stored in DB, applied via CSS variable.
- [ ] **Custom app name** — rename "CRM" to client's product name in title bar and emails.
- [ ] **White-label login page** — custom domain support (CNAME) + branded login screen per client.

### Industry Packs (Config-driven, no code fork)
- [ ] **Real estate pack** — stages: Enquiry → Viewing → Offer → Under Contract → Settled. Custom fields: property address, budget, bedrooms.
- [ ] **Recruiting pack** — stages: Applied → Screened → Interview → Offer → Placed. Custom fields: role, salary, notice period.
- [ ] **Home services pack** — stages: Lead → Quote Sent → Booked → In Progress → Invoiced.
- [ ] **Financial services pack** — stages: Prospect → KYC → Proposal → Compliance → Onboarded.

---

## 🔵 P5 — Infrastructure & Scale

### Team Hierarchies
- [ ] **Team manager role** — mid-tier between agent and admin; sees and manages their team's leads.
- [ ] **Team model** — `Team` entity with name, manager, members. Leads assignable to a team.
- [ ] **Team-scoped dashboard** — management view filtered to a single team.
- [ ] **Team leaderboard** — cross-team comparison: conversion rate, pipeline, overdue % per team.

### Multi-tenancy & Billing
- [x] **Multi-tenancy** — org-scoped data isolation, self-signup creates new org.
- [ ] **Stripe Checkout integration** — subscription plans (per-seat or flat). Webhook updates org `plan`.
- [ ] **Plan-gated features** — feature flags per plan. AI features on Pro+, white-label on Enterprise.
- [ ] **Admin portal** — super-admin view of all orgs, usage, MRR, ability to suspend/activate.
- [ ] **Usage metering** — track AI calls, file storage, seat count per org for billing.

### Infrastructure
- [x] **Neon managed Postgres** — no data retention risk, production-grade.
- [x] **Cloudflare R2** — file/recording storage, S3-compatible, free egress.
- [x] **Self-hosting via Cloudflare Tunnel** — run on home desktop, exposed via cloudflared sidecar.
- [x] **Circuit breaker on mailer** — opens after 5 failures, resets after 60s, exponential retry.
- [x] **Non-root Docker container** — dumb-init PID 1, appuser, multi-stage build.
- [x] **Health check endpoint** — `GET /api/health`.
- [ ] **Background job queue** — move AI analysis off HTTP request path. BullMQ + Redis (Upstash free tier).
- [ ] **Error monitoring** — Sentry free tier.
- [ ] **Rate limiting per org** — prevent one tenant hammering AI endpoints.

---

## ✅ Done (full history)

### Core
- [x] JWT auth with refresh tokens, role-based access (admin / agent)
- [x] Lead pipeline with Kanban drag-and-drop
- [x] Activity log — all lead events timestamped with field-level detail
- [x] Notes timeline — manual + AI summaries, collapsible
- [x] Lead archiving — soft delete, archive demo data button

### AI
- [x] AI conversation analysis — Groq with OpenRouter/Mistral fallback
- [x] Multi-day transcript parsing — chronological, latest first
- [x] AI lead scoring + suggested next action
- [x] AI Smart Add (plain English → lead)
- [x] AI auto-tagging (background agent)
- [x] AI management recommendations (admin dashboard)
- [x] Deal coach, follow-up drafter, meeting prep, lead qualifier, call debrief agents

### Storage & Files
- [x] File/recording upload to Cloudflare R2
- [x] Recordings page — global view across all leads
- [x] Voice capture from sidebar mic (mobile)

### Dashboard & Reporting
- [x] Dashboard stats scoped to org + role
- [x] Conversion funnel, stale leads, unassigned queue, agent performance panel
- [x] Pipeline value per stage on dashboard + Kanban

### UX & Mobile
- [x] Mobile responsive — bottom tab bar, card lists, sheet modals
- [x] PWA — installable iOS/Android, offline-capable
- [x] Safe area insets for iOS Safari
- [x] Voice dictation in Smart Add (Web Speech API)
- [x] Dark mode
- [x] Profile edit, avatar upload, logout in Settings

### Auth & Security
- [x] TOTP 2FA — setup, enable, disable
- [x] Email verification on self-signup (Brevo SMTP)
- [x] Cloudflare Turnstile CAPTCHA
- [x] RBAC — agent lead scoping, CSV/Kanban/SmartAdd gated to admin
- [x] Google SSO (built and reverted — TOTP kept)

### Integrations
- [x] CRM BCC export — HubSpot / Salesforce / Zoho compatible HTML activity log
- [x] Ray-Ban Meta HUD — `/hud` route
- [x] Geolocation — nearby stale leads, lead lat/lng
- [x] Internal messaging + @mentions + deal-threaded conversations

### Infrastructure
- [x] Neon Postgres (managed, no retention risk)
- [x] Cloudflare R2 storage
- [x] Self-hosting via Cloudflare Tunnel + docker-compose
- [x] Non-root Docker container, dumb-init, multi-stage build
- [x] Circuit breaker on mailer
- [x] First-time setup flow (/setup)
- [x] Disabled users sorted below active, admins excluded from assignment
- [x] Demo data seed + archive
- [x] One-time Render → Neon data migration endpoint
