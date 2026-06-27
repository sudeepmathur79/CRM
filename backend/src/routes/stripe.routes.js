const router = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const { PrismaClient } = require('@prisma/client');
const {
  createCheckoutSession,
  createPortalSession,
  handleWebhook,
} = require('../services/stripe.service');

const prisma = new PrismaClient();

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

async function getAdminOrg(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { org: true },
  });
  return { user, org: user?.org };
}

// POST /api/stripe/checkout — create Stripe Checkout session (admin only)
router.post('/checkout', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { priceId, successUrl, returnUrl } = req.body;
    if (!successUrl || typeof successUrl !== 'string' || successUrl.length > 2000) {
      return res.status(400).json({ error: 'successUrl is required and must be a valid URL' });
    }
    if (!returnUrl || typeof returnUrl !== 'string' || returnUrl.length > 2000) {
      return res.status(400).json({ error: 'returnUrl is required and must be a valid URL' });
    }

    const { user, org } = await getAdminOrg(req.user.id);
    if (!org) return res.status(404).json({ error: 'Organisation not found' });

    const result = await createCheckoutSession(org, user.email, priceId, successUrl, returnUrl);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

// POST /api/stripe/portal — create billing portal session (admin only)
router.post('/portal', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { returnUrl } = req.body;
    if (!returnUrl || typeof returnUrl !== 'string' || returnUrl.length > 2000) {
      return res.status(400).json({ error: 'returnUrl is required and must be a valid URL' });
    }

    const { org } = await getAdminOrg(req.user.id);
    if (!org) return res.status(404).json({ error: 'Organisation not found' });

    const result = await createPortalSession(org, returnUrl);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

// POST /api/stripe/webhook — Stripe webhook (raw body, no auth)
// NOTE: express.raw() is applied in index.js before this route
router.post('/webhook', async (req, res, next) => {
  try {
    const sig = req.headers['stripe-signature'];
    if (!sig) return res.status(400).json({ error: 'Missing stripe-signature header' });

    const result = await handleWebhook(req.body, sig);
    res.json(result);
  } catch (e) {
    // Return clean JSON, not a stack trace
    const status = e.status || 400;
    res.status(status).json({ error: e.message || 'Webhook error' });
  }
});

// GET /api/stripe/status — billing status for the current user's org
router.get('/status', authenticate, async (req, res, next) => {
  try {
    const { org } = await getAdminOrg(req.user.id);
    if (!org) return res.status(404).json({ error: 'Organisation not found' });

    // Determine reset date for display
    const now = new Date();
    const resetAt = org.captureResetAt || now;
    const nextReset = new Date(resetAt.getFullYear(), resetAt.getMonth() + 1, 1);

    res.json({
      plan: org.plan,
      capturesThisMonth: org.capturesThisMonth,
      limit: org.plan === 'free' ? 10 : null,
      resetAt: nextReset.toISOString(),
      stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
