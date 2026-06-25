const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const { getLeads, getLead, createLead, updateLead, deleteLead, bulkAction } = require('../services/lead.service');
const prisma = new (require('@prisma/client').PrismaClient)();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try { res.json(await getLeads(req.user, req.query)); } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const lead = await createLead(req.body, req.user.id);
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

router.post('/:id/notes', async (req, res, next) => {
  try {
    const { notes } = req.body;
    const lead = await updateLead(req.params.id, { notes }, req.user.id, req.user);
    res.json(lead);
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

module.exports = router;
