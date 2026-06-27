const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { seedDemoData } = require('./demo.service');
const { PrismaClient } = require('@prisma/client');
const { OAuth2Client } = require('google-auth-library');
const { authenticator } = require('otplib');
const QRCode = require('qrcode');
const { sendMail } = require('./mailer');
const prisma = new PrismaClient();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ── Cloudflare Turnstile token verification ───────────────────────────────────
async function verifyTurnstile(token) {
  // If no secret is configured, skip verification (dev/test environments)
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || !token) return;

  const body = new URLSearchParams({ secret, response: token });
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const data = await res.json();
  if (!data.success) {
    throw Object.assign(new Error('CAPTCHA verification failed. Please try again.'), { status: 400 });
  }
}

const generateTokens = (userId, orgId) => ({
  accessToken: jwt.sign({ userId, orgId }, process.env.JWT_SECRET, { expiresIn: '15m' }),
  refreshToken: jwt.sign({ userId, orgId }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, { expiresIn: '7d' }),
});

// Temporary token issued mid-login when 2FA is required (5-minute TTL)
const generateTempToken = (userId) =>
  jwt.sign({ userId, step: '2fa' }, process.env.JWT_SECRET, { expiresIn: '5m' });

const safeUser = (u) => ({
  id: u.id, email: u.email, name: u.name, role: u.role,
  twoFactorEnabled: u.twoFactorEnabled, orgId: u.orgId,
});

// ── Self-service signup — creates org + first admin user ─────────────────────
const signup = async ({ orgName, email, password, name, captchaToken }) => {
  if (!orgName || !email || !password || !name) {
    throw Object.assign(new Error('orgName, name, email and password are required'), { status: 400 });
  }
  await verifyTurnstile(captchaToken);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw Object.assign(new Error('Email already in use'), { status: 400 });

  const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
  const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  const hashed = await bcrypt.hash(password, 12);
  const verifyToken = crypto.randomBytes(32).toString('hex');

  const [org, user] = await prisma.$transaction(async (tx) => {
    const o = await tx.organisation.create({
      data: { name: orgName, slug, trialEndsAt },
    });
    await seedDefaultAgents(tx, o.id);
    const u = await tx.user.create({
      data: { email, password: hashed, name, role: 'admin', orgId: o.id, emailVerifyToken: verifyToken },
    });
    await seedDemoData(tx, o.id, u.id);
    return [o, u];
  });

  // Send verification email — non-fatal if mailer isn't configured
  const appUrl = process.env.APP_PUBLIC_URL || process.env.RENDER_EXTERNAL_URL?.replace(/\/$/, '') || 'http://localhost:3000';
  const verifyUrl = `${appUrl}/verify-email?token=${verifyToken}`;
  sendMail({
    to: email,
    subject: 'Verify your SalesFlow CRM email',
    html: `<p>Hi ${name},</p>
<p>Thanks for signing up! Click the link below to verify your email address and activate your account:</p>
<p><a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">Verify email address</a></p>
<p>This link expires in 24 hours. If you didn't sign up for SalesFlow CRM, you can ignore this email.</p>`,
    text: `Verify your SalesFlow CRM email:\n\n${verifyUrl}\n\nThis link expires in 24 hours.`,
  }).catch(err => console.error('[auth] verification email failed:', err.message));

  // Return requiresVerification flag instead of tokens — frontend shows "check your email" screen
  return { requiresVerification: true, email };
};

// ── Password-based register (admin-inviting a new user) ──────────────────────
const register = async ({ email, password, name, role = 'agent', orgId }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw Object.assign(new Error('Email already in use'), { status: 400 });
  const hashed = password ? await bcrypt.hash(password, 12) : null;
  const user = await prisma.user.create({ data: { email, password: hashed, name, role, orgId } });
  const tokens = generateTokens(user.id, orgId);
  return { user: safeUser(user), ...tokens };
};

