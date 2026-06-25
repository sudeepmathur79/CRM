const router = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const { extractLeadFromText, summarizeTranscript } = require('../services/ai.service');

router.use(authenticate);

router.post('/extract', async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Text is required' });
    const extracted = await extractLeadFromText(text);
    res.json(extracted);
  } catch (e) { next(e); }
});

router.post('/summarize', async (req, res, next) => {
  try {
    const { transcript } = req.body;
    if (!transcript?.trim()) return res.status(400).json({ error: 'Transcript is required' });
    const summary = await summarizeTranscript(transcript);
    res.json({ summary });
  } catch (e) { next(e); }
});

module.exports = router;
