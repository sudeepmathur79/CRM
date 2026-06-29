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
  const headerToken = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  // EventSource can't set headers — allow token via query param for SSE routes
  const queryToken = req.query.token || '';
  const token = headerToken || queryToken;
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

// POST /api/dev/ai-chat — conversational AI that classifies asks into backlog items
router.post('/ai-chat', async (req, res, next) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages required' });
    }

    const existingItems = await prisma.backlogItem.findMany({
      where: { status: { not: 'done' } },
      select: { title: true, epic: true, status: true },
      orderBy: { position: 'asc' },
    });

    const systemPrompt = `You are an AI product assistant for SalesFlow CRM — a B2B SaaS CRM for sales teams built with React, Express, Prisma/Postgres, and Flutter.

Your job is to help the product owner manage the backlog. You can:
1. Classify natural-language feature requests into structured backlog items
2. Answer questions about the backlog and prioritisation
3. Suggest when something is a duplicate of an existing item
4. Give implementation advice

Current backlog summary (${existingItems.length} open items):
${existingItems.slice(0, 20).map(i => `- [${i.epic || 'Other'}] ${i.title} (${i.status})`).join('\n')}

When the user describes a feature or bug, respond with:
- A brief acknowledgement of what you understood
- If it's a new item: propose a structured card as JSON in a \`\`\`json block like this:
\`\`\`json
{
  "action": "create_item",
  "title": "...",
  "description": "...",
  "epic": "Product|Security|Architecture|Mobile|Developer Portal|What's New|Other",
  "priority": 0-3,
  "effort": "XS|S|M|L|XL",
  "tags": ["frontend", "backend", "mobile", "security", "infra"]
}
\`\`\`
- If it looks like a duplicate, say so and suggest linking to the existing item
- Always be concise. One paragraph max before the JSON block.

Valid epics: Developer Portal, Architecture, What's New, Mobile, Product, Security, Other
Priority: 0=Critical/P0, 1=High/P1, 2=Medium/P2, 3=Low/P3
Effort: XS=<1day, S=1-2days, M=3-5days, L=1-2weeks, XL=2weeks+`;

    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        temperature: 0.4,
        max_tokens: 800,
      }),
    });
    const json = await resp.json();
    const content = json.choices?.[0]?.message?.content || '';

    // Extract JSON block if present
    const jsonMatch = content.match(/```json\s*([\s\S]*?)```/);
    let proposed = null;
    if (jsonMatch) {
      try { proposed = JSON.parse(jsonMatch[1]); } catch {}
    }

    res.json({ content, proposed });
  } catch (e) { next(e); }
});

// POST /api/dev/build/:id — trigger Claude to generate implementation plan
router.post('/build/:id', async (req, res, next) => {
  try {
    const item = await prisma.backlogItem.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const codebaseContext = `
SalesFlow CRM codebase structure:
- frontend/src/pages/ — React pages (Leads, Settings, SuperAdmin, Dev, Login, Signup, Dashboard, Kanban, Agents, Inbox, Recordings)
- frontend/src/components/ — shared components (Layout, VoiceCapture, FeedbackWidget)
- frontend/src/hooks/ — useBranding, useAuth, useTheme
- frontend/src/services/api.js — axios wrappers for all API calls
- frontend/src/contexts/ — AuthContext, ThemeContext
- backend/src/routes/ — Express routers: auth, lead, org, user, agent, dev, superadmin, messages, recordings
- backend/src/services/ — auth.service, lead.service, ai.service, agent.service, agents/ (scheduler, roundRobin, followup, tagging)
- backend/prisma/schema.prisma — Organisation, User, Lead, Tag, Message, AgentConfig, BacklogItem, VoiceDraft, SupportSession
- Stack: React + Vite + Tailwind + @tanstack/react-query + @dnd-kit | Express + Prisma + Neon Postgres | Flutter mobile
- Deployed: Render (Docker), Neon Postgres, Resend (email), Cloudflare R2 (files), Cloudflare Turnstile (captcha)`;

    const prompt = `You are a senior full-stack engineer. The product owner has moved this backlog item to "Build" status and wants a detailed implementation plan.

Item:
Title: ${item.title}
Epic: ${item.epic || 'General'}
Description: ${item.description || 'No description provided'}
Tags: ${(item.tags || []).join(', ') || 'none'}
Priority: P${item.priority}, Effort: ${item.effort}

${codebaseContext}

Produce a concrete implementation plan with:
1. **Summary** — one paragraph on the approach
2. **Files to change** — list each file with a one-line description of what changes
3. **New files** — any new files to create
4. **Database changes** — Prisma schema additions/migrations if needed
5. **Key code snippets** — the 2-3 most important code blocks (abbreviated, not full files)
6. **Risks & edge cases** — things to watch out for
7. **Test checklist** — 4-6 bullet points to verify it works

Be specific about file paths and function names. This plan should be detailed enough for a developer to pick up and implement without further clarification.`;

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const json = await resp.json();
    const plan = json.content?.[0]?.text || '';

    // Mark item as in_progress now that build has been triggered
    await prisma.backlogItem.update({
      where: { id: item.id },
      data: { status: 'in_progress' },
    });

    res.json({ plan, item });
  } catch (e) { next(e); }
});

