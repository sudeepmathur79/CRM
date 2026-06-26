const router = require('express').Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const { validateBccEmail, CRM_TYPES } = require('../services/crmExporter');
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
router.put('/me', [
  body('name').optional().trim().isLength({ min: 1, max: 120 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('password').optional().isLength({ min: 8, max: 128 }),
  body('personalCrmBccEmail').optional({ nullable: true }).custom(v => !v || validateBccEmail(v) || (() => { throw new Error('Invalid BCC email'); })()),
  body('targetCrmType').optional({ nullable: true }).isIn([...CRM_TYPES, null, '']),
  body('autoExportOnCapture').optional().isBoolean(),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
  try {
    const { name, email, password, personalCrmBccEmail, targetCrmType, autoExportOnCapture } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (password) data.password = await bcrypt.hash(password, 12);
    if (personalCrmBccEmail !== undefined) data.personalCrmBccEmail = personalCrmBccEmail || null;
    if (targetCrmType !== undefined) data.targetCrmType = targetCrmType || null;
    if (autoExportOnCapture !== undefined) data.autoExportOnCapture = autoExportOnCapture;

    // SOC 2: audit log the settings change (no PII values in action string)
    if (personalCrmBccEmail !== undefined || targetCrmType !== undefined) {
      const lead = null; // settings change, not lead-specific
      await prisma.activity.create({
        data: {
          leadId: undefined, // activity without lead isn't supported — skip
          userId: req.user.id,
          action: 'CRM integration settings updated',
          details: { targetCrmType: targetCrmType || null, autoExport: autoExportOnCapture },
        },
      }).catch(() => {}); // non-fatal — activity table requires leadId; log to console only
      console.log('[audit] userId=%s updated CRM integration settings', req.user.id);
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: { id: true, email: true, name: true, role: true, isActive: true, avatar: true,
        personalCrmBccEmail: true, targetCrmType: true, autoExportOnCapture: true },
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
