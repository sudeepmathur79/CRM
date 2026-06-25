const router = require('express').Router();
const { register, login, refresh } = require('../services/auth.service');
const { authenticate } = require('../middleware/auth.middleware');

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
