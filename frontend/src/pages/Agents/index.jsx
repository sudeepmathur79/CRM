import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agentsApi, leadsApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  Bot, Play, Settings2, ToggleLeft, ToggleRight,
  Clock, Zap, ChevronRight, X, Save, Search,
  CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

const TRIGGER_LABELS = {
  manual: { label: 'Manual', color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300', icon: Play },
  on_lead_created: { label: 'On lead created', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: Zap },
  on_recording_uploaded: { label: 'After call analysis', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', icon: Zap },
  on_stage_stuck: { label: 'Deal stuck', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
  scheduled_daily: { label: 'Daily', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Clock },
};

const TYPE_ICONS = {
  lead_qualifier: '🎯',
  followup_drafter: '✉️',
  deal_coach: '🏋️',
  call_debrief: '📞',
  meeting_prep: '📋',
  re_engagement: '🔄',
  pipeline_health: '📊',
  drip_sequence: '⏱️',
  custom: '🤖',
};

function RunModal({ agent, onClose }) {
  const [leadQuery, setLeadQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);

  const { data: leadsData } = useQuery({
    queryKey: ['leads-agent-picker', leadQuery],
    queryFn: () => leadsApi.list({ search: leadQuery, take: 8, archived: 'false' }).then(r => r.data),
    enabled: !!leadQuery,
  });
  const leads = Array.isArray(leadsData) ? leadsData : (leadsData?.leads || []);

  const handleRun = async () => {
    setRunning(true);
    setOutput('');
    try {
      const { data } = await agentsApi.run(agent.id, selectedLead?.id);
      setOutput(data.output || '(no output)');
      toast.success('Agent ran successfully');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Agent failed');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-xl">{TYPE_ICONS[agent.type] || '🤖'}</span>
            <h3 className="font-semibold text-slate-900 dark:text-white">{agent.name}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-4">
          {agent.trigger !== 'scheduled_daily' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Run against a lead (optional)
              </label>
              <div className="relative mb-2">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search leads…"
                  value={leadQuery}
                  onChange={e => { setLeadQuery(e.target.value); setSelectedLead(null); }}
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {selectedLead ? (
                <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg px-3 py-2">
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">{selectedLead.name}</div>
                    {selectedLead.company && <div className="text-xs text-slate-500">{selectedLead.company}</div>}
                  </div>
                  <button onClick={() => { setSelectedLead(null); setLeadQuery(''); }} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
                </div>
              ) : leadQuery ? (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {leads.map(l => (
                    <button key={l.id} onClick={() => { setSelectedLead(l); setLeadQuery(l.name); }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-sm">
                      <div className="font-medium text-slate-900 dark:text-white">{l.name}</div>
                      {l.company && <div className="text-xs text-slate-500">{l.company}</div>}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          {output && (
            <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-4 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-64 overflow-y-auto border border-slate-200 dark:border-slate-700">
              {output}
            </div>
          )}

          <button
            onClick={handleRun}
            disabled={running}
            className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2"
          >
            {running ? <><Loader2 size={16} className="animate-spin" /> Running…</> : <><Play size={16} /> Run now</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditModal({ agent, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: agent.name,
    description: agent.description || '',
    promptTemplate: agent.promptTemplate,
    config: JSON.stringify(agent.config || {}, null, 2),
  });
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const saveMutation = useMutation({
    mutationFn: (data) => agentsApi.update(agent.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agents'] });
      toast.success('Agent saved');
      onClose();
    },
    onError: () => toast.error('Save failed'),
  });

  const handleSave = () => {
    let config = {};
    try { config = JSON.parse(form.config); } catch { toast.error('Config JSON is invalid'); return; }
    saveMutation.mutate({ name: form.name, description: form.description, promptTemplate: form.promptTemplate, config });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
          <h3 className="font-semibold text-slate-900 dark:text-white">Edit Agent: {agent.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Name</label>
            <input value={form.name} onChange={set('name')} className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Description</label>
            <input value={form.description} onChange={set('description')} className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
              Prompt template — use {'{{lead.name}}'}, {'{{lead.status}}'}, {'{{lead.lastNote}}'} etc.
            </label>
            <textarea value={form.promptTemplate} onChange={set('promptTemplate')} rows={12}
              className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Config (JSON)</label>
            <textarea value={form.config} onChange={set('config')} rows={3}
              className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono" />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 flex-shrink-0">
          <button onClick={handleSave} disabled={saveMutation.isPending}
            className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2">
            <Save size={16} />
            {saveMutation.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AgentsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user?.role === 'admin';
  const [runModal, setRunModal] = useState(null);
  const [editModal, setEditModal] = useState(null);

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: () => agentsApi.list().then(r => r.data),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }) => agentsApi.update(id, { enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agents'] }),
    onError: () => toast.error('Failed to update agent'),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-indigo-500" size={32} />
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Bot size={24} className="text-indigo-500" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AI Agents</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Agents run automatically on triggers or manually on any lead. Customise the prompt to match your team's tone and industry.
        </p>
      </div>

      {/* Socket.io live agent output listener is in Layout */}
      <div className="space-y-3">
        {agents.map(agent => {
          const trig = TRIGGER_LABELS[agent.trigger] || TRIGGER_LABELS.manual;
          const TrigIcon = trig.icon;
          const lastRun = agent.runs?.[0];
          return (
            <div key={agent.id}
              className={`bg-white dark:bg-slate-800 rounded-xl border transition-all ${
                agent.enabled
                  ? 'border-gray-200 dark:border-slate-700'
                  : 'border-dashed border-gray-300 dark:border-slate-600 opacity-60'
              } p-5`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="text-2xl flex-shrink-0">{TYPE_ICONS[agent.type] || '🤖'}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{agent.name}</h3>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${trig.color}`}>
                        <TrigIcon size={10} />
                        {trig.label}
                      </span>
                    </div>
                    {agent.description && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{agent.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                      <span>{agent._count?.runs ?? 0} runs</span>
                      {lastRun && (
                        <span className="flex items-center gap-1">
                          {lastRun.status === 'done' ? <CheckCircle2 size={11} className="text-green-500" /> : <AlertCircle size={11} className="text-red-400" />}
                          Last: {new Date(lastRun.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Enable/disable toggle */}
                  <button
                    onClick={() => toggleMutation.mutate({ id: agent.id, enabled: !agent.enabled })}
                    className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    title={agent.enabled ? 'Disable' : 'Enable'}
                  >
                    {agent.enabled
                      ? <ToggleRight size={28} className="text-indigo-600 dark:text-indigo-400" />
                      : <ToggleLeft size={28} />
                    }
                  </button>

                  {/* Edit prompt (admin) */}
                  {isAdmin && (
                    <button
                      onClick={() => setEditModal(agent)}
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      title="Edit agent"
                    >
                      <Settings2 size={16} />
                    </button>
                  )}

                  {/* Manual run */}
                  <button
                    onClick={() => setRunModal(agent)}
                    disabled={!agent.enabled}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium transition-colors"
                  >
                    <Play size={12} />
                    Run
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {agents.length === 0 && (
        <div className="text-center py-20 text-slate-400">
          <Bot size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-sm">No agents configured yet.</p>
        </div>
      )}

      {runModal && <RunModal agent={runModal} onClose={() => setRunModal(null)} />}
      {editModal && <EditModal agent={editModal} onClose={() => setEditModal(null)} />}
    </div>
  );
}
