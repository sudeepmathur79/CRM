import { useQuery } from '@tanstack/react-query';
import { leadsApi } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { Mic, FileText } from 'lucide-react';
import { format } from 'date-fns';

export default function RecordingsPage() {
  const navigate = useNavigate();
  const { data: leads = [] } = useQuery({
    queryKey: ['leads', '', ''],
    queryFn: () => leadsApi.list({ take: 500 }).then(r => r.data),
  });

  const allRecordings = leads
    .flatMap(lead => (lead.recordings || []).map(r => ({ ...r, lead })))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Recordings & Files</h1>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
        {allRecordings.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Mic size={32} className="mx-auto mb-3 opacity-40" />
            <p>No recordings yet. Open a lead to record or upload files.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
              <tr>
                <th className="p-4 text-left font-medium text-gray-600 dark:text-gray-400">File</th>
                <th className="p-4 text-left font-medium text-gray-600 dark:text-gray-400">Lead</th>
                <th className="p-4 text-left font-medium text-gray-600 dark:text-gray-400">Type</th>
                <th className="p-4 text-left font-medium text-gray-600 dark:text-gray-400">Transcript</th>
                <th className="p-4 text-left font-medium text-gray-600 dark:text-gray-400">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
              {allRecordings.map(rec => (
                <tr key={rec.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 cursor-pointer"
                  onClick={() => navigate(`/leads/${rec.leadId}`)}>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-gray-400" />
                      <span className="truncate max-w-xs">{rec.fileName}</span>
                    </div>
                  </td>
                  <td className="p-4 text-primary-600 dark:text-primary-400">{rec.lead.name}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-slate-700">{rec.type}</span>
                  </td>
                  <td className="p-4">
                    {rec.transcript ? (
                      <span className="text-green-600 dark:text-green-400 text-xs">✓ Available</span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="p-4 text-gray-500">{format(new Date(rec.createdAt), 'MMM d, yyyy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
