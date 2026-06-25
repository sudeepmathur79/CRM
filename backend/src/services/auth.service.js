const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { OAuth2Client } = require('google-auth-library');
const { authenticator } = require('otplib');
const QRCode = require('qrcode');
const prisma = new PrismaClient();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateTokens = (userId) => ({
  accessToken: jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '15m' }),
  refreshToken: jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, { expiresIn: '7d' }),
});

// Temporary token issued mid-login when 2FA is required (5-minute TTL)
const generateTempToken = (userId) =>
  jwt.sign({ userId, step: '2fa' }, process.env.JWT_SECRET, { expiresIn: '5m' });

const safeUser = (u) => ({
  id: u.id, email: u.email, name: u.name, role: u.role,
  twoFactorEnabled: u.twoFactorEnabled,
});

// ── Password-based register (admin-inviting a new user) ──────────────────────
const register = async ({ email, password, name, role = 'agent' }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw Object.assign(new Error('Email already in use'), { status: 400 });
  const hashed = password ? await bcrypt.hash(password, 12) : null;
  const user = await prisma.user.create({ data: { email, password: hashed, name, role } });
  const tokens = generateTokens(user.id);
  return { user: safeUser(user), ...tokens };
};

// ── Password login — returns full tokens OR a tempToken if 2FA is active ─────
const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  if (!user.password) throw Object.assign(new Error('This account uses Google Sign-In'), { status: 401 });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

  if (user.twoFactorEnabled) {
    return { requiresTwoFactor: true, tempToken: generateTempToken(user.id) };
  }

  const tokens = generateTokens(user.id);
  return { user: safeUser(user), ...tokens };
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
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw Object.assign(new Error('No account found for this Google address. Ask your admin to add you.'), { status: 403 });
  if (!user.isActive) throw Object.assign(new Error('Account is inactive'), { status: 403 });

  // Link googleId on first Google login
  if (!user.googleId) {
    await prisma.user.update({ where: { id: user.id }, data: { googleId } });
  }

  const tokens = generateTokens(user.id);
  return { user: safeUser(user), ...tokens };
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

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || !user.isActive || !user.twoFactorEnabled) throw Object.assign(new Error('Invalid session'), { status: 401 });
  const valid = authenticator.verify({ token: code, secret: user.twoFactorSecret });
  if (!valid) throw Object.assign(new Error('Invalid authenticator code'), { status: 400 });

  const tokens = generateTokens(user.id);
  return { user: safeUser(user), ...tokens };
};

// ── Token refresh ─────────────────────────────────────────────────────────────
const refresh = async (token) => {
  try {
    const { userId } = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) throw new Error();
    return generateTokens(userId);
  } catch {
    throw Object.assign(new Error('Invalid refresh token'), { status: 401 });
  }
};

module.exports = { register, login, googleLogin, setup2FA, enable2FA, disable2FA, verify2FALogin, refresh };
