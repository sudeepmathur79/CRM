const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const { getLeads, getLead, createLead, updateLead, deleteLead, bulkAction } = require('../services/lead.service');
const { scoreLead } = require('../services/ai.service');
const { triggerAgents } = require('../services/agent.service');
const prisma = new (require('@prisma/client').PrismaClient)();

router.use(authenticate);

// Superadmin and support roles have no access to leads — they operate across orgs
router.use((req, res, next) => {
  if (['superadmin', 'support'].includes(req.user?.role)) {
    return res.status(403).json({ error: 'Superadmin accounts cannot access leads.' });
  }
  next();
});

router.get('/', async (req, res, next) => {
  try { res.json(await getLeads(req.user, req.query, req.orgId)); } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const lead = await createLead({ ...req.body, orgId: req.orgId }, req.user.id, req.user.role);
    // Trigger on_lead_created agents
    triggerAgents('on_lead_created', lead, req.orgId, req.app.get('io'));
    req.app.get('io')?.emit('lead:created', lead);
    res.status(201).json(lead);
  } catch (e) { next(e); }
});

// Admin-only: archive all active leads as demo data
router.post('/admin/archive-demo', requireRole('admin'), async (req, res, next) => {
  try {
    const { count } = await prisma.lead.updateMany({
      where: { archived: false },
      data: { archived: true, archiveLabel: 'Demo Data', archivedAt: new Date() },
    });
    const seedEmails = ['alice@crm.com','bob@crm.com','carol@crm.com','dave@crm.com','eve@crm.com','frank@crm.com','grace@crm.com','henry@crm.com','viewer@crm.com'];
    const { count: usersDeactivated } = await prisma.user.updateMany({
      where: { email: { in: seedEmails } },
      data: { isActive: false },
    });
    res.json({ archivedLeads: count, deactivatedUsers: usersDeactivated });
  } catch (e) { next(e); }
});

router.post('/bulk', requireRole('admin'), async (req, res, next) => {
  try {
    const { ids, action, data } = req.body;
    res.json(await bulkAction(ids, action, data, req.user.id, req.user));
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try { res.json(await getLead(req.params.id, req.user)); } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const lead = await updateLead(req.params.id, req.body, req.user.id, req.user);
    req.app.get('io')?.emit('lead:updated', lead);
    res.json(lead);
  } catch (e) { next(e); }
});

router.delete('/:id', requireRole('admin', 'agent'), async (req, res, next) => {
  try {
    await deleteLead(req.params.id, req.user.id, req.user);
    req.app.get('io')?.emit('lead:deleted', { id: req.params.id });
    res.json({ success: true });
  } catch (e) { next(e); }
});

// Lead notes timeline
router.get('/:id/notes', async (req, res, next) => {
  try {
    const notes = await prisma.leadNote.findMany({
      where: { leadId: req.params.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(notes);
  } catch (e) { next(e); }
});

router.post('/:id/notes', async (req, res, next) => {
  try {
    const { content, type = 'manual' } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Note content required' });
    const note = await prisma.leadNote.create({
      data: { leadId: req.params.id, userId: req.user.id, content: content.trim(), type },
    });
    await prisma.activity.create({
      data: { leadId: req.params.id, userId: req.user.id, action: 'note_added', details: { preview: content.trim().slice(0, 80) } },
    });
    // Notify @mentioned users
    const io = req.app.get('io');
    if (io) {
      const mentions = content.match(/@([^@\n]+)/g) || [];
      if (mentions.length) {
        const names = mentions.map(m => m.slice(1).trim());
        const lead = await prisma.lead.findUnique({ where: { id: req.params.id }, select: { id: true, name: true } });
        const mentioned = await prisma.user.findMany({
          where: { name: { in: names }, id: { not: req.user.id } },
          select: { id: true },
        });
        for (const u of mentioned) {
          io.to(`user:${u.id}`).emit('mention:new', { note, lead, from: { id: req.user.id, name: req.user.name } });
        }
      }
    }
    res.status(201).json(note);
  } catch (e) { next(e); }
});

router.delete('/:id/notes/:noteId', async (req, res, next) => {
  try {
    await prisma.leadNote.delete({ where: { id: req.params.noteId, leadId: req.params.id } });
    res.json({ success: true });
  } catch (e) { next(e); }
});

router.get('/:id/activities', async (req, res, next) => {
  try {
    const activities = await prisma.activity.findMany({
      where: { leadId: req.params.id },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json(activities);
  } catch (e) { next(e); }
});

router.post('/:id/score', async (req, res, next) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: req.params.id },
      include: {
        leadNotes: true,
        recordings: { select: { summary: true, transcript: true } },
        activities: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true } },
      },
    });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    lead.lastActivityAt = lead.activities[0]?.createdAt || null;
    const result = await scoreLead(lead);
    if (!result) return res.status(400).json({ error: 'AI provider not configured' });

    const updated = await prisma.lead.update({
      where: { id: req.params.id },
      data: { aiScore: result.score, aiScoreReason: result.reason, aiNextAction: result.nextAction, aiScoredAt: new Date() },
    });
    res.json({ score: updated.aiScore, reason: updated.aiScoreReason, nextAction: updated.aiNextAction, aiScoredAt: updated.aiScoredAt });
  } catch (e) { next(e); }
});

module.exports = router;