// ── Password login — returns full tokens OR a tempToken if 2FA is active ─────
const login = async ({ email, password, captchaToken }) => {
  if (!email || !password) throw Object.assign(new Error('Email and password are required'), { status: 400 });
  await verifyTurnstile(captchaToken);

  const user = await prisma.user.findUnique({ where: { email }, include: { org: true } });
  if (!user || !user.isActive) throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  if (!user.password) throw Object.assign(new Error('This account uses Google Sign-In'), { status: 401 });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

  // Block unverified self-signup accounts — admin-invited users skip verification
  if (!user.emailVerifiedAt && user.emailVerifyToken) {
    throw Object.assign(
      new Error('Please verify your email address before logging in. Check your inbox for the verification link.'),
      { status: 403, code: 'EMAIL_NOT_VERIFIED', email: user.email }
    );
  }

  if (user.twoFactorEnabled) {
    return { requiresTwoFactor: true, tempToken: generateTempToken(user.id) };
  }

  const tokens = generateTokens(user.id, user.orgId);
  const org = user.org ? { id: user.org.id, name: user.org.name, plan: user.org.plan, trialEndsAt: user.org.trialEndsAt } : null;
  return { user: safeUser(user), org, ...tokens };
};

// ── Google SSO — verifies ID token, checks email is pre-registered ───────────
const googleLogin = async ({ credential }) => {
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    throw Object.assign(new Error('Invalid Google token'), { status: 401 });
  }

  const { email, name, sub: googleId } = payload;
  const user = await prisma.user.findUnique({ where: { email }, include: { org: true } });
  if (!user) throw Object.assign(new Error('No account found for this Google address. Ask your admin to add you.'), { status: 403 });
  if (!user.isActive) throw Object.assign(new Error('Account is inactive'), { status: 403 });

  if (!user.googleId) {
    await prisma.user.update({ where: { id: user.id }, data: { googleId } });
  }

  const tokens = generateTokens(user.id, user.orgId);
  const org = user.org ? { id: user.org.id, name: user.org.name, plan: user.org.plan, trialEndsAt: user.org.trialEndsAt } : null;
  return { user: safeUser(user), org, ...tokens };
};

// ── 2FA setup — generate secret + QR code ────────────────────────────────────
const setup2FA = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(user.email, 'CRM', secret);
  const qrCode = await QRCode.toDataURL(otpauth);

  // Store secret temporarily — only activated once user verifies
  await prisma.user.update({ where: { id: userId }, data: { twoFactorSecret: secret } });
  return { secret, qrCode };
};

// ── 2FA enable — verify first code, then mark enabled ────────────────────────
const enable2FA = async (userId, code) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.twoFactorSecret) throw Object.assign(new Error('2FA setup not started'), { status: 400 });
  const valid = authenticator.verify({ token: code, secret: user.twoFactorSecret });
  if (!valid) throw Object.assign(new Error('Invalid code'), { status: 400 });
  await prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: true } });
  return { ok: true };
};

// ── 2FA disable ───────────────────────────────────────────────────────────────
const disable2FA = async (userId, code) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.twoFactorEnabled) throw Object.assign(new Error('2FA not enabled'), { status: 400 });
  const valid = authenticator.verify({ token: code, secret: user.twoFactorSecret });
  if (!valid) throw Object.assign(new Error('Invalid code'), { status: 400 });
  await prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: false, twoFactorSecret: null } });
  return { ok: true };
};

// ── Complete login after 2FA code verified ────────────────────────────────────
const verify2FALogin = async ({ tempToken, code }) => {
  let payload;
  try {
    payload = jwt.verify(tempToken, process.env.JWT_SECRET);
  } catch {
    throw Object.assign(new Error('Session expired, please log in again'), { status: 401 });
  }
  if (payload.step !== '2fa') throw Object.assign(new Error('Invalid token'), { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: payload.userId }, include: { org: true } });
  if (!user || !user.isActive || !user.twoFactorEnabled) throw Object.assign(new Error('Invalid session'), { status: 401 });
  const valid = authenticator.verify({ token: code, secret: user.twoFactorSecret });
  if (!valid) throw Object.assign(new Error('Invalid authenticator code'), { status: 400 });

  const tokens = generateTokens(user.id, user.orgId);
  const org = user.org ? { id: user.org.id, name: user.org.name, plan: user.org.plan, trialEndsAt: user.org.trialEndsAt } : null;
  return { user: safeUser(user), org, ...tokens };
};

// ── Token refresh ─────────────────────────────────────────────────────────────
const refresh = async (token) => {
  try {
    const { userId } = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) throw new Error();
    return generateTokens(userId, user.orgId);
  } catch {
    throw Object.assign(new Error('Invalid refresh token'), { status: 401 });
  }
};

