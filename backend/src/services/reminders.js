const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Runs every 15 minutes.
 * Finds leads whose nextFollowUp is within the next 60 minutes and haven't
 * had a reminder sent today. Emits a socket event to the assigned agent.
 */
function startReminderScheduler(io) {
  cron.schedule('*/15 * * * *', async () => {
    try {
      const now = new Date();
      const horizon = new Date(now.getTime() + 60 * 60 * 1000); // +1 hour
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const dueleads = await prisma.lead.findMany({
        where: {
          archived: false,
          status: { notIn: ['Closed Won', 'Closed Lost'] },
          nextFollowUp: { gte: now, lte: horizon },
          assignedToId: { not: null },
          OR: [
            { reminderSentAt: null },
            { reminderSentAt: { lt: startOfToday } },
          ],
        },
        include: {
          assignedTo: { select: { id: true, name: true } },
        },
      });

      for (const lead of dueleads) {
        const minutesUntil = Math.round((new Date(lead.nextFollowUp) - now) / 60000);

        // Emit to the assigned agent's socket room
        io.to(lead.assignedToId).emit('followup:due', {
          leadId: lead.id,
          leadName: lead.name,
          company: lead.company,
          minutesUntil,
          nextFollowUp: lead.nextFollowUp,
        });

        // Mark reminder sent
        await prisma.lead.update({
          where: { id: lead.id },
          data: { reminderSentAt: now },
        });

        console.log(`📅 Reminder sent: "${lead.name}" due in ${minutesUntil}min → ${lead.assignedTo.name}`);
      }
    } catch (e) {
      console.error('Reminder scheduler error:', e.message);
    }
  });

  console.log('📅 Follow-up reminder scheduler started (runs every 15 min)');

  // Runs once a day at 9am — remind agents about unresolved voice drafts,
  // and escalate to admins any draft older than 24h
  cron.schedule('0 9 * * *', async () => {
    try {
      const now = new Date();
      const cutoff24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Find all agents who have unresolved drafts
      const agentsWithDrafts = await prisma.voiceDraft.groupBy({
        by: ['userId'],
        where: { resolved: false },
        _count: { id: true },
        _min: { createdAt: true },
      });

      const admins = await prisma.user.findMany({
        where: { role: 'admin', isActive: true },
        select: { id: true },
      });

      for (const row of agentsWithDrafts) {
        const count = row._count.id;
        const oldestAt = row._min.createdAt;
        const isOverdue = oldestAt < cutoff24h;

        // Remind the agent
        io.to(row.userId).emit('voicedraft:reminder', { count, escalated: false });
        console.log(`🎙 Voice draft reminder → agent ${row.userId} (${count} unresolved)`);

        // Escalate to all admins if oldest draft > 24h
        if (isOverdue) {
          const agent = await prisma.user.findUnique({ where: { id: row.userId }, select: { name: true } });
          for (const admin of admins) {
            io.to(admin.id).emit('voicedraft:reminder', {
              count,
              escalated: true,
              agentName: agent?.name || 'An agent',
            });
          }
          console.log(`🚨 Voice draft escalated: ${agent?.name} has ${count} drafts older than 24h`);
        }
      }
    } catch (e) {
      console.error('Voice draft reminder error:', e.message);
    }
  });

  console.log('🎙 Voice draft reminder scheduler started (runs daily at 9am)');
}

module.exports = { startReminderScheduler };
