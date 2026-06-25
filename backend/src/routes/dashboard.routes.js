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

// Admin-only management view
router.get('/management', async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const staleThreshold = new Date(now); staleThreshold.setDate(staleThreshold.getDate() - 14);

    const [agents, unassigned, staleLeads] = await Promise.all([
      // All active agents
      prisma.user.findMany({
        where: { role: { not: 'admin' }, isActive: true },
        select: { id: true, name: true, email: true, role: true },
      }),
      // Unassigned active leads
      prisma.lead.findMany({
        where: { archived: false, assignedToId: null },
        select: { id: true, name: true, company: true, status: true, createdAt: true, value: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      // Leads with no activity in 14+ days (not closed)
      prisma.lead.findMany({
        where: {
          archived: false,
          status: { notIn: ['Closed Won', 'Closed Lost'] },
          activities: { none: { createdAt: { gte: staleThreshold } } },
        },
        select: { id: true, name: true, company: true, status: true, assignedTo: { select: { name: true } }, createdAt: true, value: true },
        orderBy: { createdAt: 'asc' },
        take: 20,
      }),
    ]);

    // Per-agent stats
    const agentStats = await Promise.all(agents.map(async (agent) => {
      const [total, won, overdue, newThisMonth] = await Promise.all([
        prisma.lead.count({ where: { assignedToId: agent.id, archived: false } }),
        prisma.lead.count({ where: { assignedToId: agent.id, status: 'Closed Won' } }),
        prisma.lead.count({ where: { assignedToId: agent.id, archived: false, nextFollowUp: { lt: today }, status: { notIn: ['Closed Won', 'Closed Lost'] } } }),
        prisma.lead.count({ where: { assignedToId: agent.id, createdAt: { gte: thirtyDaysAgo } } }),
      ]);
      const valueAgg = await prisma.lead.aggregate({ where: { assignedToId: agent.id, archived: false }, _sum: { value: true } });
      return {
        ...agent,
        total, won, overdue, newThisMonth,
        pipelineValue: valueAgg._sum.value || 0,
        conversionRate: total > 0 ? ((won / total) * 100).toFixed(1) : 0,
      };
    }));

    res.json({ agentStats, unassigned, staleLeads });
  } catch (e) { next(e); }
});

module.exports = router;
