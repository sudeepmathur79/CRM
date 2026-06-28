import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { leadsApi, csvApi } from '../../services/api';
import { StatusBadge, TagBadge } from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import LeadForm from '../../components/forms/LeadForm';
import { Plus, Search, Sparkles, Trash2, Archive, ChevronRight, Upload, Download } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import SmartAdd from '../../components/forms/SmartAdd';
import CsvImportModal from '../../components/csv/CsvImportModal';
import api from '../../services/api';

const STATUSES = ['', 'New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];

export default function LeadsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showSmartAdd, setShowSmartAdd] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [selected, setSelected] = useState([]);
  const [showImport, setShowImport] = useState(false);

  // Support ?stale=1, ?unassigned=1, ?status=X from dashboard deep-links
  const staleFilter = searchParams.get('stale') === '1';
  const unassignedFilter = searchParams.get('unassigned') === '1';
  useEffect(() => {
    const s = searchParams.get('status');
    if (s) setStatusFilter(s);
  }, []);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads', search, statusFilter, showArchived, staleFilter, unassignedFilter],
    queryFn: () => leadsApi.list({
      search: search || undefined,
      status: statusFilter || undefined,
      archived: showArchived ? 'true' : 'false',
      stale: staleFilter ? '1' : undefined,
      unassigned: unassignedFilter ? '1' : undefined,
    }).then(r => r.data),
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

  const handleExport = async () => {
    try {
      const res = await csvApi.export(statusFilter ? { status: statusFilter } : undefined);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Export failed');
    }
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Leads</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{leads.length} total</p>
          </div>
          {/* Primary actions */}
          <div className="flex items-center gap-2">
            {user.role === 'admin' && (
              <button onClick={() => setShowSmartAdd(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors">
                <Sparkles size={15} /> <span className="hidden sm:inline">Smart Add</span>
              </button>
            )}
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors">
              <Plus size={15} /> <span className="hidden sm:inline">New Lead</span>
            </button>
          </div>
        </div>

        {/* Secondary actions row */}
        <div className="flex flex-wrap gap-2 mt-3">
          {user.role === 'admin' && (
            <button onClick={() => setShowImport(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700">
              <Upload size={13} /> Import CSV
            </button>
          )}
          {user.role === 'admin' && (
            <button onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700">
              <Download size={13} /> Export CSV
            </button>
          )}
          <button onClick={() => setShowArchived(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${showArchived ? 'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300' : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-400'}`}>
            <Archive size={13} /> {showArchived ? 'Hide Archive' : 'View Archive'}
          </button>
          {user.role === 'admin' && !showArchived && (
            <button
              onClick={() => { if (confirm('Archive all current leads as Demo Data?')) archiveDemoMutation.mutate(); }}
              disabled={archiveDemoMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 disabled:opacity-50">
              <Archive size={13} /> {archiveDemoMutation.isPending ? 'Archiving…' : 'Archive Demo'}
            </button>
          )}
        </div>
      </div>

      {/* Active filter banner */}
      {(staleFilter || unassignedFilter) && (
        <div className="flex items-center justify-between mb-3 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-300">
          <span>{staleFilter ? '⏱ Showing stale leads (no activity in 14+ days)' : '👤 Showing unassigned leads'}</span>
          <button onClick={() => navigate('/leads')} className="text-xs underline ml-2">Clear</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search leads..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-2 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 max-w-[130px]">
          {STATUSES.map(s => <option key={s} value={s}>{s || 'All'}</option>)}
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
          <button onClick={() => setSelected([])} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
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
                <th className="p-4 text-left font-medium text-gray-600 dark:text-gray-400">Company</th>
                <th className="p-4 text-left font-medium text-gray-600 dark:text-gray-400">Status</th>
                <th className="p-4 text-left font-medium text-gray-600 dark:text-gray-400 hidden lg:table-cell">AI Score</th>
                <th className="p-4 text-left font-medium text-gray-600 dark:text-gray-400 hidden lg:table-cell">Assigned</th>
                <th className="p-4 text-left font-medium text-gray-600 dark:text-gray-400 hidden lg:table-cell">Follow-up</th>
                <th className="p-4 text-left font-medium text-gray-600 dark:text-gray-400 hidden xl:table-cell">Tags</th>
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
                    {lead.contactName && <div className="text-xs text-gray-400">{lead.contactName}</div>}
                    {!lead.contactName && <div className="text-xs text-gray-400">{lead.email || lead.phone}</div>}
                  </td>
                  <td className="p-4 text-gray-600 dark:text-gray-400">{lead.company || '—'}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <StatusBadge status={lead.status} />
                      {lead.leadType && (
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                          lead.leadType === 'VC' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' :
                          lead.leadType === 'Startup' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                          lead.leadType === 'Partner' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                          'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300'
                        }`}>{lead.leadType}</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 hidden lg:table-cell">
                    {lead.aiScore ? (
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full text-white ${
                        lead.aiScore >= 8 ? 'bg-green-500' : lead.aiScore >= 6 ? 'bg-yellow-500' : lead.aiScore >= 4 ? 'bg-orange-500' : 'bg-red-500'
                      }`}>✦ {lead.aiScore}/10</span>
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="p-4 text-gray-600 dark:text-gray-400 hidden lg:table-cell">{lead.assignedTo?.name || '—'}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                    {lead.nextFollowUp ? format(new Date(lead.nextFollowUp), 'MMM d') : '—'}
                  </td>
                  <td className="p-4 hidden xl:table-cell">
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

      {/* Mobile card list */}
      <div className="md:hidden space-y-2">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : leads.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No leads found</div>
        ) : leads.map(lead => (
          <div key={lead.id}
            className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 flex items-center gap-3 active:bg-gray-50 dark:active:bg-slate-700"
            onClick={() => navigate(`/leads/${lead.id}`)}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-medium text-sm">{lead.name}</span>
                <StatusBadge status={lead.status} />
                {lead.value > 0 && <span className="text-xs font-semibold text-green-600 dark:text-green-400">{lead.value >= 1000000 ? `$${(lead.value/1000000).toFixed(1)}M` : lead.value >= 1000 ? `$${(lead.value/1000).toFixed(0)}K` : `$${lead.value}`}</span>}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {lead.contactName && <span>{lead.contactName} · </span>}
                {lead.company && <span>{lead.company} · </span>}
                {lead.assignedTo ? <span>{lead.assignedTo.name} · </span> : null}
                {lead.email || lead.phone}
              </div>
              {lead.nextFollowUp && (
                <div className={`text-xs mt-1 ${new Date(lead.nextFollowUp) < new Date() && !['Closed Won','Closed Lost'].includes(lead.status) ? 'text-red-500 dark:text-red-400 font-medium' : 'text-amber-600 dark:text-amber-400'}`}>
                  {new Date(lead.nextFollowUp) < new Date() && !['Closed Won','Closed Lost'].includes(lead.status) ? '⚠ Overdue · ' : '📅 '}
                  {format(new Date(lead.nextFollowUp), 'MMM d')}
                </div>
              )}
            </div>
            <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
          </div>
        ))}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Lead" size="lg">
        <LeadForm onSubmit={createMutation.mutate} loading={createMutation.isPending} />
      </Modal>

      <Modal open={showSmartAdd} onClose={() => setShowSmartAdd(false)} title="✨ Smart Add" size="lg">
        <SmartAdd onClose={() => setShowSmartAdd(false)} onSuccess={() => setShowSmartAdd(false)} />
      </Modal>

      <CsvImportModal open={showImport} onClose={() => setShowImport(false)} />
    </div>
  );
}
