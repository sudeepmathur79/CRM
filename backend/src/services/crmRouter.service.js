// Routes extracted lead data to connected external CRMs + always saves locally
// Falls back to local-only if no CRM connected or sync fails
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const hubspotService = require('./hubspot.service');

/**
 * @param {string} userId
 * @param {object} leadData - { name, company, email, phone, value, nextFollowUp, nextAction, summary, confidence }
 * @param {{ saveLocally?: boolean }} options
 * @returns {{ synced: string[], failed: Array<{crm:string,error:string}>, localLeadId: string|null }}
 */
async function routeExtractedLead(userId, leadData, options = {}) {
  const { saveLocally = true } = options;
  const synced = [];
  const failed = [];
  let localLeadId = null;

  // 1. Load user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { targetCrmType: true, autoExportOnCapture: true, orgId: true },
  });

  if (!user) {
    if (saveLocally) {
      localLeadId = await upsertLeadLocally(userId, null, leadData);
    }
    return { synced, failed, localLeadId };
  }

  // 2. autoExportOnCapture gate
  if (user.autoExportOnCapture === false) {
    if (saveLocally) {
      localLeadId = await upsertLeadLocally(userId, user.orgId, leadData);
    }
    return { synced, failed, localLeadId };
  }

  // 3. External CRM sync
  if (user.targetCrmType === 'HUBSPOT' && hubspotService.isConfigured()) {
    try {
      await hubspotService.syncLeadToHubSpot(userId, leadData);
      synced.push('hubspot');
    } catch (err) {
      // Log only non-PII info
      console.error(`[crmRouter] HubSpot sync failed userId=${userId} status=${err.status ?? 'unknown'} code=${err.message}`);
      failed.push({ crm: 'hubspot', error: err.message });
      // Degraded mode — continue to local save
    }
  }

  // 4. Local save
  if (saveLocally) {
    try {
      localLeadId = await upsertLeadLocally(userId, user.orgId, leadData);
    } catch (err) {
      console.error(`[crmRouter] Local save failed userId=${userId}: ${err.message}`);
    }
  }

  return { synced, failed, localLeadId };
}

async function upsertLeadLocally(userId, orgId, leadData) {
  const { name, contactName, company, email, phone, value, nextFollowUp, nextAction, summary } = leadData;

  let lead = null;

  // Search by email within the same org
  if (email) {
    lead = await prisma.lead.findFirst({
      where: {
        email,
        ...(orgId ? { orgId } : {}),
      },
      select: { id: true },
    });
  }

  if (lead) {
    // Update existing
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        ...(name ? { name } : {}),
        ...(contactName !== undefined ? { contactName } : {}),
        ...(company !== undefined ? { company } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(value !== undefined ? { value } : {}),
        ...(nextFollowUp ? { nextFollowUp: new Date(nextFollowUp) } : {}),
        ...(nextAction !== undefined ? { aiNextAction: nextAction } : {}),
      },
    });
  } else {
    // Create new
    lead = await prisma.lead.create({
      data: {
        name: name || 'Unknown',
        contactName,
        company,
        email,
        phone,
        value,
        nextFollowUp: nextFollowUp ? new Date(nextFollowUp) : undefined,
        aiNextAction: nextAction,
        status: 'New',
        ...(orgId ? { orgId } : {}),
        createdById: userId,
      },
    });
  }

  // Add AI summary note if provided
  if (summary) {
    await prisma.leadNote.create({
      data: {
        leadId: lead.id,
        content: summary,
        type: 'ai_summary',
        userId,
      },
    });
  }

  return lead.id;
}

module.exports = { routeExtractedLead };