// ── Helpers ────────────────────────────────────────────────────────────────────

async function groqChat(messages, { model = 'llama-3.3-70b-versatile', maxTokens = 2000, json = false } = {}) {
  const body = {
    model,
    messages,
    temperature: 0.3,
    max_tokens: maxTokens,
    ...(json ? { response_format: { type: 'json_object' } } : {}),
  };
  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Groq error ${resp.status}: ${err}`);
  }
  const data = await resp.json();
  return data.choices[0].message.content;
}

// Read relevant source files from the container for context
const fs = require('fs');
const path = require('path');

function readSourceFile(relPath) {
  const base = path.join(__dirname, '../../');
  const full = path.join(base, relPath);
  try { return fs.readFileSync(full, 'utf8').slice(0, 3000); } // cap at 3k chars per file
  catch { return null; }
}

function getRelevantFiles(item) {
  const tags = item.tags || [];
  const files = {};

  if (tags.includes('backend') || tags.includes('security') || tags.includes('infra')) {
    const routeFiles = ['src/routes/lead.routes.js', 'src/routes/org.routes.js', 'src/routes/auth.routes.js', 'src/routes/user.routes.js'];
    for (const f of routeFiles) {
      const content = readSourceFile(f);
      if (content) files[f] = content;
    }
    const schema = readSourceFile('prisma/schema.prisma');
    if (schema) files['prisma/schema.prisma'] = schema.slice(0, 2000);
  }

  if (tags.includes('frontend')) {
    const content = readSourceFile('../frontend/src/App.jsx') || readSourceFile('frontend/dist/index.html');
    if (content) files['frontend/src/App.jsx'] = content;
  }

  if (tags.includes('mobile')) {
    files['flutter_mobile/pubspec.yaml'] = '# Flutter mobile app — provider, http, record, flutter_secure_storage';
  }

  return files;
}

// Token estimates per effort size (output tokens for Groq)
const EFFORT_TOKENS = { XS: 600, S: 1000, M: 1800, L: 2500, XL: 3000 };

// Items that can safely run in parallel: different primary domain (frontend vs backend vs mobile)
function canParallelize(a, b) {
  const domain = item => {
    const t = item.tags || [];
    if (t.includes('mobile') && !t.includes('backend') && !t.includes('frontend')) return 'mobile';
    if (t.includes('frontend') && !t.includes('backend')) return 'frontend';
    if (t.includes('backend') && !t.includes('frontend')) return 'backend';
    return 'shared';
  };
  return domain(a) !== domain(b) && domain(a) !== 'shared' && domain(b) !== 'shared';
}

// Assign items into execution waves
function planWaves(items) {
  const waves = [];
  const assigned = new Set();

  for (let i = 0; i < items.length; i++) {
    if (assigned.has(i)) continue;
    const wave = [items[i]];
    assigned.add(i);

    // Only batch XS/S into parallel waves; M/L/XL always solo
    if (['XS', 'S'].includes(items[i].effort)) {
      for (let j = i + 1; j < items.length; j++) {
        if (assigned.has(j)) continue;
        if (!['XS', 'S'].includes(items[j].effort)) continue;
        if (wave.every(w => canParallelize(w, items[j]))) {
          wave.push(items[j]);
          assigned.add(j);
          if (wave.length >= 3) break; // cap parallel wave at 3
        }
      }
    }

    waves.push(wave);
  }
  return waves;
}

// ── Session registry for cancellation ────────────────────────────────────────
// Maps sessionId → { cancelled: bool, paused: bool, touchedIds: Set<string> }
const activeSessions = new Map();

// GET /api/dev/takeover — SSE stream of autonomous AI build session
router.get('/takeover', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const sessionId = `to_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const session = { cancelled: false, paused: false, touchedIds: new Set() };
  activeSessions.set(sessionId, session);

  const send = (event, data) => {
    try { res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); } catch {}
  };

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // Check abort state; sleep respects pause
  const checkAbort = async () => {
    while (session.paused && !session.cancelled) await sleep(500);
    return session.cancelled;
  };

  // Clean up on client disconnect
  req.on('close', () => { session.cancelled = true; });

  try {
    send('session', { sessionId });

    const rawItems = await prisma.backlogItem.findMany({
      where: { status: { in: ['backlog', 'ready'] }, priority: { lte: 1 } },
      orderBy: [{ priority: 'asc' }, { position: 'asc' }],
      take: 12,
    });

    if (rawItems.length === 0) {
      send('error', { message: 'No P0/P1 items in backlog or ready. Promote some items to P0/P1 first.' });
      res.end(); return;
    }

    send('start', { total: rawItems.length, items: rawItems.map(i => ({ id: i.id, title: i.title, priority: i.priority, effort: i.effort, epic: i.epic })) });

    if (await checkAbort()) { send('cancelled', { reason: 'Cancelled before planning' }); res.end(); return; }

    const planPrompt = `You are a senior engineering manager for SalesFlow CRM — a React/Express/Prisma/Flutter B2B SaaS.

These backlog items need to be built (ordered by priority):
${rawItems.map((i, idx) => `${idx+1}. [P${i.priority}] [${i.effort}] [${i.epic}] "${i.title}" tags:${(i.tags||[]).join(',')} — ${(i.description||'').slice(0,100)}`).join('\n')}

For each item, identify the primary domain (frontend|backend|mobile|shared) and whether it can safely run in parallel with items of a different domain.
Also estimate actual implementation complexity: simple|moderate|complex.

Return ONLY valid JSON:
{
  "analysis": [{ "id": "<id>", "domain": "frontend|backend|mobile|shared", "complexity": "simple|moderate|complex", "parallelSafe": true|false, "reason": "one line" }],
  "overallStrategy": "one sentence on approach"
}`;

    try {
      const planJson = await groqChat([{ role: 'user', content: planPrompt }], { json: true, maxTokens: 1000 });
      send('plan', JSON.parse(planJson));
    } catch (e) {
      send('log', { message: `Plan analysis failed, using heuristics: ${e.message}` });
    }

    const waves = planWaves(rawItems);
    send('waves', { count: waves.length, waves: waves.map((w, i) => ({ wave: i+1, parallel: w.length > 1, items: w.map(x => x.title) })) });

    let totalTokensUsed = 0;
    const TOKEN_BUDGET_PER_MIN = 5000;
    let waveStartTime = Date.now();

    for (let waveIdx = 0; waveIdx < waves.length; waveIdx++) {
      if (await checkAbort()) { send('cancelled', { reason: 'Cancelled between waves', completedWaves: waveIdx }); break; }

      const wave = waves[waveIdx];
      const isParallel = wave.length > 1;
      send('wave_start', { wave: waveIdx + 1, parallel: isParallel, items: wave.map(i => i.title) });

      const elapsed = (Date.now() - waveStartTime) / 1000;
      if (totalTokensUsed > TOKEN_BUDGET_PER_MIN * 0.7 && elapsed < 60) {
        const waitMs = Math.ceil((60 - elapsed) * 1000) + 2000;
        send('rate_limit', { waitSeconds: Math.ceil(waitMs / 1000), message: `Pacing Groq rate limits (${totalTokensUsed} tokens this minute)` });
        await sleep(waitMs);
        totalTokensUsed = 0;
        waveStartTime = Date.now();
      }

      const buildItem = async (item) => {
        if (session.cancelled) return;
        send('item_start', { id: item.id, title: item.title });
        session.touchedIds.add(item.id);

        const relevantFiles = getRelevantFiles(item);
        const fileContext = Object.entries(relevantFiles).map(([p, c]) => `// === ${p} ===\n${c}`).join('\n\n');
        const expectedTokens = EFFORT_TOKENS[item.effort] || 1500;
        const model = (isParallel && ['XS', 'S'].includes(item.effort)) ? 'llama-3.1-8b-instant' : 'llama-3.3-70b-versatile';

        const itemPrompt = `You are a senior full-stack engineer implementing a feature for SalesFlow CRM.

TASK: ${item.title}
Epic: ${item.epic || 'General'} | Priority: P${item.priority} | Effort: ${item.effort}
Description: ${item.description || 'No description provided'}
Tags: ${(item.tags || []).join(', ')}

RELEVANT EXISTING CODE:
${fileContext || '(No specific files — stack: React+Vite+Tailwind, Express+Prisma+Neon, Flutter)'}

STACK: React 18, Vite, Tailwind CSS, @tanstack/react-query | Express.js, Prisma, Neon Postgres | Flutter
Auth: JWT roles: agent/admin/superadmin/support

Provide a production-ready implementation with:
## Summary, ## Files to Create/Modify, ## Implementation (complete code per file in \`\`\` blocks), ## Migration (if needed), ## Verification (4-6 test steps)`;

        try {
          const code = await groqChat([{ role: 'user', content: itemPrompt }], { model, maxTokens: expectedTokens });
          totalTokensUsed += expectedTokens;
          await prisma.backlogItem.update({ where: { id: item.id }, data: { status: 'in_progress' } });
          send('item_done', { id: item.id, title: item.title, code, model, tokensEstimate: expectedTokens });
        } catch (e) {
          send('item_error', { id: item.id, title: item.title, error: e.message });
        }
      };

      if (isParallel) {
        await Promise.all(wave.map(buildItem));
      } else {
        await buildItem(wave[0]);
      }

      send('wave_done', { wave: waveIdx + 1 });
      if (waveIdx < waves.length - 1) await sleep(1500);
    }

    if (!session.cancelled) {
      send('complete', { totalItems: rawItems.length, totalWaves: waves.length, sessionId });
    }
  } catch (e) {
    send('error', { message: e.message });
  } finally {
    activeSessions.delete(sessionId);
    res.end();
  }
});

