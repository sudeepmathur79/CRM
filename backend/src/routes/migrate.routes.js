// ONE-TIME DATA MIGRATION ROUTE
// Copies all data from an old Postgres DB into the current (Neon) DB.
// Deletes itself from the route table after one successful run.
// Protected by MIGRATE_SECRET env var.

const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { Client } = require('pg');

const prisma = new PrismaClient();

router.post('/run', async (req, res) => {
  const secret = req.headers['x-migrate-secret'];
  if (!secret || secret !== process.env.MIGRATE_SECRET) {
    return res.status(403).json({ error: 'Forbidden — set MIGRATE_SECRET env var and pass it as X-Migrate-Secret header' });
  }

  const { sourceUrl } = req.body;
  if (!sourceUrl) return res.status(400).json({ error: 'sourceUrl required in request body' });

  const old = new Client({ connectionString: sourceUrl, ssl: { rejectUnauthorized: false } });
  const log = [];
  const note = (msg) => { console.log(msg); log.push(msg); };

  try {
    await old.connect();
    note('Connected to source database');

    // ── 1. Clear seed/dummy data from Neon ──────────────────────────────────
    note('Clearing dummy data from Neon...');
    await prisma.activity.deleteMany({});
    await prisma.leadNote.deleteMany({});
    await prisma.recording.deleteMany({});
    await prisma.lead.deleteMany({});
    await prisma.tag.deleteMany({});
    await prisma.user.deleteMany({});
    note('Neon cleared');

    // ── 2. Users ─────────────────────────────────────────────────────────────
    const { rows: users } = await old.query('SELECT * FROM "User"');
    note(`Migrating ${users.length} users...`);
    for (const u of users) {
      await prisma.user.create({
        data: {
          id: u.id, email: u.email, password: u.password,
          name: u.name, role: u.role, isActive: u.isActive ?? true,
          createdAt: u.createdAt,
        },
      });
    }
    note(`✓ ${users.length} users`);

    // ── 3. Tags ──────────────────────────────────────────────────────────────
    const { rows: tags } = await old.query('SELECT * FROM "Tag"');
    note(`Migrating ${tags.length} tags...`);
    for (const t of tags) {
      await prisma.tag.create({ data: { id: t.id, name: t.name, color: t.color } });
    }
    note(`✓ ${tags.length} tags`);

    // ── 4. Leads ─────────────────────────────────────────────────────────────
    const { rows: leads } = await old.query('SELECT * FROM "Lead"');
    note(`Migrating ${leads.length} leads...`);
    for (const l of leads) {
      await prisma.lead.create({
        data: {
          id: l.id, name: l.name, email: l.email, phone: l.phone,
          company: l.company, status: l.status, source: l.source,
          notes: l.notes, nextFollowUp: l.nextFollowUp,
          assignedToId: l.assignedToId || null,
          archived: l.archived ?? false,
          archiveLabel: l.archiveLabel || null,
          archivedAt: l.archivedAt || null,
          createdAt: l.createdAt, updatedAt: l.updatedAt,
        },
      });
    }
    note(`✓ ${leads.length} leads`);

    // ── 5. Lead ↔ Tag join table ─────────────────────────────────────────────
    try {
      const { rows: leadTags } = await old.query('SELECT * FROM "_LeadToTag"');
      note(`Migrating ${leadTags.length} lead-tag links...`);
      for (const lt of leadTags) {
        await prisma.lead.update({
          where: { id: lt.A },
          data: { tags: { connect: { id: lt.B } } },
        }).catch(() => {});
      }
      note(`✓ ${leadTags.length} lead-tag links`);
    } catch (e) { note(`⚠ lead-tag links skipped: ${e.message}`); }

    // ── 6. Recordings ────────────────────────────────────────────────────────
    try {
      const { rows: recs } = await old.query('SELECT * FROM "Recording"');
      note(`Migrating ${recs.length} recordings...`);
      for (const r of recs) {
        await prisma.recording.create({
          data: {
            id: r.id, leadId: r.leadId, fileName: r.fileName,
            fileUrl: r.fileUrl, fileSize: r.fileSize ?? 0, type: r.type ?? 'file',
            transcript: r.transcript ?? null, summary: r.summary ?? null,
            nextSteps: r.nextSteps ?? null, createdAt: r.createdAt,
          },
        }).catch(e => note(`  skip recording ${r.id}: ${e.message}`));
      }
      note(`✓ ${recs.length} recordings`);
    } catch (e) { note(`⚠ recordings skipped: ${e.message}`); }

    // ── 7. Lead Notes ────────────────────────────────────────────────────────
    try {
      const { rows: notes } = await old.query('SELECT * FROM "LeadNote"');
      note(`Migrating ${notes.length} lead notes...`);
      for (const n of notes) {
        await prisma.leadNote.create({
          data: {
            id: n.id, leadId: n.leadId, userId: n.userId || null,
            content: n.content, type: n.type || 'manual', createdAt: n.createdAt,
          },
        }).catch(e => note(`  skip note ${n.id}: ${e.message}`));
      }
      note(`✓ ${notes.length} lead notes`);
    } catch (e) { note(`⚠ lead notes skipped: ${e.message}`); }

    // ── 8. Activities ────────────────────────────────────────────────────────
    try {
      const { rows: acts } = await old.query('SELECT * FROM "Activity"');
      note(`Migrating ${acts.length} activities...`);
      for (const a of acts) {
        await prisma.activity.create({
          data: {
            id: a.id, leadId: a.leadId, userId: a.userId || null,
            action: a.action, details: a.details || {}, createdAt: a.createdAt,
          },
        }).catch(e => note(`  skip activity ${a.id}: ${e.message}`));
      }
      note(`✓ ${acts.length} activities`);
    } catch (e) { note(`⚠ activities skipped: ${e.message}`); }

    await old.end();
    note('Migration complete ✓');
    res.json({ success: true, log });

  } catch (e) {
    console.error('Migration error:', e);
    try { await old.end(); } catch {}
    res.status(500).json({ error: e.message, log });
  }
});

// Test email endpoint — admin only, protected by MIGRATE_SECRET
router.post('/test-email', async (req, res, next) => {
  try {
    const { secret, to } = req.body;
    if (!secret || secret !== process.env.MIGRATE_SECRET) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { sendMail } = require('../services/mailer');
    const result = await sendMail({
      to,
      subject: 'SalesFlow CRM — email test',
      html: '<h2>Email is working ✅</h2><p>SMTP via Brevo is configured correctly on SalesFlow CRM.</p>',
      text: 'Email is working. SMTP via Brevo is configured correctly on SalesFlow CRM.',
    });
    res.json({ ok: true, messageId: result.messageId });
  } catch (e) { next(e); }
});

module.exports = router;
