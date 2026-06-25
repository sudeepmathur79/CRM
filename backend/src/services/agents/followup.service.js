const nodemailer = require('nodemailer');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getTransporter = () => nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

const sendFollowUpReminders = async () => {
  if (!process.env.SMTP_USER) return;
  try {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const end = new Date(start); end.setDate(end.getDate() + 1);

    const leads = await prisma.lead.findMany({
      where: { nextFollowUp: { gte: start, lt: end }, status: { notIn: ['Closed Won', 'Closed Lost'] } },
      include: { assignedTo: true }
    });

    const transporter = getTransporter();
    for (const lead of leads) {
      if (!lead.assignedTo?.email) continue;
      await transporter.sendMail({
        from: process.env.FROM_EMAIL || process.env.SMTP_USER,
        to: lead.assignedTo.email,
        subject: `Follow-up reminder: ${lead.name}`,
        html: `<h2>Follow-up Reminder</h2><p>You have a follow-up scheduled today for <strong>${lead.name}</strong>${lead.company ? ` (${lead.company})` : ''}.</p><p>Status: ${lead.status}</p>${lead.notes ? `<p>Notes: ${lead.notes}</p>` : ''}`
      });
    }
    if (leads.length) console.log(`[Agent] Sent ${leads.length} follow-up reminders`);
  } catch (e) {
    console.error('[Agent] Follow-up error:', e.message);
  }
};

const sendDailyDigest = async () => {
  if (!process.env.SMTP_USER) return;
  try {
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const end = new Date(start); end.setDate(end.getDate() + 1);

    const [newLeads, followUpsToday, overdueLeads] = await Promise.all([
      prisma.lead.findMany({ where: { createdAt: { gte: yesterday } }, include: { assignedTo: { select: { name: true } } } }),
      prisma.lead.findMany({ where: { nextFollowUp: { gte: start, lt: end }, status: { notIn: ['Closed Won', 'Closed Lost'] } } }),
      prisma.lead.findMany({ where: { nextFollowUp: { lt: start }, status: { notIn: ['Closed Won', 'Closed Lost'] } } })
    ]);

    const admins = await prisma.user.findMany({ where: { role: 'admin', isActive: true } });
    if (!admins.length) return;

    const transporter = getTransporter();
    const html = `
      <h2>Daily CRM Digest - ${today.toDateString()}</h2>
      <h3>New Leads (last 24h): ${newLeads.length}</h3>
      ${newLeads.map(l => `<li>${l.name}${l.assignedTo ? ` → ${l.assignedTo.name}` : ''}</li>`).join('')}
      <h3>Follow-ups Today: ${followUpsToday.length}</h3>
      ${followUpsToday.map(l => `<li>${l.name} (${l.status})</li>`).join('')}
      <h3>Overdue Follow-ups: ${overdueLeads.length}</h3>
      ${overdueLeads.slice(0, 10).map(l => `<li>${l.name}</li>`).join('')}
    `;

    for (const admin of admins) {
      await transporter.sendMail({
        from: process.env.FROM_EMAIL || process.env.SMTP_USER,
        to: admin.email,
        subject: `CRM Daily Digest - ${today.toDateString()}`,
        html
      });
    }
    console.log('[Agent] Daily digest sent');
  } catch (e) {
    console.error('[Agent] Digest error:', e.message);
  }
};

module.exports = { sendFollowUpReminders, sendDailyDigest };
