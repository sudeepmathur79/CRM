import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recordingsApi, leadsApi } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { Mic, FileText, ChevronRight, Upload, X } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../services/api';

const safeFormat = (val, fmt) => { try { return val ? format(new Date(val), fmt) : '—'; } catch { return '—'; } };

function UploadModal({ onClose }) {
  const qc = useQueryClient();
  const [leadSearch, setLeadSearch] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const { data: leads = [] } = useQuery({
    queryKey: ['leads-upload-search', leadSearch],
    queryFn: () => leadsApi.list({ search: leadSearch || undefined, take: 20 }).then(r => r.data),
    enabled: leadSearch.length > 0,
  });

  const handleUpload = async () => {
    if (!selectedLead) { toast.error('Select a lead first'); return; }
    if (!file) { toast.error('Choose a file'); return; }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      await api.post(`/recordings/upload/${selectedLead.id}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      qc.invalidateQueries({ queryKey: ['recordings'] });
      toast.success('File uploaded');
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-900 dark:text-white">Upload file to lead</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={18} /></button>
        </div>

        <div className="space-y-4">
          {/* Lead search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lead</label>
            {selectedLead ? (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-primary-300 dark:border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-sm">
                <span className="font-medium text-primary-700 dark:text-primary-300">{selectedLead.name}</span>
                <button onClick={() => setSelectedLead(null)} className="text-primary-400 hover:text-primary-600"><X size={14} /></button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={leadSearch}
                  onChange={e => setLeadSearch(e.target.value)}
                  placeholder="Search leads…"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {leads.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {leads.map(l => (
                      <button key={l.id} onClick={() => { setSelectedLead(l); setLeadSearch(''); }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm">
                        <div className="font-medium text-gray-900 dark:text-white">{l.name}</div>
                        {l.company && <div className="text-xs text-gray-400">{l.company}</div>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* File picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">File</label>
            <input ref={fileRef} type="file" className="hidden" onChange={e => setFile(e.target.files[0])} />
            {file ? (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-sm">
                <span className="truncate text-gray-700 dark:text-gray-200">{file.name}</span>
                <button onClick={() => setFile(null)} className="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2"><X size={14} /></button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-3 py-6 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-400 hover:border-primary-400 hover:text-primary-500 text-sm transition-colors">
                <Upload size={16} /> Choose file
              </button>
            )}
          </div>

          <button onClick={handleUpload} disabled={uploading || !selectedLead || !file}
            className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors">
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RecordingsPage() {
  const navigate = useNavigate();
  const [showUpload, setShowUpload] = useState(false);

  const { data: recordings = [], isLoading } = useQuery({
    queryKey: ['recordings'],
    queryFn: () => recordingsApi.list().then(r => r.data),
  });

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Recordings & Files</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">{recordings.length} file{recordings.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowUpload(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors">
          <Upload size={15} /> <span className="hidden sm:inline">Upload</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
        </div>
      ) : recordings.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-12 text-center text-gray-400">
          <Mic size={32} className="mx-auto mb-3 opacity-40" />
          <p className="mb-4">No recordings yet. Open a lead to record, or upload a file.</p>
          <button onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium">
            <Upload size={14} /> Upload file
          </button>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
                <tr>
                  <th className="p-4 text-left font-medium text-gray-600 dark:text-gray-400">File</th>
                  <th className="p-4 text-left font-medium text-gray-600 dark:text-gray-400">Lead</th>
                  <th className="p-4 text-left font-medium text-gray-600 dark:text-gray-400">Type</th>
                  <th className="p-4 text-left font-medium text-gray-600 dark:text-gray-400">AI Summary</th>
                  <th className="p-4 text-left font-medium text-gray-600 dark:text-gray-400">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                {recordings.map(rec => (
                  <tr key={rec.id}
                    className="hover:bg-gray-50 dark:hover:bg-slate-700/30 cursor-pointer"
                    onClick={() => navigate(`/leads/${rec.leadId}`)}>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-gray-400 flex-shrink-0" />
                        <span className="truncate max-w-xs">{rec.fileName}</span>
                      </div>
                    </td>
                    <td className="p-4 text-primary-600 dark:text-primary-400">{rec.lead?.name || '—'}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-slate-700">{rec.type}</span>
                    </td>
                    <td className="p-4">
                      {rec.summary
                        ? <span className="text-green-600 dark:text-green-400 text-xs">✓ Analysed</span>
                        : rec.transcript
                          ? <span className="text-amber-600 dark:text-amber-400 text-xs">Transcript only</span>
                          : <span className="text-gray-400 text-xs">—</span>
                      }
                    </td>
                    <td className="p-4 text-gray-500">{safeFormat(rec.createdAt, 'MMM d, yyyy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden space-y-2">
            {recordings.map(rec => (
              <div key={rec.id}
                className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 flex items-center gap-3"
                onClick={() => navigate(`/leads/${rec.leadId}`)}>
                <FileText size={18} className="text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{rec.fileName}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {rec.lead?.name && <span className="text-primary-600 dark:text-primary-400">{rec.lead.name} · </span>}
                    {safeFormat(rec.createdAt, 'MMM d, yyyy')}
                  </div>
                  {rec.summary && <div className="text-xs text-green-600 dark:text-green-400 mt-0.5">✓ AI analysed</div>}
                </div>
                <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
              </div>
            ))}
          </div>
        </>
      )}

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
    </div>
  );
}
