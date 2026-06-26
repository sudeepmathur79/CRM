const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const {
  signup, register, login, googleLogin,
  setup2FA, enable2FA, disable2FA, verify2FALogin,
  refresh,
} = require('../services/auth.service');
const { authenticate } = require('../middleware/auth.middleware');
const prisma = new PrismaClient();

// Self-service signup — creates a new organisation + admin user
router.post('/signup', async (req, res, next) => {
  try {
    const data = await signup(req.body);
    res.status(201).json(data);
  } catch (e) { next(e); }
});

// One-time setup — only works when the database has zero users
router.post('/setup', async (req, res, next) => {
  try {
    const count = await prisma.user.count();
    if (count > 0) return res.status(403).json({ error: 'Setup already complete. Use /login instead.' });
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'name, email and password are required' });
    const data = await register({ name, email, password, role: 'admin' });
    res.status(201).json(data);
  } catch (e) { next(e); }
});

// Password login — may return requiresTwoFactor + tempToken instead of full JWT
router.post('/login', async (req, res, next) => {
  try {
    const data = await login(req.body);
    res.json(data);
  } catch (e) { next(e); }
});

// Google SSO — verifies credential (ID token from frontend), checks email is pre-registered
router.post('/google', async (req, res, next) => {
  try {
    const data = await googleLogin(req.body);
    res.json(data);
  } catch (e) { next(e); }
});

// Complete 2FA login — submit TOTP code + tempToken → get full JWT
router.post('/2fa/verify-login', async (req, res, next) => {
  try {
    const data = await verify2FALogin(req.body);
    res.json(data);
  } catch (e) { next(e); }
});

// ── Protected 2FA management ──────────────────────────────────────────────────

// Start 2FA setup — returns secret + QR code (user scans with Authenticator app)
router.post('/2fa/setup', authenticate, async (req, res, next) => {
  try {
    const data = await setup2FA(req.user.id);
    res.json(data);
  } catch (e) { next(e); }
});

// Confirm 2FA — verify first code to activate
router.post('/2fa/enable', authenticate, async (req, res, next) => {
  try {
    const data = await enable2FA(req.user.id, req.body.code);
    res.json(data);
  } catch (e) { next(e); }
});

// Disable 2FA — requires current TOTP code
router.post('/2fa/disable', authenticate, async (req, res, next) => {
  try {
    const data = await disable2FA(req.user.id, req.body.code);
    res.json(data);
  } catch (e) { next(e); }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const tokens = await refresh(req.body.refreshToken);
    res.json(tokens);
  } catch (e) { next(e); }
});

router.get('/me', authenticate, async (req, res) => {
  const { id, email, name, role, twoFactorEnabled, avatar, orgId,
    personalCrmBccEmail, targetCrmType, autoExportOnCapture } = req.user;
  let org = null;
  if (orgId) {
    const orgRecord = await prisma.organisation.findUnique({
      where: { id: orgId },
      select: { id: true, name: true, plan: true, trialEndsAt: true, demoMode: true, demoDisabledAt: true },
    });
    org = orgRecord;
  }
  res.json({ id, email, name, role, twoFactorEnabled, avatar, orgId,
    personalCrmBccEmail, targetCrmType, autoExportOnCapture, org });
});

module.exports = router;
