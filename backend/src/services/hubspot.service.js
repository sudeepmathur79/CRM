// Stub — replaced by full implementation in CRM-001/002
async function syncLeadToHubSpot(userId, leadData) {
  throw Object.assign(new Error('HubSpot not connected'), { status: 400 });
}
async function disconnectHubSpot(userId) {}
module.exports = { syncLeadToHubSpot, disconnectHubSpot };
