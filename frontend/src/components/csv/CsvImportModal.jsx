import { useState, useRef, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { csvApi } from '../../services/api';
import Modal from '../ui/Modal';
import { Upload, FileText, AlertCircle, CheckCircle, ChevronDown, ChevronUp, X } from 'lucide-react';
import toast from 'react-hot-toast';

const SAMPLE_CSV = `Name,Email,Phone,Company,Status,Source,Notes,Next Follow Up
John Smith,john@acme.com,0412345678,Acme Corp,New,Referral,Met at conference,2026-07-15
Jane Doe,jane@beta.io,,Beta Inc,Contacted,LinkedIn,,`;

function downloadSample() {
  const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'sample-leads.csv';
  a.click();
}

export default function CsvImportModal({ open, onClose }) {
  const qc = useQueryClient();
  const fileRef = useRef();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showErrors, setShowErrors] = useState(false);
  const [showDupes, setShowDupes] = useState(false);
  const [dragging, setDragging] = useState(false);

  const previewMutation = useMutation({
    mutationFn: (f) => csvApi.preview(f).then(r => r.data),
    onSuccess: setPreview,
    onError: (e) => toast.error(e.response?.data?.error || 'Could not parse file'),
  });

  const importMutation = useMutation({
    mutationFn: (f) => csvApi.import(f).then(r => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      toast.success(`Imported ${data.imported} leads${data.skipped ? ` · ${data.skipped} skipped` : ''}${data.duplicates ? ` · ${data.duplicates} duplicates` : ''}`);
      handleClose();
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Import failed'),
  });

  const handleFile = useCallback((f) => {
    if (!f || !f.name.endsWith('.csv')) { toast.error('Please select a .csv file'); return; }
    setFile(f);
    setPreview(null);
    previewMutation.mutate(f);
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setShowErrors(false);
    setShowDupes(false);
    onClose();
  };

  const COLS = ['Name', 'Email', 'Phone', 'Company', 'Status', 'Source'];

  return (
    <Modal open={open} onClose={handleClose} title="Import Leads from CSV">
      <div className="space-y-4">

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            dragging ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' :
            file ? 'border-green-400 bg-green-50 dark:bg-green-900/10' :
            'border-gray-300 dark:border-slate-600 hover:border-primary-400 dark:hover:border-primary-500'
          }`}
        >
          <input ref={fileRef} type="file" accept=".csv" className="hidden"
            onChange={e => handleFile(e.target.files[0])} />
          {file ? (
            <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-400">
              <FileText size={20} />
              <span className="font-medium text-sm">{file.name}</span>
              <button onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
                className="p-0.5 rounded hover:bg-green-100 dark:hover:bg-green-900/30">
                <X size={14} />
              </button>
            </div>
          ) : (
            <>
              <Upload size={24} className="mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Drop a CSV file here or click to browse</p>
              <p className="text-xs text-gray-400 mt-1">Max 5 MB</p>
            </>
          )}
        </div>

        {/* Sample download */}
        <button onClick={downloadSample}
          className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
          <FileText size={12} /> Download sample CSV template
        </button>

        {/* Loading */}
        {previewMutation.isPending && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500" />
            Analysing file…
          </div>
        )}

        {/* Preview results */}
        {preview && (
          <div className="space-y-3">
            {/* Summary chips */}
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                {preview.total} rows total
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                {preview.valid} ready to import
              </span>
              {preview.skipped > 0 && (
                <button onClick={() => setShowErrors(s => !s)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 flex items-center gap-1">
                  {preview.skipped} errors {showErrors ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                </button>
              )}
              {preview.duplicates?.length > 0 && (
                <button onClick={() => setShowDupes(s => !s)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 flex items-center gap-1">
                  {preview.duplicates.length} duplicates {showDupes ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                </button>
              )}
            </div>

            {/* Unmapped columns warning */}
            {preview.unmappedColumns?.length > 0 && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-xs text-amber-700 dark:text-amber-300">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span>Columns not recognised (will be ignored): <strong>{preview.unmappedColumns.join(', ')}</strong></span>
              </div>
            )}

            {/* Error detail */}
            {showErrors && preview.rowErrors?.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-3 space-y-1 max-h-32 overflow-y-auto">
                {preview.rowErrors.map((e, i) => (
                  <div key={i} className="text-xs text-red-700 dark:text-red-400">
                    Row {e.row}: {e.errors.join('; ')}
                  </div>
                ))}
              </div>
            )}

            {/* Duplicate detail */}
            {showDupes && preview.duplicates?.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/10 rounded-lg p-3 space-y-1 max-h-32 overflow-y-auto">
                {preview.duplicates.map((d, i) => (
                  <div key={i} className="text-xs text-amber-700 dark:text-amber-400">
                    Row {d.row}: {d.name} — {d.reason}
                  </div>
                ))}
              </div>
            )}

            {/* Sample preview table */}
            {preview.sample?.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-slate-700">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 dark:bg-slate-700/50">
                    <tr>
                      {COLS.map(c => <th key={c} className="p-2 text-left font-medium text-gray-500">{c}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                    {preview.sample.map((row, i) => (
                      <tr key={i} className="bg-white dark:bg-slate-800">
                        <td className="p-2 font-medium">{row.name || '—'}</td>
                        <td className="p-2 text-gray-500">{row.email || '—'}</td>
                        <td className="p-2 text-gray-500">{row.phone || '—'}</td>
                        <td className="p-2 text-gray-500">{row.company || '—'}</td>
                        <td className="p-2">{row.status || 'New'}</td>
                        <td className="p-2 text-gray-500">{row.source || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.valid > 5 && (
                  <div className="p-2 text-center text-xs text-gray-400 bg-gray-50 dark:bg-slate-700/30">
                    … and {preview.valid - 5} more rows
                  </div>
                )}
              </div>
            )}

            {/* Action */}
            {preview.valid > 0 ? (
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={handleClose}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700">
                  Cancel
                </button>
                <button
                  onClick={() => importMutation.mutate(file)}
                  disabled={importMutation.isPending}
                  className="px-5 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-medium rounded-lg text-sm flex items-center gap-2">
                  {importMutation.isPending
                    ? <><div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" /> Importing…</>
                    : <><CheckCircle size={15} /> Import {preview.valid} leads</>
                  }
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-sm text-red-700 dark:text-red-300">
                <AlertCircle size={16} />
                No valid rows to import. Fix the errors above and re-upload.
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
