const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEMO_LEADS = [
  {
    name: 'Sarah Mitchell',
    company: 'Apex Retail Group',
    email: 'sarah.m@apexretail.com',
    phone: '+44 7700 900123',
    status: 'Proposal Sent',
    source: 'LinkedIn',
    value: 28000,
    notes: 'Looking to replace their current POS system. Decision by end of Q3. Sarah is the procurement lead, needs sign-off from CFO.',
    aiScore: 8,
    aiScoreReason: 'High value deal with clear timeline and budget. Decision maker engaged.',
    aiNextAction: 'Send ROI calculator and schedule CFO call.',
    nextFollowUp: new Date(Date.now() + 2 * 86400000),
    activities: [
      { action: 'Lead created', details: { note: 'Inbound from LinkedIn campaign' }, daysAgo: 14 },
      { action: 'Call logged', details: { note: 'Discovery call — 45 min. Strong interest.' }, daysAgo: 10 },
      { action: 'Proposal sent', details: { note: 'Sent £28k proposal for enterprise package' }, daysAgo: 5 },
    ],
    notes_list: [
      'Discovery call: Sarah confirmed budget approved up to £30k. Main pain point is inventory sync delays.',
      'Proposal sent. She requested a breakdown by department — preparing now.',
    ],
  },
  {
    name: 'James Okafor',
    company: 'Brightline Logistics',
    email: 'j.okafor@brightline.co',
    phone: '+44 7911 123456',
    status: 'Negotiation',
    source: 'Referral',
    value: 45000,
    notes: 'Referred by Tom (Apex deal). Fleet management software. 3 competing bids. Price is a sticking point.',
    aiScore: 7,
    aiScoreReason: 'Large deal but competitive. Referral source is warm. Needs price flexibility.',
    aiNextAction: 'Offer 10% Year 1 discount to close before month end.',
    nextFollowUp: new Date(Date.now() + 1 * 86400000),
    activities: [
      { action: 'Lead created', details: { note: 'Referred by Sarah Mitchell — Apex' }, daysAgo: 21 },
      { action: 'Demo completed', details: { note: 'Full product demo — 3 stakeholders attended' }, daysAgo: 12 },
      { action: 'Negotiation started', details: { note: 'Requested 15% discount — countered with 10%' }, daysAgo: 3 },
    ],
    notes_list: [
      'They have 3 competing bids. Ours is mid-range on price but strongest on support SLA.',
      'James personally prefers us — CFO is the blocker on budget.',
    ],
  },
  {
    name: 'Priya Sharma',
    company: 'NovaMed Healthcare',
    email: 'p.sharma@novamed.org',
    phone: '+44 7800 654321',
    status: 'Qualified',
    source: 'Website',
    value: 18500,
    notes: 'NHS-adjacent private clinic. GDPR compliance is critical. Procurement process is slow.',
    aiScore: 6,
    aiScoreReason: 'Good fit but long sales cycle typical in healthcare. Budget confirmed.',
    aiNextAction: 'Share GDPR compliance documentation and ISO certification.',
    nextFollowUp: new Date(Date.now() + 7 * 86400000),
    activities: [
      { action: 'Lead created', details: { note: 'Form submission — pricing page' }, daysAgo: 9 },
      { action: 'Qualification call', details: { note: 'BANT confirmed. Long buying cycle expected.' }, daysAgo: 5 },
    ],
    notes_list: [
      'Qualification call done. Budget is there (£18-20k). They need compliance docs before moving forward.',
    ],
  },
  {
    name: 'Daniel Crews',
    company: 'Staffmark Recruitment',
    email: 'daniel@staffmark.co.uk',
    phone: '+44 7722 345678',
    status: 'New',
    source: 'Cold Outreach',
    value: 9500,
    notes: 'Reached out after webinar. Early stage — needs education on product.',
    aiScore: 4,
    aiScoreReason: 'Early stage, low engagement so far. Potential but needs nurturing.',
    aiNextAction: 'Send case study relevant to recruitment industry.',
    nextFollowUp: new Date(Date.now() + 3 * 86400000),
    activities: [
      { action: 'Lead created', details: { note: 'Signed up for webinar, left contact details' }, daysAgo: 3 },
    ],
    notes_list: [],
  },
  {
    name: 'Emma Lindqvist',
    company: 'Nordic Imports Ltd',
    email: 'emma.l@nordicimports.com',
    phone: '+44 7733 987654',
    status: 'Closed Won',
    source: 'Trade Show',
    value: 22000,
    notes: 'Closed at Nordic Trade Expo. Annual contract signed. Onboarding begins next week.',
    aiScore: 10,
    aiScoreReason: 'Deal closed. Focus on onboarding and upsell in 6 months.',
    aiNextAction: 'Schedule onboarding call with implementation team.',
    nextFollowUp: null,
    activities: [
      { action: 'Lead created', details: { note: 'Met at Nordic Trade Expo stand' }, daysAgo: 30 },
      { action: 'Demo completed', details: { note: 'Loved the reporting features' }, daysAgo: 22 },
      { action: 'Proposal sent', details: { note: '£22k annual contract sent' }, daysAgo: 18 },
      { action: 'Deal closed', details: { note: 'Contract signed — annual plan' }, daysAgo: 5 },
    ],
    notes_list: [
      'Emma was the easiest close this quarter. She had budget and authority from day one.',
      'Contract signed. Annual licence £22k. Onboarding scheduled for next Monday.',
    ],
  },
  {
    name: 'Marcus Webb',
    company: 'Webb & Associates Law',
    email: 'm.webb@webblaw.co.uk',
    phone: '+44 7744 112233',
    status: 'Closed Lost',
    source: 'Website',
    value: 12000,
    notes: 'Lost to competitor on price. They went with a cheaper SaaS option. Left door open for next year.',
    aiScore: 2,
    aiScoreReason: 'Lost deal — track for re-engagement in 6-9 months.',
    aiNextAction: 'Set a 6-month re-engagement reminder.',
    nextFollowUp: null,
    activities: [
      { action: 'Lead created', details: { note: 'Inbound — contact form' }, daysAgo: 45 },
      { action: 'Demo completed', details: { note: '1hr demo, seemed interested' }, daysAgo: 38 },
      { action: 'Deal lost', details: { note: 'Chose competitor — price was deciding factor' }, daysAgo: 20 },
    ],
    notes_list: [
      'Lost on price — competitor quoted £8k for similar feature set. Worth re-approaching when their contract expires (12 months).',
    ],
  },
  {
    name: 'Aisha Patel',
    company: 'GreenSpark Energy',
    email: 'aisha@greenspark.energy',
    phone: '+44 7755 223344',
    status: 'Contacted',
    source: 'LinkedIn',
    value: 31000,
    notes: 'Fast-growing startup. Series A funded. Moving fast. Need to strike before they commit to competitors.',
    aiScore: 7,
    aiScoreReason: 'Well-funded and growing fast. Urgency is high. Strong ICP match.',
    aiNextAction: 'Book a demo this week — urgency is high.',
    nextFollowUp: new Date(Date.now() + 1 * 86400000),
    activities: [
      { action: 'Lead created', details: { note: 'Connected on LinkedIn — she commented on our post' }, daysAgo: 5 },
      { action: 'Message sent', details: { note: 'LinkedIn message with intro and calendar link' }, daysAgo: 4 },
    ],
    notes_list: [
      'Series A — £4M raised in March. Growing team fast, currently using spreadsheets. Perfect timing.',
    ],
  },
  {
    name: 'Tom Harrington',
    company: 'Harrington Property Group',
    email: 'tom@harringtonpg.com',
    phone: '+44 7766 334455',
    status: 'Qualified',
    source: 'Referral',
    value: 15000,
    notes: 'Manages 300+ properties. Needs CRM specifically for tenant and contractor tracking. Referred by Emma.',
    aiScore: 5,
    aiScoreReason: 'Good fit, referral source is warm, but use case is niche — needs customisation conversation.',
    aiNextAction: 'Prepare a property management workflow demo.',
    nextFollowUp: new Date(Date.now() + 5 * 86400000),
    activities: [
      { action: 'Lead created', details: { note: 'Referred by Emma Lindqvist (Nordic Imports)' }, daysAgo: 7 },
      { action: 'Intro call', details: { note: '30 min call. Confirmed he manages 300+ properties.' }, daysAgo: 4 },
    ],
    notes_list: [
      'Tom needs a demo tailored to property — showing contractor assignments and tenant communication tracking.',
    ],
  },
];