// POST /api/dev/takeover/:sessionId/pause — pause between waves
router.post('/takeover/:sessionId/pause', (req, res) => {
  const s = activeSessions.get(req.params.sessionId);
  if (!s) return res.status(404).json({ error: 'Session not found or already complete' });
  s.paused = true;
  res.json({ ok: true, paused: true });
});

// POST /api/dev/takeover/:sessionId/resume — resume from pause
router.post('/takeover/:sessionId/resume', (req, res) => {
  const s = activeSessions.get(req.params.sessionId);
  if (!s) return res.status(404).json({ error: 'Session not found or already complete' });
  s.paused = false;
  res.json({ ok: true, paused: false });
});

// DELETE /api/dev/takeover/:sessionId — cancel + optionally revert touched items
router.delete('/takeover/:sessionId', async (req, res, next) => {
  try {
    const s = activeSessions.get(req.params.sessionId);
    if (!s) return res.status(404).json({ error: 'Session not found or already complete' });

    s.cancelled = true;
    s.paused = false; // unblock any sleep so it exits cleanly

    const { revert } = req.query; // ?revert=true → move touched items back to ready
    let revertedIds = [];
    if (revert === 'true' && s.touchedIds.size > 0) {
      await prisma.backlogItem.updateMany({
        where: { id: { in: [...s.touchedIds] }, status: 'in_progress' },
        data: { status: 'ready' },
      });
      revertedIds = [...s.touchedIds];
    }

    res.json({ ok: true, cancelled: true, revertedIds });
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
