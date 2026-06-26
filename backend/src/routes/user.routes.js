const router = require('express').Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const prisma = new PrismaClient();

const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
    filename: (req, file, cb) => cb(null, `avatar-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, file.mimetype.startsWith('image/')),
});

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const base = req.orgId ? { orgId: req.orgId } : {};
    const where = req.query.assignable === 'true'
      ? { ...base, isActive: true, role: { not: 'admin' } }
      : req.query.activeOnly === 'true' ? { ...base, isActive: true } : base;
    const users = await prisma.user.findMany({
      where,
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true }
    });
    res.json(users);
  } catch (e) { next(e); }
});

router.post('/', requireRole('admin'), async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body;
    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hashed, name, role, orgId: req.orgId },
      select: { id: true, email: true, name: true, role: true, isActive: true }
    });
    res.status(201).json(user);
  } catch (e) { next(e); }
});

router.put('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const { password, ...data } = req.body;
    if (password) data.password = await bcrypt.hash(password, 12);
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, email: true, name: true, role: true, isActive: true }
    });
    res.json(user);
  } catch (e) { next(e); }
});

router.delete('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true });
  } catch (e) { next(e); }
});

// Self-update: any authenticated user can update their own name/email/password
router.put('/me', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const data = {};
    if (name) data.name = name;
    if (email) data.email = email;
    if (password) data.password = await bcrypt.hash(password, 12);
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: { id: true, email: true, name: true, role: true, isActive: true, avatar: true },
    });
    res.json(user);
  } catch (e) { next(e); }
});

router.post('/me/avatar', avatarUpload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    const avatarUrl = `/uploads/${req.file.filename}`;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatar: avatarUrl },
      select: { id: true, email: true, name: true, role: true, avatar: true },
    });
    res.json(user);
  } catch (e) { next(e); }
});

module.exports = router;
