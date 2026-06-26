# SalesFlow CRM — Local Deployment Guide

Run the full CRM stack on a home desktop with a permanent HTTPS URL via Cloudflare Tunnel.
Zero cloud server costs. Zero cold starts. WebSockets and cron jobs always alive.

---

## Prerequisites

| Tool | Install | Purpose |
|---|---|---|
| Docker Desktop | docker.com/get-started | Container runtime |
| Cloudflare account | cloudflare.com (free) | Tunnel + DNS |
| A domain in Cloudflare | (any registrar, NS pointed to CF) | Public HTTPS URL |

---

## Step 1 — Clone & configure environment

```bash
git clone https://github.com/your-org/crm.git
cd crm
cp backend/.env.example .env
```

Edit `.env` — minimum required values:

```env
# Neon database (stays in cloud — free tier)
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/crm?sslmode=require

# Generate with: openssl rand -base64 48
JWT_SECRET=<at-least-32-random-chars>
JWT_REFRESH_SECRET=<different-32-random-chars>

# Your Cloudflare Tunnel public domain (set after Step 3)
CLOUDFLARE_TUNNEL_DOMAIN=https://crm.yourdomain.com
APP_PUBLIC_URL=https://crm.yourdomain.com
CORS_ORIGIN=https://crm.yourdomain.com

# AI — get a free key at console.groq.com
GROQ_API_KEY=gsk_...

# Email (optional — for CRM BCC export)
# Option A: Resend (resend.com — generous free tier)
RESEND_API_KEY=re_...
# Option B: Gmail SMTP
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=you@gmail.com
# SMTP_PASS=your-16-char-app-password
FROM_EMAIL=SalesFlow CRM <you@yourdomain.com>
```

---

## Step 2 — Start the application

```bash
# Start app only (no tunnel — useful for local testing first)
docker compose up -d

# Check logs
docker compose logs -f app

# Verify health
curl http://localhost:3000/api/health
# → {"status":"ok","time":"..."}
```

The app is now running on `http://localhost:3000`.

---

## Step 3 — Create a Cloudflare Tunnel

### 3a. Install cloudflared

```bash
# macOS
brew install cloudflare/cloudflare/cloudflared

# Linux (Debian/Ubuntu)
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb
```

### 3b. Authenticate

```bash
cloudflared tunnel login
# Opens browser → select your Cloudflare account → authorise
```

### 3c. Create the tunnel

```bash
cloudflared tunnel create salesflow-crm
# Output: Created tunnel salesflow-crm with id <TUNNEL-UUID>
# A credentials JSON file is saved to ~/.cloudflared/<TUNNEL-UUID>.json
```

### 3d. Route DNS

```bash
cloudflared tunnel route dns salesflow-crm crm.yourdomain.com
# Creates a CNAME record: crm.yourdomain.com → <TUNNEL-UUID>.cfargotunnel.com
```

### 3e. Get tunnel token (for Docker)

```bash
cloudflared tunnel token salesflow-crm
# Copy the long token string
```

Add to `.env`:
```env
CLOUDFLARE_TUNNEL_TOKEN=<paste token here>
```

---

## Step 4 — Start with tunnel

```bash
# Start app + tunnel together
docker compose --profile tunnel up -d

# Verify tunnel is connected
docker compose logs cloudflared
# → "Registered tunnel connection"

# Test public URL
curl https://crm.yourdomain.com/api/health
# → {"status":"ok"}
```

Your CRM is now publicly accessible at `https://crm.yourdomain.com` with:
- Full TLS (Cloudflare manages certificates)
- WebSockets working (Socket.io real-time)
- Cron jobs persistent (no sleep/wake cycles)
- Audio uploads safe in named Docker volume

---

## Step 5 — Keep it running after desktop restarts

```bash
# Set Docker Desktop to start on login (Docker Desktop → Settings → General)
# Then set the container to auto-restart:
docker compose --profile tunnel up -d
# The restart: unless-stopped policy handles the rest
```

---

## Useful commands

```bash
# View live logs
docker compose logs -f app

# Restart after code change
docker compose build app && docker compose --profile tunnel up -d app

# Shell into container
docker compose exec app sh

# Check uploads volume (audio files)
docker volume inspect crm_crm_uploads

# Copy upload from container (backup)
docker cp salesflow_crm:/app/uploads ./uploads-backup

# Stop everything
docker compose --profile tunnel down

# Stop and remove uploads volume (DESTRUCTIVE — loses all audio files)
docker compose --profile tunnel down -v
```

---

## Updating the app

```bash
git pull origin main
docker compose build app
docker compose --profile tunnel up -d app
# DB schema changes are applied automatically on start (prisma db push)
```

---

## Security notes

- The app container binds to `127.0.0.1:3000` only — not exposed to the internet directly
- All inbound traffic goes through Cloudflare's edge (DDoS protection, WAF, TLS termination)
- Cloudflare Tunnel creates an outbound-only connection — no inbound firewall rules needed
- The desktop does not need any open ports
- Set `CLOUDFLARE_TUNNEL_DOMAIN` in `.env` so the backend's CORS whitelist is locked to your domain

---

## Troubleshooting

| Issue | Fix |
|---|---|
| `tunnel not found` | Run `cloudflared tunnel login` again |
| CORS error in browser | Ensure `CLOUDFLARE_TUNNEL_DOMAIN` matches your exact public URL |
| WebSocket disconnects | Check `docker compose logs cloudflared` — tunnel may need restart |
| Uploads lost after restart | Verify `crm_uploads` volume exists: `docker volume ls` |
| DB connection refused | Check `DATABASE_URL` — Neon requires `?sslmode=require` |
| Port 3000 already in use | `lsof -i :3000` to find and kill the process |

---

## Architecture summary

```
Internet
    │ HTTPS (Cloudflare edge)
    ▼
Cloudflare Tunnel (cloudflared container)
    │ localhost:3000
    ▼
Express app (salesflow_crm container)
    ├── Serves React SPA (frontend/dist)
    ├── REST API + Socket.io
    ├── node-cron (always alive)
    └── Multer uploads → /app/uploads (crm_uploads volume)
            │
            ▼
    Neon PostgreSQL (cloud — always on)
```
