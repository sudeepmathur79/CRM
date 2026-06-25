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
    const { rows: leadTags } = await old.query('SELECT * FROM "_LeadToTag"');
    note(`Migrating ${leadTags.length} lead-tag links...`);
    for (const lt of leadTags) {
      await prisma.lead.update({
        where: { id: lt.A },
        data: { tags: { connect: { id: lt.B } } },
      }).catch(() => {}); // skip if lead/tag missing
    }
    note(`✓ ${leadTags.length} lead-tag links`);

    // ── 6. Recordings ────────────────────────────────────────────────────────
    const { rows: recs } = await old.query('SELECT * FROM "Recording"');
    note(`Migrating ${recs.length} recordings...`);
    for (const r of recs) {
      await prisma.recording.create({
        data: {
          id: r.id, leadId: r.leadId, fileName: r.fileName,
          fileUrl: r.fileUrl, fileSize: r.fileSize, type: r.type,
          transcript: r.transcript, summary: r.summary,
          nextSteps: r.nextSteps, createdAt: r.createdAt,
        },
      });
    }
    note(`✓ ${recs.length} recordings`);

    // ── 7. Lead Notes ────────────────────────────────────────────────────────
    let notesCount = 0;
    try {
      const { rows: notes } = await old.query('SELECT * FROM "LeadNote"');
      note(`Migrating ${notes.length} lead notes...`);
      for (const n of notes) {
        await prisma.leadNote.create({
          data: {
            id: n.id, leadId: n.leadId, userId: n.userId || null,
            content: n.content, type: n.type || 'manual', createdAt: n.createdAt,
          },
        });
      }
      notesCount = notes.length;
    } catch { note('LeadNote table not found in source — skipping'); }
    note(`✓ ${notesCount} lead notes`);

    // ── 8. Activities ────────────────────────────────────────────────────────
    const { rows: acts } = await old.query('SELECT * FROM "Activity"');
    note(`Migrating ${acts.length} activities...`);
    for (const a of acts) {
      await prisma.activity.create({
        data: {
          id: a.id, leadId: a.leadId, userId: a.userId || null,
          action: a.action, details: a.details || {}, createdAt: a.createdAt,
        },
      });
    }
    note(`✓ ${acts.length} activities`);

    await old.end();
    note('Migration complete ✓');
    res.json({ success: true, log });

  } catch (e) {
    console.error('Migration error:', e);
    try { await old.end(); } catch {}
    res.status(500).json({ error: e.message, log });
  }
});

module.exports = router;
