const router = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const { extractLeadFromText, summarizeTranscript } = require('../services/ai.service');
const { routeExtractedLead } = require('../services/crmRouter.service');

router.use(authenticate);

router.post('/extract', async (req, res, next) => {
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

router.post('/summarize', async (req, res, next) => {
  try {
    const { transcript } = req.body;
    if (!transcript?.trim()) return res.status(400).json({ error: 'Transcript is required' });
    const summary = await summarizeTranscript(transcript);
    res.json({ summary });
  } catch (e) { next(e); }
});

module.exports = router;
