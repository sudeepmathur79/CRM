const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth.middleware');
const prisma = new PrismaClient();

router.use(authenticate);

// List my unresolved drafts
router.get('/', async (req, res, next) => {
  try {
    const drafts = await prisma.voiceDraft.findMany({
      where: { userId: req.user.id, resolved: false },
      orderBy: { createdAt: 'desc' },
    });
    res.json(drafts);
  } catch (e) { next(e); }
});

// Create a draft
router.post('/', async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Content required' });
    const draft = await prisma.voiceDraft.create({
      data: { userId: req.user.id, content },
    });
    res.status(201).json(draft);
  } catch (e) { next(e); }
});

// Resolve a draft (assign to lead as note, then mark resolved)
router.post('/:id/resolve', async (req, res, next) => {
  try {
    const { leadId } = req.body;
    const draft = await prisma.voiceDraft.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!draft) return res.status(404).json({ error: 'Not found' });
    if (leadId) {
      await prisma.leadNote.create({ data: { leadId, userId: req.user.id, content: draft.content, type: 'manual' } });
    }
    await prisma.voiceDraft.update({ where: { id: draft.id }, data: { resolved: true } });
    res.json({ success: true });
  } catch (e) { next(e); }
});

// Dismiss without assigning
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.voiceDraft.updateMany({ where: { id: req.params.id, userId: req.user.id }, data: { resolved: true } });
    res.json({ success: true });
  } catch (e) { next(e); }
});

module.exports = router;
