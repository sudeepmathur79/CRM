const router = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const { isConfigured, syncLeadToHubSpot } = require('../services/hubspot.service');

router.use(authenticate);

// GET /api/hubspot/status — is service key configured?
router.get('/status', (req, res) => {
  res.json({ connected: isConfigured() });
});

// POST /api/hubspot/test — push a test contact/deal to verify the key works
router.post('/test', async (req, res, next) => {
  try {
    if (!isConfigured()) return res.status(400).json({ error: 'HUBSPOT_ACCESS_TOKEN not set' });
    const result = await syncLeadToHubSpot(req.user.id, {
      name: 'SalesFlow Test Contact',
      company: 'SalesFlow CRM',
      email: `test-${Date.now()}@salesflow-test.invalid`,
      summary: 'Test contact created from SalesFlow CRM integration check.',
    });
    res.json({ ok: true, ...result });
  } catch (e) { next(e); }
});

module.exports = router;
