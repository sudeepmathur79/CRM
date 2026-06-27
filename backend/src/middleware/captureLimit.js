const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const FREE_MONTHLY_LIMIT = 10;

module.exports = async function enforceCapureLimit(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { org: true },
    });
    const org = user?.org;
    if (!org) return next();

    // Reset monthly counter if we're in a new month
    const now = new Date();
    const resetNeeded =
      !org.captureResetAt ||
      org.captureResetAt.getMonth() !== now.getMonth() ||
      org.captureResetAt.getFullYear() !== now.getFullYear();

    if (resetNeeded) {
      await prisma.organisation.update({
        where: { id: org.id },
        data: { capturesThisMonth: 0, captureResetAt: now },
      });
      org.capturesThisMonth = 0;
    }

    if (org.plan === 'free' && org.capturesThisMonth >= FREE_MONTHLY_LIMIT) {
      return res.status(402).json({
        error: 'Free plan limit reached. Upgrade to Pro for unlimited captures.',
        code: 'CAPTURE_LIMIT_REACHED',
        used: org.capturesThisMonth,
        limit: FREE_MONTHLY_LIMIT,
      });
    }

    // Increment counter after capture completes successfully
    res.on('finish', async () => {
      if (res.statusCode < 400) {
        await prisma.organisation
          .update({
            where: { id: org.id },
            data: { capturesThisMonth: { increment: 1 } },
          })
          .catch(() => {});
      }
    });

    next();
  } catch (e) {
    next(e);
  }
};
