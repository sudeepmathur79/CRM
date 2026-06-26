import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { leadsApi, voiceDraftsApi } from '../services/api';
import { Mic, MicOff, X, Check, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const SAVE_MODES = [
  { id: 'existing', label: 'Existing lead' },
  { id: 'new', label: 'Create new lead' },
  { id: 'none', label: 'Save for later' },
];

const MAX_ERROR_RETRIES = 3;

function formatElapsed(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

export default function VoiceCapture() {
  const [open, setOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [saveMode, setSaveMode] = useState('existing');
  const [leadQuery, setLeadQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [newLeadName, setNewLeadName] = useState('');
  const [saving, setSaving] = useState(false);

  // Refs for recognition session management
  const recognitionRef = useRef(null);
  const accumulatedRef = useRef('');       // text confirmed across all completed sessions
  const shouldRestartRef = useRef(false);  // false = user stopped; true = auto-restart on end
  const restartCountRef = useRef(0);       // error retry counter
  const timerRef = useRef(null);

  const qc = useQueryClient();

  const { data: leadsData } = useQuery({
    queryKey: ['leads-voice-picker', leadQuery],
    queryFn: () => leadsApi.list({ search: leadQuery, take: 10, archived: 'false' }).then(r => r.data),
    enabled: open && saveMode === 'existing',
  });
  const leads = Array.isArray(leadsData) ? leadsData : (leadsData?.leads || []);

  // startRecognition is called on each session start (including auto-restarts).
  // It must be defined with useCallback so stopRecording can safely call the ref version.
  const startRecognition = useCallback(() => {
    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    // Track final text accumulated within this single recognition session
    let sessionFinal = '';

    rec.onresult = (e) => {
      let newFinal = '';
      let interimText = '';
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          newFinal += e.results[i][0].transcript + ' ';
        } else {
          interimText += e.results[i][0].transcript;
        }
      }
      sessionFinal = newFinal;
      // Display = all previous sessions + this session's finals + live interim
      setTranscript(accumulatedRef.current + sessionFinal);
      setInterim(interimText);
    };

    rec.onerror = (e) => {
      if (e.error === 'no-speech') {
        // Transient — onend will fire and we auto-restart; nothing to show user
        return;
      }
      if (e.error === 'not-allowed' || e.error === 'service-not-available') {
        shouldRestartRef.current = false;
        toast.error('Microphone access denied. Please allow microphone access and try again.');
        return;
      }
      // Other errors: count retries; stop after MAX_ERROR_RETRIES
      restartCountRef.current += 1;
      if (restartCountRef.current >= MAX_ERROR_RETRIES) {
        shouldRestartRef.current = false;
        toast.error('Recording stopped after repeated errors.');
      }
    };

    rec.onend = () => {
      // Commit this session's finals into the accumulator before any restart
      if (sessionFinal) {
        accumulatedRef.current += sessionFinal;
      }
      setInterim('');

      if (shouldRestartRef.current) {
        // 300 ms delay prevents tight loop on iOS when the browser fires onend immediately
        setTimeout(() => {
          if (shouldRestartRef.current) {
            startRecognition();
          }
        }, 300);
      } else {
        setRecording(false);
      }
    };

    recognitionRef.current = rec;
    rec.start();
    setRecording(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startRecording = () => {
    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }
    // Reset state for a fresh capture session
    accumulatedRef.current = '';
    shouldRestartRef.current = true;
    restartCountRef.current = 0;
    setElapsedSeconds(0);
    setTranscript('');
    setInterim('');
    startRecognition();
  };

  const stopRecording = () => {
    shouldRestartRef.current = false;
    recognitionRef.current?.stop();
    setRecording(false);
    setInterim('');
  };

  // Elapsed-time counter — ticks every second while recording, resets when recording stops
  useEffect(() => {
    if (recording) {
      timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [recording]);

  const handleSave = async () => {
    const full = (transcript + interim).trim();
    if (!full) { toast.error('Nothing recorded yet'); return; }
    setSaving(true);
    try {
      if (saveMode === 'existing') {
        if (!selectedLead) { toast.error('Pick a lead first'); setSaving(false); return; }
        await leadsApi.addNote(selectedLead.id, full);
        toast.success(`Saved to ${selectedLead.name}`);
      } else if (saveMode === 'new') {
        if (!newLeadName.trim()) { toast.error('Enter a lead name'); setSaving(false); return; }
        const { data: newLead } = await leadsApi.create({ name: newLeadName.trim(), status: 'New' });
        await leadsApi.addNote(newLead.id, full);
        qc.invalidateQueries({ queryKey: ['leads'] });
        toast.success(`New lead "${newLead.name}" created with recording`);
      } else {
        await voiceDraftsApi.create(full);
        qc.invalidateQueries({ queryKey: ['voice-drafts'] });
        toast.success('Saved to your unresolved recordings');
      }
      handleClose();
    } catch (e) {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    stopRecording();
    setOpen(false);
    setTranscript('');
    setInterim('');
    setElapsedSeconds(0);
    setLeadQuery('');
    setSelectedLead(null);
    setNewLeadName('');
    setSaveMode('existing');
    accumulatedRef.current = '';
  };

  useEffect(() => {
    window.__openVoiceCapture = () => setOpen(true);
    return () => {
      recognitionRef.current?.stop();
      delete window.__openVoiceCapture;
    };
  }, []);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-slate-900 text-white">
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-700">
            <h2 className="font-semibold text-lg">Capture Conversation</h2>
            <button onClick={handleClose} className="p-2 rounded-lg hover:bg-slate-700"><X size={20} /></button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
            {/* Mic */}
            <div className="flex flex-col items-center gap-3 py-4">
              <button
                onClick={recording ? stopRecording : startRecording}
                className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl transition-all active:scale-95 ${
                  recording ? 'bg-red-500 animate-pulse shadow-red-500/40' : 'bg-primary-600 shadow-primary-500/40'
                }`}
              >
                {recording ? <MicOff size={32} /> : <Mic size={32} />}
              </button>
              {recording ? (
                <p className="text-sm text-red-400 font-medium">
                  Recording · {formatElapsed(elapsedSeconds)}
                </p>
              ) : (
                <p className="text-sm text-slate-400">Tap to start</p>
              )}
            </div>

            {/* Transcript */}
            <div className="rounded-xl bg-slate-800 p-4 min-h-[100px]">
              <div className="text-xs text-slate-500 mb-2 uppercase tracking-wide">Transcript</div>
              {(transcript || interim) ? (
                <p className="text-sm leading-relaxed">
                  <span className="text-white">{transcript}</span>
                  <span className="text-slate-400 italic">{interim}</span>
                </p>
              ) : (
                <p className="text-slate-500 text-sm italic">Speech will appear here…</p>
              )}
            </div>

            {/* Save mode selector */}
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">Attach to</div>
              <div className="flex gap-2">
                {SAVE_MODES.map(m => (
                  <button key={m.id} onClick={() => { setSaveMode(m.id); setSelectedLead(null); setLeadQuery(''); }}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                      saveMode === m.id
                        ? 'bg-primary-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Existing lead picker */}
            {saveMode === 'existing' && (
              <div>
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type="text" placeholder="Search leads…" value={leadQuery}
                    onChange={e => { setLeadQuery(e.target.value); setSelectedLead(null); }}
                    className="w-full bg-slate-800 text-white placeholder-slate-500 rounded-lg pl-8 pr-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary-500" />
                </div>
                {selectedLead ? (
                  <div className="flex items-center justify-between bg-primary-600/20 border border-primary-500/40 rounded-lg px-3 py-2.5">
                    <div>
                      <div className="text-sm font-medium">{selectedLead.name}</div>
                      {selectedLead.company && <div className="text-xs text-slate-400">{selectedLead.company}</div>}
                    </div>
                    <button onClick={() => setSelectedLead(null)} className="text-slate-400 hover:text-white"><X size={14} /></button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {leads.slice(0, 8).map(lead => (
                      <button key={lead.id} onClick={() => { setSelectedLead(lead); setLeadQuery(lead.name); }}
                        className="w-full text-left px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors">
                        <div className="text-sm font-medium">{lead.name}</div>
                        {lead.company && <div className="text-xs text-slate-500">{lead.company}</div>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* New lead name */}
            {saveMode === 'new' && (
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wide mb-2 block">New lead name</label>
                <input type="text" placeholder="e.g. Acme Corp — John Smith"
                  value={newLeadName} onChange={e => setNewLeadName(e.target.value)}
                  className="w-full bg-slate-800 text-white placeholder-slate-500 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary-500" />
              </div>
            )}

            {/* No lead explanation */}
            {saveMode === 'none' && (
              <div className="rounded-xl bg-slate-800 px-4 py-3 text-sm text-slate-400">
                Recording will be saved to your <span className="text-amber-400 font-medium">unresolved list</span> in Profile. You can assign it to a lead later.
              </div>
            )}
          </div>

          <div className="px-4 pb-8 pt-3 border-t border-slate-700">
            <button onClick={handleSave} disabled={saving || !(transcript + interim).trim()}
              className="w-full py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-40 font-semibold flex items-center justify-center gap-2 transition-all">
              <Check size={18} />
              {saving ? 'Saving…' : saveMode === 'none' ? 'Save for later' : 'Save recording'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
