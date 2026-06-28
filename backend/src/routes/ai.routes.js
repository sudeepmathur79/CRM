const router = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const enforceCapureLimit = require('../middleware/captureLimit');
const { extractLeadFromText, summarizeTranscript, draftFollowUpEmail } = require('../services/ai.service');
const { routeExtractedLead } = require('../services/crmRouter.service');
const prisma = new (require('@prisma/client').PrismaClient)();
const multer = require('multer');
const os = require('os');
const path = require('path');
const fs = require('fs');

const audioUpload = multer({ dest: os.tmpdir(), limits: { fileSize: 25 * 1024 * 1024 } });

router.use(authenticate);

router.post('/extract', enforceCapureLimit, async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Text is required' });
    const extracted = await extractLeadFromText(text);

    // Route to connected CRM + save locally; never fail the extract response
    let syncResult = { synced: [], failed: [], localLeadId: null };
    try {
      syncResult = await routeExtractedLead(req.user.id, extracted, { saveLocally: true });
    } catch (syncErr) {
      console.error(`[ai/extract] routeExtractedLead threw unexpectedly userId=${req.user.id}: ${syncErr.message}`);
    }

    res.json({ ...extracted, _sync: syncResult });
  } catch (e) { next(e); }
});

// Audio transcription via Groq Whisper — used by the mobile app
router.post('/transcribe', audioUpload.single('audio'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No audio file uploaded' });
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) return res.status(503).json({ error: 'Transcription not configured (GROQ_API_KEY missing)' });

    const FormData = require('form-data');
    const form = new FormData();
    // Rename to .m4a so Groq recognises the format (Expo records .m4a by default)
    const ext = path.extname(req.file.originalname || '') || '.m4a';
    form.append('file', fs.createReadStream(req.file.path), { filename: `audio${ext}`, contentType: req.file.mimetype || 'audio/m4a' });
    form.append('model', 'whisper-large-v3');
    form.append('response_format', 'json');

    const fetch = (await import('node-fetch')).default;
    const resp = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${groqKey}`, ...form.getHeaders() },
      body: form,
    });
    const data = await resp.json();
    fs.unlink(req.file.path, () => {});

    if (!resp.ok) return res.status(502).json({ error: data.error?.message || 'Transcription failed' });
    res.json({ transcript: data.text });
  } catch (e) { fs.unlink(req.file?.path || '', () => {}); next(e); }
});

router.post('/summarize', async (req, res, next) => {
  try {
    const { transcript } = req.body;
    if (!transcript?.trim()) return res.status(400).json({ error: 'Transcript is required' });
    const summary = await summarizeTranscript(transcript);
    res.json({ summary });
  } catch (e) { next(e); }
});

router.post('/draft-email', async (req, res, next) => {
  try {
    const { leadId } = req.body;
    if (!leadId) return res.status(400).json({ error: 'leadId is required' });

    const lead = await prisma.lead.findFirst({ where: { id: leadId, orgId: req.user.orgId } });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const notes = await prisma.leadNote.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { content: true, createdAt: true },
    });

    const notesText = notes.map(n => n.content).join('\n---\n');

    let draft;
    try {
      draft = await draftFollowUpEmail({ leadName: lead.name, company: lead.company, notes: notesText });
    } catch (aiErr) {
      console.error(`[ai/draft-email] AI error leadId=${leadId}: ${aiErr.message}`);
      return res.status(503).json({ error: 'AI service unavailable. Please try again.' });
    }

    res.json(draft);
  } catch (e) { next(e); }
});

module.exports = router;
