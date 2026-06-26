<<<<<<< HEAD
'use strict';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const HUBSPOT_TOKEN_URL = 'https://api.hubapi.com/oauth/v1/token';
const HUBSPOT_API_BASE = 'https://api.hubspot.com';
const TIMEOUT_MS = 10_000;

function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

// ── Auth URL ─────────────────────────────────────────────────────────────────

function getAuthUrl(userId) {
  const clientId = process.env.HUBSPOT_CLIENT_ID;
  if (!clientId) throw { status: 400, message: 'HubSpot integration not configured' };
  const redirectUri = process.env.HUBSPOT_REDIRECT_URI;
  const scope = 'crm.objects.contacts.write crm.objects.deals.write';
  return (
    `https://app.hubspot.com/oauth/authorize` +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&state=${encodeURIComponent(userId)}`
  );
}

// ── Token exchange ────────────────────────────────────────────────────────────

async function exchangeCode(code, userId) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: process.env.HUBSPOT_CLIENT_ID,
    client_secret: process.env.HUBSPOT_CLIENT_SECRET,
    redirect_uri: process.env.HUBSPOT_REDIRECT_URI,
    code,
  });

  const res = await fetchWithTimeout(HUBSPOT_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    const err = await res.text();
    throw { status: 502, message: `HubSpot token exchange failed: ${err}` };
  }

  const data = await res.json();
  const expiry = new Date(Date.now() + data.expires_in * 1000);

  await prisma.user.update({
    where: { id: userId },
    data: {
      hubspotAccessToken: data.access_token,
      hubspotRefreshToken: data.refresh_token,
      hubspotTokenExpiry: expiry,
      hubspotPortalId: String(data.hub_id),
    },
  });

  console.log(`[HubSpot] Token stored for userId=${userId} portalId=${data.hub_id}`);
  return { ok: true };
}

// ── Token refresh ─────────────────────────────────────────────────────────────

async function refreshTokenIfNeeded(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.hubspotRefreshToken) return;

  const expiryMs = user.hubspotTokenExpiry ? new Date(user.hubspotTokenExpiry).getTime() : 0;
  const fiveMinMs = 5 * 60 * 1000;
  if (Date.now() < expiryMs - fiveMinMs) return; // still valid

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: process.env.HUBSPOT_CLIENT_ID,
    client_secret: process.env.HUBSPOT_CLIENT_SECRET,
    refresh_token: user.hubspotRefreshToken,
  });

  const res = await fetchWithTimeout(HUBSPOT_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    const err = await res.text();
    throw { status: 502, message: `HubSpot token refresh failed: ${err}` };
  }

  const data = await res.json();
  const expiry = new Date(Date.now() + data.expires_in * 1000);

  await prisma.user.update({
    where: { id: userId },
    data: {
      hubspotAccessToken: data.access_token,
      hubspotRefreshToken: data.refresh_token || user.hubspotRefreshToken,
      hubspotTokenExpiry: expiry,
    },
  });

  console.log(`[HubSpot] Token refreshed for userId=${userId}`);
}

// ── Get valid token ───────────────────────────────────────────────────────────

async function getValidToken(userId) {
  await refreshTokenIfNeeded(userId);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.hubspotAccessToken) throw { status: 400, message: 'HubSpot not connected' };
  return user.hubspotAccessToken;
}

// ── Internal HubSpot API call with 401-retry ──────────────────────────────────

async function hubspotFetch(userId, url, options = {}, retried = false) {
  const token = await getValidToken(userId);
  const res = await fetchWithTimeout(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (res.status === 401 && !retried) {
    // Force refresh and retry once
    await prisma.user.update({
      where: { id: userId },
      data: { hubspotTokenExpiry: new Date(0) }, // expire immediately
    });
    return hubspotFetch(userId, url, options, true);
  }

  return res;
}

// ── Main sync function ────────────────────────────────────────────────────────

async function syncLeadToHubSpot(userId, leadData) {
  const { name, company, email, phone, value, nextFollowUp, nextAction, summary } = leadData;

  // Ensure connected
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.hubspotAccessToken) throw { status: 400, message: 'HubSpot not connected' };

  // ── Contact: search by email ──────────────────────────────────────────────
  let contactId;

  if (email) {
    const searchRes = await hubspotFetch(userId, `${HUBSPOT_API_BASE}/crm/v3/objects/contacts/search`, {
      method: 'POST',
      body: JSON.stringify({
        filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: email }] }],
        properties: ['email', 'firstname', 'lastname'],
        limit: 1,
      }),
    });

    if (!searchRes.ok) {
      const err = await searchRes.text();
      throw { status: 502, message: `HubSpot contact search failed: ${err}` };
    }

    const searchData = await searchRes.json();

    if (searchData.total > 0) {
      // Update existing contact
      contactId = searchData.results[0].id;
      const parts = (name || '').split(' ');
      const updateRes = await hubspotFetch(userId, `${HUBSPOT_API_BASE}/crm/v3/objects/contacts/${contactId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          properties: {
            firstname: parts[0] || '',
            lastname: parts.slice(1).join(' ') || '',
            phone: phone || '',
            company: company || '',
          },
        }),
      });
      if (!updateRes.ok) {
        const err = await updateRes.text();
        throw { status: 502, message: `HubSpot contact update failed: ${err}` };
      }
      console.log(`[HubSpot] Updated contact id=${contactId}`);
    } else {
      // Create new contact
      const parts = (name || '').split(' ');
      const createRes = await hubspotFetch(userId, `${HUBSPOT_API_BASE}/crm/v3/objects/contacts`, {
        method: 'POST',
        body: JSON.stringify({
          properties: {
            email,
            firstname: parts[0] || '',
            lastname: parts.slice(1).join(' ') || '',
            phone: phone || '',
            company: company || '',
          },
        }),
      });
      if (!createRes.ok) {
        const err = await createRes.text();
        throw { status: 502, message: `HubSpot contact create failed: ${err}` };
      }
      const created = await createRes.json();
      contactId = created.id;
      console.log(`[HubSpot] Created contact id=${contactId}`);
    }
  }

  // ── Deal: search by name association ─────────────────────────────────────
  const dealName = name + (company ? ` — ${company}` : '');

  // Search for existing deal associated with contact (if any)
  let dealId;

  if (contactId) {
    const assocRes = await hubspotFetch(
      userId,
      `${HUBSPOT_API_BASE}/crm/v3/objects/contacts/${contactId}/associations/deals`,
      { method: 'GET' }
    );

    if (assocRes.ok) {
      const assocData = await assocRes.json();
      if (assocData.results?.length > 0) {
        dealId = assocData.results[0].id;
      }
    }
  }

  const dealProperties = {
    dealname: dealName,
    ...(value != null ? { amount: String(value) } : {}),
    ...(nextFollowUp ? { closedate: new Date(nextFollowUp).toISOString() } : {}),
    ...(summary ? { description: summary } : {}),
  };

  if (dealId) {
    const updateRes = await hubspotFetch(userId, `${HUBSPOT_API_BASE}/crm/v3/objects/deals/${dealId}`, {
      method: 'PATCH',
      body: JSON.stringify({ properties: dealProperties }),
    });
    if (!updateRes.ok) {
      const err = await updateRes.text();
      throw { status: 502, message: `HubSpot deal update failed: ${err}` };
    }
    console.log(`[HubSpot] Updated deal id=${dealId}`);
  } else {
    const createRes = await hubspotFetch(userId, `${HUBSPOT_API_BASE}/crm/v3/objects/deals`, {
      method: 'POST',
      body: JSON.stringify({ properties: dealProperties }),
    });
    if (!createRes.ok) {
      const err = await createRes.text();
      throw { status: 502, message: `HubSpot deal create failed: ${err}` };
    }
    const created = await createRes.json();
    dealId = created.id;
    console.log(`[HubSpot] Created deal id=${dealId}`);

    // Associate deal with contact
    if (contactId && dealId) {
      const assocRes = await hubspotFetch(
        userId,
        `${HUBSPOT_API_BASE}/crm/v3/objects/deals/${dealId}/associations/contacts/${contactId}/deal_to_contact`,
        { method: 'PUT', body: '' }
      );
      if (!assocRes.ok) {
        console.warn(`[HubSpot] Association warning: deal=${dealId} contact=${contactId}`);
      }
    }
  }

  return { contactId, dealId };
}

// ── Disconnect ────────────────────────────────────────────────────────────────

async function disconnectHubSpot(userId) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      hubspotAccessToken: null,
      hubspotRefreshToken: null,
      hubspotTokenExpiry: null,
      hubspotPortalId: null,
    },
  });
  console.log(`[HubSpot] Disconnected userId=${userId}`);
}

module.exports = {
  getAuthUrl,
  exchangeCode,
  refreshTokenIfNeeded,
  getValidToken,
  syncLeadToHubSpot,
  disconnectHubSpot,
};
