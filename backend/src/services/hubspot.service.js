'use strict';

const HUBSPOT_API_BASE = 'https://api.hubspot.com';
const TIMEOUT_MS = 10_000;

function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

function getHeaders() {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) throw Object.assign(new Error('HubSpot not configured — set HUBSPOT_ACCESS_TOKEN'), { status: 400 });
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

// Search for existing contact by email
async function findContact(email) {
  if (!email) return null;
  const res = await fetchWithTimeout(`${HUBSPOT_API_BASE}/crm/v3/objects/contacts/search`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: email }] }],
      properties: ['email', 'firstname', 'lastname', 'phone'],
      limit: 1,
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.results?.[0] ?? null;
}

// Create or update a contact, return contactId
async function upsertContact(leadData) {
  const [firstName, ...rest] = (leadData.name || 'Unknown').split(' ');
  const lastName = rest.join(' ') || '';
  const properties = {
    firstname: firstName,
    lastname: lastName,
    email: leadData.email || '',
    phone: leadData.phone || '',
    company: leadData.company || '',
  };

  const existing = await findContact(leadData.email);
  if (existing) {
    await fetchWithTimeout(`${HUBSPOT_API_BASE}/crm/v3/objects/contacts/${existing.id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ properties }),
    });
    return existing.id;
  }

  const res = await fetchWithTimeout(`${HUBSPOT_API_BASE}/crm/v3/objects/contacts`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ properties }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error('HubSpot contact create failed'), { status: 502, detail: err.message });
  }
  const data = await res.json();
  return data.id;
}

// Create a deal and associate it with the contact
async function createDeal(leadData, contactId) {
  const dealName = leadData.name + (leadData.company ? ` — ${leadData.company}` : '');
  const properties = {
    dealname: dealName,
    pipeline: 'default',
    dealstage: 'appointmentscheduled',
    ...(leadData.value ? { amount: String(leadData.value) } : {}),
    ...(leadData.nextFollowUp ? { closedate: new Date(leadData.nextFollowUp).toISOString() } : {}),
    ...(leadData.summary ? { description: leadData.summary.slice(0, 65535) } : {}),
  };

  const res = await fetchWithTimeout(`${HUBSPOT_API_BASE}/crm/v3/objects/deals`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      properties,
      associations: [{
        to: { id: contactId },
        types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }],
      }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error('HubSpot deal create failed'), { status: 502, detail: err.message });
  }
  const data = await res.json();
  return data.id;
}

// Main sync function — call this after AI extraction
async function syncLeadToHubSpot(userId, leadData) {
  const contactId = await upsertContact(leadData);
  const dealId = await createDeal(leadData, contactId);
  // Log only IDs, no PII
  console.log(`[HubSpot] synced contactId=${contactId} dealId=${dealId}`);
  return { contactId, dealId };
}

// Check if HubSpot is configured (service key present)
function isConfigured() {
  return !!process.env.HUBSPOT_ACCESS_TOKEN;
}

module.exports = { syncLeadToHubSpot, isConfigured };
