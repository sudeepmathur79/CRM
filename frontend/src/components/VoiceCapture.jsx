import { useState, useRef, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { leadsApi, voiceDraftsApi, aiApi } from '../services/api';
import { Mic, MicOff, X, Check, RefreshCw, Plus, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import posthog from 'posthog-js';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const MAX_ERROR_RETRIES = 3;

function formatElapsed(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ── Review card shown after AI processing ────────────────────────────────────
function ReviewCard({ result, onConfirm, onSaveLater, onRetry, saving }) {
  const isUpdate = !!result.matchedLead;
  const dealName = result.name || result.matchedLead?.name || 'Unknown Deal';
  const contact = result.contactName;
  const company = result.company || result.matchedLead?.company;
  const value = result.value;
  const followUp = result.nextFollowUp;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      {/* Action label */}
      <div className={`flex items-center gap-2 text-sm font-semibold ${isUpdate ? 'text-amber-400' : 'text-green-400'}`}>
        {isUpdate ? <RefreshCw size={16} /> : <Plus size={16} />}
        {isUpdate ? `Updating: ${result.matchedLead.name}` : 'Creating new deal'}
      </div>

      {/* Extracted fields */}
      <div className="rounded-xl bg-slate-800 divide-y divide-slate-700 overflow-hidden">
        <Field label="Deal" value={dealName} />
        {contact && <Field label="Contact" value={contact} />}
        {company && <Field label="Company" value={company} />}
        {value && <Field label="Value" value={`$${Number(value).toLocaleString()}`} />}
        {followUp && <Field label="Follow-up" value={new Date(followUp).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })} />}
      </div>

      {result.notes && (
        <div className="rounded-xl bg-slate-800 px-4 py-3">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Notes</div>
          <p className="text-sm text-slate-300 leading-relaxed">{result.notes}</p>
        </div>
      )}

      <p className="text-xs text-slate-500 text-center">Review the details above before confirming.</p>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-xs text-slate-500 uppercase tracking-wide w-20 flex-shrink-0">{label}</span>
      <span className="text-sm text-white text-right">{value}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function VoiceCapture() {
  const [open, setOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [phase, setPhase] = useState('record'); // 'record' | 'processing' | 'review'
  const [aiResult, setAiResult] = useState(null);
  const [saving, setSaving] = useState(false);

  const recognitionRef = useRef(null);
  const accumulatedRef = useRef('');
  const shouldRestartRef = useRef(false);
  const restartCountRef = useRef(0);
  const timerRef = useRef(null);
  const qc = useQueryClient();

  const startRecognition = useCallback(() => {
    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    let sessionFinal = '';

    rec.onresult = (e) => {
      let newFinal = '';
      let interimText = '';
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) newFinal += e.results[i][0].transcript + ' ';
        else interimText += e.results[i][0].transcript;
      }
      sessionFinal = newFinal;
      setTranscript(accumulatedRef.current + sessionFinal);
      setInterim(interimText);
    };

    rec.onerror = (e) => {
      if (e.error === 'no-speech') return;
      if (e.error === 'not-allowed' || e.error === 'service-not-available') {
        shouldRestartRef.current = false;
        toast.error('Microphone access denied.');
        return;
      }
      restartCountRef.current += 1;
      if (restartCountRef.current >= MAX_ERROR_RETRIES) {
        shouldRestartRef.current = false;
        toast.error('Recording stopped after repeated errors.');
      }
    };

    rec.onend = () => {
      if (sessionFinal) accumulatedRef.current += sessionFinal;
      setInterim('');
      if (shouldRestartRef.current) {
        setTimeout(() => { if (shouldRestartRef.current) startRecognition(); }, 300);
      } else {
        setRecording(false);
      }
    };

    recognitionRef.current = rec;
    rec.start();
    setRecording(true);
  }, []);

  const startRecording = () => {
    if (!SpeechRecognition) { toast.error('Speech recognition not supported in this browser'); return; }
    accumulatedRef.current = '';
    shouldRestartRef.current = true;
    restartCountRef.current = 0;
    setElapsedSeconds(0);
    setTranscript('');
    setInterim('');
    setPhase('record');
    setAiResult(null);
    startRecognition();
  };

  const stopRecording = () => {
    shouldRestartRef.current = false;
    recognitionRef.current?.stop();
    setRecording(false);
    setInterim('');
  };

  useEffect(() => {
    if (recording) {
      timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [recording]);

  // After stopping — auto-process with AI
  const handleStopAndProcess = async () => {
    stopRecording();
    const full = (transcript + interim).trim();
    if (!full) { toast.error('Nothing recorded yet'); return; }

    setPhase('processing');
    try {
      const { data } = await aiApi.extract(full);

      // Try to match against existing leads by company or contact name
      let matchedLead = null;
      if (data.company || data.contactName) {
        try {
          const searchTerm = data.company || data.contactName;
          const resp = await leadsApi.list({ search: searchTerm, take: 5, archived: 'false' });
          const candidates = Array.isArray(resp.data) ? resp.data : (resp.data?.leads || []);
          // Simple match: company name substring match
          const match = candidates.find(l =>
            data.company && l.company?.toLowerCase().includes(data.company.toLowerCase())
          ) || candidates.find(l =>
            data.contactName && l.contactName?.toLowerCase().includes(data.contactName.toLowerCase())
          );
          if (match) matchedLead = match;
        } catch (_) {}
      }

      setAiResult({ ...data, matchedLead, _transcript: full, _sync: data._sync });
      setPhase('review');
    } catch (err) {
      if (err.response?.status === 402 && err.response?.data?.code === 'CAPTURE_LIMIT_REACHED') {
        toast.error('Free plan limit reached (10/month). Upgrade to Pro →', { duration: 6000 });
        try {
          const origin = window.location.origin;
          const resp = await fetch('/api/stripe/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify({ successUrl: `${origin}/settings?billing=success`, returnUrl: `${origin}/settings` }),
          });
          const d = await resp.json();
          if (d?.url) window.location.href = d.url;
        } catch (_) {}
        setPhase('record');
        return;
      }
      // AI failed — save as draft
      toast.error('AI unavailable — saved for later');
      try {
        await voiceDraftsApi.create(full);
        qc.invalidateQueries({ queryKey: ['voice-drafts'] });
      } catch (_) {}
      setPhase('record');
    }
  };

  const handleConfirm = async () => {
    if (!aiResult) return;
    setSaving(true);
    try {
      const { matchedLead, _transcript, _sync, ...extracted } = aiResult;

      if (matchedLead) {
        // Update existing lead — add note + update fields
        const updates = {};
        if (extracted.value) updates.value = extracted.value;
        if (extracted.nextFollowUp) updates.nextFollowUp = extracted.nextFollowUp;
        if (extracted.status) updates.status = extracted.status;
        if (extracted.contactName) updates.contactName = extracted.contactName;
        if (Object.keys(updates).length) await leadsApi.update(matchedLead.id, updates);
        await leadsApi.addNote(matchedLead.id, _transcript);
        qc.invalidateQueries({ queryKey: ['leads'] });
        toast.success(`Updated: ${matchedLead.name}`);
      } else if (_sync?.localLeadId) {
        // AI already created the lead via extract endpoint
        qc.invalidateQueries({ queryKey: ['leads'] });
        toast.success(`Created: ${extracted.name || 'New deal'}`);
      } else {
        // Fallback create
        const name = extracted.name || `New Lead — ${new Date().toLocaleDateString('en-AU')}`;
        const { data: newLead } = await leadsApi.create({
          name,
          contactName: extracted.contactName,
          company: extracted.company,
          email: extracted.email,
          phone: extracted.phone,
          value: extracted.value,
          nextFollowUp: extracted.nextFollowUp,
          status: extracted.status || 'New',
        });
        await leadsApi.addNote(newLead.id, _transcript);
        qc.invalidateQueries({ queryKey: ['leads'] });
        toast.success(`Created: ${newLead.name}`);
      }

      posthog.capture('voice_capture_saved', { action: matchedLead ? 'update' : 'create' });
      handleClose();
    } catch (e) {
      toast.error('Save failed — please try again');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLater = async () => {
    const full = aiResult?._transcript || (transcript + interim).trim();
    if (!full) return;
    try {
      await voiceDraftsApi.create(full);
      qc.invalidateQueries({ queryKey: ['voice-drafts'] });
      toast.success('Saved to your unresolved list');
      handleClose();
    } catch (_) {
      toast.error('Save failed');
    }
  };

  const handleClose = () => {
    stopRecording();
    setOpen(false);
    setTranscript('');
    setInterim('');
    setElapsedSeconds(0);
    setPhase('record');
    setAiResult(null);
    accumulatedRef.current = '';
  };

  useEffect(() => {
    window.__openVoiceCapture = () => setOpen(true);
    return () => { recognitionRef.current?.stop(); delete window.__openVoiceCapture; };
  }, []);

  const hasTranscript = !!(transcript + interim).trim();

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-slate-900 text-white">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-700">
            <h2 className="font-semibold text-lg">
              {phase === 'processing' ? 'Processing…' : phase === 'review' ? 'Review & confirm' : 'Capture meeting'}
            </h2>
            <button onClick={handleClose} className="p-2 rounded-lg hover:bg-slate-700"><X size={20} /></button>
          </div>

          {/* Body */}
          {phase === 'record' && (
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
              {/* Mic button */}
              <div className="flex flex-col items-center gap-3 py-6">
                <button
                  onClick={recording ? null : startRecording}
                  className={`w-24 h-24 rounded-full flex items-center justify-center text-white shadow-xl transition-all active:scale-95 ${
                    recording ? 'bg-red-500 shadow-red-500/40 animate-pulse' : 'bg-primary-600 shadow-primary-500/40'
                  }`}
                >
                  {recording ? <MicOff size={36} /> : <Mic size={36} />}
                </button>
                {recording ? (
                  <p className="text-sm text-red-400 font-medium">Recording · {formatElapsed(elapsedSeconds)}</p>
                ) : (
                  <p className="text-sm text-slate-400">{hasTranscript ? 'Tap to re-record' : 'Tap to start'}</p>
                )}
              </div>

              {/* Transcript */}
              <div className="rounded-xl bg-slate-800 p-4 min-h-[120px]">
                <div className="text-xs text-slate-500 mb-2 uppercase tracking-wide">Transcript</div>
                {hasTranscript ? (
                  <p className="text-sm leading-relaxed">
                    <span className="text-white">{transcript}</span>
                    <span className="text-slate-400 italic">{interim}</span>
                  </p>
                ) : (
                  <p className="text-slate-500 text-sm italic">Speak naturally — "just met James at Apex Roofing, $40k install, follow up Friday"</p>
                )}
              </div>

              {/* Hint */}
              {!recording && !hasTranscript && (
                <p className="text-xs text-slate-500 text-center leading-relaxed">
                  AI will automatically detect whether this is a new deal or an update to an existing one.
                </p>
              )}
            </div>
          )}

          {phase === 'processing' && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
              <div className="w-12 h-12 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
              <p className="text-slate-400 text-sm">AI is extracting deal details…</p>
            </div>
          )}

          {phase === 'review' && aiResult && (
            <ReviewCard
              result={aiResult}
              onConfirm={handleConfirm}
              onSaveLater={handleSaveLater}
              onRetry={() => { setPhase('record'); setAiResult(null); }}
              saving={saving}
            />
          )}

          {/* Footer */}
          <div className="px-4 pb-8 pt-3 border-t border-slate-700 space-y-2">
            {phase === 'record' && (
              <>
                {recording ? (
                  <button onClick={handleStopAndProcess}
                    className="w-full py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 font-semibold flex items-center justify-center gap-2 transition-all">
                    <Check size={18} /> Stop & process
                  </button>
                ) : (
                  <button onClick={handleStopAndProcess} disabled={!hasTranscript}
                    className="w-full py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-40 font-semibold flex items-center justify-center gap-2 transition-all">
                    <Check size={18} /> Process recording
                  </button>
                )}
                {hasTranscript && !recording && (
                  <button onClick={handleSaveLater}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-sm flex items-center justify-center gap-2 transition-all">
                    <FileText size={15} /> Save for later instead
                  </button>
                )}
              </>
            )}

            {phase === 'review' && (
              <div className="space-y-2">
                <button onClick={handleConfirm} disabled={saving}
                  className="w-full py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-40 font-semibold flex items-center justify-center gap-2 transition-all">
                  <Check size={18} /> {saving ? 'Saving…' : 'Confirm & save'}
                </button>
                <div className="flex gap-2">
                  <button onClick={() => { setPhase('record'); setAiResult(null); }}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-sm flex items-center justify-center gap-1.5 transition-all">
                    <RefreshCw size={14} /> Re-record
                  </button>
                  <button onClick={handleSaveLater}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-sm flex items-center justify-center gap-1.5 transition-all">
                    <FileText size={14} /> Save for later
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
