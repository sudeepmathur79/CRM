/**
 * Developer Portal routes — gated by DEV_SECRET env var.
 * No org isolation: this is a platform-level internal tool.
 */
const router = require('express').Router();
const prisma = new (require('@prisma/client').PrismaClient)();

const DEV_SECRET = process.env.DEV_SECRET || 'dev-change-me';

// ── Auth middleware ───────────────────────────────────────────────────────────
function devAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (token !== DEV_SECRET) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// POST /api/dev/auth  — exchange secret for confirmation
router.post('/auth', (req, res) => {
  const { secret } = req.body;
  if (secret !== DEV_SECRET) return res.status(401).json({ error: 'Invalid secret' });
  res.json({ ok: true, token: DEV_SECRET });
});

router.use(devAuth);

// ── CRUD ──────────────────────────────────────────────────────────────────────

// Seed initial backlog from BACKLOG.md items if table is empty
const SEED_ITEMS = [
  // Epic: Developer Portal
  { title: 'Developer Portal (/dev) with Kanban backlog', epic: 'Developer Portal', priority: 1, effort: 'L', status: 'in_progress', tags: ['frontend', 'backend'], description: 'Password-gated /dev route with live Kanban board, AI prioritisation, and drag-and-drop. Persisted to BacklogItem table.', position: 1 },

  // Epic: Architecture
  { title: 'Per-paid-org isolated Neon database', epic: 'Architecture', priority: 1, effort: 'XL', status: 'backlog', tags: ['infra', 'database'], description: 'Stripe webhook triggers provisioning of a dedicated Neon project per paid org. Free/trial stays on shared DB.', position: 2 },
  { title: 'CDN + edge caching for static assets', epic: 'Architecture', priority: 2, effort: 'M', status: 'backlog', tags: ['infra', 'performance'], description: 'Serve Vite build from Cloudflare Pages / S3. API stays on Render/ECS.', position: 3 },
  { title: 'Background job queue (BullMQ + Redis)', epic: 'Architecture', priority: 2, effort: 'M', status: 'backlog', tags: ['backend', 'performance'], description: 'Move AI calls, email sends, CSV exports off the request path into BullMQ with Upstash Redis.', position: 4 },
  { title: 'Structured logging + Sentry error tracking', epic: 'Architecture', priority: 3, effort: 'S', status: 'backlog', tags: ['ops', 'backend'], description: 'Replace console.log with pino. Add Sentry (free tier) with org/user context.', position: 5 },

  // Epic: What's New
  { title: '"What\'s New" modal after minor/major releases', epic: "What's New", priority: 1, effort: 'S', status: 'ready', tags: ['frontend', 'ux'], description: 'One-time modal per user per version. Content parsed from CHANGELOG.md. lastSeenVersion tracked on User.', position: 6 },

  // Epic: Mobile
  { title: 'Mobile: stage update + offline queue', epic: 'Mobile', priority: 2, effort: 'M', status: 'backlog', tags: ['flutter', 'mobile'], description: 'Swipe-to-update stage on iOS/Android. Offline voice capture queue syncs on reconnect.', position: 7 },
  { title: 'Mobile: push notifications (FCM + APNs)', epic: 'Mobile', priority: 2, effort: 'M', status: 'backlog', tags: ['flutter', 'mobile', 'infra'], description: 'New lead assigned or inbox reply triggers push. DeviceToken table per user.', position: 8 },
  { title: 'App Store + Play Store submission', epic: 'Mobile', priority: 3, effort: 'L', status: 'backlog', tags: ['mobile', 'release'], description: 'Configure Apple Developer + Google Play Console. Screenshot sets for both stores.', position: 9 },

  // Epic: Product
  { title: 'Usage analytics dashboard for admins', epic: 'Product', priority: 2, effort: 'S', status: 'backlog', tags: ['frontend', 'analytics'], description: 'DAU, leads/week, AI calls used, storage used — visible to org admin.', position: 10 },
  { title: 'Onboarding checklist (first-run wizard)', epic: 'Product', priority: 2, effort: 'M', status: 'backlog', tags: ['frontend', 'ux'], description: 'Upload logo → invite team → add lead → first AI call. Progress bar in sidebar until complete.', position: 11 },
  { title: 'Zapier / Make.com webhook integration', epic: 'Product', priority: 3, effort: 'M', status: 'backlog', tags: ['backend', 'integrations'], description: 'Outbound webhook on lead events. Inbound webhook to create/update leads.', position: 12 },
  { title: 'CSV import with column mapping UI', epic: 'Product', priority: 3, effort: 'S', status: 'backlog', tags: ['frontend', 'backend'], description: 'Upload CSV → map columns → preview 5 rows → import. Duplicate detection by email.', position: 13 },

  // Epic: Security
  { title: 'Audit log (admin view)', epic: 'Security', priority: 1, effort: 'S', status: 'ready', tags: ['backend', 'security', 'compliance'], description: 'Every mutating action written to AuditLog table. Visible in Settings → Audit.', position: 14 },
  { title: 'GDPR: data export + right-to-erasure', epic: 'Security', priority: 2, effort: 'M', status: 'backlog', tags: ['backend', 'compliance'], description: 'Admin exports all org data as JSON/CSV. Individual users request account deletion.', position: 15 },
  { title: 'IP allowlist per org', epic: 'Security', priority: 3, effort: 'S', status: 'backlog', tags: ['backend', 'security'], description: 'Admin restricts logins to specific CIDR ranges.', position: 16 },
];

