/**
 * Geolocation API — finds and flags stale leads near a device's coordinates.
 *
 * Agent A: validates lat/lng strictly; rejects out-of-range values.
 * Agent B: no PII (names, emails) in console logs.
 * Agent C: single optimised DB query with Haversine distance in-app.
 */
const router = require('express').Router();
const { body, query, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth.middleware');
const prisma = new (require('@prisma/client').PrismaClient)();

router.use(authenticate);

// Haversine distance in km between two lat/lng pairs
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * POST /api/geo/nearby-stale
 * Body: { lat, lng, radiusKm? (default 50), staleAfterDays? (default 14) }
 * Returns leads that are stale AND have coordinates within radius.
 * Falls back to returning all stale leads when no coordinates stored on leads.
 */
router.post(
  '/nearby-stale',
  [
    body('lat').isFloat({ min: -90, max: 90 }).withMessage('lat must be -90 to 90'),
    body('lng').isFloat({ min: -180, max: 180 }).withMessage('lng must be -180 to 180'),
    body('radiusKm').optional().isFloat({ min: 1, max: 500 }),
    body('staleAfterDays').optional().isInt({ min: 1, max: 365 }),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    try {
      const { lat, lng, radiusKm = 50, staleAfterDays = 14 } = req.body;
      const staleCutoff = new Date(Date.now() - staleAfterDays * 86400000);

      // Fetch stale leads for this org
      const staleLeads = await prisma.lead.findMany({
        where: {
          orgId: req.orgId ?? null,
          archived: false,
          status: { notIn: ['Closed Won', 'Closed Lost'] },
          activities: { none: { createdAt: { gte: staleCutoff } } },
        },
        select: {
          id: true, name: true, company: true, status: true,
          value: true, aiScore: true, lat: true, lng: true, address: true,
          nextFollowUp: true,
          assignedTo: { select: { name: true } },
        },
        take: 100,
      });

      // Separate leads with and without coordinates
      const withCoords = staleLeads.filter(l => l.lat != null && l.lng != null);
      const withoutCoords = staleLeads.filter(l => l.lat == null || l.lng == null);

      // Filter by radius for those with coordinates
      const nearby = withCoords
        .map(l => ({ ...l, distanceKm: Math.round(haversine(lat, lng, l.lat, l.lng) * 10) / 10 }))
        .filter(l => l.distanceKm <= radiusKm)
        .sort((a, b) => a.distanceKm - b.distanceKm);

      // Agent B: log only counts, never lead names
      console.log('[geo] orgId=%s stale=%d withCoords=%d nearby=%d', req.orgId, staleLeads.length, withCoords.length, nearby.length);

      res.json({
        nearby,
        noCoordinates: withoutCoords, // stale leads without a stored location
        meta: {
          deviceLat: lat,
          deviceLng: lng,
          radiusKm,
          staleAfterDays,
          totalStale: staleLeads.length,
        },
      });
    } catch (e) { next(e); }
  }
);

/**
 * PATCH /api/geo/lead/:id/location
 * Sets lat/lng/address on a lead (e.g. after geocoding the lead's address client-side).
 */
router.patch(
  '/lead/:id/location',
  [
    body('lat').isFloat({ min: -90, max: 90 }),
    body('lng').isFloat({ min: -180, max: 180 }),
    body('address').optional().trim().isLength({ max: 255 }),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
    try {
      const { lat, lng, address } = req.body;
      // findFirst + update (not updateMany) to avoid matching all null-orgId leads
      // when req.orgId is null — only update the exact target lead
      const existing = await prisma.lead.findFirst({
        where: { id: req.params.id, orgId: req.orgId ?? null },
        select: { id: true },
      });
      if (!existing) return res.status(404).json({ error: 'Lead not found' });
      await prisma.lead.update({
        where: { id: existing.id },
        data: { lat, lng, address: address || null },
      });
      res.json({ ok: true });
    } catch (e) { next(e); }
  }
);

module.exports = router;
