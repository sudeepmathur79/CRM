import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../../services/api';

/**
 * Textarea with @mention support.
 * Props:
 *   value, onChange(newValue), onMentions(userIds[]) — called whenever mentions change
 *   placeholder, rows, className, onKeyDown
 */
export default function MentionTextarea({ value, onChange, onMentions, placeholder, rows = 2, className = '', onKeyDown }) {
  const textareaRef = useRef(null);
  const [showPicker, setShowPicker] = useState(false);
  const [query, setQuery] = useState('');
  const [atIndex, setAtIndex] = useState(-1);
  const [pickerIndex, setPickerIndex] = useState(0);

  const { data: allUsers = [] } = useQuery({
    queryKey: ['users-all'],
    queryFn: () => usersApi.list().then(r => r.data),
    staleTime: 60000,
  });

  const filtered = allUsers.filter(u =>
    u.isActive !== false && u.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 6);

  // Parse @mentions already in text to extract mentioned userIds
  const extractMentions = useCallback((text) => {
    const names = allUsers.map(u => u.name);
    const found = [];
    for (const u of allUsers) {
      if (text.includes(`@${u.name}`)) found.push(u.id);
    }
    return found;
  }, [allUsers]);

  const handleChange = (e) => {
    const text = e.target.value;
    onChange(text);
    onMentions?.(extractMentions(text));

    const cursor = e.target.selectionStart;
    // Find last @ before cursor
    const before = text.slice(0, cursor);
    const lastAt = before.lastIndexOf('@');
    if (lastAt !== -1) {
      const fragment = before.slice(lastAt + 1);
      // Only show picker if fragment has no spaces (still typing the name)
      if (!fragment.includes(' ') && !fragment.includes('\n')) {
        setAtIndex(lastAt);
        setQuery(fragment);
        setShowPicker(true);
        setPickerIndex(0);
        return;
      }
    }
    setShowPicker(false);
  };

  const insertMention = (user) => {
    const before = value.slice(0, atIndex);
    const after = value.slice(atIndex + 1 + query.length);
    const newText = `${before}@${user.name} ${after}`;
    onChange(newText);
    onMentions?.(extractMentions(newText));
    setShowPicker(false);
    // Restore focus
    setTimeout(() => {
      const el = textareaRef.current;
      if (el) {
        const pos = atIndex + user.name.length + 2;
        el.focus();
        el.setSelectionRange(pos, pos);
      }
    }, 0);
  };

  const handleKeyDown = (e) => {
    if (showPicker && filtered.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setPickerIndex(i => Math.min(i + 1, filtered.length - 1)); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setPickerIndex(i => Math.max(i - 1, 0)); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insertMention(filtered[pickerIndex]); return; }
      if (e.key === 'Escape') { setShowPicker(false); return; }
    }
    onKeyDown?.(e);
  };

  // Close picker on outside click
  useEffect(() => {
    const handler = (e) => { if (!textareaRef.current?.contains(e.target)) setShowPicker(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Render @Name as highlighted spans — for display-only, we overlay on the textarea using a mirror div
  // (simple approach: just style the textarea, highlights shown in a separate read-only layer)
  // For MVP we just show the picker; the @Name text is plain in the textarea.

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        rows={rows}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
      />

      {showPicker && filtered.length > 0 && (
        <div className="absolute bottom-full mb-1 left-0 z-50 w-56 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl shadow-lg overflow-hidden">
          <div className="px-3 py-1.5 text-xs text-gray-400 border-b border-gray-100 dark:border-slate-700">
            Mention someone
          </div>
          {filtered.map((u, i) => (
            <button key={u.id} type="button"
              onMouseDown={(e) => { e.preventDefault(); insertMention(u); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                i === pickerIndex ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' : 'hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 ${
                u.role === 'admin' ? 'bg-violet-500' : u.role === 'viewer' ? 'bg-blue-500' : 'bg-emerald-500'
              }`}>
                {u.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div>
                <div className="font-medium leading-tight">{u.name}</div>
                <div className="text-xs text-gray-400 capitalize">{u.role}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Render message/note text with @Name highlighted in blue.
 */
export function MentionText({ text, className = '' }) {
  if (!text) return null;
  const parts = text.split(/(@\S+)/g);
  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.startsWith('@')
          ? <span key={i} className="text-primary-500 font-medium">{part}</span>
          : part
      )}
    </span>
  );
}
