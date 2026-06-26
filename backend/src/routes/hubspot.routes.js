'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const {
  getAuthUrl,
  exchangeCode,
  disconnectHubSpot,
} = require('../services/hubspot.service');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/hubspot/connect — redirect to HubSpot OAuth
router.get('/connect', authenticate, (req, res) => {
  try {
    const url = getAuthUrl(req.user.id);
    res.redirect(url);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to build auth URL' });
  }
});

// GET /api/hubspot/callback — HubSpot redirects here after OAuth
// NOTE: No authenticate middleware — state param carries userId
router.get('/callback', async (req, res) => {
  const { code, state: userId, error } = req.query;

  if (error) {
    return res.redirect('/settings?hubspot=error');
  }

  if (!code || !userId) {
    return res.status(400).json({ error: 'Missing code or state' });
  }

  try {
    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(400).json({ error: 'Invalid state' });

    await exchangeCode(code, userId);
    res.redirect('/settings?hubspot=connected');
  } catch (err) {
    console.error('[HubSpot] Callback error:', err.message || err);
    res.redirect('/settings?hubspot=error');
  }
});

// GET /api/hubspot/status — check connection status
router.get('/status', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    res.json({
      connected: Boolean(user?.hubspotAccessToken),
      portalId: user?.hubspotPortalId || null,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check HubSpot status' });
  }
});

// POST /api/hubspot/disconnect
router.post('/disconnect', authenticate, async (req, res) => {
  try {
    await disconnectHubSpot(req.user.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to disconnect HubSpot' });
  }
});

module.exports = router;
