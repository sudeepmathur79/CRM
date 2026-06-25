const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth.middleware');
const prisma = new PrismaClient();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const where = req.user.role === 'agent' ? { lead: { assignedToId: req.user.id } } : {};
    const activities = await prisma.activity.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
        lead: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json(activities);
  } catch (e) { next(e); }
});

module.exports = router;
