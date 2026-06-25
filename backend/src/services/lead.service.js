const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const logActivity = async (leadId, userId, action, details) => {
  await prisma.activity.create({ data: { leadId, userId, action, details } });
};

const getLeads = async (user, filters = {}) => {
  const where = {};
  where.archived = filters.archived === 'true';
  if (user.role === 'agent') where.assignedToId = user.id;
  if (filters.status) where.status = filters.status;
  if (filters.source) where.source = filters.source;
  if (filters.assignedToId) where.assignedToId = filters.assignedToId;
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
      { company: { contains: filters.search, mode: 'insensitive' } },
      { phone: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  return prisma.lead.findMany({
    where,
    include: { assignedTo: { select: { id: true, name: true, email: true } }, tags: true },
    orderBy: { [filters.sortBy || 'createdAt']: filters.sortOrder || 'desc' },
    skip: filters.skip ? Number(filters.skip) : 0,
    take: filters.take ? Number(filters.take) : 100,
  });
};

const getLead = async (id, user) => {
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      tags: true,
      recordings: { orderBy: { createdAt: 'desc' } },
      activities: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50
      }
    }
  });
  if (!lead) throw Object.assign(new Error('Lead not found'), { status: 404 });
  if (user.role === 'agent' && lead.assignedToId !== user.id)
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  return lead;
};

const createLead = async (data, userId) => {
  const lead = await prisma.lead.create({
    data: {
      name: data.name, company: data.company, email: data.email, phone: data.phone,
      status: data.status || 'New', source: data.source, notes: data.notes,
      nextFollowUp: data.nextFollowUp ? new Date(data.nextFollowUp) : null,
      assignedToId: data.assignedToId || null,
    },
    include: { assignedTo: { select: { id: true, name: true } }, tags: true }
  });
  await logActivity(lead.id, userId, 'created', { name: lead.name });
  return lead;
};

const updateLead = async (id, data, userId, user) => {
  const existing = await getLead(id, user);
  const updated = await prisma.lead.update({
    where: { id },
    data: {
      name: data.name ?? existing.name,
      company: data.company ?? existing.company,
      email: data.email ?? existing.email,
      phone: data.phone ?? existing.phone,
      status: data.status ?? existing.status,
      source: data.source ?? existing.source,
      notes: data.notes ?? existing.notes,
      nextFollowUp: data.nextFollowUp !== undefined ? (data.nextFollowUp ? new Date(data.nextFollowUp) : null) : existing.nextFollowUp,
      assignedToId: data.assignedToId !== undefined ? data.assignedToId : existing.assignedToId,
    },
    include: { assignedTo: { select: { id: true, name: true } }, tags: true }
  });
  if (data.status && data.status !== existing.status)
    await logActivity(id, userId, 'status_changed', { from: existing.status, to: data.status });
  else
    await logActivity(id, userId, 'updated', { fields: Object.keys(data) });
  return updated;
};

const deleteLead = async (id, userId, user) => {
  await getLead(id, user);
  await prisma.lead.delete({ where: { id } });
};

const bulkAction = async (ids, action, data, userId, user) => {
  const results = [];
  for (const id of ids) {
    try {
      if (action === 'delete') await deleteLead(id, userId, user);
      else if (action === 'assign') await updateLead(id, { assignedToId: data.assignedToId }, userId, user);
      else if (action === 'status') await updateLead(id, { status: data.status }, userId, user);
      results.push({ id, success: true });
    } catch (e) {
      results.push({ id, success: false, error: e.message });
    }
  }
  return results;
};

module.exports = { getLeads, getLead, createLead, updateLead, deleteLead, bulkAction, logActivity };
