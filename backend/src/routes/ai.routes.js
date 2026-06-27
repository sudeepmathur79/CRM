const router = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const enforceCapureLimit = require('../middleware/captureLimit');
const { extractLeadFromText, summarizeTranscript, draftFollowUpEmail } = require('../services/ai.service');
const { routeExtractedLead } = require('../services/crmRouter.service');
const prisma = new (require('@prisma/client').PrismaClient)();

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

    // Verify lead belongs to user's org
    const lead = await prisma.lead.findFirst({ where: { id: leadId, orgId: req.user.orgId } });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    // Load last 3 notes
    const notes = await prisma.leadNote.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { content: true, createdAt: true },
    });

    const notesText = notes.map(n => n.content).join('\n---\n');

    let draft;
    try {
      draft = await draftFollowUpEmail({
        leadName: lead.name,
        company: lead.company,
        notes: notesText,
      });
    } catch (aiErr) {
      console.error(`[ai/draft-email] AI error leadId=${leadId}: ${aiErr.message}`);
      return res.status(503).json({ error: 'AI service unavailable. Please try again.' });
    }

    res.json(draft);
  } catch (e) { next(e); }
});

module.exports = router;
