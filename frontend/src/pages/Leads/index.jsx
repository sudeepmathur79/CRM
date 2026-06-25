import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { leadsApi } from '../../services/api';
import { StatusBadge, TagBadge } from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import LeadForm from '../../components/forms/LeadForm';
import { Plus, Search, Sparkles, Trash2, Archive } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import SmartAdd from '../../components/forms/SmartAdd';

const STATUSES = ['', 'New', 'Contacted', 'Qualified', 'Proposal', 'Closed Won', 'Closed Lost'];

export default function LeadsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showSmartAdd, setShowSmartAdd] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [selected, setSelected] = useState([]);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads', search, statusFilter, showArchived],
    queryFn: () => leadsApi.list({ search: search || undefined, status: statusFilter || undefined, archived: showArchived ? 'true' : 'false' }).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => leadsApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leads'] }); setShowCreate(false); toast.success('Lead created'); },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => leadsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leads'] }); toast.success('Lead deleted'); },
  });

  const archiveDemoMutation = useMutation({
    mutationFn: () => api.post('/leads/admin/archive-demo'),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      toast.success(`Archived ${res.data.archivedLeads} demo leads & deactivated ${res.data.deactivatedUsers} seed users`);
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const bulkMutation = useMutation({
    mutationFn: (data) => leadsApi.bulk(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leads'] }); setSelected([]); toast.success('Done'); },
  });

  const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const allSelected = leads.length > 0 && selected.length === leads.length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{leads.length} total</p>
        </div>
        {user.role === 'admin' && !showArchived && (
          <button
            onClick={() => { if (confirm('Archive all current leads as Demo Data and deactivate seed users? This cannot be undone.')) archiveDemoMutation.mutate(); }}
            disabled={archiveDemoMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors">
            <Archive size={16} /> {archiveDemoMutation.isPending ? 'Archiving…' : 'Archive Demo Data'}
          </button>
        )}
        <button onClick={() => setShowArchived(v => !v)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${showArchived ? 'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300' : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-400 hover:border-amber-400'}`}>
          <Archive size={16} /> {showArchived ? 'Hide Archive' : 'View Archive'}
        </button>
        <button onClick={() => setShowSmartAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors">
          <Sparkles size={16} /> Smart Add
        </button>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> New Lead
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search leads..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
          {STATUSES.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
        </select>
      </div>

      {/* Bulk actions */}
      {selected.length > 0 && user.role === 'admin' && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
          <span className="text-sm font-medium text-primary-700 dark:text-primary-300">{selected.length} selected</span>
          <button onClick={() => bulkMutation.mutate({ ids: selected, action: 'delete' })}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium">
            <Trash2 size={14} /> Delete
          </button>
          <button onClick={() => { setSelected([]); }}
            className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
              <tr>
                {user.role === 'admin' && (
                  <th className="p-4 w-8">
                    <input type="checkbox" checked={allSelected}
                      onChange={() => setSelected(allSelected ? [] : leads.map(l => l.id))}
                      className="rounded" />
                  </th>
                )}
                <th className="p-4 text-left font-medium text-gray-600 dark:text-gray-400">Name</th>
                <th className="p-4 text-left font-medium text-gray-600 dark:text-gray-400 hidden sm:table-cell">Company</th>
                <th className="p-4 text-left font-medium text-gray-600 dark:text-gray-400">Status</th>
                <th className="p-4 text-left font-medium text-gray-600 dark:text-gray-400 hidden md:table-cell">Assigned</th>
                <th className="p-4 text-left font-medium text-gray-600 dark:text-gray-400 hidden lg:table-cell">Follow-up</th>
                <th className="p-4 text-left font-medium text-gray-600 dark:text-gray-400 hidden lg:table-cell">Tags</th>
                <th className="p-4 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
              {isLoading ? (
                <tr><td colSpan={8} className="p-8 text-center text-gray-400">Loading...</td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-gray-400">No leads found</td></tr>
              ) : leads.map(lead => (
                <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 cursor-pointer"
                  onClick={() => navigate(`/leads/${lead.id}`)}>
                  {user.role === 'admin' && (
                    <td className="p-4" onClick={e => { e.stopPropagation(); toggleSelect(lead.id); }}>
                      <input type="checkbox" checked={selected.includes(lead.id)} onChange={() => toggleSelect(lead.id)} className="rounded" />
                    </td>
                  )}
                  <td className="p-4">
                    <div className="font-medium">{lead.name}</div>
                    <div className="text-xs text-gray-400">{lead.email}</div>
                  </td>
                  <td className="p-4 text-gray-600 dark:text-gray-400 hidden sm:table-cell">{lead.company || '—'}</td>
                  <td className="p-4"><StatusBadge status={lead.status} /></td>
                  <td className="p-4 text-gray-600 dark:text-gray-400 hidden md:table-cell">{lead.assignedTo?.name || '—'}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                    {lead.nextFollowUp ? format(new Date(lead.nextFollowUp), 'MMM d') : '—'}
                  </td>
                  <td className="p-4 hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {lead.tags?.slice(0, 2).map(t => <TagBadge key={t.id} tag={t} />)}
                    </div>
                  </td>
                  <td className="p-4" onClick={e => { e.stopPropagation(); if (confirm('Delete lead?')) deleteMutation.mutate(lead.id); }}>
                    <Trash2 size={15} className="text-gray-300 hover:text-red-500 transition-colors" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Lead" size="lg">
        <LeadForm onSubmit={createMutation.mutate} loading={createMutation.isPending} />
      </Modal>

      <Modal open={showSmartAdd} onClose={() => setShowSmartAdd(false)} title="✨ Smart Add — AI Lead Extraction" size="lg">
        <SmartAdd onClose={() => setShowSmartAdd(false)} onSuccess={() => setShowSmartAdd(false)} />
      </Modal>
    </div>
  );
}
