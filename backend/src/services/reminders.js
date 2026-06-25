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
}

module.exports = { startReminderScheduler };
