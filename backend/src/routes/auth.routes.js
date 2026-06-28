const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const {
  signup, register, login, googleLogin,
  setup2FA, enable2FA, disable2FA, verify2FALogin,
  refresh,
} = require('../services/auth.service');
const { sendMail } = require('../services/mailer');
const { authenticate } = require('../middleware/auth.middleware');
const crypto = require('crypto');
const prisma = new PrismaClient();

// Self-service signup — creates a new organisation + admin user
router.post('/signup', async (req, res, next) => {
  try {
    const data = await signup(req.body);
    res.status(201).json(data);
  } catch (e) { next(e); }
});

// One-time setup — only works when the database has zero users
// Delegates to signup so the first admin gets an org + default agents + demo data
router.post('/setup', async (req, res, next) => {
  try {
    const count = await prisma.user.count();
    if (count > 0) return res.status(403).json({ error: 'Setup already complete. Use /login instead.' });
    const { name, email, password, orgName } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'name, email and password are required' });
    const data = await signup({ orgName: orgName || `${name}'s Workspace`, name, email, password });
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

// Email verification — clicked from the link in the signup email
router.get('/verify-email', async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') return res.status(400).json({ error: 'Invalid verification link' });
    const user = await prisma.user.findFirst({ where: { emailVerifyToken: token } });
    if (!user) return res.status(400).json({ error: 'Verification link is invalid or has already been used' });
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date(), emailVerifyToken: null },
    });
    // Redirect to login with success flag rather than auto-logging in (more secure)
    const appUrl = process.env.APP_PUBLIC_URL || process.env.RENDER_EXTERNAL_URL?.replace(/\/$/, '') || '';
    res.redirect(`${appUrl}/login?verified=1`);
  } catch (e) { next(e); }
});

// Resend verification email — unauthenticated, rate-limited by address lookup
router.post('/resend-verification', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const user = await prisma.user.findUnique({ where: { email } });
    // Return success even if not found to avoid email enumeration
    if (!user || user.emailVerifiedAt || !user.emailVerifyToken) {
      return res.json({ ok: true });
    }
    const verifyToken = crypto.randomBytes(32).toString('hex');
    await prisma.user.update({ where: { id: user.id }, data: { emailVerifyToken: verifyToken } });
    const appUrl = process.env.APP_PUBLIC_URL || process.env.RENDER_EXTERNAL_URL?.replace(/\/$/, '') || 'http://localhost:3000';
    const verifyUrl = `${appUrl}/verify-email?token=${verifyToken}`;
    await sendMail({
      to: email,
      subject: 'Verify your SalesFlow CRM email',
      html: `<p>Hi ${user.name},</p><p>Here's a fresh verification link for your SalesFlow CRM account:</p>
<p><a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">Verify email address</a></p>
<p>This link expires in 24 hours.</p>`,
      text: `Verify your SalesFlow CRM email:\n\n${verifyUrl}`,
    });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ── Forgot password ──────────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const user = await prisma.user.findUnique({ where: { email } });
    // Always return ok to prevent email enumeration
    if (!user) return res.json({ ok: true });

    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpiry: expiry },
    });

    const appUrl = process.env.APP_PUBLIC_URL || 'https://crm-mjky.onrender.com';
    const resetUrl = `${appUrl}/reset-password?token=${token}`;
    await sendMail({
      to: email,
      subject: 'Reset your SalesFlow CRM password',
      html: `<h2>Password reset</h2><p>Click the link below to reset your password. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
      text: `Reset your SalesFlow CRM password:\n\n${resetUrl}\n\nThis link expires in 1 hour.`,
    });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and password are required' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const user = await prisma.user.findFirst({
      where: { passwordResetToken: token, passwordResetExpiry: { gt: new Date() } },
    });
    if (!user) return res.status(400).json({ error: 'Invalid or expired reset link' });

    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, passwordResetToken: null, passwordResetExpiry: null },
    });
    res.json({ ok: true });
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
