const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth.middleware');

const prisma = new PrismaClient();

// GET /api/onboarding/status
router.get('/status', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const orgId = req.orgId;
    const role = req.user.role;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        onboardingDismissed: true,
        targetCrmType: true,
        _count: {
          select: {
            createdLeads: true,
            voiceDrafts: true,
          },
        },
      },
    });

    // Step 1: has at least 1 lead
    const hasLead = (user._count.createdLeads || 0) > 0;

    // Step 2: has at least 1 voice draft or recording with transcript
    let hasVoiceCapture = (user._count.voiceDrafts || 0) > 0;
    if (!hasVoiceCapture) {
      const transcribedRecording = await prisma.recording.findFirst({
        where: {
          lead: { orgId },
          transcript: { not: null },
        },
        select: { id: true },
      });
      hasVoiceCapture = !!transcribedRecording;
    }

    // Step 3: invite teammate (admin only)
    let hasTeammate = true; // agents always pass
    if (role === 'admin' && orgId) {
      const orgUserCount = await prisma.user.count({ where: { orgId, isActive: true } });
      hasTeammate = orgUserCount > 1;
    }

    // Step 4: CRM connected
    const hasCrm = !!user.targetCrmType && user.targetCrmType !== 'none';

    const steps = [
      { id: 'add_lead', label: 'Add your first lead', done: hasLead },
      { id: 'voice_capture', label: 'Record a voice capture', done: hasVoiceCapture },
      { id: 'invite_teammate', label: 'Invite a teammate', done: hasTeammate, adminOnly: true },
      { id: 'connect_crm', label: 'Connect your CRM', done: hasCrm },
    ];

    const allDone = steps.every(s => s.done);

    res.json({ steps, allDone, dismissed: user.onboardingDismissed });
  } catch (err) {
    console.error('onboarding/status error');
    res.status(500).json({ error: 'Failed to load onboarding status' });
  }
});

// POST /api/onboarding/dismiss (idempotent)
router.post('/dismiss', authenticate, async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { onboardingDismissed: true },
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('onboarding/dismiss error');
    res.status(500).json({ error: 'Failed to dismiss onboarding' });
  }
});

module.exports = router;
