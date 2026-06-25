const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { register, login, refresh } = require('../services/auth.service');
const { authenticate } = require('../middleware/auth.middleware');
const prisma = new PrismaClient();

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

router.post('/register', async (req, res, next) => {
  try {
    const data = await register(req.body);
    res.status(201).json(data);
  } catch (e) { next(e); }
});

router.post('/login', async (req, res, next) => {
  try {
    const data = await login(req.body);
    res.json(data);
  } catch (e) { next(e); }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const tokens = await refresh(req.body.refreshToken);
    res.json(tokens);
  } catch (e) { next(e); }
});

router.get('/me', authenticate, (req, res) => {
  const { id, email, name, role } = req.user;
  res.json({ id, email, name, role });
});

module.exports = router;
