import { useState } from 'react';
import { MessageSquarePlus, X, Star } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function FeedbackWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [sending, setSending] = useState(false);

  // Only show for trial/demo orgs
  const org = user?.org;
  const isTrial = org?.trialEndsAt && new Date(org.trialEndsAt) > new Date();
  const isDemo = org?.demoMode;
  if (!isTrial && !isDemo) return null;

  const handleSubmit = async () => {
    if (!message.trim()) { toast.error('Please write your feedback'); return; }
    setSending(true);
    try {
      await api.post('/feedback', { message, rating: rating || undefined });
      toast.success('Thanks for your feedback!');
      setOpen(false);
      setMessage('');
      setRating(0);
    } catch {
      toast.error('Failed to send feedback');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg text-sm font-medium transition-all hover:scale-105 active:scale-95"
      >
        <MessageSquarePlus size={16} />
        Give feedback
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">Share your feedback</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Help us improve SalesFlow CRM</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Star rating */}
            <div className="flex items-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={24}
                    className={`transition-colors ${n <= (hover || rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-slate-600'}`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                  {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]}
                </span>
              )}
            </div>

            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="What's working well? What could be better?"
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />

            <div className="flex gap-3 mt-4">
              <button onClick={() => setOpen(false)}
                className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={sending}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium rounded-lg text-sm transition-colors">
                {sending ? 'Sending…' : 'Send feedback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