// ── Default agents seeded on org creation ─────────────────────────────────────
async function seedDefaultAgents(tx, orgId) {
  const defaults = [
    {
      name: 'Lead Qualifier',
      description: 'Automatically scores and qualifies new leads as they are created.',
      type: 'lead_qualifier',
      trigger: 'on_lead_created',
      promptTemplate: `You are a sales qualification expert. Analyze this new lead and provide:
1. A qualification score from 1-10 (10 = highest priority)
2. Key qualifying factors (2-3 bullet points)
3. Recommended next action

Lead details:
Name: {{lead.name}}
Company: {{lead.company}}
Source: {{lead.source}}
Value: {{lead.value}}
Notes: {{lead.notes}}

Respond in JSON: { "score": number, "factors": ["..."], "nextAction": "..." }`,
      config: {},
    },
    {
      name: 'Follow-up Drafter',
      description: 'Drafts a personalised follow-up message based on the lead\'s conversation history.',
      type: 'followup_drafter',
      trigger: 'manual',
      promptTemplate: `You are a sales professional. Draft a concise, personalised follow-up message for this lead.

Lead: {{lead.name}} at {{lead.company}}
Status: {{lead.status}}
Last note: {{lead.lastNote}}
Previous interactions: {{lead.activitySummary}}

Write a follow-up message (2-3 short paragraphs) that:
- References the last conversation naturally
- Adds value (insight, resource, or next step)
- Has a clear, low-friction call to action

Keep it warm, professional, and under 150 words.`,
      config: {},
    },
    {
      name: 'Deal Coach',
      description: 'Identifies stalled deals and suggests specific actions to move them forward.',
      type: 'deal_coach',
      trigger: 'on_stage_stuck',
      promptTemplate: `You are an experienced sales coach. This deal has been stuck in the "{{lead.status}}" stage for {{stuckDays}} days.

Lead: {{lead.name}} at {{lead.company}}
Deal value: {{lead.value}}
Last activity: {{lead.lastActivitySummary}}
Notes: {{lead.notes}}

Provide:
1. Why this deal is likely stalling (1-2 sentences)
2. Three specific actions to unblock it (numbered list)
3. A suggested re-engagement message (2 sentences)`,
      config: { stuckDays: 7 },
    },
    {
      name: 'Call Debrief',
      description: 'Generates a structured debrief after a call recording is uploaded.',
      type: 'call_debrief',
      trigger: 'on_recording_uploaded',
      promptTemplate: `You are a sales coach reviewing a call recording transcript. Provide a structured debrief.

Lead: {{lead.name}} at {{lead.company}}
Transcript: {{recording.transcript}}

Respond with:
**What went well:** (2-3 points)
**Watch out for:** (1-2 risks or objections raised)
**Commitments made:** (bullet list of any promises from either side)
**Next steps:** (specific, actionable, with suggested timing)`,
      config: {},
    },
    {
      name: 'Meeting Prep',
      description: 'Creates a briefing card before a scheduled follow-up call.',
      type: 'meeting_prep',
      trigger: 'manual',
      promptTemplate: `You are a sales assistant preparing a call briefing for a meeting happening today.

Lead: {{lead.name}}, {{lead.company}}
Status: {{lead.status}}
Deal value: {{lead.value}}
Recent notes: {{lead.recentNotes}}
Activity history: {{lead.activitySummary}}

Generate a concise meeting prep card:
**Context:** (1-2 sentence reminder of where the deal stands)
**Open questions to address:** (3 bullet points)
**Suggested talking points:** (3 bullet points)
**Goal for this call:** (one clear outcome to aim for)`,
      config: {},
    },
  ];

  await tx.agentConfig.createMany({
    data: defaults.map(d => ({ ...d, orgId, config: d.config })),
  });
}

// Public version (no transaction) — used to backfill orgs that missed seeding
async function seedDefaultAgentsForOrg(orgId) {
  await seedDefaultAgents(prisma, orgId);
}

module.exports = { signup, register, login, googleLogin, setup2FA, enable2FA, disable2FA, verify2FALogin, refresh, seedDefaultAgentsForOrg };
