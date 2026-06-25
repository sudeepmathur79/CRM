import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { leadsApi, usersApi } from '../../services/api';
import api from '../../services/api';
import { Sparkles, Loader2, ChevronRight, RotateCcw, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const STATUSES = ['New', 'Contacted', 'Qualified', 'Proposal', 'Closed Won', 'Closed Lost'];
const SOURCES = ['Website', 'Referral', 'LinkedIn', 'Cold Call', 'Email Campaign', 'Event', 'Other'];

const EXAMPLES = [
  "Just got off a call with Priya Sharma from TechNova, she's the CTO. Very interested in our enterprise plan, budget around $30k. Asked for a demo next Thursday.",
  "WhatsApp chat with Rajan Mehta from Global Logistics. He found us on LinkedIn. Wants pricing info, follow up this Friday.",
  "Meeting notes: John Davis, Acme Corp CFO. Approved budget of 50k for Q3. Ready to move forward, send proposal by end of week.",
];

export default function SmartAdd({ onClose, onSuccess }) {
  const [step, setStep] = useState('input'); // 'input' | 'extracting' | 'review'
  const [inputText, setInputText] = useState('');
  const [extracted, setExtracted] = useState(null);
  const qc = useQueryClient();

  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => usersApi.list().then(r => r.data) });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const extractMutation = useMutation({
    mutationFn: (text) => api.post('/ai/extract', { text }).then(r => r.data),
    onSuccess: (data) => {
      setExtracted(data);
      reset({
        name: data.name || '',
        company: data.company || '',
        email: data.email || '',
        phone: data.phone || '',
        status: data.status || 'New',
        source: data.source || '',
        notes: data.notes || '',
        nextFollowUp: data.nextFollowUp || '',
        assignedToId: '',
      });
      setStep('review');
    },
    onError: (e) => toast.error(e.response?.data?.error || 'AI extraction failed'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => leadsApi.create(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      toast.success(`Lead created: ${res.data.name}`);
      onSuccess?.();
      onClose?.();
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed to create lead'),
  });

  const handleExtract = () => {
    if (!inputText.trim()) return toast.error('Please enter some text');
    setStep('extracting');
    extractMutation.mutate(inputText);
  };

  const onSubmit = (data) => {
    const payload = { ...data };
    if (!payload.assignedToId) delete payload.assignedToId;
    if (!payload.nextFollowUp) delete payload.nextFollowUp;
    if (!payload.source) delete payload.source;
    createMutation.mutate(payload);
  };

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {step === 'input' && (
          <motion.div key="input" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={18} className="text-primary-500" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Describe the lead in plain English, or paste a chat/call transcript. AI will extract the details.
              </p>
            </div>

            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              rows={6}
              placeholder="e.g. 'Called Sarah from Acme Corp, she's the VP of Sales. Very interested in our Pro plan, budget is around $20k. Follow up next Monday.'"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />

            <div className="mt-3">
              <p className="text-xs text-gray-400 mb-2">Examples — click to try:</p>
              <div className="space-y-1.5">
                {EXAMPLES.map((ex, i) => (
                  <button key={i} onClick={() => setInputText(ex)}
                    className="w-full text-left text-xs p-2 rounded-lg bg-gray-50 dark:bg-slate-700/50 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-gray-600 dark:text-gray-400 hover:text-primary-700 transition-colors truncate">
                    {ex.slice(0, 80)}…
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
              <button onClick={handleExtract} disabled={!inputText.trim()}
                className="flex items-center gap-2 px-5 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                <Sparkles size={14} /> Extract with AI <ChevronRight size={14} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 'extracting' && (
          <motion.div key="extracting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 size={32} className="animate-spin text-primary-500" />
            <p className="text-sm text-gray-500">AI is reading and extracting lead details…</p>
          </motion.div>
        )}

        {step === 'review' && (
          <motion.div key="review" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {extracted?.summary && (
              <div className="mb-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-800">
                <p className="text-xs font-medium text-primary-700 dark:text-primary-300 mb-0.5">AI Summary</p>
                <p className="text-sm text-primary-800 dark:text-primary-200">{extracted.summary}</p>
              </div>
            )}

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Review and edit the extracted details before saving:</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Name *</label>
                  <input {...register('name', { required: true })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Company</label>
                  <input {...register('company')}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email</label>
                  <input type="email" {...register('email')}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Phone</label>
                  <input {...register('phone')}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Status</label>
                  <select {...register('status')}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Source</label>
                  <select {...register('source')}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="">— Select —</option>
                    {SOURCES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Assign To</label>
                  <select {...register('assignedToId')}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="">— Unassigned —</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Next Follow-up</label>
                  <input type="date" {...register('nextFollowUp')}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Notes</label>
                  <textarea rows={3} {...register('notes')}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button type="button" onClick={() => setStep('input')}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
                  <RotateCcw size={13} /> Edit input
                </button>
                <button type="submit" disabled={createMutation.isPending}
                  className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
                  <Check size={14} /> {createMutation.isPending ? 'Saving…' : 'Save Lead'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
