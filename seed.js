const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const STATUSES = ['New', 'Contacted', 'Qualified', 'Proposal', 'Closed Won', 'Closed Lost'];
const SOURCES = ['Website', 'Referral', 'LinkedIn', 'Cold Call', 'Email Campaign', 'Event'];
const COMPANIES = ['Acme Corp', 'Globex', 'Initech', 'Umbrella Ltd', 'Stark Industries', 'Wayne Enterprises', 'Dunder Mifflin', 'Hooli', 'Pied Piper', 'Massive Dynamic'];
const FIRST = ['James', 'Maria', 'John', 'Sarah', 'David', 'Emma', 'Michael', 'Priya', 'Chen', 'Carlos', 'Lisa', 'Ahmed', 'Sophie', 'Raj', 'Nina'];
const LAST = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Wilson', 'Taylor'];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randDate = (daysAgo) => { const d = new Date(); d.setDate(d.getDate() - Math.floor(Math.random() * daysAgo)); return d; };
const futureDate = (days) => { const d = new Date(); d.setDate(d.getDate() + Math.floor(Math.random() * days)); return d; };

async function main() {
  console.log('Seeding database...');

  // Create users
  const password = await bcrypt.hash('password123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@crm.com' },
    update: {},
    create: { email: 'admin@crm.com', password, name: 'Admin User', role: 'admin' }
  });

  const agents = await Promise.all([
    { email: 'alice@crm.com', name: 'Alice Johnson' },
    { email: 'bob@crm.com', name: 'Bob Smith' },
    { email: 'carol@crm.com', name: 'Carol Davis' },
    { email: 'dave@crm.com', name: 'Dave Wilson' },
    { email: 'eve@crm.com', name: 'Eve Martinez' },
    { email: 'frank@crm.com', name: 'Frank Brown' },
    { email: 'grace@crm.com', name: 'Grace Lee' },
    { email: 'henry@crm.com', name: 'Henry Taylor' },
  ].map(u => prisma.user.upsert({
    where: { email: u.email },
    update: {},
    create: { ...u, password, role: 'agent' }
  })));

  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@crm.com' },
    update: {},
    create: { email: 'viewer@crm.com', password, name: 'View Only', role: 'viewer' }
  });

  const allUsers = [admin, ...agents];
  console.log(`Created ${allUsers.length + 1} users`);

  // Create tags
  const tagDefs = [
    { name: 'hot-lead', color: '#10b981' }, { name: 'urgent', color: '#ef4444' },
    { name: 'budget', color: '#f59e0b' }, { name: 'demo-requested', color: '#06b6d4' },
    { name: 'enterprise', color: '#8b5cf6' }, { name: 'competitor', color: '#6366f1' },
  ];
  const tags = await Promise.all(tagDefs.map(t => prisma.tag.upsert({ where: { name: t.name }, update: {}, create: t })));

  // Create 50 leads
  for (let i = 0; i < 50; i++) {
    const firstName = rand(FIRST), lastName = rand(LAST);
    const name = `${firstName} ${lastName}`;
    const company = rand(COMPANIES);
    const assignedTo = rand(allUsers);
    const status = rand(STATUSES);
    const createdAt = randDate(60);
    const leadTags = Math.random() > 0.6 ? [rand(tags)] : [];

    const lead = await prisma.lead.create({
      data: {
        name, company,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.toLowerCase().replace(/\s+/g, '')}.com`,
        phone: `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
        status,
        source: rand(SOURCES),
        notes: Math.random() > 0.5 ? `Initial contact made. ${Math.random() > 0.5 ? 'Interested in enterprise plan.' : 'Budget discussion needed.'}` : null,
        nextFollowUp: Math.random() > 0.4 ? futureDate(14) : null,
        assignedToId: assignedTo.id,
        createdAt,
        updatedAt: createdAt,
        tags: { connect: leadTags.map(t => ({ id: t.id })) }
      }
    });

    // Activity log
    await prisma.activity.create({
      data: { leadId: lead.id, userId: assignedTo.id, action: 'created', details: { name }, createdAt }
    });

    if (status !== 'New') {
      await prisma.activity.create({
        data: { leadId: lead.id, userId: assignedTo.id, action: 'status_changed', details: { from: 'New', to: status } }
      });
    }
  }

  console.log('Created 50 leads with activities');
  console.log('\n✅ Seed complete!\n');
  console.log('Login credentials (all use password: password123):');
  console.log('  Admin:  admin@crm.com');
  console.log('  Agent:  alice@crm.com');
  console.log('  Viewer: viewer@crm.com');
}

main().catch(console.error).finally(() => prisma.$disconnect());
