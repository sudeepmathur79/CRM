const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth.middleware');
const { sendMail } = require('../services/mailer');
const { register } = require('../services/auth.service');
const crypto = require('crypto');

const prisma = new PrismaClient();

// All routes require authentication + superadmin or support role
router.use(authenticate);
router.use((req, res, next) => {
  if (!['superadmin', 'support'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
});

// ── Super admin: list all orgs ────────────────────────────────────────────────
router.get('/orgs', async (req, res, next) => {
  try {
    const orgs = await prisma.organisation.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, slug: true, plan: true,
        trialEndsAt: true, demoMode: true, createdAt: true,
        _count: { select: { users: true, leads: true } },
      },
    });
    res.json(orgs);
  } catch (e) { next(e); }
});

// ── Super admin: org detail (users only, no lead data) ────────────────────────
router.get('/orgs/:orgId', async (req, res, next) => {
  try {
    const org = await prisma.organisation.findUnique({
      where: { id: req.params.orgId },
      select: {
        id: true, name: true, slug: true, plan: true,
        trialEndsAt: true, demoMode: true, createdAt: true,
        users: {
          select: { id: true, name: true, email: true, role: true, emailVerifiedAt: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        },
        _count: { select: { leads: true, users: true } },
      },
    });
    if (!org) return res.status(404).json({ error: 'Org not found' });
    res.json(org);
  } catch (e) { next(e); }
});

// ── Superadmin: list support users ───────────────────────────────────────────
router.get('/support-users', async (req, res, next) => {
  if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const users = await prisma.user.findMany({
      where: { role: 'support' },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (e) { next(e); }
});

// ── Superadmin: create a support user ────────────────────────────────────────
router.post('/support-users', async (req, res, next) => {
  if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'name, email and password are required' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    const user = await register({ name, email, password, role: 'support', orgId: null });
    res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'An account with that email already exists' });
    next(e);
  }
});

// ── Superadmin: delete a support user ────────────────────────────────────────
router.delete('/support-users/:id', async (req, res, next) => {
  if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user || user.role !== 'support') return res.status(404).json({ error: 'Support user not found' });
    await prisma.supportSession.deleteMany({ where: { supportId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ── Support: request access to an org ────────────────────────────────────────
// Sends a 6-digit code to all admin users of the org.
// Support agent must hear the code back from the customer before accessing.
router.post('/orgs/:orgId/request-access', async (req, res, next) => {
  if (req.user.role !== 'support') return res.status(403).json({ error: 'Only support accounts can request access' });
  try {
    const org = await prisma.organisation.findUnique({
      where: { id: req.params.orgId },
      include: { users: { where: { role: 'admin' }, select: { email: true, name: true } } },
    });
    if (!org) return res.status(404).json({ error: 'Org not found' });

    const code = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
    const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour

    // Invalidate any prior pending sessions for this support+org pair
    await prisma.supportSession.deleteMany({
      where: { supportId: req.user.id, orgId: org.id, confirmed: false },
    });

    const session = await prisma.supportSession.create({
      data: { supportId: req.user.id, orgId: org.id, code, expiresAt },
    });

    // Email the code to all org admins
    for (const admin of org.users) {
      await sendMail({
        to: admin.email,
        subject: `SalesFlow Support Access Request — your verification code`,
        html: `
          <p>Hi ${admin.name},</p>
          <p>A SalesFlow customer support agent is requesting temporary access to your workspace <strong>${org.name}</strong>.</p>
          <p>Your verification code is:</p>
          <h1 style="letter-spacing:0.3em;font-size:42px;color:#4f46e5;font-family:monospace">${code}</h1>
          <p>Please read this code back to the support agent on your call or chat. <strong>Do not share it via email.</strong></p>
          <p>This code expires in 1 hour. If you did not request support, ignore this email.</p>
        `,
        text: `SalesFlow Support Access Request\n\nYour verification code: ${code}\n\nRead this to the support agent. Do not share via email. Expires in 1 hour.`,
      });
    }

    res.json({ sessionId: session.id, message: `Verification code sent to ${org.users.length} admin(s) of ${org.name}` });
  } catch (e) { next(e); }
});

// ── Support: confirm code (customer reads it back) ────────────────────────────
// Once confirmed, the support agent gets a session record they can use.
router.post('/sessions/:sessionId/confirm', async (req, res, next) => {
  if (req.user.role !== 'support') return res.status(403).json({ error: 'Only support accounts can confirm sessions' });
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Code is required' });

    const session = await prisma.supportSession.findFirst({
      where: { id: req.params.sessionId, supportId: req.user.id, confirmed: false },
    });

    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (new Date() > session.expiresAt) return res.status(400).json({ error: 'Code has expired. Request a new one.' });
    if (session.code !== String(code).trim()) return res.status(400).json({ error: 'Incorrect code' });

    await prisma.supportSession.update({
      where: { id: session.id },
      data: { confirmed: true, confirmedAt: new Date() },
    });

    res.json({ ok: true, orgId: session.orgId, message: 'Access confirmed. You may now assist this organisation.' });
  } catch (e) { next(e); }
});

// ── Support: check active sessions ───────────────────────────────────────────
router.get('/sessions', async (req, res, next) => {
  if (req.user.role !== 'support') return res.status(403).json({ error: 'Forbidden' });
  try {
    const sessions = await prisma.supportSession.findMany({
      where: { supportId: req.user.id, confirmed: true, expiresAt: { gt: new Date() } },
      include: { org: { select: { id: true, name: true, plan: true } } },
      orderBy: { confirmedAt: 'desc' },
    });
    res.json(sessions);
  } catch (e) { next(e); }
});

module.exports = router;
