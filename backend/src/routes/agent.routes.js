const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const { runAgent } = require('../services/agent.service');
const prisma = new (require('@prisma/client').PrismaClient)();

router.use(authenticate);

// List all agents for the org — seed defaults if the org has none yet
router.get('/', async (req, res, next) => {
  try {
    if (!req.orgId) return res.status(400).json({ error: 'No organisation linked to this account. Please re-sign up.' });

    const count = await prisma.agentConfig.count({ where: { orgId: req.orgId } });
    if (count === 0) {
      // Org was created before agent seeding was added — seed now
      const { seedDefaultAgentsForOrg } = require('../services/auth.service');
      await seedDefaultAgentsForOrg(req.orgId);
    }

    const agents = await prisma.agentConfig.findMany({
      where: { orgId: req.orgId },
      include: {
        _count: { select: { runs: true } },
        runs: { orderBy: { createdAt: 'desc' }, take: 1, select: { status: true, createdAt: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json(agents);
  } catch (e) { next(e); }
});

// Get a single agent + its recent runs
router.get('/:id', async (req, res, next) => {
  try {
    const agent = await prisma.agentConfig.findFirst({
      where: { id: req.params.id, orgId: req.orgId },
      include: {
        runs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { lead: { select: { id: true, name: true, company: true } } },
        },
      },
    });
    if (!agent) return res.status(404).json({ error: 'Not found' });
    res.json(agent);
  } catch (e) { next(e); }
});

// Create a custom agent (admin only)
router.post('/', requireRole('admin'), async (req, res, next) => {
  try {
    const { name, description, type, trigger, promptTemplate, scope, config } = req.body;
    const agent = await prisma.agentConfig.create({
      data: { name, description, type, trigger, promptTemplate, scope, config, orgId: req.orgId, createdById: req.user.id },
    });
    res.status(201).json(agent);
  } catch (e) { next(e); }
});

// Update agent (admin: any field; agent: only enabled toggle on personal agents)
router.put('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.agentConfig.findFirst({ where: { id: req.params.id, orgId: req.orgId } });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const isAdmin = req.user.role === 'admin';
    const { name, description, type, trigger, promptTemplate, scope, config, enabled } = req.body;

    const data = isAdmin
      ? { name, description, type, trigger, promptTemplate, scope, config, enabled }
      : { enabled }; // agents can only toggle on/off

    const agent = await prisma.agentConfig.update({ where: { id: req.params.id }, data });
    res.json(agent);
  } catch (e) { next(e); }
});

// Delete (admin only)
router.delete('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    await prisma.agentConfig.deleteMany({ where: { id: req.params.id, orgId: req.orgId } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// Manually run an agent against a lead
router.post('/:id/run', async (req, res, next) => {
  try {
    const agent = await prisma.agentConfig.findFirst({ where: { id: req.params.id, orgId: req.orgId } });
    if (!agent) return res.status(404).json({ error: 'Not found' });
    const { leadId } = req.body;
    const result = await runAgent(agent.id, leadId);
    res.json(result);
  } catch (e) { next(e); }
});

// Get recent runs for an agent
router.get('/:id/runs', async (req, res, next) => {
  try {
    const runs = await prisma.agentRun.findMany({
      where: { agentConfigId: req.params.id, orgId: req.orgId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { lead: { select: { id: true, name: true, company: true } } },
    });
    res.json(runs);
  } catch (e) { next(e); }
});

module.exports = router;
