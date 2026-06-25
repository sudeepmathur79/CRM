const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  // On the demo branch: auto-seed if DB is empty (first deploy), OR if SEED=true is explicitly set
  const leadCount = await prisma.lead.count();
  if (process.env.SEED !== 'true' && leadCount > 0) {
    console.log(`Seed skipped — ${leadCount} leads already exist. Set SEED=true to force reseed.`);
    return;
  }
  if (leadCount > 0 && process.env.SEED === 'true') {
    console.log('Force reseed: clearing existing data...');
    await prisma.$executeRawUnsafe(`TRUNCATE "Message", "LeadNote", "Activity", "Recording", "_LeadToTag", "Lead", "Tag", "User" CASCADE`);
  }

  console.log('🌱 Seeding demo data...');
  const pw = await bcrypt.hash('demo1234', 12);

  // ── Users ─────────────────────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: { email: 'admin@demo.com', password: pw, name: 'Sarah Chen', role: 'admin' }
  });
  const viewer = await prisma.user.create({
    data: { email: 'viewer@demo.com', password: pw, name: 'Mark Thompson', role: 'viewer' }
  });
  const [james, priya, david, lisa] = await Promise.all([
    prisma.user.create({ data: { email: 'james@demo.com', password: pw, name: 'James Miller', role: 'agent' } }),
    prisma.user.create({ data: { email: 'priya@demo.com', password: pw, name: 'Priya Patel', role: 'agent' } }),
    prisma.user.create({ data: { email: 'david@demo.com', password: pw, name: 'David Kim', role: 'agent' } }),
    prisma.user.create({ data: { email: 'lisa@demo.com', password: pw, name: 'Lisa Okafor', role: 'agent', isActive: false } }),
  ]);

  // ── Tags ──────────────────────────────────────────────────────────────
  const [tagHot, tagEnterprise, tagSMB, tagReferral, tagUrgent, tagQ2] = await Promise.all([
    prisma.tag.create({ data: { name: 'Hot Lead', color: '#ef4444' } }),
    prisma.tag.create({ data: { name: 'Enterprise', color: '#8b5cf6' } }),
    prisma.tag.create({ data: { name: 'SMB', color: '#06b6d4' } }),
    prisma.tag.create({ data: { name: 'Referral', color: '#10b981' } }),
    prisma.tag.create({ data: { name: 'Urgent', color: '#f59e0b' } }),
    prisma.tag.create({ data: { name: 'Q2 Target', color: '#6366f1' } }),
  ]);

  const ago = (d) => { const x = new Date(); x.setDate(x.getDate() - d); return x; };
  const future = (d) => { const x = new Date(); x.setDate(x.getDate() + d); return x; };

  // ── Leads ─────────────────────────────────────────────────────────────
  const leadsData = [
    // James's leads — strong performer
    {
      name: 'Michael Torres', company: 'NovaTech Solutions', email: 'mtorres@novatech.io', phone: '+14155550101',
      status: 'Proposal', source: 'LinkedIn', value: 85000, assignedTo: james, createdBy: james,
      tags: [tagHot, tagEnterprise], createdAt: ago(18), nextFollowUp: future(2),
      notes: 'Evaluating us against Salesforce. Budget confirmed at $85K. Decision by end of month.',
      aiNote: `**AI Summary — Call 14 Jun**\nMichael confirmed budget approval from CFO. Main concern is data migration timeline — wants a 2-week cutover. Competitor is Salesforce Essentials but they find it too complex for their 12-person sales team.\n\n**Next Steps:**\n- Send migration timeline doc by Friday\n- Schedule technical call with their IT lead\n- Prepare ROI comparison vs Salesforce`,
    },
    {
      name: 'Rachel Green', company: 'BloomRetail Group', email: 'rgreen@bloomretail.com', phone: '+14155550102',
      status: 'Closed Won', source: 'Referral', value: 42000, assignedTo: james, createdBy: admin,
      tags: [tagReferral], createdAt: ago(45), nextFollowUp: null,
      notes: 'Deal closed. Annual subscription. Referred by NovaTech account.',
      aiNote: `**AI Summary — Closing Call 1 Jun**\nRachel signed off on the annual plan. She cited the AI call analysis feature as the deciding factor — her team does 50+ calls a week and the auto-summary saves them 2 hours daily.\n\n**Next Steps:**\n- Send onboarding welcome email\n- Schedule kickoff call for next week\n- Connect Rachel with customer success`,
    },
    {
      name: 'Tom Nguyen', company: 'Apex Logistics', email: 'tnguyen@apexlogistics.com', phone: '+14155550103',
      status: 'Qualified', source: 'Cold Call', value: 28000, assignedTo: james, createdBy: james,
      tags: [tagSMB, tagQ2], createdAt: ago(12), nextFollowUp: future(5),
      notes: 'Operations manager. 8-person sales team. Currently using spreadsheets.',
    },
    {
      name: 'Karen Walsh', company: 'PrimePropery Co', email: 'kwalsh@primeproperty.com', phone: '+14155550104',
      status: 'Contacted', source: 'Website', value: 15000, assignedTo: james, createdBy: james,
      tags: [tagSMB], createdAt: ago(7), nextFollowUp: future(3),
      notes: 'Real estate firm. Interested in mobile features for agents in the field.',
    },
    {
      name: 'Steven Park', company: 'ClearVision Analytics', email: 'spark@clearvision.ai', phone: '+14155550105',
      status: 'New', source: 'LinkedIn', value: 120000, assignedTo: james, createdBy: james,
      tags: [tagHot, tagEnterprise, tagQ2], createdAt: ago(3), nextFollowUp: future(1),
      notes: 'Head of Revenue Ops at a 200-person SaaS co. Wants enterprise-wide rollout.',
    },

    // Priya's leads — high value, some overdue
    {
      name: 'Aisha Okonkwo', company: 'Meridian Financial', email: 'aokonkwo@meridianfin.com', phone: '+14155550201',
      status: 'Proposal', source: 'Event', value: 195000, assignedTo: priya, createdBy: priya,
      tags: [tagEnterprise, tagHot, tagQ2], createdAt: ago(22), nextFollowUp: ago(3),
      notes: 'Largest deal in pipeline. 50-seat enterprise licence. Legal review in progress.',
      aiNote: `**AI Summary — Demo Call 10 Jun**\nAisha loved the management dashboard and AI recommendations. Her VP of Sales was on the call and immediately asked about white-labelling for their broker network. Two additional use cases emerged beyond the initial scope.\n\n**Next Steps:**\n- Prepare white-label pricing addendum\n- Loop in technical team for broker API discussion\n- Follow up on legal review status — due 20 Jun`,
    },
    {
      name: 'Carlos Reyes', company: 'Summit Staffing', email: 'creyes@summitstaffing.com', phone: '+14155550202',
      status: 'Qualified', source: 'Referral', value: 36000, assignedTo: priya, createdBy: admin,
      tags: [tagReferral, tagSMB], createdAt: ago(15), nextFollowUp: ago(2),
      notes: 'Staffing agency. 15 recruiters. Interested in recording and AI transcript features.',
    },
    {
      name: 'Diana Foster', company: 'BrightSpark EdTech', email: 'dfoster@brightspark.edu', phone: '+14155550203',
      status: 'Contacted', source: 'Website', value: 22000, assignedTo: priya, createdBy: priya,
      tags: [tagSMB], createdAt: ago(9), nextFollowUp: future(4),
      notes: 'EdTech startup. Fundraised Series A. Building out their sales team from scratch.',
    },
    {
      name: 'Nathan Brooks', company: 'Voyager Capital', email: 'nbrooks@voyagercap.com', phone: '+14155550204',
      status: 'Closed Lost', source: 'LinkedIn', value: 75000, assignedTo: priya, createdBy: priya,
      tags: [], createdAt: ago(60), nextFollowUp: null,
      notes: 'Went with HubSpot. Decision driven by existing HubSpot marketing suite integration.',
    },
    {
      name: 'Yuki Tanaka', company: 'Kinetic Health', email: 'ytanaka@kinetichealth.com', phone: '+14155550205',
      status: 'New', source: 'Cold Call', value: 18000, assignedTo: priya, createdBy: priya,
      tags: [tagSMB], createdAt: ago(1), nextFollowUp: future(7),
      notes: 'Health & wellness brand. 6 sales reps. Interested in follow-up automation.',
    },

    // David's leads — newer agent, developing
    {
      name: 'Brett Cunningham', company: 'IronGate Security', email: 'bcunningham@irongate.com', phone: '+14155550301',
      status: 'Qualified', source: 'Cold Call', value: 44000, assignedTo: david, createdBy: david,
      tags: [tagEnterprise], createdAt: ago(11), nextFollowUp: future(6),
      notes: 'Physical security company expanding into SaaS sales. 20 reps.',
    },
    {
      name: 'Monique Laurent', company: 'Luxe Hospitality', email: 'mlaurent@luxegroup.com', phone: '+14155550302',
      status: 'Contacted', source: 'Event', value: 31000, assignedTo: david, createdBy: david,
      tags: [tagSMB], createdAt: ago(8), nextFollowUp: future(2),
      notes: 'Boutique hotel group. 10 properties. Sales team uses WhatsApp currently.',
    },
    {
      name: 'Josh Patterson', company: 'QuickShip Co', email: 'jpatterson@quickship.com', phone: '+14155550303',
      status: 'New', source: 'Website', value: 12000, assignedTo: david, createdBy: admin,
      tags: [tagSMB], createdAt: ago(2), nextFollowUp: future(5),
      notes: null,
    },
    {
      name: 'Amara Singh', company: 'CityFresh Foods', email: 'asingh@cityfresh.com', phone: '+14155550304',
      status: 'Closed Won', source: 'Referral', value: 19000, assignedTo: david, createdBy: david,
      tags: [tagReferral], createdAt: ago(30), nextFollowUp: null,
      notes: 'SMB food distributor. Closed in 3 weeks — fastest deal to date for David.',
    },
    {
      name: 'Oliver West', company: 'Greenwave Energy', email: 'owest@greenwave.energy', phone: '+14155550305',
      status: 'Proposal', source: 'LinkedIn', value: 67000, assignedTo: david, createdBy: david,
      tags: [tagQ2, tagEnterprise], createdAt: ago(19), nextFollowUp: ago(5),
      notes: 'Renewable energy consultancy. 30 sales reps across 3 regions.',
      aiNote: `**AI Summary — Discovery Call 5 Jun**\nOliver is the Sales Director. Pain point is lack of visibility across regional teams. Currently using Excel and a legacy system. Showed strong interest in the management dashboard.\n\n**Next Steps:**\n- Send proposal by 15 Jun\n- Include regional breakdown feature in demo\n- Confirm technical requirements with IT`,
    },

    // Unassigned leads — for management view demonstration
    {
      name: 'Fatima Al-Rashid', company: 'Horizon Consulting', email: 'falrashid@horizon.co', phone: '+14155550401',
      status: 'New', source: 'Website', value: 55000, assignedTo: null, createdBy: admin,
      tags: [tagHot], createdAt: ago(5), nextFollowUp: null,
      notes: 'Inbound — filled out the enterprise contact form. Needs to be assigned urgently.',
    },
    {
      name: 'Ravi Gupta', company: 'TechPulse Media', email: 'rgupta@techpulse.com', phone: '+14155550402',
      status: 'New', source: 'LinkedIn', value: 29000, assignedTo: null, createdBy: admin,
      tags: [], createdAt: ago(3), nextFollowUp: null,
      notes: null,
    },
    {
      name: 'Claire Beaumont', company: 'Solstice Wellness', email: 'cbeaumont@solstice.com', phone: '+14155550403',
      status: 'New', source: 'Event', value: 0, assignedTo: null, createdBy: viewer,
      tags: [], createdAt: ago(1), nextFollowUp: null,
      notes: 'Met at SaaS Summit. Interested in team plan.',
    },

    // Stale leads — for AI recommendations
    {
      name: 'Harold Vance', company: 'Atlas Manufacturing', email: 'hvance@atlasmanufacturing.com', phone: '+14155550501',
      status: 'Qualified', source: 'Cold Call', value: 38000, assignedTo: david, createdBy: david,
      tags: [], createdAt: ago(35), nextFollowUp: ago(20),
      notes: 'Went quiet after the second call. Was interested but no response to last 2 emails.',
    },
    {
      name: 'Simone Dupont', company: 'EuroTrade Partners', email: 'sdupont@eurotrade.eu', phone: '+14155550502',
      status: 'Proposal', source: 'Referral', value: 62000, assignedTo: priya, createdBy: priya,
      tags: [tagEnterprise], createdAt: ago(40), nextFollowUp: ago(18),
      notes: 'Proposal sent 3 weeks ago. No reply. May have gone with a competitor.',
    },
    {
      name: 'Derek Hammond', company: 'Cornerstone Realty', email: 'dhammond@cornerstone.re', phone: '+14155550503',
      status: 'Contacted', source: 'Website', value: 16000, assignedTo: james, createdBy: james,
      tags: [], createdAt: ago(28), nextFollowUp: ago(14),
      notes: 'Initial call went well. Said they would discuss internally. Silence since.',
    },
  ];

  const createdLeads = [];
  for (const l of leadsData) {
    const lead = await prisma.lead.create({
      data: {
        name: l.name, company: l.company, email: l.email, phone: l.phone,
        status: l.status, source: l.source, value: l.value || null,
        notes: l.notes || null,
        nextFollowUp: l.nextFollowUp,
        assignedToId: l.assignedTo?.id || null,
        createdById: l.createdBy?.id || null,
        archived: false,
        createdAt: l.createdAt || ago(10),
        updatedAt: l.createdAt || ago(10),
        tags: { connect: (l.tags || []).map(t => ({ id: t.id })) },
      }
    });

    // Activities
    const creator = l.createdBy || admin;
    await prisma.activity.create({
      data: { leadId: lead.id, userId: creator.id, action: 'created', details: { name: l.name }, createdAt: l.createdAt || ago(10) }
    });
    if (l.assignedTo && l.assignedTo.id !== creator.id) {
      await prisma.activity.create({
        data: { leadId: lead.id, userId: admin.id, action: 'assigned', details: { to: l.assignedTo.name }, createdAt: l.createdAt || ago(10) }
      });
    }
    if (l.status !== 'New') {
      await prisma.activity.create({
        data: { leadId: lead.id, userId: l.assignedTo?.id || admin.id, action: 'status_changed', details: { from: 'New', to: l.status }, createdAt: ago(Math.floor((l.createdAt ? (Date.now() - l.createdAt) / 86400000 : 10) / 2)) }
      });
    }

    // Manual note
    if (l.notes) {
      await prisma.leadNote.create({
        data: { leadId: lead.id, userId: l.assignedTo?.id || admin.id, content: l.notes, type: 'manual', createdAt: l.createdAt || ago(10) }
      });
      await prisma.activity.create({
        data: { leadId: lead.id, userId: l.assignedTo?.id || admin.id, action: 'note_added', details: { preview: l.notes.slice(0, 80) }, createdAt: l.createdAt || ago(10) }
      });
    }

    // AI summary note
    if (l.aiNote) {
      await prisma.leadNote.create({
        data: { leadId: lead.id, userId: admin.id, content: l.aiNote, type: 'ai_summary', createdAt: ago(8) }
      });
      await prisma.activity.create({
        data: { leadId: lead.id, userId: admin.id, action: 'note_added', details: { preview: 'AI summary added' }, createdAt: ago(8) }
      });
    }

    createdLeads.push({ ...lead, _data: l });
  }

  // ── Messages — demo conversations with deal threads ───────────────────
  const novatechLead = createdLeads.find(l => l._data.name === 'Michael Torres');
  const meridianLead = createdLeads.find(l => l._data.name === 'Aisha Okonkwo');
  const oliverLead = createdLeads.find(l => l._data.name === 'Oliver West');

  const msgData = [
    // James ↔ Admin — NovaTech thread + general
    { from: admin, to: james, body: 'Hey James — quick check-in. How are you feeling about the NovaTech deal?', createdAt: ago(4) },
    { from: james, to: admin, body: 'Pretty good! Michael is responsive and budget is confirmed. Main blocker is migration timeline.', leadId: novatechLead?.id, lead: novatechLead, createdAt: ago(4) },
    { from: admin, to: james, body: 'I had our tech team draft a migration doc. Sending it over now. Should address his concerns.', leadId: novatechLead?.id, lead: novatechLead, createdAt: ago(3) },
    { from: james, to: admin, body: 'Perfect. I have a call with him tomorrow at 10am. Will use this to close.', leadId: novatechLead?.id, lead: novatechLead, createdAt: ago(3) },
    { from: admin, to: james, body: 'Good luck! Also — can you cover Priya\'s calls Thursday? She\'s at a conference.', createdAt: ago(2) },
    { from: james, to: admin, body: 'Sure, no problem.', createdAt: ago(2) },

    // Priya ↔ Admin — Meridian thread
    { from: priya, to: admin, body: 'Sarah — the Meridian deal is moving fast. Aisha\'s VP wants a white-label quote now.', leadId: meridianLead?.id, lead: meridianLead, createdAt: ago(5) },
    { from: admin, to: priya, body: 'That\'s a big signal. I\'ll prepare a white-label addendum — give me 2 days. Don\'t let them go cold!', leadId: meridianLead?.id, lead: meridianLead, createdAt: ago(5) },
    { from: priya, to: admin, body: 'Follow-up was due 3 days ago and I haven\'t heard back. Should I call directly?', leadId: meridianLead?.id, lead: meridianLead, createdAt: ago(1) },
    { from: admin, to: priya, body: 'Yes — call today. $195K deal. Don\'t let it go stale. @James can you help prep Priya on the white-label talking points?', leadId: meridianLead?.id, lead: meridianLead, createdAt: ago(1) },

    // David ↔ Priya — Oliver/Greenwave
    { from: david, to: priya, body: 'Priya, do you have experience pitching to energy companies? I have a big one I could use advice on.', createdAt: ago(6) },
    { from: priya, to: david, body: 'Yes! Key thing is to emphasise regional visibility — they care a lot about cross-team reporting.', leadId: oliverLead?.id, lead: oliverLead, createdAt: ago(6) },
    { from: david, to: priya, body: 'That\'s exactly what Oliver said on the call. I\'ll lean into that in the proposal.', leadId: oliverLead?.id, lead: oliverLead, createdAt: ago(5) },
    { from: priya, to: david, body: 'Also mention the management dashboard — it sells itself when they see live team stats. Good luck!', leadId: oliverLead?.id, lead: oliverLead, createdAt: ago(5) },
  ];

  for (const m of msgData) {
    await prisma.message.create({
      data: {
        fromId: m.from.id,
        toId: m.to.id,
        body: m.body,
        leadId: m.leadId || null,
        read: true,
        createdAt: m.createdAt,
      }
    });
  }

  // Mark last few messages as unread (for badge demo)
  await prisma.message.updateMany({
    where: { fromId: admin.id, toId: priya.id, createdAt: { gte: ago(2) } },
    data: { read: false }
  });

  console.log('\n✅ Demo seed complete!\n');
  console.log('──────────────────────────────────────────');
  console.log('  Demo login credentials:');
  console.log('  Admin   : admin@demo.com  / demo1234');
  console.log('  Agent   : james@demo.com  / demo1234');
  console.log('  Agent   : priya@demo.com  / demo1234');
  console.log('  Agent   : david@demo.com  / demo1234');
  console.log('  Viewer  : viewer@demo.com / demo1234');
  console.log('──────────────────────────────────────────\n');
}

main().catch(console.error).finally(() => prisma.$disconnect());
