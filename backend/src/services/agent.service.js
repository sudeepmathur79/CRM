const { PrismaClient } = require('@prisma/client');
const { callAI } = require('./ai.service');
const prisma = new PrismaClient();

// ── Template variable interpolation ──────────────────────────────────────────
function interpolate(template, vars) {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    const val = key.trim().split('.').reduce((o, k) => o?.[k], vars);
    return val !== undefined && val !== null ? String(val) : `[${key.trim()}]`;
  });
}

// ── Build context object for a lead ──────────────────────────────────────────
async function buildLeadContext(leadId) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      leadNotes: { orderBy: { createdAt: 'desc' }, take: 5 },
      activities: { orderBy: { createdAt: 'desc' }, take: 10, include: { user: { select: { name: true } } } },
      recordings: { orderBy: { createdAt: 'desc' }, take: 3 },
      assignedTo: { select: { name: true } },
    },
  });
  if (!lead) return null;

  const lastNote = lead.leadNotes[0]?.content || 'No notes yet';
  const recentNotes = lead.leadNotes.map(n => n.content).join('\n---\n') || 'No notes';
  const activitySummary = lead.activities
    .map(a => `${a.user?.name || 'System'}: ${a.action} (${new Date(a.createdAt).toLocaleDateString()})`)
    .join('\n') || 'No activity';
  const lastActivity = lead.activities[0];
  const daysSinceActivity = lastActivity
    ? Math.floor((Date.now() - new Date(lastActivity.createdAt)) / 86400000)
    : null;

  return {
    lead: {
      id: lead.id,
      name: lead.name,
      company: lead.company || 'Unknown company',
      email: lead.email || '',
      phone: lead.phone || '',
      status: lead.status,
      source: lead.source || '',
      value: lead.value ? `$${lead.value.toLocaleString()}` : 'Not specified',
      notes: lead.notes || '',
      lastNote,
      recentNotes,
      activitySummary,
      lastActivitySummary: lastActivity ? `${lastActivity.action} (${daysSinceActivity} days ago)` : 'No activity',
    },
  };
}

// ── Run a single agent against a lead ────────────────────────────────────────
async function runAgent(agentConfigId, leadId, extraVars = {}) {
  const config = await prisma.agentConfig.findUnique({ where: { id: agentConfigId } });
  if (!config || !config.enabled) return null;

  const run = await prisma.agentRun.create({
    data: { agentConfigId, leadId: leadId || null, orgId: config.orgId, status: 'running' },
  });

  try {
    let context = leadId ? await buildLeadContext(leadId) : {};
    context = { ...context, ...extraVars };

    const prompt = interpolate(config.promptTemplate, context);
    const output = await callAI(prompt);

    // Save output as a LeadNote if there's a lead
    if (leadId && output) {
      await prisma.leadNote.create({
        data: {
          leadId,
          content: `**${config.name}**\n\n${output}`,
          type: 'agent_output',
          agentType: config.type,
        },
      });
    }

    await prisma.agentRun.update({
      where: { id: run.id },
      data: { output, status: 'done', input: context },
    });

    return { runId: run.id, output };
  } catch (e) {
    await prisma.agentRun.update({
      where: { id: run.id },
      data: { status: 'failed', output: e.message },
    });
    throw e;
  }
}

// ── Trigger all enabled agents for a given event within an org ───────────────
async function triggerAgents(triggerType, lead, orgId, io) {
  if (!orgId) return;
  try {
    const agents = await prisma.agentConfig.findMany({
      where: { orgId, trigger: triggerType, enabled: true },
    });
    for (const agent of agents) {
      try {
        const result = await runAgent(agent.id, lead?.id);
        if (result?.output && lead?.assignedToId && io) {
          io.to(lead.assignedToId).emit('agent:output', {
            agentName: agent.name,
            leadId: lead.id,
            leadName: lead.name,
            output: result.output,
          });
        }
      } catch (e) {
        console.error(`Agent ${agent.name} failed for lead ${lead?.id}:`, e.message);
      }
    }
  } catch (e) {
    console.error('triggerAgents error:', e.message);
  }
}

// ── Cron: check for stuck deals (on_stage_stuck trigger) ─────────────────────
async function runStuckDealAgents(io) {
  try {
    const agents = await prisma.agentConfig.findMany({
      where: { trigger: 'on_stage_stuck', enabled: true },
    });
    for (const agent of agents) {
      const stuckDays = agent.config?.stuckDays || 7;
      const cutoff = new Date(Date.now() - stuckDays * 86400000);
      const stuckLeads = await prisma.lead.findMany({
        where: {
          orgId: agent.orgId,
          archived: false,
          status: { notIn: ['Closed Won', 'Closed Lost'] },
          updatedAt: { lt: cutoff },
        },
        take: 10,
      });
      for (const lead of stuckLeads) {
        try {
          const result = await runAgent(agent.id, lead.id, { stuckDays });
          if (result?.output && lead.assignedToId && io) {
            io.to(lead.assignedToId).emit('agent:output', {
              agentName: agent.name,
              leadId: lead.id,
              leadName: lead.name,
              output: result.output,
            });
          }
        } catch (e) {
          console.error(`Stuck deal agent failed for ${lead.id}:`, e.message);
        }
      }
    }
  } catch (e) {
    console.error('runStuckDealAgents error:', e.message);
  }
}

module.exports = { runAgent, triggerAgents, runStuckDealAgents };
