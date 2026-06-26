const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth.middleware');
const prisma = new PrismaClient();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const orgId = req.orgId ?? null;
    res.json(await prisma.tag.findMany({ where: { orgId } }));
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const orgId = req.orgId ?? null;
    const tag = await prisma.tag.upsert({
      where: { name_orgId: { name: req.body.name, orgId } },
      update: {},
      create: { name: req.body.name, color: req.body.color || '#6366f1', orgId },
    });
    res.status(201).json(tag);
  } catch (e) { next(e); }
});

router.post('/lead/:leadId', async (req, res, next) => {
  try {
    const { tagNames } = req.body;
    const orgId = req.orgId ?? null;
    const tags = await Promise.all(tagNames.map(name =>
      prisma.tag.upsert({
        where: { name_orgId: { name, orgId } },
        update: {},
        create: { name, orgId },
      })
    ));
    await prisma.lead.update({
      where: { id: req.params.leadId },
      data: { tags: { set: tags.map(t => ({ id: t.id })) } },
    });
    res.json({ success: true });
  } catch (e) { next(e); }
});

module.exports = router;
