const cron = require('node-cron');
const { runRoundRobin } = require('./roundRobin.service');
const { sendFollowUpReminders, sendDailyDigest } = require('./followup.service');
const { autoTagLeads } = require('./tagging.service');

const startAgents = (io) => {
  const interval = process.env.AGENT_INTERVAL || 300000;
  const intervalMinutes = Math.max(1, Math.floor(interval / 60000));

  // Every N minutes: round-robin + follow-ups + tagging
  cron.schedule(`*/${intervalMinutes} * * * *`, async () => {
    console.log('[Agents] Running scheduled tasks...');
    await runRoundRobin(io);
    await sendFollowUpReminders();
    await autoTagLeads();
  });

  // Daily digest at configured hour
  const digestHour = process.env.DIGEST_HOUR || 8;
  const digestMinute = process.env.DIGEST_MINUTE || 0;
  cron.schedule(`${digestMinute} ${digestHour} * * *`, async () => {
    console.log('[Agents] Sending daily digest...');
    await sendDailyDigest();
  });

  console.log(`[Agents] Started - running every ${intervalMinutes} minute(s), digest at ${digestHour}:${String(digestMinute).padStart(2,'0')}`);
};

module.exports = { startAgents };
