import { useState, useEffect } from 'react';
import { X, Copy, Share2, Mail } from 'lucide-react';
import { aiApi } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

// Props: leadId, leadName, onClose
export default function EmailDraftModal({ leadId, leadName, onClose }) {
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    aiApi.draftEmail(leadId)
      .then(r => {
        if (!cancelled) {
          setSubject(r.data.subject || '');
          setBody(r.data.body || '');
        }
      })
      .catch(e => {
        if (!cancelled) setError(e.response?.data?.error || 'Failed to generate email draft.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [leadId]);

  const fullText = `Subject: ${subject}\n\n${body}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: subject, text: fullText }).catch(() => {});
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', damping: 30, stiffness: 400 }}
          className="relative bg-white dark:bg-slate-800 shadow-xl w-full md:max-w-2xl rounded-t-2xl md:rounded-2xl max-h-[92vh] md:max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-slate-700">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-200 dark:bg-slate-600 rounded-full md:hidden" />
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Mail size={16} className="text-primary-500" />
              Draft Follow-up Email
              {leadName && <span className="text-gray-400 font-normal">— {leadName}</span>}
            </h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 px-5 py-4">
            {loading && (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
                <p className="text-sm">Generating email draft…</p>
              </div>
            )}

            {error && !loading && (
              <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {!loading && !error && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    Subject
                  </label>
                  <textarea
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    Body
                  </label>
                  <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    rows={10}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {!loading && !error && (
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-200 dark:border-slate-700">
              {typeof navigator !== 'undefined' && navigator.share && (
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 transition-colors"
                >
                  <Share2 size={14} /> Share
                </button>
              )}
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-primary-600 hover:bg-primary-700 text-white transition-colors"
              >
                <Copy size={14} /> {copied ? 'Copied!' : 'Copy to clipboard'}
              </button>
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
