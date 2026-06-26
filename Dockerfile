# ── Stage 1: Build frontend ───────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
ARG VITE_TURNSTILE_SITE_KEY
ENV VITE_TURNSTILE_SITE_KEY=$VITE_TURNSTILE_SITE_KEY
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
# bust: 2026-06-27
RUN npm run build

# ── Stage 2: Production backend ───────────────────────────────────────────────
# Agent A: run as non-root user (principle of least privilege)
# Agent C: multi-stage keeps image lean (~200MB vs ~800MB with dev deps)
FROM node:20-alpine

# Required for Prisma binary targets and OpenSSL for JWT
RUN apk add --no-cache openssl dumb-init

# Non-root user for container security (Agent A — AppSec)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Install production deps first (layer-cached unless package.json changes)
COPY backend/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy Prisma schema and generate client
COPY backend/prisma ./prisma
RUN npx prisma generate

# Copy application source
COPY backend/src ./src

# Copy built frontend
COPY --from=frontend-builder /frontend/dist ./frontend/dist

# Create uploads directory with correct ownership
# This will be overridden by the Docker volume mount in production
RUN mkdir -p /app/uploads && chown -R appuser:appgroup /app

# Switch to non-root
USER appuser

EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

# dumb-init: proper PID 1 signal handling (Agent C — prevents zombie processes)
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

CMD ["sh", "-c", \
  "npx prisma db push --accept-data-loss && \
   node -e \"const{PrismaClient}=require('@prisma/client');const p=new PrismaClient(); \
     p.user.count().then(n=>{if(n===0){require('child_process').execSync('npx prisma db seed',{stdio:'inherit'})}else{console.log('[boot] DB has data, skipping seed')}}).finally(()=>p.\\$disconnect())\" && \
   node src/index.js"]
