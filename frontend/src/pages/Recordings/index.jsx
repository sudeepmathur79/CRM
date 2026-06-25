import { useQuery } from '@tanstack/react-query';
import { recordingsApi } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { Mic, FileText, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

const safeFormat = (val, fmt) => { try { return val ? format(new Date(val), fmt) : '—'; } catch { return '—'; } };

export default function RecordingsPage() {
  const navigate = useNavigate();

  const { data: recordings = [], isLoading } = useQuery({
    queryKey: ['recordings'],
    queryFn: () => recordingsApi.list().then(r => r.data),
  });

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl md:text-2xl font-bold mb-4">Recordings & Files</h1>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
        </div>
      ) : recordings.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-12 text-center text-gray-400">
          <Mic size={32} className="mx-auto mb-3 opacity-40" />
          <p>No recordings yet. Open a lead to record or upload files.</p>
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
    </div>
  );
}
