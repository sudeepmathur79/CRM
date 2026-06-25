const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

let agentIndex = 0;

const runRoundRobin = async (io) => {
  try {
    const unassigned = await prisma.lead.findMany({ where: { assignedToId: null } });
    if (!unassigned.length) return;

    const agents = await prisma.user.findMany({ where: { role: 'agent', isActive: true } });
    if (!agents.length) return;

    for (const lead of unassigned) {
      const agent = agents[agentIndex % agents.length];
      agentIndex++;
      await prisma.lead.update({ where: { id: lead.id }, data: { assignedToId: agent.id } });
      await prisma.activity.create({
        data: { leadId: lead.id, userId: agent.id, action: 'assigned', details: { by: 'system', to: agent.name } }
      });
      io?.to(`user:${agent.id}`).emit('lead:assigned', { leadId: lead.id, leadName: lead.name });
    }
    console.log(`[Agent] Round-robin: assigned ${unassigned.length} leads`);
  } catch (e) {
    console.error('[Agent] Round-robin error:', e.message);
  }
};

module.exports = { runRoundRobin };