async function seedDemoData(tx, orgId, adminUserId) {
  for (const lead of DEMO_LEADS) {
    const { activities, notes_list, ...leadData } = lead;

    const created = await tx.lead.create({
      data: {
        ...leadData,
        orgId,
        createdById: adminUserId,
        isDemo: true,
        aiScoredAt: leadData.aiScore ? new Date() : null,
      },
    });

    // Seed activities
    for (const act of activities) {
      await tx.activity.create({
        data: {
          leadId: created.id,
          userId: adminUserId,
          action: act.action,
          details: act.details,
          createdAt: new Date(Date.now() - act.daysAgo * 86400000),
        },
      });
    }

    // Seed notes
    for (const content of notes_list) {
      await tx.leadNote.create({
        data: { leadId: created.id, userId: adminUserId, content, type: 'manual' },
      });
    }
  }
}

async function disableDemoMode(orgId) {
  const org = await prisma.organisation.findUnique({ where: { id: orgId } });
  if (!org) throw Object.assign(new Error('Organisation not found'), { status: 404 });
  if (!org.demoMode) throw Object.assign(new Error('Demo mode is already disabled'), { status: 400 });

  // Archive all demo leads
  await prisma.lead.updateMany({
    where: { orgId, isDemo: true },
    data: { archived: true, archiveLabel: 'Demo Data', archivedAt: new Date() },
  });

  // Disable demo mode permanently
  const updated = await prisma.organisation.update({
    where: { id: orgId },
    data: { demoMode: false, demoDisabledAt: new Date() },
  });

  return updated;
}

module.exports = { seedDemoData, disableDemoMode };
