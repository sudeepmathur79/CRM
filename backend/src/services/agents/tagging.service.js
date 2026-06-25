const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const KEYWORD_TAGS = [
  { keywords: ['urgent', 'asap', 'immediately', 'critical'], tag: 'urgent', color: '#ef4444' },
  { keywords: ['budget', 'price', 'cost', 'afford', 'invest'], tag: 'budget', color: '#f59e0b' },
  { keywords: ['competitor', 'competition', 'alternative', 'vs '], tag: 'competitor', color: '#8b5cf6' },
  { keywords: ['demo', 'trial', 'test', 'poc'], tag: 'demo-requested', color: '#06b6d4' },
  { keywords: ['hot', 'ready', 'buy', 'purchase', 'close'], tag: 'hot-lead', color: '#10b981' },
  { keywords: ['follow up', 'call back', 'remind', 'schedule'], tag: 'needs-followup', color: '#3b82f6' },
];

const autoTagLeads = async () => {
  try {
    const leads = await prisma.lead.findMany({
      include: { recordings: { select: { transcript: true } }, tags: true }
    });

    for (const lead of leads) {
      const text = [lead.notes, lead.name, ...lead.recordings.map(r => r.transcript)].filter(Boolean).join(' ').toLowerCase();
      if (!text) continue;

      const matchedTags = KEYWORD_TAGS.filter(kt => kt.keywords.some(kw => text.includes(kw)));
      if (!matchedTags.length) continue;

      for (const kt of matchedTags) {
        const alreadyTagged = lead.tags.some(t => t.name === kt.tag);
        if (alreadyTagged) continue;

        const tag = await prisma.tag.upsert({
          where: { name: kt.tag },
          update: {},
          create: { name: kt.tag, color: kt.color }
        });
        await prisma.lead.update({
          where: { id: lead.id },
          data: { tags: { connect: { id: tag.id } } }
        });
      }
    }
    console.log('[Agent] Auto-tagging complete');
  } catch (e) {
    console.error('[Agent] Tagging error:', e.message);
  }
};

module.exports = { autoTagLeads };
