const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth.middleware');
const prisma = new PrismaClient();

router.use(authenticate);

router.get('/stats', async (req, res, next) => {
  try {
    const where = req.user.role === 'agent' ? { assignedToId: req.user.id } : {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [total, byStatus, followUpsToday, newToday, overdue] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.groupBy({ by: ['status'], where, _count: { id: true } }),
      prisma.lead.count({ where: { ...where, nextFollowUp: { gte: today, lt: tomorrow } } }),
      prisma.lead.count({ where: { ...where, createdAt: { gte: today } } }),
      prisma.lead.count({ where: { ...where, nextFollowUp: { lt: today }, status: { notIn: ['Closed Won', 'Closed Lost'] } } }),
    ]);

    const statusMap = {};
    byStatus.forEach(s => { statusMap[s.status] = s._count.id; });

    const closedWon = statusMap['Closed Won'] || 0;
    const conversionRate = total > 0 ? ((closedWon / total) * 100).toFixed(1) : 0;

    res.json({ total, byStatus: statusMap, followUpsToday, newToday, overdue, conversionRate: Number(conversionRate) });
  } catch (e) { next(e); }
});

router.get('/charts', async (req, res, next) => {
  try {
    const where = req.user.role === 'agent' ? { assignedToId: req.user.id } : {};
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentLeads = await prisma.lead.findMany({
      where: { ...where, createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, status: true },
      orderBy: { createdAt: 'asc' }
    });

    // Group by day
    const byDay = {};
    recentLeads.forEach(l => {
      const day = l.createdAt.toISOString().split('T')[0];
      byDay[day] = (byDay[day] || 0) + 1;
    });

    const leadsOverTime = Object.entries(byDay).map(([date, count]) => ({ date, count }));

    // Pipeline funnel
    const statuses = ['New', 'Contacted', 'Qualified', 'Proposal', 'Closed Won', 'Closed Lost'];
    const pipeline = await Promise.all(statuses.map(async status => ({
      status,
      count: await prisma.lead.count({ where: { ...where, status } })
    })));

    res.json({ leadsOverTime, pipeline });
  } catch (e) { next(e); }
});

module.exports = router;
