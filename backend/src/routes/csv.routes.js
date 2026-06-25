const router = require('express').Router();
const multer = require('multer');
const Papa = require('papaparse');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const { logActivity } = require('../services/lead.service');

const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authenticate);

// ── Column aliases ───────────────────────────────────────────────────────────
// Maps common CSV header variations → our field names
const FIELD_MAP = {
  name:          ['name', 'full name', 'fullname', 'contact name', 'lead name'],
  email:         ['email', 'email address', 'e-mail'],
  phone:         ['phone', 'phone number', 'mobile', 'cell', 'telephone'],
  company:       ['company', 'company name', 'organisation', 'organization', 'business'],
  status:        ['status', 'lead status', 'stage'],
  source:        ['source', 'lead source', 'channel'],
  notes:         ['notes', 'note', 'description', 'comments'],
  nextFollowUp:  ['next follow up', 'nextfollowup', 'follow up date', 'follow-up date', 'followup'],
};

const VALID_STATUSES = ['New', 'Contacted', 'Qualified', 'Proposal', 'Closed Won', 'Closed Lost'];
const VALID_SOURCES  = ['Website', 'Referral', 'LinkedIn', 'Cold Call', 'Email Campaign', 'Event', 'Other'];

function resolveHeader(raw) {
  const normalised = raw.trim().toLowerCase();
  for (const [field, aliases] of Object.entries(FIELD_MAP)) {
    if (aliases.includes(normalised)) return field;
  }
  return null;
}

function mapRow(rawRow) {
  const row = {};
  for (const [rawKey, value] of Object.entries(rawRow)) {
    const field = resolveHeader(rawKey);
    if (field) row[field] = typeof value === 'string' ? value.trim() : value;
  }
  return row;
}

function validateRow(row, index) {
  const errors = [];
  if (!row.name) errors.push('Name is required');
  if (!row.email && !row.phone) errors.push('Either email or phone is required');
  if (row.status && !VALID_STATUSES.includes(row.status))
    errors.push(`Status "${row.status}" not recognised — use: ${VALID_STATUSES.join(', ')}`);
  if (row.source && !VALID_SOURCES.includes(row.source))
    row.source = 'Other'; // coerce unknown sources rather than error
  return errors.length ? { row: index + 1, errors } : null;
}

// POST /api/csv/import — preview=true returns analysis only, preview=false executes
router.post('/import', requireRole('admin', 'agent'), upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const text = req.file.buffer.toString('utf8');
    const { data: rawRows, errors: parseErrors } = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: h => h.trim(),
    });

    if (parseErrors.length) return res.status(400).json({ error: 'CSV parse error', details: parseErrors });
    if (!rawRows.length) return res.status(400).json({ error: 'CSV file is empty' });

    const rows = rawRows.map(mapRow);

    // Detect unmapped columns
    const sampleRaw = Object.keys(rawRows[0] || {});
    const unmapped = sampleRaw.filter(k => !resolveHeader(k));

    // Validate all rows
    const rowErrors = rows.map(validateRow).filter(Boolean);
    const validRows = rows.filter((_, i) => !rowErrors.find(e => e.row === i + 1));

    // Duplicate detection against existing DB (email + phone)
    const emails = validRows.map(r => r.email).filter(Boolean);
    const phones = validRows.map(r => r.phone).filter(Boolean);
    const existing = await prisma.lead.findMany({
      where: { OR: [{ email: { in: emails } }, { phone: { in: phones } }] },
      select: { email: true, phone: true, name: true },
    });
    const existingEmails = new Set(existing.map(e => e.email).filter(Boolean));
    const existingPhones = new Set(existing.map(e => e.phone).filter(Boolean));

    const duplicates = [];
    const toImport = validRows.filter((r, i) => {
      const isDup = (r.email && existingEmails.has(r.email)) || (r.phone && existingPhones.has(r.phone));
      if (isDup) duplicates.push({ row: rows.indexOf(r) + 1, name: r.name, reason: 'Already exists' });
      return !isDup;
    });

    const preview = req.query.preview !== 'false';

    if (preview) {
      return res.json({
        total: rows.length,
        valid: toImport.length,
        skipped: rowErrors.length,
        duplicates: duplicates.length,
        unmappedColumns: unmapped,
        rowErrors,
        duplicates,
        sample: toImport.slice(0, 5),
      });
    }

    // Execute import
    let imported = 0;
    for (const row of toImport) {
      const lead = await prisma.lead.create({
        data: {
          name: row.name,
          email: row.email || null,
          phone: row.phone || null,
          company: row.company || null,
          status: VALID_STATUSES.includes(row.status) ? row.status : 'New',
          source: row.source || null,
          notes: row.notes || null,
          nextFollowUp: row.nextFollowUp ? new Date(row.nextFollowUp) : null,
          assignedToId: null,
        },
      });
      await logActivity(lead.id, req.user.id, 'created', { name: lead.name, via: 'csv_import' });
      imported++;
    }

    res.json({ imported, skipped: rowErrors.length, duplicates: duplicates.length });
  } catch (e) { next(e); }
});

// GET /api/csv/export — export leads as CSV
router.get('/export', async (req, res, next) => {
  try {
    const where = { archived: false };
    if (req.user.role === 'agent') where.assignedToId = req.user.id;
    if (req.query.status) where.status = req.query.status;

    const leads = await prisma.lead.findMany({
      where,
      include: { assignedTo: { select: { name: true } }, tags: true },
      orderBy: { createdAt: 'desc' },
    });

    const rows = leads.map(l => ({
      Name:           l.name,
      Email:          l.email || '',
      Phone:          l.phone || '',
      Company:        l.company || '',
      Status:         l.status,
      Source:         l.source || '',
      'Assigned To':  l.assignedTo?.name || '',
      Tags:           l.tags.map(t => t.name).join(', '),
      Notes:          l.notes || '',
      'Next Follow Up': l.nextFollowUp ? l.nextFollowUp.toISOString().slice(0, 10) : '',
      Created:        l.createdAt.toISOString().slice(0, 10),
    }));

    const csv = Papa.unparse(rows);
    const filename = `leads-export-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (e) { next(e); }
});

module.exports = router;
