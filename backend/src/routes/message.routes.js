const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth.middleware');
const prisma = new PrismaClient();

router.use(authenticate);

const USER_SELECT = { id: true, name: true, role: true };
const MSG_INCLUDE = {
  from: { select: USER_SELECT },
  to: { select: USER_SELECT },
  lead: { select: { id: true, name: true, company: true } },
};

// GET /api/messages — inbox: all conversations involving me
router.get('/', async (req, res, next) => {
  try {
    const me = req.user.id;
    const messages = await prisma.message.findMany({
      where: { OR: [{ fromId: me }, { toId: me }] },
      include: MSG_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });

    // Group into conversations keyed by the other person's id
    const convMap = {};
    for (const m of messages) {
      const otherId = m.fromId === me ? m.toId : m.fromId;
      const other = m.fromId === me ? m.to : m.from;
      if (!convMap[otherId]) {
        convMap[otherId] = { user: other, messages: [], unread: 0 };
      }
      convMap[otherId].messages.push(m);
      if (!m.read && m.toId === me) convMap[otherId].unread++;
    }
    res.json(Object.values(convMap));
  } catch (e) { next(e); }
});

// GET /api/messages/unread-count
router.get('/unread-count', async (req, res, next) => {
  try {
    const count = await prisma.message.count({ where: { toId: req.user.id, read: false } });
    res.json({ count });
  } catch (e) { next(e); }
});

// GET /api/messages/:userId — thread with one user
router.get('/:userId', async (req, res, next) => {
  try {
    const me = req.user.id;
    const other = req.params.userId;
    const messages = await prisma.message.findMany({
      where: { OR: [{ fromId: me, toId: other }, { fromId: other, toId: me }] },
      include: MSG_INCLUDE,
      orderBy: { createdAt: 'asc' },
    });
    // Mark received messages as read
    await prisma.message.updateMany({ where: { fromId: other, toId: me, read: false }, data: { read: true } });
    res.json(messages);
  } catch (e) { next(e); }
});

// POST /api/messages — send a message
router.post('/', async (req, res, next) => {
  try {
    const { toId, body, leadId } = req.body;
    if (!toId || !body?.trim()) return res.status(400).json({ error: 'toId and body are required' });
    const recipient = await prisma.user.findUnique({ where: { id: toId } });
    if (!recipient) return res.status(404).json({ error: 'Recipient not found' });

    const msg = await prisma.message.create({
      data: { fromId: req.user.id, toId, body: body.trim(), leadId: leadId || null },
      include: MSG_INCLUDE,
    });

    // Emit via Socket.io if available
    const io = req.app.get('io');
    if (io) io.to(`user:${toId}`).emit('message:new', msg);

    res.status(201).json(msg);
  } catch (e) { next(e); }
});

// PATCH /api/messages/:id/read
router.patch('/:id/read', async (req, res, next) => {
  try {
    const msg = await prisma.message.update({
      where: { id: req.params.id, toId: req.user.id },
      data: { read: true },
    });
    res.json(msg);
  } catch (e) { next(e); }
});

module.exports = router;
