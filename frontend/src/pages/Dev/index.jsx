import { useState, useEffect, useCallback, useRef } from 'react';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  closestCorners, useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { devApi } from './devApi';
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';
import {
  Plus, Trash2, Sparkles, LogOut, GripVertical, X, ChevronDown, ChevronUp,
  Zap, Clock, Send, Bot, User, Hammer, Loader,
  MessageSquare, Play, CheckCircle, AlertCircle, Code, Copy, Layers,
  GitMerge, GitBranch, ExternalLink, ArrowUpCircle,
} from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────

const COLUMNS = [
  { id: 'backlog',     label: 'Backlog',      color: 'bg-slate-700/50' },
  { id: 'ready',       label: 'Ready',        color: 'bg-blue-900/30' },
  { id: 'in_progress', label: 'In Progress',  color: 'bg-amber-900/30' },
  { id: 'review',      label: 'Review',       color: 'bg-violet-900/30' },
  { id: 'build',       label: '⚡ Build',     color: 'bg-emerald-900/40 border border-emerald-700/50' },
  { id: 'done',        label: 'Done',         color: 'bg-green-900/20' },
];

const PRIORITY_META = {
  0: { label: 'P0', color: 'bg-red-900/40 text-red-300' },
  1: { label: 'P1', color: 'bg-orange-900/40 text-orange-300' },
  2: { label: 'P2', color: 'bg-amber-900/40 text-amber-300' },
  3: { label: 'P3', color: 'bg-slate-700 text-slate-400' },
};

const EFFORTS = ['XS', 'S', 'M', 'L', 'XL'];
const EPICS = ['Developer Portal', 'Architecture', "What's New", 'Mobile', 'Product', 'Security', 'Other'];

const EPIC_COLORS = {
  'Developer Portal': 'bg-indigo-900/40 text-indigo-300',
  'Architecture':     'bg-blue-900/40 text-blue-300',
  "What's New":       'bg-pink-900/40 text-pink-300',
  'Mobile':           'bg-green-900/40 text-green-300',
  'Product':          'bg-amber-900/40 text-amber-300',
  'Security':         'bg-red-900/40 text-red-300',
  'Other':            'bg-slate-700 text-slate-400',
};

// ── Login ────────────────────────────────────────────────────────────────────

