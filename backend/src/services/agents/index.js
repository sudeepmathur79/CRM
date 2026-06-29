const cron = require('node-cron');
const { runRoundRobin } = require('./roundRobin.service');
const { sendFollowUpReminders, sendDailyDigest } = require('./followup.service');
const { autoTagLeads } = require('./tagging.service');
const prisma = new (require('@prisma/client').PrismaClient)();

// Platform-level default in minutes (env override). Old AGENT_INTERVAL was ms; new is minutes.
const PLATFORM_DEFAULT_MINUTES = parseInt(process.env.AGENT_INTERVAL_MINUTES || '30', 10);

const startAgents = (io) => {
  const orgLastRun = new Map(); // orgId → last run timestamp (ms)

  // Tick every minute; each org fires only when its own interval has elapsed
  cron.schedule('* * * * *', async () => {
    try {
      const orgs = await prisma.organisation.findMany({
        select: { id: true, agentIntervalMinutes: true },
      });

      const now = Date.now();
      for (const org of orgs) {
        if (org.agentIntervalMinutes === 0) continue; // explicitly disabled for this org

        const intervalMs = (org.agentIntervalMinutes ?? PLATFORM_DEFAULT_MINUTES) * 60 * 1000;
        const last = orgLastRun.get(org.id) || 0;

        if (now - last >= intervalMs) {
          orgLastRun.set(org.id, now);
          console.log(`[Agents] org=${org.id} interval=${org.agentIntervalMinutes ?? PLATFORM_DEFAULT_MINUTES}min`);
          await runRoundRobin(io, org.id);
          await sendFollowUpReminders(org.id);
          await autoTagLeads(org.id);
        }
      }
    } catch (err) {
      console.error('[Agents] Scheduler error:', err.message);
    }
  });

  // Daily digest
  const digestHour = process.env.DIGEST_HOUR || 8;
  const digestMinute = process.env.DIGEST_MINUTE || 0;
  cron.schedule(`${digestMinute} ${digestHour} * * *`, async () => {
    console.log('[Agents] Sending daily digest...');
    await sendDailyDigest();
  });

  console.log(`[Agents] Started — per-org scheduling, platform default: ${PLATFORM_DEFAULT_MINUTES}min`);
};

module.exports = { startAgents, PLATFORM_DEFAULT_MINUTES };
