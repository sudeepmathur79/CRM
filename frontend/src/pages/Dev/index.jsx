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
  Zap, Clock, Send, Bot, User, Hammer, ChevronRight, Loader,
  MessageSquare, LayoutGrid,
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
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 p-5 border-b border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
            <Sparkles size={15} className="text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">AI Prioritisation</h3>
            <p className="text-xs text-slate-500">Llama 3.3 70B</p>
          </div>
          <button onClick={onClose} className="ml-auto text-slate-500 hover:text-slate-300"><X size={16} /></button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">
          <div className="bg-indigo-950/60 border border-indigo-800/30 rounded-xl p-4 mb-4">
            <p className="text-sm text-indigo-200 leading-relaxed">{result.reasoning}</p>
          </div>
          <div className="space-y-2">
            {result.items.map((s, i) => (
              <div key={s.id} className="flex items-start gap-3 py-2 border-b border-slate-800 last:border-0">
                <span className="text-xs font-bold text-slate-600 w-5 flex-shrink-0 mt-0.5">#{i+1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 font-medium truncate">{s.id}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.reason}</p>
                </div>
                <span className={`text-xs px-1.5 py-0.5 rounded font-semibold flex-shrink-0 ${PRIORITY_META[s.suggestedPriority]?.color}`}>
                  P{s.suggestedPriority}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="p-5 border-t border-slate-800 flex gap-2">
          <button onClick={onApply} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors">
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

// ── Main portal ───────────────────────────────────────────────────────────────

export default function DevPortal() {
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

  const applyAI = async () => {
    if (!aiResult) return;
    await Promise.all(aiResult.items.map(s => devApi.updateItem(s.id, { priority: s.suggestedPriority })));
    setItems(prev => prev.map(i => {
      const s = aiResult.items.find(s => s.id === i.id);
      return s ? { ...i, priority: s.suggestedPriority } : i;
    }));
    setAiResult(null);
    toast.success('AI priorities applied');
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
    </div>
  );
}
