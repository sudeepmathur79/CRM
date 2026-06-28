# ADR 001 — Multi-Tenant Isolation Strategy

**Date:** 2026-06-29  
**Status:** Proposed  
**Deciders:** Sudiip Mathur

---

## Context

SalesFlow CRM currently runs as a single shared deployment on Render with one Neon Postgres database. All organisations share the same tables, separated by `orgId` foreign keys. This is fine for free/trial users but creates problems for paid enterprise orgs:

- **Data isolation risk:** A SQL bug could leak cross-org data
- **Performance isolation:** A heavy org degrades experience for all others
- **Compliance:** Enterprise buyers require contractual data isolation (SOC 2, ISO 27001)
- **Scaling:** Cannot scale individual orgs independently

---

## Decision Drivers

- Must start on free/low-cost tier (AWS/GCP free tier)
- Paid orgs (Pro/Premium) need stronger isolation guarantees
- Dev team is small — operational complexity must stay low
- Time-to-market: provisioning a new paid org must be automatic (<60s)

---

## Options Considered

### Option A — Shared database, row-level isolation (current)
- ✅ Zero infra overhead, instant provisioning
- ❌ No physical data isolation, hard compliance story
- ✅ Good for Free/Trial (keep this)

### Option B — Schema-per-tenant in same Postgres
- ✅ Data isolation without multiple databases
- ✅ Neon supports branching (near-instant schema copies)
- ❌ Cross-schema queries possible; migration complexity grows
- ❌ Not supported by Prisma without workarounds

### Option C — Database-per-tenant (Recommended for Paid)
- ✅ Full data isolation — strongest compliance posture
- ✅ Independent backup/restore per org
- ✅ Neon project-per-org: free tier includes 10 projects
- ❌ Many connection pools needed → use PgBouncer or Prisma Data Proxy
- ❌ Schema migrations must run per org

### Option D — Instance-per-tenant (containers)
- ✅ Full isolation at compute + data level
- ✅ Independent scaling, zero noisy-neighbour
- ❌ Highest cost and operational overhead
- ❌ Premature for current scale

---

## Decision

**Hybrid approach:**
- **Free / Trial** orgs → shared Render deployment, shared Neon database (Option A)
- **Pro / Premium** orgs → shared Render deployment (same containers), **dedicated Neon project** per org (Option C)
- **Enterprise** (future) → Option D, dedicated ECS task + dedicated Neon project

This separates data isolation (high value, low cost with Neon) from compute isolation (needed only at enterprise scale).

---

## Implementation Plan

### Phase 1 (v2.0.0) — Database-per-paid-org

1. **Stripe webhook** `checkout.session.completed` triggers provisioning:
   ```
   POST /api/internal/provision-org
   { orgId, plan }
   ```

2. **Provisioning service** (`backend/src/services/provision.service.js`):
   ```js
   async function provisionPaidOrg(orgId) {
     // 1. Create Neon project via Neon API
     const project = await neonApi.createProject({ name: `crm-org-${orgId}` });
     // 2. Store DATABASE_URL per org in encrypted column or AWS Secrets Manager
     await prisma.organisation.update({
       where: { id: orgId },
       data: { databaseUrl: encrypt(project.connection_uri) }
     });
     // 3. Run migrations on new database
     await runMigrations(project.connection_uri);
     // 4. Migrate existing data from shared DB
     await migrateOrgData(orgId, project.connection_uri);
   }
   ```

3. **Request routing** — middleware resolves which DATABASE_URL to use per request:
   ```js
   // middleware/tenant.middleware.js
   req.prisma = getPrismaForOrg(req.orgId); // cached per orgId
   ```

4. **Migration runner** — `prisma migrate deploy` called per org database on deploy (or via a migration Lambda)

### Phase 2 (v2.1.0) — Subdomain routing
- `{slug}.salesflow.io` → Cloudflare Worker routes to correct backend with `X-Org-Slug` header
- Custom domain support: org admin points `crm.theircompany.com` CNAME → Cloudflare

---

## Cost Estimate (AWS free tier, Year 1)

| Resource | Provider | Free tier | Paid org cost |
|----------|----------|-----------|---------------|
| Compute | Render Starter | ~$7/mo shared | $0 extra (shared containers) |
| Database | Neon | 10 projects free | $19/mo per project after |
| CDN | Cloudflare | Unlimited free | $0 |
| Email | Resend | 3k emails/mo free | $20/mo for 50k |
| Secrets | AWS Secrets Manager | 30 days free then $0.40/secret | ~$0.40/org/mo |

**Break-even:** First ~10 paid orgs cost $0 in infra (Neon free tier). After that, ~$19/mo per org — easily covered by Pro pricing ($49+/mo).

---

## Consequences

- ✅ Strong data isolation story for enterprise sales
- ✅ Neon branching enables instant staging environments per org
- ⚠️ Schema migrations become a coordinated operation (need migration orchestrator)
- ⚠️ Connection pool management: Prisma client must be per-org not singleton
- ⚠️ Dev/test complexity: local dev still uses shared DB; test environment needs to mirror per-org routing
