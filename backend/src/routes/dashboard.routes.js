const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth.middleware');
const prisma = new PrismaClient();

router.use(authenticate);

router.get('/stats', async (req, res, next) => {
  try {
    const where = { archived: false, ...(req.user.role === 'agent' ? { assignedToId: req.user.id } : {}) };
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    const [total, byStatus, followUpsToday, newToday, overdue, valueAgg] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.groupBy({ by: ['status'], where, _count: { id: true }, _sum: { value: true } }),
      prisma.lead.count({ where: { ...where, nextFollowUp: { gte: today, lt: tomorrow } } }),
      prisma.lead.count({ where: { ...where, createdAt: { gte: today } } }),
      prisma.lead.count({ where: { ...where, nextFollowUp: { lt: today }, status: { notIn: ['Closed Won', 'Closed Lost'] } } }),
      prisma.lead.aggregate({ where, _sum: { value: true } }),
    ]);

    const statusMap = {};
    const valueByStatus = {};
    byStatus.forEach(s => {
      statusMap[s.status] = s._count.id;
      if (s._sum.value) valueByStatus[s.status] = s._sum.value;
    });

    const closedWon = statusMap['Closed Won'] || 0;
    const conversionRate = total > 0 ? ((closedWon / total) * 100).toFixed(1) : 0;
    const totalPipelineValue = valueAgg._sum.value || 0;
    const wonValue = valueByStatus['Closed Won'] || 0;

    res.json({
      total, byStatus: statusMap, followUpsToday, newToday, overdue,
      conversionRate: Number(conversionRate),
      totalPipelineValue, wonValue, valueByStatus,
    });
  } catch (e) { next(e); }
});

router.get('/charts', async (req, res, next) => {
  try {
    const where = { archived: false, ...(req.user.role === 'agent' ? { assignedToId: req.user.id } : {}) };
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentLeads = await prisma.lead.findMany({
      where: { ...where, createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, status: true },
      orderBy: { createdAt: 'asc' }
    });

    const byDay = {};
    recentLeads.forEach(l => {
      const day = l.createdAt.toISOString().split('T')[0];
      byDay[day] = (byDay[day] || 0) + 1;
    });

    const leadsOverTime = Object.entries(byDay).map(([date, count]) => ({ date, count }));

    const statuses = ['New', 'Contacted', 'Qualified', 'Proposal', 'Closed Won', 'Closed Lost'];
    const pipeline = await Promise.all(statuses.map(async status => {
      const agg = await prisma.lead.aggregate({
        where: { ...where, status },
        _count: { id: true },
        _sum: { value: true },
      });
      return { status, count: agg._count.id, value: agg._sum.value || 0 };
    }));

    res.json({ leadsOverTime, pipeline });
  } catch (e) { next(e); }
});

module.exports = router;
