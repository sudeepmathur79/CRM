import { useState, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Upload, RotateCcw, Paintbrush } from 'lucide-react';

const PRESETS = [
  { label: 'Indigo (default)', primary: '#4F46E5', accent: '#818CF8', bg: '#1E1B4B' },
  { label: 'Emerald', primary: '#059669', accent: '#34D399', bg: '#064E3B' },
  { label: 'Rose', primary: '#E11D48', accent: '#FB7185', bg: '#4C0519' },
  { label: 'Amber', primary: '#D97706', accent: '#FCD34D', bg: '#451A03' },
  { label: 'Sky', primary: '#0284C7', accent: '#38BDF8', bg: '#0C4A6E' },
  { label: 'Violet', primary: '#7C3AED', accent: '#A78BFA', bg: '#2E1065' },
];

function ColorPicker({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 font-mono">{value || '—'}</span>
        <label className="relative cursor-pointer">
          <div
            className="w-8 h-8 rounded-lg border-2 border-gray-200 dark:border-slate-600 shadow-sm"
            style={{ background: value || '#E5E7EB' }}
          />
          <input
            type="color"
            value={value || '#4F46E5'}
            onChange={e => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          />
        </label>
      </div>
    </div>
  );
}

export default function BrandingSection() {
  const qc = useQueryClient();
  const logoInputRef = useRef(null);
  const faviconInputRef = useRef(null);

  const { data: org } = useQuery({
    queryKey: ['org'],
    queryFn: () => api.get('/org').then(r => r.data),
  });

  const [colors, setColors] = useState({
    brandPrimary: org?.brandPrimary || '',
    brandAccent: org?.brandAccent || '',
    brandBg: org?.brandBg || '',
  });

  // Sync when org loads
  useState(() => {
    if (org) setColors({
      brandPrimary: org.brandPrimary || '',
      brandAccent: org.brandAccent || '',
      brandBg: org.brandBg || '',
    });
  }, [org]);

  const colorMutation = useMutation({
    mutationFn: (data) => api.put('/org/branding', data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['org'] }); toast.success('Brand colours saved'); },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed to save'),
  });

  const logoMutation = useMutation({
    mutationFn: (file) => {
      const fd = new FormData();
      fd.append('logo', file);
      return api.post('/org/branding/logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['org'] }); toast.success('Logo uploaded'); },
    onError: (e) => toast.error(e.response?.data?.error || 'Upload failed'),
  });

  const faviconMutation = useMutation({
    mutationFn: (file) => {
      const fd = new FormData();
      fd.append('favicon', file);
      return api.post('/org/branding/favicon', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['org'] }); toast.success('Favicon uploaded'); },
    onError: (e) => toast.error(e.response?.data?.error || 'Upload failed'),
  });

  const resetMutation = useMutation({
    mutationFn: () => api.delete('/org/branding'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org'] });
      setColors({ brandPrimary: '', brandAccent: '', brandBg: '' });
      toast.success('Branding reset to default');
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const applyPreset = (preset) => {
    setColors({ brandPrimary: preset.primary, brandAccent: preset.accent, brandBg: preset.bg });
  };

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
      <div className="flex items-center gap-2 mb-5">
        <Paintbrush size={16} className="text-primary-600" />
        <h3 className="font-semibold text-gray-900 dark:text-white">Brand &amp; Identity</h3>
      </div>

      {/* Logo + Favicon row */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Logo */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Logo</p>
          <div className="flex flex-col items-start gap-2">
            {org?.brandLogoUrl ? (
              <img
                src={`${baseUrl}${org.brandLogoUrl}`}
                alt="Logo"
                className="h-10 max-w-[140px] object-contain rounded border border-gray-100 dark:border-slate-700 p-1 bg-gray-50 dark:bg-slate-700"
              />
            ) : (
              <div className="h-10 w-28 rounded border-2 border-dashed border-gray-200 dark:border-slate-600 flex items-center justify-center">
                <span className="text-xs text-gray-400">No logo</span>
              </div>
            )}
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files?.[0] && logoMutation.mutate(e.target.files[0])} />
            <button onClick={() => logoInputRef.current?.click()} disabled={logoMutation.isPending}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-600 dark:text-gray-300 transition-colors">
              <Upload size={11} /> {logoMutation.isPending ? 'Uploading…' : 'Upload'}
            </button>
          </div>
        </div>

        {/* Favicon */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Favicon</p>
          <div className="flex flex-col items-start gap-2">
            {org?.brandFaviconUrl ? (
              <img
                src={`${baseUrl}${org.brandFaviconUrl}`}
                alt="Favicon"
                className="h-10 w-10 object-contain rounded border border-gray-100 dark:border-slate-700 p-1 bg-gray-50 dark:bg-slate-700"
              />
            ) : (
              <div className="h-10 w-10 rounded border-2 border-dashed border-gray-200 dark:border-slate-600 flex items-center justify-center">
                <span className="text-xs text-gray-400">—</span>
              </div>
            )}
            <input ref={faviconInputRef} type="file" accept="image/png,image/x-icon,image/svg+xml" className="hidden"
              onChange={e => e.target.files?.[0] && faviconMutation.mutate(e.target.files[0])} />
            <button onClick={() => faviconInputRef.current?.click()} disabled={faviconMutation.isPending}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-600 dark:text-gray-300 transition-colors">
              <Upload size={11} /> {faviconMutation.isPending ? 'Uploading…' : 'Upload'}
            </button>
          </div>
        </div>
      </div>

      {/* Colour presets */}
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Colour Presets</p>
      <div className="flex flex-wrap gap-2 mb-5">
        {PRESETS.map(p => (
          <button key={p.label} onClick={() => applyPreset(p)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 text-xs text-gray-600 dark:text-gray-300 hover:border-gray-400 transition-colors">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: p.primary }} />
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom colour pickers */}
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Custom Colours</p>
      <div className="space-y-3 mb-5">
        <ColorPicker label="Primary (buttons, links)" value={colors.brandPrimary} onChange={v => setColors(c => ({ ...c, brandPrimary: v }))} />
        <ColorPicker label="Accent (highlights, badges)" value={colors.brandAccent} onChange={v => setColors(c => ({ ...c, brandAccent: v }))} />
        <ColorPicker label="Sidebar background" value={colors.brandBg} onChange={v => setColors(c => ({ ...c, brandBg: v }))} />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => colorMutation.mutate(colors)}
          disabled={colorMutation.isPending}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors">
          {colorMutation.isPending ? 'Saving…' : 'Save brand colours'}
        </button>
        <button
          onClick={() => { if (confirm('Reset all branding to default?')) resetMutation.mutate(); }}
          disabled={resetMutation.isPending}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-red-500 transition-colors">
          <RotateCcw size={13} /> Reset to default
        </button>
      </div>
    </section>
  );
}
