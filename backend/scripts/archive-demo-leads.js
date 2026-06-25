// Run with: node scripts/archive-demo-leads.js
// Archives ALL current leads as "Demo Data" and deactivates seed users.
// Safe to run multiple times — won't touch already-archived leads.

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const now = new Date();

  // Archive all active (non-archived) leads
  const { count: leadsArchived } = await prisma.lead.updateMany({
    where: { archived: false },
    data: { archived: true, archiveLabel: 'Demo Data', archivedAt: now },
  });

  // Deactivate the 10 seed users (keep admin@crm.com active for you to manage)
  const seedEmails = [
    'alice@crm.com', 'bob@crm.com', 'carol@crm.com', 'dave@crm.com',
    'eve@crm.com', 'frank@crm.com', 'grace@crm.com', 'henry@crm.com',
    'viewer@crm.com',
  ];
  const { count: usersDeactivated } = await prisma.user.updateMany({
    where: { email: { in: seedEmails } },
    data: { isActive: false },
  });

  console.log(`✅ Archived ${leadsArchived} leads as "Demo Data"`);
  console.log(`✅ Deactivated ${usersDeactivated} seed user accounts`);
  console.log(`ℹ️  admin@crm.com is still active — use it to create real user accounts`);
}

main()
  .catch(e => { console.error('❌', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
