# CRM — Phase 1

A full-featured CRM for a 10-person sales team. Lead management, Kanban board, call recordings, background automation agents, real-time updates.

---

## Deploy to Railway (Recommended)

### Step 1 — Push to GitHub

```bash
cd crm
git init
git add .
git commit -m "Initial CRM"
# Create a new repo on github.com then:
git remote add origin https://github.com/YOUR_USERNAME/crm.git
git push -u origin main
```

### Step 2 — Create Railway project

1. Go to [railway.app](https://railway.app) → **New Project**
2. Choose **Deploy from GitHub repo** → select your `crm` repo
3. Railway auto-detects the `Dockerfile` at root — click **Deploy**

### Step 3 — Add PostgreSQL

1. In your Railway project, click **+ New** → **Database** → **PostgreSQL**
2. Railway automatically sets `DATABASE_URL` in your service env — no manual config needed

### Step 4 — Set environment variables

In Railway → your service → **Variables**, add:

```
JWT_SECRET=<generate a 32+ char random string>
JWT_REFRESH_SECRET=<another 32+ char random string>
NODE_ENV=production
PORT=3000

# Optional — enables follow-up reminder emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password

# Optional — enables Whisper transcription + AI summaries
OPENAI_API_KEY=sk-...
WHISPER_ENABLED=true
```

Generate secrets with: `openssl rand -base64 32`

### Step 5 — Seed demo data

Once deployed, open Railway's terminal for your service:

```bash
node seed.js
```

Or from your local machine (replace with your Railway DATABASE_URL):
```bash
DATABASE_URL=postgresql://... node seed.js
```

Your app is now live at the Railway-provided URL (e.g. `https://crm-production.up.railway.app`).

---

## Local Development

```bash
# Backend
cd backend
cp .env.example .env   # set DATABASE_URL
npm install
npx prisma migrate dev --name init
npm run dev            # → http://localhost:5000

# Frontend (new terminal)
cd frontend
npm install
npm run dev            # → http://localhost:5173

# Seed data (from repo root)
node seed.js
```

---

## Demo Accounts (after seeding)

All passwords: `password123`

| Email | Role |
|---|---|
| admin@crm.com | Admin — sees all leads, manages users |
| alice@crm.com | Agent — sees own leads only |
| viewer@crm.com | Viewer — read-only |

---

## Features

| Feature | Details |
|---|---|
| Lead Management | CRUD, search, filter by status/source/assignee, bulk actions |
| Kanban Board | Drag-and-drop across 6 status columns |
| Call Recording | In-browser via MediaRecorder API |
| File Upload | MP3, WAV, MP4, WebM, TXT, VTT, SRT |
| AI Transcription | OpenAI Whisper (set `WHISPER_ENABLED=true`) |
| AI Summaries | GPT-3.5 summarizes call transcripts |
| Background Agents | Auto round-robin assignment, follow-up emails, keyword tagging, daily digest |
| Real-time | Socket.io — live updates across all browser tabs |
| Auth | JWT + refresh tokens, role-based access (admin/agent/viewer) |
| Dark Mode | Toggle in sidebar |
| Docker | Single `docker compose up` for local full-stack |

---

## Docker (local full-stack)

```bash
cp .env.example .env
docker compose up -d
# First run — seed data:
docker compose exec backend sh -c "cd /app && node ../../seed.js"
```
Open http://localhost

---

## Phase 2 (Future)

WhatsApp, Telegram, voice note ingestion, AI conversation processing — agents interact entirely through chat while the CRM updates in the background.