async function ensureSeeded() {
  const count = await prisma.backlogItem.count();
  if (count === 0) {
    await prisma.backlogItem.createMany({ data: SEED_ITEMS });
  }
}

// GET /api/dev/items
router.get('/items', async (req, res, next) => {
  try {
    await ensureSeeded();
    const items = await prisma.backlogItem.findMany({ orderBy: [{ status: 'asc' }, { position: 'asc' }] });
    res.json(items);
  } catch (e) { next(e); }
});

// POST /api/dev/items
router.post('/items', async (req, res, next) => {
  try {
    const { title, description, epic, priority = 2, effort = 'M', status = 'backlog', tags = [] } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'title required' });
    // position at end of column
    const last = await prisma.backlogItem.findFirst({ where: { status }, orderBy: { position: 'desc' } });
    const item = await prisma.backlogItem.create({
      data: { title: title.trim(), description, epic, priority, effort, status, tags, position: (last?.position ?? 0) + 1 },
    });
    res.status(201).json(item);
  } catch (e) { next(e); }
});

// PATCH /api/dev/items/:id
router.patch('/items/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, epic, priority, effort, status, tags, position } = req.body;
    const data = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (epic !== undefined) data.epic = epic;
    if (priority !== undefined) data.priority = priority;
    if (effort !== undefined) data.effort = effort;
    if (status !== undefined) data.status = status;
    if (tags !== undefined) data.tags = tags;
    if (position !== undefined) data.position = position;
    const item = await prisma.backlogItem.update({ where: { id }, data });
    res.json(item);
  } catch (e) { next(e); }
});

// DELETE /api/dev/items/:id
router.delete('/items/:id', async (req, res, next) => {
  try {
    await prisma.backlogItem.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// POST /api/dev/ai-prioritise — AI suggests priority order
router.post('/ai-prioritise', async (req, res, next) => {
  try {
    const items = await prisma.backlogItem.findMany({
      where: { status: { not: 'done' } },
      orderBy: { position: 'asc' },
    });

    const prompt = `You are a senior product manager for SalesFlow CRM — a B2B SaaS CRM for sales teams.

Here is the current backlog (JSON):
${JSON.stringify(items.map(i => ({ id: i.id, title: i.title, epic: i.epic, priority: i.priority, effort: i.effort, status: i.status, tags: i.tags })), null, 2)}

Prioritise these items for a small dev team. Consider:
- User/business impact (higher = first)
- Effort vs value (quick wins early)
- Dependencies (infra before features that depend on it)
- Current status (in_progress items stay, don't demote them)

Return ONLY valid JSON in this exact shape, nothing else:
{
  "reasoning": "2-3 sentence summary of your prioritisation logic",
  "items": [
    { "id": "<id>", "suggestedPriority": 0, "reason": "<one line why>" }
  ]
}`;

    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      }),
    });
    const json = await resp.json();
    const result = JSON.parse(json.choices[0].message.content);
    res.json(result);
  } catch (e) { next(e); }
});

// GET /api/dev/stats — quick summary for portal header
router.get('/stats', async (req, res, next) => {
  try {
    const all = await prisma.backlogItem.groupBy({ by: ['status'], _count: { _all: true } });
    const byPriority = await prisma.backlogItem.groupBy({ by: ['priority'], _count: { _all: true }, where: { status: { not: 'done' } } });
    res.json({ byStatus: all, byPriority });
  } catch (e) { next(e); }
});

module.exports = router;
