const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const { disableDemoMode } = require('../services/demo.service');
const prisma = new (require('@prisma/client').PrismaClient)();

router.use(authenticate);

// Get current org info
router.get('/', async (req, res, next) => {
  try {
    if (!req.orgId) return res.json(null);
    const org = await prisma.organisation.findUnique({
      where: { id: req.orgId },
      select: { id: true, name: true, plan: true, trialEndsAt: true, demoMode: true, demoDisabledAt: true, createdAt: true },
    });
    res.json(org);
  } catch (e) { next(e); }
});

// Disable demo mode — admin only, one-way
router.post('/demo/disable', requireRole('admin'), async (req, res, next) => {
  try {
    if (!req.orgId) return res.status(400).json({ error: 'No organisation found' });
    const org = await disableDemoMode(req.orgId);
    res.json({ ok: true, demoMode: org.demoMode });
  } catch (e) { next(e); }
});

module.exports = router;
