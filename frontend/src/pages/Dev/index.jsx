import { useState, useEffect, useCallback } from 'react';
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
  Zap, BarChart2, Tag, Clock,
} from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────

const COLUMNS = [
  { id: 'backlog',     label: 'Backlog',      color: 'bg-slate-100 dark:bg-slate-700' },
  { id: 'ready',       label: 'Ready',        color: 'bg-blue-50 dark:bg-blue-900/20' },
  { id: 'in_progress', label: 'In Progress',  color: 'bg-amber-50 dark:bg-amber-900/20' },
  { id: 'review',      label: 'Review',       color: 'bg-violet-50 dark:bg-violet-900/20' },
  { id: 'done',        label: 'Done',         color: 'bg-green-50 dark:bg-green-900/20' },
];

const PRIORITY_META = {
  0: { label: 'P0', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  1: { label: 'P1', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  2: { label: 'P2', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  3: { label: 'P3', color: 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400' },
};

const EFFORTS = ['XS', 'S', 'M', 'L', 'XL'];
const EPICS = ['Developer Portal', 'Architecture', "What's New", 'Mobile', 'Product', 'Security', 'Other'];

const EPIC_COLORS = {
  'Developer Portal': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  'Architecture': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  "What's New": 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  'Mobile': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  'Product': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  'Security': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  'Other': 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300',
};

// ── Login ────────────────────────────────────────────────────────────────────

function DevLogin({ onLogin }) {
  const [secret, setSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await devApi.login(secret);
      onLogin();
    } catch {
      setError('Invalid secret');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Dev Portal</span>
        </div>
        <div className="bg-slate-800 rounded-2xl p-7 shadow-2xl border border-slate-700">
          <p className="text-slate-400 text-sm mb-5 text-center">Enter your <code className="text-indigo-400">DEV_SECRET</code> to continue</p>
          <form onSubmit={submit} className="space-y-4">
            <input
              type="password"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between p-5 border-b border-gray-100 dark:border-slate-700">
          <input
            value={form.title}
            onChange={e => set('title', e.target.value)}
            className="text-lg font-semibold text-gray-900 dark:text-white bg-transparent border-0 focus:outline-none flex-1 mr-3"
          />
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex-shrink-0">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {/* Epic + Priority + Effort row */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Epic</label>
              <select value={form.epic || ''} onChange={e => set('epic', e.target.value)}
                className="w-full text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">—</option>
                {EPICS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Priority</label>
              <select value={form.priority} onChange={e => set('priority', Number(e.target.value))}
                className="w-full text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {[0,1,2,3].map(p => <option key={p} value={p}>P{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Effort</label>
              <select value={form.effort} onChange={e => set('effort', e.target.value)}
                className="w-full text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {EFFORTS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="w-full text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Description</label>
            <textarea
              value={form.description || ''}
              onChange={e => set('description', e.target.value)}
              rows={4}
              placeholder="Acceptance criteria, notes…"
              className="w-full text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Tags (comma-separated)</label>
            <input
              value={(form.tags || []).join(', ')}
              onChange={e => set('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
              placeholder="frontend, backend, mobile"
              className="w-full text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="flex items-center justify-between p-5 border-t border-gray-100 dark:border-slate-700">
          <button onClick={() => { if (confirm('Delete this item?')) { onDelete(item.id); onClose(); } }}
            className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 transition-colors">
            <Trash2 size={14} /> Delete
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-200">Cancel</button>
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

// ── Sortable card ─────────────────────────────────────────────────────────────

function KanbanCard({ item, onClick, aiSuggestion }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  const p = PRIORITY_META[item.priority] || PRIORITY_META[2];

  return (
    <div ref={setNodeRef} style={style}
      className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
      onClick={onClick}>
      <div className="flex items-start gap-2">
        <button {...attributes} {...listeners} onClick={e => e.stopPropagation()}
          className="mt-0.5 text-gray-300 dark:text-slate-600 hover:text-gray-500 dark:hover:text-slate-400 flex-shrink-0 cursor-grab active:cursor-grabbing">
          <GripVertical size={14} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug line-clamp-2">{item.title}</p>

          <div className="flex flex-wrap gap-1 mt-2">
            <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${p.color}`}>{p.label}</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 flex items-center gap-0.5">
              <Clock size={9} />{item.effort}
            </span>
            {item.epic && (
              <span className={`text-xs px-1.5 py-0.5 rounded ${EPIC_COLORS[item.epic] || EPIC_COLORS['Other']}`}>{item.epic}</span>
            )}
          </div>

          {item.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {item.tags.slice(0, 3).map(t => (
                <span key={t} className="text-xs px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">{t}</span>
              ))}
            </div>
          )}

          {aiSuggestion && (
            <div className="mt-2 flex items-start gap-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg px-2 py-1.5">
              <Sparkles size={10} className="text-indigo-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-snug">{aiSuggestion.reason}</p>
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

  return (
    <div className="flex flex-col min-w-[260px] max-w-[280px] flex-shrink-0">
      {/* Header */}
      <div className={`flex items-center justify-between px-3 py-2 rounded-xl mb-2 ${col.color}`}>
        <div className="flex items-center gap-2">
          <button onClick={() => setCollapsed(c => !c)} className="text-gray-500 dark:text-gray-400">
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
          <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">{col.label}</span>
          <span className="text-xs bg-white/60 dark:bg-slate-800/60 rounded-full px-2 py-0.5 font-medium text-gray-600 dark:text-gray-300">
            {items.length}
          </span>
        </div>
        {col.id !== 'done' && (
          <button onClick={() => onAddCard(col.id)}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
            <Plus size={15} />
          </button>
        )}
      </div>

      {/* Cards */}
      {!collapsed && (
        <div ref={setNodeRef} className="flex-1 space-y-2 min-h-[60px]">
          <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
            {items.map(item => (
              <KanbanCard
                key={item.id}
                item={item}
                onClick={() => onCardClick(item)}
                aiSuggestion={aiSuggestions?.[item.id]}
              />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
}

// ── Add card form ─────────────────────────────────────────────────────────────

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
    <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-indigo-300 dark:border-indigo-600 p-3 shadow-sm">
      <form onSubmit={submit} className="space-y-2">
        <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Item title…"
          className="w-full text-sm bg-transparent border-0 focus:outline-none text-gray-900 dark:text-white placeholder-gray-400" />
        <select value={epic} onChange={e => setEpic(e.target.value)}
          className="w-full text-xs rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1 focus:outline-none">
          <option value="">Epic…</option>
          {EPICS.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <div className="flex gap-2">
          <button type="submit" className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg font-medium">Add</button>
          <button type="button" onClick={onCancel} className="px-3 py-1 text-gray-400 text-xs hover:text-gray-600">Cancel</button>
        </div>
      </form>
    </div>
  );
}

// ── AI Results overlay ────────────────────────────────────────────────────────

function AIResultsPanel({ result, onApply, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 p-5 border-b border-gray-100 dark:border-slate-700">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
            <Sparkles size={15} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">AI Prioritisation</h3>
            <p className="text-xs text-gray-500">Llama 3.3 70B recommendations</p>
          </div>
          <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 mb-4">
            <p className="text-sm text-indigo-800 dark:text-indigo-200 leading-relaxed">{result.reasoning}</p>
          </div>
          <div className="space-y-2">
            {result.items.map((s, i) => (
              <div key={s.id} className="flex items-start gap-3 py-2 border-b border-gray-50 dark:border-slate-700 last:border-0">
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 w-5 flex-shrink-0 mt-0.5">#{i+1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{s.id}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.reason}</p>
                </div>
                <span className={`text-xs px-1.5 py-0.5 rounded font-semibold flex-shrink-0 ${PRIORITY_META[s.suggestedPriority]?.color}`}>
                  P{s.suggestedPriority}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 dark:border-slate-700 flex gap-2">
          <button onClick={onApply}
            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors">
            Apply priorities
          </button>
          <button onClick={onClose}
            className="px-4 py-2 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 rounded-xl text-sm">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main board ────────────────────────────────────────────────────────────────

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

  // ── Drag handlers ──────────────────────────────────────────────────────────

  const handleDragStart = ({ active }) => setActiveItem(items.find(i => i.id === active.id));

  const handleDragOver = ({ active, over }) => {
    if (!over) return;
    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    const activeItem = items.find(i => i.id === activeId);
    const overItem = items.find(i => i.id === overId);
    const overColId = overItem ? overItem.status : COLUMNS.find(c => c.id === overId)?.id;

    if (!overColId || !activeItem) return;
    if (activeItem.status === overColId) return;

    setItems(prev => prev.map(i => i.id === activeId ? { ...i, status: overColId } : i));
  };

  const handleDragEnd = async ({ active, over }) => {
    setActiveItem(null);
    if (!over) return;
    const activeId = active.id;
    const overId = over.id;

    const currentItems = [...items];
    const activeItem = currentItems.find(i => i.id === activeId);
    if (!activeItem) return;

    const overItem = currentItems.find(i => i.id === overId);
    const newStatus = overItem ? overItem.status : (COLUMNS.find(c => c.id === overId)?.id || activeItem.status);

    let newItems = currentItems.map(i => i.id === activeId ? { ...i, status: newStatus } : i);

    if (overItem && activeId !== overId && activeItem.status === newStatus) {
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
    } catch {
      toast.error('Failed to save position');
      load();
    }
  };

  // ── CRUD handlers ──────────────────────────────────────────────────────────

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

  // ── AI prioritise ──────────────────────────────────────────────────────────

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
    const updates = aiResult.items.map(s => devApi.updateItem(s.id, { priority: s.suggestedPriority }));
    await Promise.all(updates);
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
    <div className="min-h-screen bg-slate-950 text-white">
      <Toaster position="top-right" />

      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white tracking-tight">SalesFlow Dev Portal</h1>
            <p className="text-xs text-slate-500">Product backlog · {total} items · {done} done</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Filters */}
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

          {/* Progress */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-32 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${total ? (done/total)*100 : 0}%` }} />
            </div>
            <span className="text-xs text-slate-400">{total ? Math.round((done/total)*100) : 0}%</span>
          </div>

          {/* AI button */}
          <button onClick={runAI} disabled={aiLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-lg text-sm font-medium transition-colors">
            <Sparkles size={14} />
            {aiLoading ? 'Thinking…' : 'AI Prioritise'}
          </button>

          <button onClick={() => { devApi.logout(); setAuthed(false); }}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1.5">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Board */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 p-6 overflow-x-auto min-h-[calc(100vh-69px)] items-start">
            {COLUMNS.map(col => (
              <div key={col.id} className="flex flex-col gap-2">
                <Column
                  col={col}
                  items={itemsForCol(col.id)}
                  onCardClick={setEditItem}
                  onAddCard={setAddingToCol}
                  aiSuggestions={aiSuggestions}
                />
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

      {/* Card modal */}
      {editItem && (
        <CardModal
          item={editItem}
          onClose={() => setEditItem(null)}
          onSave={handleSaveCard}
          onDelete={handleDeleteCard}
        />
      )}

      {/* AI results panel */}
      {aiResult && (
        <AIResultsPanel result={aiResult} onApply={applyAI} onClose={() => setAiResult(null)} />
      )}
    </div>
  );
}
