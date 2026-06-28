const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const { disableDemoMode } = require('../services/demo.service');
const prisma = new (require('@prisma/client').PrismaClient)();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

router.use(authenticate);

const UPLOADS_DIR = path.join(__dirname, '../../uploads/logos');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const logoStorage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${req.orgId}_${Date.now()}${ext}`);
  },
});
const logoUpload = multer({
  storage: logoStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const ok = /^image\/(png|jpeg|jpg|svg\+xml|webp)$/.test(file.mimetype);
    cb(ok ? null : new Error('Only images allowed'), ok);
  },
});

// Get current org info (includes branding)
router.get('/', async (req, res, next) => {
  try {
    if (!req.orgId) return res.json(null);
    const org = await prisma.organisation.findUnique({
      where: { id: req.orgId },
      select: {
        id: true, name: true, plan: true, trialEndsAt: true,
        demoMode: true, demoDisabledAt: true, createdAt: true,
        brandPrimary: true, brandAccent: true, brandBg: true,
        brandLogoUrl: true, brandFaviconUrl: true,
      },
    });
    res.json(org);
  } catch (e) { next(e); }
});

// Update branding colours — admin only
router.put('/branding', requireRole('admin'), async (req, res, next) => {
  try {
    const { brandPrimary, brandAccent, brandBg } = req.body;
    const HEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
    const fields = {};
    if (brandPrimary !== undefined) {
      if (brandPrimary && !HEX.test(brandPrimary)) return res.status(400).json({ error: 'Invalid hex for brandPrimary' });
      fields.brandPrimary = brandPrimary || null;
    }
    if (brandAccent !== undefined) {
      if (brandAccent && !HEX.test(brandAccent)) return res.status(400).json({ error: 'Invalid hex for brandAccent' });
      fields.brandAccent = brandAccent || null;
    }
    if (brandBg !== undefined) {
      if (brandBg && !HEX.test(brandBg)) return res.status(400).json({ error: 'Invalid hex for brandBg' });
      fields.brandBg = brandBg || null;
    }
    const org = await prisma.organisation.update({
      where: { id: req.orgId },
      data: fields,
      select: { brandPrimary: true, brandAccent: true, brandBg: true, brandLogoUrl: true, brandFaviconUrl: true },
    });
    res.json(org);
  } catch (e) { next(e); }
});

// Upload logo — admin only
router.post('/branding/logo', requireRole('admin'), logoUpload.single('logo'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const logoUrl = `/uploads/logos/${req.file.filename}`;
    const org = await prisma.organisation.update({
      where: { id: req.orgId },
      data: { brandLogoUrl: logoUrl },
      select: { brandLogoUrl: true },
    });
    res.json(org);
  } catch (e) { next(e); }
});

// Upload favicon — admin only
router.post('/branding/favicon', requireRole('admin'), logoUpload.single('favicon'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = `/uploads/logos/${req.file.filename}`;
    const org = await prisma.organisation.update({
      where: { id: req.orgId },
      data: { brandFaviconUrl: url },
      select: { brandFaviconUrl: true },
    });
    res.json(org);
  } catch (e) { next(e); }
});

// Reset all branding to defaults
router.delete('/branding', requireRole('admin'), async (req, res, next) => {
  try {
    await prisma.organisation.update({
      where: { id: req.orgId },
      data: { brandPrimary: null, brandAccent: null, brandBg: null, brandLogoUrl: null, brandFaviconUrl: null },
    });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// Disable demo mode — admin only, one-way
router.post('/demo/disable', requireRole('admin'), async (req, res, next) => {
  try {
    if (!req.orgId) return res.status(400).json({ error: 'No organisation found' });
    const org = await disableDemoMode(req.orgId);
    res.json({ ok: true, demoMode: org.demoMode });
  } catch (e) { next(e); }
});

module.exports = router;
