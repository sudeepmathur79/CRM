import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { leadsApi, usersApi } from '../../services/api';
import api from '../../services/api';
import { Sparkles, Loader2, ChevronRight, RotateCcw, Check, Mic, MicOff, Square } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const STATUSES = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
const SOURCES = ['Website', 'Referral', 'LinkedIn', 'Cold Call', 'Email Campaign', 'Event', 'Other'];

const EXAMPLES = [
  "Just got off a call with Priya Sharma from TechNova, she's the CTO. Very interested in our enterprise plan, budget around $30k. Asked for a demo next Thursday.",
  "WhatsApp chat with Rajan Mehta from Global Logistics. He found us on LinkedIn. Wants pricing info, follow up this Friday.",
  "Meeting notes: John Davis, Acme Corp CFO. Approved budget of 50k for Q3. Ready to move forward, send proposal by end of week.",
];

function useSpeechRecognition({ onResult, onError }) {
  const recogRef = useRef(null);
  const [listening, setListening] = useState(false);

  const supported = typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const start = () => {
    if (!supported) { toast.error('Speech recognition not supported on this browser'); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SR();
    r.lang = 'en-US';
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map(res => res[0].transcript)
        .join('');
      onResult(transcript, e.results[e.results.length - 1].isFinal);
    };
    r.onerror = (e) => {
      setListening(false);
      if (e.error !== 'aborted') onError?.(e.error);
    };
    r.onend = () => setListening(false);
    recogRef.current = r;
    r.start();
    setListening(true);
  };

  const stop = () => {
    recogRef.current?.stop();
    setListening(false);
  };

  useEffect(() => () => recogRef.current?.abort(), []);

  return { listening, start, stop, supported };
}

export default function SmartAdd({ onClose, onSuccess }) {
  const [step, setStep] = useState('input');
  const [inputText, setInputText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [extracted, setExtracted] = useState(null);
  const baseTextRef = useRef(''); // text before current speech session
  const qc = useQueryClient();

  const { data: users = [] } = useQuery({ queryKey: ['users', 'active'], queryFn: () => usersApi.list({ activeOnly: 'true' }).then(r => r.data) });
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const { listening, start, stop, supported } = useSpeechRecognition({
    onResult: (transcript, isFinal) => {
      const combined = baseTextRef.current
        ? baseTextRef.current.trimEnd() + ' ' + transcript
        : transcript;
      if (isFinal) {
        setInputText(combined);
        baseTextRef.current = combined;
        setInterimText('');
      } else {
        setInterimText(transcript);
        setInputText(combined); // show interim in real time
      }
    },
    onError: (err) => toast.error(`Voice error: ${err}`),
  });

  const handleMicToggle = () => {
    if (listening) {
      stop();
    } else {
      baseTextRef.current = inputText;
      setInterimText('');
      start();
    }
  };

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
    if (listening) stop();
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

  const inputCls = "w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500";

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {step === 'input' && (
          <motion.div key="input" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="flex items-start gap-2 mb-3">
              <Sparkles size={16} className="text-primary-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Describe the lead in plain English, paste a chat transcript, or <strong>tap the mic</strong> to dictate.
              </p>
            </div>

            {/* Textarea + mic button */}
            <div className="relative">
              <textarea
                value={inputText}
                onChange={e => { setInputText(e.target.value); baseTextRef.current = e.target.value; }}
                rows={6}
                placeholder={listening ? '🎤 Listening… speak now' : "e.g. 'Called Sarah from Acme Corp, VP of Sales. Interested in Pro plan, budget $20k. Follow up Monday.'"}
                className={`w-full px-3 py-2.5 pr-12 rounded-xl border text-sm focus:outline-none focus:ring-2 resize-none transition-colors ${
                  listening
                    ? 'border-red-400 ring-2 ring-red-200 dark:ring-red-800 bg-white dark:bg-slate-700'
                    : 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-primary-500'
                }`}
              />
              {/* Mic button overlaid bottom-right of textarea */}
              {supported && (
                <button
                  type="button"
                  onClick={handleMicToggle}
                  title={listening ? 'Stop recording' : 'Dictate with voice'}
                  className={`absolute bottom-3 right-3 p-2 rounded-full transition-colors ${
                    listening
                      ? 'bg-red-500 text-white animate-pulse shadow-lg'
                      : 'bg-gray-100 dark:bg-slate-600 text-gray-500 dark:text-gray-400 hover:bg-primary-100 dark:hover:bg-primary-900/40 hover:text-primary-600'
                  }`}
                >
                  {listening ? <Square size={14} /> : <Mic size={14} />}
                </button>
              )}
            </div>

            {/* Interim live transcription indicator */}
            {listening && interimText && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-1 italic truncate">
                🎤 {interimText}
              </p>
            )}

            {/* Examples */}
            <div className="mt-3">
              <p className="text-xs text-gray-400 mb-2">Examples — click to try:</p>
              <div className="space-y-1.5">
                {EXAMPLES.map((ex, i) => (
                  <button key={i} onClick={() => { setInputText(ex); baseTextRef.current = ex; }}
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

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Review and edit before saving:</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Name *</label>
                  <input {...register('name', { required: true })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Company</label>
                  <input {...register('company')} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email</label>
                  <input type="email" {...register('email')} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Phone</label>
                  <input {...register('phone')} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Status</label>
                  <select {...register('status')} className={inputCls}>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Source</label>
                  <select {...register('source')} className={inputCls}>
                    <option value="">— Select —</option>
                    {SOURCES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Assign To</label>
                  <select {...register('assignedToId')} className={inputCls}>
                    <option value="">— Unassigned —</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Next Follow-up</label>
                  <input type="date" {...register('nextFollowUp')} className={inputCls} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Notes</label>
                  <textarea rows={3} {...register('notes')} className={`${inputCls} resize-none`} />
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