function DevLogin({ onLogin }) {
  const [secret, setSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try { await devApi.login(secret); onLogin(); }
    catch { setError('Invalid secret'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Dev Portal</span>
        </div>
        <div className="bg-slate-900 rounded-2xl p-7 shadow-2xl border border-slate-800">
          <p className="text-slate-400 text-sm mb-5 text-center">Enter your <code className="text-indigo-400">DEV_SECRET</code> to continue</p>
          <form onSubmit={submit} className="space-y-4">
            <input type="password" value={secret} onChange={e => setSecret(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" disabled={loading || !secret}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors">
              {loading ? 'Checking…' : 'Enter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Card modal ────────────────────────────────────────────────────────────────

function CardModal({ item, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({ ...item });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try { await onSave(form); onClose(); }
    catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between p-5 border-b border-slate-800">
          <input value={form.title} onChange={e => set('title', e.target.value)}
            className="text-lg font-semibold text-white bg-transparent border-0 focus:outline-none flex-1 mr-3" />
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200 flex-shrink-0"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[['Epic', 'epic', EPICS, false], ['Priority', 'priority', [0,1,2,3], true], ['Effort', 'effort', EFFORTS, false]].map(([label, key, opts, isNum]) => (
              <div key={key}>
                <label className="text-xs font-medium text-slate-500 block mb-1">{label}</label>
                <select value={form[key] ?? ''} onChange={e => set(key, isNum ? Number(e.target.value) : e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {!isNum && <option value="">—</option>}
                  {opts.map(o => <option key={o} value={o}>{isNum ? `P${o}` : o}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Description</label>
            <textarea value={form.description || ''} onChange={e => set('description', e.target.value)}
              rows={4} placeholder="Acceptance criteria, notes…"
              className="w-full text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Tags (comma-separated)</label>
            <input value={(form.tags || []).join(', ')} onChange={e => set('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
              placeholder="frontend, backend, mobile"
              className="w-full text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        <div className="flex items-center justify-between p-5 border-t border-slate-800">
          <button onClick={() => { if (confirm('Delete this item?')) { onDelete(item.id); onClose(); } }}
            className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 transition-colors">
            <Trash2 size={14} /> Delete
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200">Cancel</button>
            <button onClick={save} disabled={saving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Kanban card ───────────────────────────────────────────────────────────────

function KanbanCard({ item, onClick, aiSuggestion }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 };
  const p = PRIORITY_META[item.priority] || PRIORITY_META[2];

  return (
    <div ref={setNodeRef} style={style}
      className="bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-sm hover:border-slate-500 transition-colors cursor-pointer group"
      onClick={onClick}>
      <div className="flex items-start gap-2">
        <button {...attributes} {...listeners} onClick={e => e.stopPropagation()}
          className="mt-0.5 text-slate-600 hover:text-slate-400 flex-shrink-0 cursor-grab active:cursor-grabbing">
          <GripVertical size={14} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-100 leading-snug line-clamp-2">{item.title}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${p.color}`}>{p.label}</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 flex items-center gap-0.5">
              <Clock size={9} />{item.effort}
            </span>
            {item.epic && (
              <span className={`text-xs px-1.5 py-0.5 rounded ${EPIC_COLORS[item.epic] || EPIC_COLORS['Other']}`}>{item.epic}</span>
            )}
          </div>
          {item.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {item.tags.slice(0, 3).map(t => (
                <span key={t} className="text-xs px-1.5 py-0.5 rounded-full bg-slate-700 text-slate-500">{t}</span>
              ))}
            </div>
          )}
          {aiSuggestion && (
            <div className="mt-2 flex items-start gap-1 bg-indigo-950/60 border border-indigo-800/40 rounded-lg px-2 py-1.5">
              <Sparkles size={10} className="text-indigo-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-indigo-300 leading-snug">{aiSuggestion.reason}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Column ────────────────────────────────────────────────────────────────────

function Column({ col, items, onCardClick, onAddCard, aiSuggestions }) {
  const { setNodeRef } = useDroppable({ id: col.id });
  const [collapsed, setCollapsed] = useState(false);
  const isBuild = col.id === 'build';

  return (
    <div className="flex flex-col min-w-[240px] max-w-[260px] flex-shrink-0">
      <div className={`flex items-center justify-between px-3 py-2 rounded-xl mb-2 ${col.color}`}>
        <div className="flex items-center gap-2">
          <button onClick={() => setCollapsed(c => !c)} className="text-slate-500">
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
          <span className="font-semibold text-sm text-slate-200">{col.label}</span>
          <span className="text-xs bg-slate-900/50 rounded-full px-2 py-0.5 font-medium text-slate-400">{items.length}</span>
        </div>
        {!isBuild && col.id !== 'done' && (
          <button onClick={() => onAddCard(col.id)} className="text-slate-500 hover:text-slate-300 transition-colors">
            <Plus size={15} />
          </button>
        )}
        {isBuild && (
          <span className="text-xs text-emerald-400 font-medium">drag to build</span>
        )}
      </div>
      {!collapsed && (
        <div ref={setNodeRef} className="flex-1 space-y-2 min-h-[80px]">
          {isBuild && items.length === 0 && (
            <div className="border-2 border-dashed border-emerald-700/40 rounded-xl p-4 text-center text-xs text-emerald-600">
              Drop a card here to trigger<br />Claude to build it
            </div>
          )}
          <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
            {items.map(item => (
              <KanbanCard key={item.id} item={item} onClick={() => onCardClick(item)} aiSuggestion={aiSuggestions?.[item.id]} />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
}

// ── Quick add ─────────────────────────────────────────────────────────────────

function QuickAdd({ status, onAdd, onCancel }) {
  const [title, setTitle] = useState('');
  const [epic, setEpic] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    await onAdd({ title: title.trim(), epic: epic || undefined, status });
    onCancel();
  };

  return (
    <div className="bg-slate-800 border-2 border-indigo-600 rounded-xl p-3">
      <form onSubmit={submit} className="space-y-2">
        <input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="Item title…"
          className="w-full text-sm bg-transparent border-0 focus:outline-none text-white placeholder-slate-500" />
        <select value={epic} onChange={e => setEpic(e.target.value)}
          className="w-full text-xs rounded-lg border border-slate-700 bg-slate-900 text-slate-300 px-2 py-1 focus:outline-none">
          <option value="">Epic…</option>
          {EPICS.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <div className="flex gap-2">
          <button type="submit" className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg font-medium">Add</button>
          <button type="button" onClick={onCancel} className="px-3 py-1 text-slate-400 text-xs hover:text-slate-200">Cancel</button>
        </div>
      </form>
    </div>
  );
}

// ── AI Results panel (prioritise) ─────────────────────────────────────────────

function AIResultsPanel({ result, onApply, onClose }) {
  const [overrides, setOverrides] = useState({});

  const effectiveItems = result.items.map(s => ({
    ...s,
    suggestedPriority: overrides[s.id] !== undefined ? overrides[s.id] : s.suggestedPriority,
  }));

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 p-5 border-b border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
            <Sparkles size={15} className="text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">AI Prioritisation</h3>
            <p className="text-xs text-slate-500">Llama 3.3 70B · Override any priority before applying</p>
          </div>
          <button onClick={onClose} className="ml-auto text-slate-500 hover:text-slate-300"><X size={16} /></button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">
          <div className="bg-indigo-950/60 border border-indigo-800/30 rounded-xl p-4 mb-4">
            <p className="text-sm text-indigo-200 leading-relaxed">{result.reasoning}</p>
          </div>
          <div className="space-y-1">
            {effectiveItems.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3 py-2 border-b border-slate-800 last:border-0">
                <span className="text-xs font-bold text-slate-600 w-5 flex-shrink-0">#{i+1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 font-medium truncate">{s.title || s.id}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.reason}</p>
                </div>
                <select
                  value={s.suggestedPriority}
                  onChange={e => setOverrides(o => ({ ...o, [s.id]: Number(e.target.value) }))}
                  className="bg-slate-800 border border-slate-700 text-xs rounded px-1.5 py-1 text-slate-200 flex-shrink-0"
                >
                  {[0,1,2,3].map(p => (
                    <option key={p} value={p}>P{p} — {['Critical','High','Medium','Low'][p]}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
        <div className="p-5 border-t border-slate-800 flex gap-2">
          <button onClick={() => onApply(effectiveItems)} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors">
            Apply priorities
          </button>
          <button onClick={onClose} className="px-4 py-2 border border-slate-700 text-slate-400 rounded-xl text-sm hover:text-slate-200">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Build result drawer ───────────────────────────────────────────────────────

function BuildDrawer({ item, plan, onClose }) {
  const sections = plan.split(/\n(?=\d+\.\s+\*\*|##\s+)/);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-700 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start gap-3 p-5 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-emerald-900/50 border border-emerald-700/50 flex items-center justify-center flex-shrink-0">
            <Hammer size={16} className="text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-medium text-emerald-400 uppercase tracking-wide">Build Plan</span>
              <span className="text-xs text-slate-500">· Claude Sonnet 4.6</span>
            </div>
            <h3 className="font-semibold text-white text-sm leading-snug">{item.title}</h3>
            <div className="flex gap-2 mt-1">
              <span className={`text-xs px-1.5 py-0.5 rounded ${PRIORITY_META[item.priority]?.color}`}>P{item.priority}</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">{item.effort}</span>
              {item.epic && <span className={`text-xs px-1.5 py-0.5 rounded ${EPIC_COLORS[item.epic] || EPIC_COLORS['Other']}`}>{item.epic}</span>}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 flex-shrink-0"><X size={18} /></button>
        </div>

        {/* Plan content */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="prose prose-invert prose-sm max-w-none">
            <pre className="whitespace-pre-wrap text-slate-300 text-sm leading-relaxed font-sans bg-slate-950/60 rounded-xl p-5 border border-slate-800">
              {plan}
            </pre>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 flex gap-2">
          <button onClick={() => navigator.clipboard.writeText(plan).then(() => toast.success('Copied'))}
            className="px-4 py-2 border border-slate-700 text-slate-300 rounded-lg text-sm hover:text-white transition-colors">
            Copy plan
          </button>
          <button onClick={onClose} className="ml-auto px-4 py-2 text-slate-500 hover:text-slate-200 text-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── AI Chat panel ─────────────────────────────────────────────────────────────

function ChatPanel({ onAddItem, onClose }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! Describe a feature, bug, or improvement and I'll classify it into a backlog card. You can also ask me to help prioritise, explain trade-offs, or suggest implementation approaches." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [proposed, setProposed] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, proposed]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setProposed(null);

    const userMsg = { role: 'user', content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setLoading(true);

    try {
      const res = await devApi.aiChat(history.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content })));
      const assistantMsg = { role: 'assistant', content: res.content };
      setMessages(prev => [...prev, assistantMsg]);
      if (res.proposed) setProposed(res.proposed);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I had trouble processing that. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const confirmAdd = async () => {
    if (!proposed) return;
    await onAddItem(proposed);
    setProposed(null);
    setMessages(prev => [...prev, { role: 'assistant', content: `✅ Added to backlog: **${proposed.title}**` }]);
    toast.success('Added to backlog');
  };

  const stripJson = (text) => text.replace(/```json[\s\S]*?```/g, '').trim();

  return (
    <div className="w-80 flex-shrink-0 bg-slate-900 border-l border-slate-800 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Bot size={14} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">AI Assistant</p>
            <p className="text-xs text-slate-500">Classify · Prioritise · Plan</p>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-600 hover:text-slate-400"><X size={16} /></button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
              msg.role === 'user' ? 'bg-indigo-600' : 'bg-slate-700'
            }`}>
              {msg.role === 'user' ? <User size={12} className="text-white" /> : <Bot size={12} className="text-slate-300" />}
            </div>
            <div className={`max-w-[220px] rounded-xl px-3 py-2 text-xs leading-relaxed ${
              msg.role === 'user'
                ? 'bg-indigo-600 text-white rounded-tr-sm'
                : 'bg-slate-800 text-slate-200 rounded-tl-sm'
            }`}>
              {stripJson(msg.content)}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
              <Bot size={12} className="text-slate-300" />
            </div>
            <div className="bg-slate-800 rounded-xl rounded-tl-sm px-3 py-2">
              <Loader size={12} className="text-slate-400 animate-spin" />
            </div>
          </div>
        )}

        {/* Proposed card */}
        {proposed && (
          <div className="bg-emerald-950/60 border border-emerald-800/50 rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-emerald-300">Proposed backlog card</p>
            <p className="text-xs font-medium text-white">{proposed.title}</p>
            <div className="flex flex-wrap gap-1">
              <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${PRIORITY_META[proposed.priority]?.color}`}>P{proposed.priority}</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">{proposed.effort}</span>
              {proposed.epic && <span className={`text-xs px-1.5 py-0.5 rounded ${EPIC_COLORS[proposed.epic] || EPIC_COLORS['Other']}`}>{proposed.epic}</span>}
            </div>
            {proposed.description && <p className="text-xs text-slate-400 leading-snug">{proposed.description.slice(0, 120)}{proposed.description.length > 120 ? '…' : ''}</p>}
            <div className="flex gap-2 pt-1">
              <button onClick={confirmAdd}
                className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-lg font-medium transition-colors flex items-center justify-center gap-1">
                <Plus size={11} /> Add to backlog
              </button>
              <button onClick={() => setProposed(null)}
                className="px-3 py-1.5 bg-slate-700 text-slate-400 text-xs rounded-lg hover:text-slate-200">
                Edit
              </button>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-800">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Describe a feature or bug…"
            rows={2}
            className="flex-1 text-xs bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
          <button onClick={send} disabled={loading || !input.trim()}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl transition-colors flex-shrink-0">
            <Send size={14} />
          </button>
        </div>
        <p className="text-xs text-slate-600 mt-1.5 text-center">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}

// ── Push to Production ────────────────────────────────────────────────────────

function PushToProductionModal({ onClose }) {
  const [branchStatus, setBranchStatus] = useState(null);
  const [testStatus, setTestStatus]     = useState(null);
  const [loading, setLoading]           = useState(true);
  const [shipping, setShipping]         = useState(false);
  const [result, setResult]             = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([devApi.branchStatus(), devApi.testStatus()])
      .then(([b, t]) => { setBranchStatus(b); setTestStatus(t); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const testsGreen = testStatus?.status === 'success';
  const testsRunning = testStatus?.status === 'in_progress' || testStatus?.status === 'queued';
  const nothingToShip = branchStatus?.ahead === 0;

  const ship = async () => {
    setShipping(true);
    try {
      const r = await devApi.ship();
      setResult(r);
      toast.success('Shipped to production!');
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Ship failed — check test results');
    } finally {
      setShipping(false);
    }
  };

  const TestStatusBadge = () => {
    if (!testStatus) return null;
    if (testsRunning) return (
      <span className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-950/40 border border-amber-800/40 px-2.5 py-1 rounded-full">
        <Loader size={11} className="animate-spin" /> Running…
      </span>
    );
    if (testsGreen) return (
      <span className="flex items-center gap-1.5 text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-full">
        <CheckCircle size={11} /> Tests passed
      </span>
    );
    if (testStatus.status === 'never_run') return (
      <span className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-full">
        <AlertCircle size={11} /> No test run yet
      </span>
    );
    return (
      <span className="flex items-center gap-1.5 text-xs text-red-300 bg-red-950/40 border border-red-800/40 px-2.5 py-1 rounded-full">
        <AlertCircle size={11} /> Tests failed
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-700 to-teal-700 flex items-center justify-center flex-shrink-0">
            <GitMerge size={17} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-white">Ship to Production</h2>
            <p className="text-xs text-slate-500">Merges <code className="text-emerald-400">dev</code> → <code className="text-slate-300">main</code> — Render auto-deploys</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-slate-500 text-sm py-4 justify-center">
              <Loader size={14} className="animate-spin" /> Checking status…
            </div>
          ) : (
            <>
              {/* Branch status */}
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <GitBranch size={14} className="text-slate-400" />
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">dev vs main</span>
                  </div>
                  <TestStatusBadge />
                </div>
                {branchStatus?.error ? (
                  <p className="text-sm text-red-400">{branchStatus.error}</p>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-4 text-sm">
                      <span className={`font-semibold ${branchStatus?.ahead > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                        ↑ {branchStatus?.ahead ?? 0} ahead
                      </span>
                      <span className={`font-semibold ${branchStatus?.behind > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                        ↓ {branchStatus?.behind ?? 0} behind
                      </span>
                    </div>
                    {branchStatus?.commits?.length > 0 && (
                      <div className="space-y-1 mt-2">
                        {branchStatus.commits.map(c => (
                          <div key={c.sha} className="flex items-start gap-2 text-xs">
                            <code className="text-slate-600 flex-shrink-0">{c.sha}</code>
                            <span className="text-slate-400 leading-snug">{c.message}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {nothingToShip && <p className="text-xs text-slate-500">dev is up to date with main — nothing to ship.</p>}
                  </div>
                )}
              </div>

              {/* Test run link */}
              {testStatus?.url && (
                <a href={testStatus.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors">
                  <ExternalLink size={11} /> Last test run: {testStatus.headCommit || testStatus.headSha || '—'}
                </a>
              )}

              {!result ? (
                <>
                  {/* Status callout */}
                  {testsRunning && (
                    <div className="bg-amber-950/40 border border-amber-800/40 rounded-xl p-3 text-xs text-amber-300">
                      Tests are running — wait for them to finish before shipping.
                    </div>
                  )}
                  {!testsGreen && !testsRunning && testStatus?.status !== 'never_run' && (
                    <div className="bg-red-950/40 border border-red-800/40 rounded-xl p-3 text-xs text-red-300">
                      Last test run failed. Fix the issues and push to <code>dev</code> again to re-run tests.
                    </div>
                  )}
                  {testStatus?.status === 'never_run' && (
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-slate-400">
                      No test run found. Push a commit to <code>dev</code> to trigger the staging readiness check.
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 py-2 border border-slate-700 text-slate-400 rounded-xl text-sm hover:text-slate-200 transition-colors">Cancel</button>
                    <button onClick={ship} disabled={shipping || !testsGreen || nothingToShip}
                      className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2">
                      {shipping
                        ? <><Loader size={14} className="animate-spin" /> Shipping…</>
                        : <><ArrowUpCircle size={14} /> Ship It</>}
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="bg-emerald-950/60 border border-emerald-800/50 rounded-xl p-4 text-center">
                    <CheckCircle size={24} className="text-emerald-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-emerald-300">Shipped to production!</p>
                    <p className="text-xs text-slate-400 mt-1">{result.pr?.title}</p>
                    <p className="text-xs text-slate-500 mt-1">Render is deploying main now — takes ~3 minutes.</p>
                  </div>
                  <a href={result.pr?.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 rounded-xl text-sm font-medium transition-colors">
                    <ExternalLink size={14} /> View merged PR
                  </a>
                  <button onClick={onClose} className="w-full py-2 text-slate-500 hover:text-slate-300 text-sm">Close</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Take Over modal ───────────────────────────────────────────────────────────

const PRIORITY_LABEL = { 0: 'P0', 1: 'P1', 2: 'P2', 3: 'P3' };

function TakeOverModal({ onClose, onRefreshBoard }) {
  const [phase, setPhase] = useState('idle'); // idle | running | paused | done | error | cancelled
  const [log, setLog] = useState([]);
  const [waves, setWaves] = useState([]);
  const [activeWave, setActiveWave] = useState(null);
  const [itemStates, setItemStates] = useState({}); // id → 'running'|'done'|'error'
  const [results, setResults] = useState({});        // id → { code, model, title, tokensEstimate }
  const [selectedResult, setSelectedResult] = useState(null);
  const [totalItems, setTotalItems] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const esRef = useRef(null);
  const logRef = useRef(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [log]);

  // Clean up SSE on unmount
  useEffect(() => () => { esRef.current?.close(); }, []);

  const addLog = (type, text) => setLog(prev => [...prev, { type, text, ts: Date.now() }]);

  const start = () => {
    setPhase('running');
    setLog([]);
    setWaves([]);
    setItemStates({});
    setResults({});
    setActiveWave(null);

    const es = devApi.takeover();
    esRef.current = es;

    es.addEventListener('session', e => {
      const d = JSON.parse(e.data);
      setSessionId(d.sessionId);
    });

    es.addEventListener('start', e => {
      const d = JSON.parse(e.data);
      setTotalItems(d.total);
      addLog('info', `Found ${d.total} P0/P1 items to build`);
      d.items.forEach(i => addLog('item', `  · [${PRIORITY_LABEL[i.priority]}] [${i.effort}] ${i.title}`));
    });

    es.addEventListener('plan', e => {
      const d = JSON.parse(e.data);
      addLog('plan', `Strategy: ${d.overallStrategy}`);
      d.analysis?.forEach(a => addLog('analysis', `  ${a.parallelSafe ? '⇉' : '→'} ${a.domain} · ${a.complexity} — ${a.reason}`));
    });

    es.addEventListener('waves', e => {
      const d = JSON.parse(e.data);
      setWaves(d.waves);
      addLog('info', `Execution plan: ${d.count} wave${d.count !== 1 ? 's' : ''}`);
      d.waves.forEach(w => addLog('wave_plan', `  Wave ${w.wave}: ${w.parallel ? '⇉ parallel' : '→ sequential'} — ${w.items.join(', ')}`));
    });

    es.addEventListener('rate_limit', e => {
      const d = JSON.parse(e.data);
      addLog('wait', `⏱ Rate limit pause: ${d.waitSeconds}s — ${d.message}`);
    });

    es.addEventListener('wave_start', e => {
      const d = JSON.parse(e.data);
      setActiveWave(d.wave);
      addLog('wave', `━━ Wave ${d.wave} ${d.parallel ? '(parallel)' : '(sequential)'}: ${d.items.join(', ')}`);
    });

    es.addEventListener('wave_done', e => {
      const d = JSON.parse(e.data);
      addLog('wave_done', `✓ Wave ${d.wave} complete`);
    });

    es.addEventListener('item_start', e => {
      const d = JSON.parse(e.data);
      setItemStates(prev => ({ ...prev, [d.id]: 'running' }));
      addLog('item_start', `🔨 Building: ${d.title}`);
    });

    es.addEventListener('item_pipeline', e => {
      const d = JSON.parse(e.data);
      addLog('item_start', `  ${d.label}`);
    });

    es.addEventListener('item_done', e => {
      const d = JSON.parse(e.data);
      setItemStates(prev => ({ ...prev, [d.id]: 'done' }));
      setResults(prev => ({ ...prev, [d.id]: { code: d.code, model: d.model, title: d.title, tokensEstimate: d.tokensEstimate } }));
      const stagingNote = d.stagingOk ? ` · staging ✅` : d.stagingOk === false ? ` · staging ⚠️` : '';
      addLog('item_done', `✅ Done: ${d.title} (${d.model?.includes('8b') ? 'fast' : 'standard'} · ~${d.tokensEstimate} tokens${stagingNote})`);
    });

    es.addEventListener('item_error', e => {
      const d = JSON.parse(e.data);
      setItemStates(prev => ({ ...prev, [d.id]: 'error' }));
      addLog('error', `❌ Failed: ${d.title} — ${d.error}`);
    });

    es.addEventListener('complete', e => {
      const d = JSON.parse(e.data);
      setPhase('done');
      addLog('done', `🎉 All done — ${d.totalItems} items across ${d.totalWaves} waves`);
      es.close();
      onRefreshBoard();
    });

    es.addEventListener('cancelled', e => {
      const d = JSON.parse(e.data);
      addLog('info', `Session stopped — ${d.reason}`);
      setPhase('cancelled');
      es.close();
      onRefreshBoard();
    });

    es.addEventListener('error', e => {
      try {
        const d = JSON.parse(e.data);
        addLog('error', `Error: ${d.message}`);
      } catch {}
      setPhase('error');
      es.close();
    });

    es.onerror = () => {
      // Only flag as error if we haven't already ended cleanly
      setPhase(p => p === 'running' || p === 'paused' ? 'error' : p);
      es.close();
    };
  };

  const handlePause = async () => {
    if (!sessionId) return;
    await devApi.pauseTakeover(sessionId);
    setPhase('paused');
    addLog('wait', '⏸ Paused — current wave will finish, then AI will hold');
  };

  const handleResume = async () => {
    if (!sessionId) return;
    await devApi.resumeTakeover(sessionId);
    setPhase('running');
    addLog('info', '▶ Resumed');
  };

  const handleCancel = async (revert = false) => {
    if (!sessionId) { esRef.current?.close(); setPhase('cancelled'); return; }
    esRef.current?.close();
    try {
      const res = await devApi.cancelTakeover(sessionId, revert);
      if (revert && res.revertedIds?.length > 0) {
        addLog('info', `↩ Reverted ${res.revertedIds.length} item(s) back to Ready`);
      }
    } catch {}
    setPhase('cancelled');
    onRefreshBoard();
  };

  const doneCount = Object.values(itemStates).filter(s => s === 'done').length;
  const resultKeys = Object.keys(results);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
            <Play size={16} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-white">AI Take Over</h2>
            <p className="text-xs text-slate-500">Groq autonomously builds your P0/P1 backlog — parallel where safe, sequential where shared</p>
          </div>
          {phase !== 'idle' && (
            <div className="flex items-center gap-2">
              {/* Status pill */}
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                phase === 'running'   ? 'bg-violet-900/60 text-violet-300 border border-violet-700/50' :
                phase === 'paused'    ? 'bg-amber-900/60 text-amber-300 border border-amber-700/50' :
                phase === 'done'      ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50' :
                phase === 'cancelled' ? 'bg-slate-700 text-slate-400 border border-slate-600' :
                'bg-red-900/60 text-red-300 border border-red-700/50'
              }`}>
                {phase === 'running' && '● Running'}
                {phase === 'paused'  && '⏸ Paused'}
                {phase === 'done'    && '✓ Complete'}
                {phase === 'cancelled' && '◼ Stopped'}
                {phase === 'error'   && '✕ Error'}
              </span>
              <span className="text-xs text-slate-500">{doneCount}/{totalItems} built</span>

              {/* Controls */}
              {phase === 'running' && (
                <button onClick={handlePause}
                  className="flex items-center gap-1 px-2 py-1 bg-amber-900/40 hover:bg-amber-900/60 border border-amber-700/50 text-amber-300 rounded-lg text-xs font-medium transition-colors">
                  ⏸ Pause
                </button>
              )}
              {phase === 'paused' && (
                <button onClick={handleResume}
                  className="flex items-center gap-1 px-2 py-1 bg-violet-900/40 hover:bg-violet-900/60 border border-violet-700/50 text-violet-300 rounded-lg text-xs font-medium transition-colors">
                  ▶ Resume
                </button>
              )}
              {(phase === 'running' || phase === 'paused') && (
                <>
                  <button onClick={() => handleCancel(false)}
                    className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-medium transition-colors">
                    Stop
                  </button>
                  <button onClick={() => handleCancel(true)}
                    className="px-2 py-1 bg-red-900/40 hover:bg-red-900/60 border border-red-700/50 text-red-300 rounded-lg text-xs font-medium transition-colors"
                    title="Stop and move all touched items back to Ready">
                    ↩ Take Back
                  </button>
                </>
              )}
            </div>
          )}
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 ml-2"><X size={18} /></button>
        </div>

        {/* Idle state */}
        {phase === 'idle' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-900/60 to-indigo-900/60 border border-violet-700/40 flex items-center justify-center">
              <Zap size={28} className="text-violet-400" />
            </div>
            <div className="text-center max-w-md">
              <h3 className="text-lg font-semibold text-white mb-2">Hand over the wheel</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Groq will fetch your highest-priority items (P0 and P1), plan which can run in parallel based on their file domains, and generate complete production-ready implementations for each one — respecting rate limits automatically.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center text-xs w-full max-w-sm">
              {[
                ['⇉ Parallel', 'Independent frontend, backend & mobile items run simultaneously'],
                ['→ Sequential', 'Shared-file items wait for each other to avoid conflicts'],
                ['⏱ Rate-aware', 'Pauses between waves to stay within Groq token limits'],
              ].map(([label, desc]) => (
                <div key={label} className="bg-slate-800 rounded-xl p-3 border border-slate-700">
                  <div className="font-semibold text-slate-200 mb-1">{label}</div>
                  <div className="text-slate-500 leading-snug">{desc}</div>
                </div>
              ))}
            </div>
            <button onClick={start}
              className="px-8 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-violet-900/40 flex items-center gap-2">
              <Play size={16} /> Start AI Take Over
            </button>
          </div>
        )}

        {/* Running / done state */}
        {phase !== 'idle' && (
          <div className="flex flex-1 overflow-hidden">

            {/* Left: live log */}
            <div className="w-80 flex-shrink-0 border-r border-slate-800 flex flex-col">
              <div className="px-4 py-2 border-b border-slate-800 flex items-center gap-2">
                {phase === 'running' && <Loader size={12} className="text-violet-400 animate-spin" />}
                {phase === 'done' && <CheckCircle size={12} className="text-emerald-400" />}
                {phase === 'error' && <AlertCircle size={12} className="text-red-400" />}
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  {phase === 'running' ? 'Building…' : phase === 'done' ? 'Complete' : 'Error'}
                </span>
              </div>
              <div ref={logRef} className="flex-1 overflow-y-auto p-3 space-y-1 font-mono text-xs">
                {log.map((entry, i) => (
                  <div key={i} className={`leading-relaxed ${
                    entry.type === 'done' ? 'text-emerald-400' :
                    entry.type === 'error' ? 'text-red-400' :
                    entry.type === 'wave' || entry.type === 'wave_done' ? 'text-violet-300 font-semibold' :
                    entry.type === 'item_done' ? 'text-emerald-300' :
                    entry.type === 'item_start' ? 'text-amber-300' :
                    entry.type === 'wait' ? 'text-amber-400' :
                    entry.type === 'plan' ? 'text-indigo-300 italic' :
                    'text-slate-400'
                  }`}>
                    {entry.text}
                  </div>
                ))}
                {phase === 'running' && (
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Loader size={10} className="animate-spin" />
                    <span>working…</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: results panel */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {resultKeys.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-slate-600 text-sm">
                  Results will appear here as each item completes
                </div>
              ) : selectedResult ? (
                /* Code view */
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-2 border-b border-slate-800">
                    <button onClick={() => setSelectedResult(null)} className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1">
                      ← back
                    </button>
                    <span className="text-xs font-medium text-slate-300 flex-1 truncate">{results[selectedResult]?.title}</span>
                    <span className="text-xs text-slate-600">{results[selectedResult]?.model?.includes('8b') ? 'llama-3.1-8b-instant' : 'llama-3.3-70b'}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(results[selectedResult]?.code || '').then(() => toast.success('Copied'))}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 px-2 py-1 bg-slate-800 rounded-lg">
                      <Copy size={11} /> Copy
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-mono bg-slate-950/60 rounded-xl p-4 border border-slate-800">
                      {results[selectedResult]?.code}
                    </pre>
                  </div>
                </div>
              ) : (
                /* Item list */
                <div className="flex-1 overflow-y-auto p-4">
                  <p className="text-xs text-slate-500 mb-3 uppercase tracking-wide font-medium">Generated implementations</p>
                  <div className="space-y-2">
                    {Object.entries(results).map(([id, r]) => (
                      <button key={id} onClick={() => setSelectedResult(id)}
                        className="w-full text-left bg-slate-800 border border-slate-700 hover:border-emerald-700/60 rounded-xl p-3 transition-colors group">
                        <div className="flex items-start gap-3">
                          <CheckCircle size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-200 leading-snug">{r.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-slate-600">{r.model?.includes('8b') ? 'fast model' : 'standard model'}</span>
                              <span className="text-xs text-slate-600">· ~{r.tokensEstimate} tokens</span>
                            </div>
                          </div>
                          <Code size={14} className="text-slate-600 group-hover:text-slate-400 flex-shrink-0" />
                        </div>
                      </button>
                    ))}

                    {/* Items still in flight */}
                    {Object.entries(itemStates).filter(([, s]) => s === 'running').map(([id]) => (
                      <div key={id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 flex items-center gap-3">
                        <Loader size={14} className="text-amber-400 animate-spin flex-shrink-0" />
                        <p className="text-sm text-slate-500">Building…</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main portal ───────────────────────────────────────────────────────────────

export default function DevPortal() {
  // Set a distinct browser tab title so it doesn't show "SalesFlow CRM"
  useEffect(() => {
    const prev = document.title;
    document.title = '⚡ Dev Portal · SalesFlow';
    const link = document.querySelector("link[rel~='icon']");
    const prevHref = link?.href;
    if (link) link.href = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>";
    return () => {
      document.title = prev;
      if (link && prevHref) link.href = prevHref;
    };
  }, []);

  const [authed, setAuthed] = useState(devApi.isLoggedIn());
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [addingToCol, setAddingToCol] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState({});
  const [filterEpic, setFilterEpic] = useState('');
  const [filterEffort, setFilterEffort] = useState('');
  const [showChat, setShowChat] = useState(true);
  const [buildResult, setBuildResult] = useState(null); // { item, plan }
  const [building, setBuilding] = useState(null); // itemId being built
  const [showTakeover, setShowTakeover] = useState(false);
  const [showPush, setShowPush] = useState(false);
  const [deploying, setDeploying] = useState(false);

  const handleDeployNow = async () => {
    setDeploying(true);
    try {
      const r = await devApi.deployNow();
      toast.success(`Deploy triggered — ${r.deployId?.slice(0, 8) ?? 'queued'}`, { duration: 5000 });
    } catch (e) {
      toast.error(e.response?.data?.error || 'Deploy failed');
    } finally {
      setDeploying(false);
    }
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await devApi.getItems()); }
    catch { toast.error('Failed to load backlog'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (authed) load(); }, [authed, load]);

  const itemsForCol = (colId) => items
    .filter(i => i.status === colId)
    .filter(i => !filterEpic || i.epic === filterEpic)
    .filter(i => !filterEffort || i.effort === filterEffort)
    .sort((a, b) => a.position - b.position);

  // ── Drag ──────────────────────────────────────────────────────────────────

  const handleDragStart = ({ active }) => setActiveItem(items.find(i => i.id === active.id));

  const handleDragOver = ({ active, over }) => {
    if (!over) return;
    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;
    const draggedItem = items.find(i => i.id === activeId);
    const overItem = items.find(i => i.id === overId);
    const overColId = overItem ? overItem.status : COLUMNS.find(c => c.id === overId)?.id;
    if (!overColId || !draggedItem || draggedItem.status === overColId) return;
    setItems(prev => prev.map(i => i.id === activeId ? { ...i, status: overColId } : i));
  };

  const handleDragEnd = async ({ active, over }) => {
    setActiveItem(null);
    if (!over) return;
    const activeId = active.id;
    const overId = over.id;
    const currentItems = [...items];
    const draggedItem = currentItems.find(i => i.id === activeId);
    if (!draggedItem) return;

    const overItem = currentItems.find(i => i.id === overId);
    const newStatus = overItem ? overItem.status : (COLUMNS.find(c => c.id === overId)?.id || draggedItem.status);

    let newItems = currentItems.map(i => i.id === activeId ? { ...i, status: newStatus } : i);

    if (overItem && activeId !== overId && draggedItem.status === newStatus) {
      const colItems = newItems.filter(i => i.status === newStatus);
      const aIdx = colItems.findIndex(i => i.id === activeId);
      const oIdx = colItems.findIndex(i => i.id === overId);
      const reordered = arrayMove(colItems, aIdx, oIdx);
      const updatedPositions = reordered.map((item, idx) => ({ ...item, position: idx + 1 }));
      newItems = newItems.filter(i => i.status !== newStatus).concat(updatedPositions);
    }

    setItems(newItems);

    try {
      await devApi.updateItem(activeId, { status: newStatus, position: newItems.find(i => i.id === activeId)?.position });

      // Build column trigger
      if (newStatus === 'build') {
        toast.loading('Claude is generating the build plan…', { id: 'build' });
        setBuilding(activeId);
        try {
          const res = await devApi.buildItem(activeId);
          toast.success('Build plan ready', { id: 'build' });
          setBuildResult({ item: res.item, plan: res.plan });
          // Move item to in_progress after build triggered
          setItems(prev => prev.map(i => i.id === activeId ? { ...i, status: 'in_progress' } : i));
        } catch {
          toast.error('Build plan failed', { id: 'build' });
        } finally {
          setBuilding(null);
        }
      }
    } catch {
      toast.error('Failed to save');
      load();
    }
  };

  // ── CRUD ──────────────────────────────────────────────────────────────────

  const handleAddCard = async (data) => {
    const item = await devApi.createItem(data);
    setItems(prev => [...prev, item]);
    toast.success('Item added');
  };

  const handleSaveCard = async (data) => {
    const updated = await devApi.updateItem(data.id, data);
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
    toast.success('Saved');
  };

  const handleDeleteCard = async (id) => {
    await devApi.deleteItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
    toast.success('Deleted');
  };

  // ── AI Prioritise ─────────────────────────────────────────────────────────

  const runAI = async () => {
    setAiLoading(true);
    try {
      const result = await devApi.aiPrioritise();
      setAiResult(result);
      const map = {};
      result.items.forEach(s => { map[s.id] = s; });
      setAiSuggestions(map);
    } catch { toast.error('AI prioritisation failed'); }
    finally { setAiLoading(false); }
  };

  const applyAI = async (effectiveItems) => {
    if (!aiResult) return;
    const toApply = effectiveItems || aiResult.items;
    await Promise.all(toApply.map(s => devApi.updateItem(s.id, { priority: s.suggestedPriority })));
    setItems(prev => prev.map(i => {
      const s = toApply.find(s => s.id === i.id);
      return s ? { ...i, priority: s.suggestedPriority } : i;
    }));
    setAiResult(null);
    toast.success('Priorities applied');
  };

  const done = items.filter(i => i.status === 'done').length;
  const total = items.length;

  if (!authed) return <DevLogin onLogin={() => setAuthed(true)} />;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155' } }} />

      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-900 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white tracking-tight text-sm">SalesFlow Dev Portal</h1>
            <p className="text-xs text-slate-500">{total} items · {done} done</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select value={filterEpic} onChange={e => setFilterEpic(e.target.value)}
            className="text-xs rounded-lg bg-slate-800 border border-slate-700 px-2 py-1.5 text-slate-300 focus:outline-none">
            <option value="">All epics</option>
            {EPICS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <select value={filterEffort} onChange={e => setFilterEffort(e.target.value)}
            className="text-xs rounded-lg bg-slate-800 border border-slate-700 px-2 py-1.5 text-slate-300 focus:outline-none">
            <option value="">All efforts</option>
            {EFFORTS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>

          <div className="hidden sm:flex items-center gap-2 ml-1">
            <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${total ? (done/total)*100 : 0}%` }} />
            </div>
            <span className="text-xs text-slate-400">{total ? Math.round((done/total)*100) : 0}%</span>
          </div>

          <button onClick={runAI} disabled={aiLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-lg text-xs font-medium transition-colors ml-1">
            <Sparkles size={13} />
            {aiLoading ? 'Thinking…' : 'AI Prioritise'}
          </button>

          <button onClick={() => setShowTakeover(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-lg text-xs font-semibold transition-all shadow-md shadow-violet-900/40">
            <Play size={13} /> Take Over
          </button>

          <button onClick={() => setShowPush(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 rounded-lg text-xs font-semibold transition-all shadow-md shadow-emerald-900/40 border border-emerald-600/30">
            <GitMerge size={13} /> Push to Production
          </button>

          <button onClick={handleDeployNow} disabled={deploying}
            title="Deploy current main branch to production immediately (no PR — use for dev portal fixes)"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-700 hover:bg-orange-600 disabled:opacity-50 rounded-lg text-xs font-semibold transition-all border border-orange-600/40">
            <Zap size={13} /> {deploying ? 'Deploying…' : 'Deploy Now'}
          </button>

          <button onClick={() => setShowChat(c => !c)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              showChat ? 'bg-slate-700 border-slate-600 text-white' : 'border-slate-700 text-slate-400 hover:text-white'
            }`}>
            <MessageSquare size={13} />
            AI Chat
          </button>

          <button onClick={() => { devApi.logout(); setAuthed(false); }} className="text-slate-500 hover:text-slate-300 p-1.5 ml-1">
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* Body: board + chat panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Kanban board */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
              <div className="flex gap-4 p-5 items-start">
                {COLUMNS.map(col => (
                  <div key={col.id} className="flex flex-col gap-2">
                    <Column col={col} items={itemsForCol(col.id)} onCardClick={setEditItem} onAddCard={setAddingToCol} aiSuggestions={aiSuggestions} />
                    {addingToCol === col.id && (
                      <QuickAdd status={col.id} onAdd={handleAddCard} onCancel={() => setAddingToCol(null)} />
                    )}
                  </div>
                ))}
              </div>
              <DragOverlay>
                {activeItem ? <KanbanCard item={activeItem} onClick={() => {}} /> : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>

        {/* AI Chat panel */}
        {showChat && <ChatPanel onAddItem={handleAddCard} onClose={() => setShowChat(false)} />}
      </div>

      {/* Modals & drawers */}
      {editItem && (
        <CardModal item={editItem} onClose={() => setEditItem(null)} onSave={handleSaveCard} onDelete={handleDeleteCard} />
      )}
      {aiResult && (
        <AIResultsPanel result={aiResult} onApply={applyAI} onClose={() => setAiResult(null)} />
      )}
      {buildResult && (
        <BuildDrawer item={buildResult.item} plan={buildResult.plan} onClose={() => setBuildResult(null)} />
      )}
      {showTakeover && (
        <TakeOverModal onClose={() => setShowTakeover(false)} onRefreshBoard={load} />
      )}
      {showPush && (
        <PushToProductionModal onClose={() => setShowPush(false)} />
      )}
    </div>
  );
}
