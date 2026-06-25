const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const generateTokens = (userId) => ({
  accessToken: jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '15m' }),
  refreshToken: jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' }),
});

const register = async ({ email, password, name, role = 'agent' }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw Object.assign(new Error('Email already in use'), { status: 400 });
  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({ data: { email, password: hashed, name, role } });
  const tokens = generateTokens(user.id);
  return { user: { id: user.id, email: user.email, name: user.name, role: user.role }, ...tokens };
};

const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  const tokens = generateTokens(user.id);
  return { user: { id: user.id, email: user.email, name: user.name, role: user.role }, ...tokens };
};

const refresh = async (token) => {
  try {
    const { userId } = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) throw new Error();
    return generateTokens(userId);
  } catch {
    throw Object.assign(new Error('Invalid refresh token'), { status: 401 });
  }
};

module.exports = { register, login, refresh };
