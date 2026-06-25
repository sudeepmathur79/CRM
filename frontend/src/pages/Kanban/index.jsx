import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { StatusBadge } from '../../components/ui/Badge';
import { DndContext, closestCenter, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const STATUSES = ['New', 'Contacted', 'Qualified', 'Proposal', 'Closed Won', 'Closed Lost'];
const STATUS_COLORS = {
  'New': 'border-blue-300', 'Contacted': 'border-yellow-300', 'Qualified': 'border-purple-300',
  'Proposal': 'border-orange-300', 'Closed Won': 'border-green-300', 'Closed Lost': 'border-red-300'
};

const LeadCard = ({ lead, isDragging }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: lead.id });
  const navigate = useNavigate();
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      {...attributes} {...listeners}
      onClick={() => navigate(`/leads/${lead.id}`)}
      className="bg-white dark:bg-slate-700 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-slate-600 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-1">
        <div className="font-medium text-sm">{lead.name}</div>
        {lead.value > 0 && <div className="text-xs font-semibold text-green-600 dark:text-green-400 flex-shrink-0">{fmtVal(lead.value)}</div>}
      </div>
      {lead.company && <div className="text-xs text-gray-400 mt-0.5">{lead.company}</div>}
      {lead.assignedTo && <div className="text-xs text-gray-400 mt-1">→ {lead.assignedTo.name}</div>}
      {lead.nextFollowUp && (
        <div className="text-xs text-primary-500 mt-1">📅 {format(new Date(lead.nextFollowUp), 'MMM d')}</div>
      )}
    </div>
  );
};

const fmtVal = (n) => n >= 1000000 ? `$${(n/1000000).toFixed(1)}M` : n >= 1000 ? `$${(n/1000).toFixed(0)}K` : `$${n.toLocaleString()}`;

const Column = ({ status, leads }) => {
  const totalValue = leads.reduce((sum, l) => sum + (l.value || 0), 0);
  return (
  <div className={`flex flex-col bg-gray-50 dark:bg-slate-800 rounded-2xl border-t-4 ${STATUS_COLORS[status]} min-h-64`}>
    <div className="px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{status}</span>
        <span className="text-xs bg-gray-200 dark:bg-slate-600 px-2 py-0.5 rounded-full">{leads.length}</span>
      </div>
      {totalValue > 0 && <div className="text-xs font-semibold text-green-600 dark:text-green-400 mt-1">{fmtVal(totalValue)}</div>}
    </div>
    <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
      <div className="flex-1 px-3 pb-3 space-y-2 min-h-16">
        {leads.map(lead => <LeadCard key={lead.id} lead={lead} />)}
        {leads.length === 0 && <div className="text-center text-xs text-gray-400 py-6">Drop here</div>}
      </div>
    </SortableContext>
  </div>
  );
};

export default function KanbanPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [activeId, setActiveId] = useState(null);

  const { data: leads = [] } = useQuery({
    queryKey: ['leads-kanban', user?.id],
    queryFn: () => leadsApi.list({ take: 500, archived: 'false' }).then(r => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => leadsApi.update(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
    onError: () => toast.error('Failed to update'),
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const byStatus = STATUSES.reduce((acc, s) => {
    acc[s] = leads.filter(l => l.status === s);
    return acc;
  }, {});

  const activeLead = activeId ? leads.find(l => l.id === activeId) : null;

  const handleDragEnd = useCallback(({ active, over }) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const targetStatus = STATUSES.find(s => byStatus[s]?.some(l => l.id === over.id) || over.id === s);
    if (targetStatus) {
      const lead = leads.find(l => l.id === active.id);
      if (lead && lead.status !== targetStatus) {
        updateMutation.mutate({ id: active.id, status: targetStatus });
      }
    }
  }, [leads, byStatus, updateMutation]);

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-xl md:text-2xl font-bold">Kanban Board</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Drag cards to update lead status</p>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter}
        onDragStart={({ active }) => setActiveId(active.id)}
        onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory" style={{ minHeight: '60vh' }}>
          {STATUSES.map(status => (
            <div key={status} className="snap-start flex-shrink-0 w-64 md:w-72">
              <Column status={status} leads={byStatus[status] || []} />
            </div>
          ))}
        </div>
        <DragOverlay>
          {activeLead && (
            <div className="bg-white dark:bg-slate-700 rounded-xl p-3 shadow-xl border border-primary-300 opacity-90 rotate-2">
              <div className="font-medium text-sm">{activeLead.name}</div>
              {activeLead.company && <div className="text-xs text-gray-400">{activeLead.company}</div>}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
