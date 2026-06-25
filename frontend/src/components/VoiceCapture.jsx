import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { leadsApi } from '../services/api';
import { Mic, MicOff, X, Check, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function VoiceCapture() {
  const [open, setOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [leadQuery, setLeadQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [saving, setSaving] = useState(false);
  const recognitionRef = useRef(null);

  const { data: leadsData } = useQuery({
    queryKey: ['leads-voice-picker', leadQuery],
    queryFn: () => leadsApi.list({ search: leadQuery, take: 10, archived: 'false' }).then(r => r.data),
    enabled: open,
  });
  const leads = Array.isArray(leadsData) ? leadsData : (leadsData?.leads || []);

  const startRecording = () => {
    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (e) => {
      let final = '';
      let interimText = '';
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + ' ';
        else interimText += e.results[i][0].transcript;
      }
      setTranscript(final);
      setInterim(interimText);
    };

    rec.onerror = (e) => {
      if (e.error !== 'aborted') toast.error(`Mic error: ${e.error}`);
      setRecording(false);
    };

    rec.onend = () => setRecording(false);

    recognitionRef.current = rec;
    rec.start();
    setRecording(true);
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setRecording(false);
    setInterim('');
  };

  const handleSave = async () => {
    if (!selectedLead) { toast.error('Pick a lead first'); return; }
    const full = (transcript + interim).trim();
    if (!full) { toast.error('Nothing recorded yet'); return; }
    setSaving(true);
    try {
      await leadsApi.addNote(selectedLead.id, full);
      toast.success(`Saved to ${selectedLead.name}`);
      handleClose();
    } catch {
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
    setLeadQuery('');
    setSelectedLead(null);
  };

  // Clean up on unmount
  useEffect(() => () => recognitionRef.current?.stop(), []);

  return (
    <>
      {/* Floating mic button */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-primary-600 hover:bg-primary-700 active:scale-95 shadow-lg shadow-primary-500/40 flex items-center justify-center text-white transition-all"
        aria-label="Record conversation"
      >
        <Mic size={24} />
      </button>

      {/* Recording modal */}
      {open && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-slate-900 text-white">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-safe pt-4 pb-3 border-b border-slate-700">
            <h2 className="font-semibold text-lg">Capture Conversation</h2>
            <button onClick={handleClose} className="p-2 rounded-lg hover:bg-slate-700">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
            {/* Mic button */}
            <div className="flex flex-col items-center gap-3 py-4">
              <button
                onClick={recording ? stopRecording : startRecording}
                className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl transition-all active:scale-95 ${
                  recording
                    ? 'bg-red-500 animate-pulse shadow-red-500/40'
                    : 'bg-primary-600 shadow-primary-500/40'
                }`}
              >
                {recording ? <MicOff size={32} /> : <Mic size={32} />}
              </button>
              <p className="text-sm text-slate-400">
                {recording ? 'Recording… tap to stop' : 'Tap to start'}
              </p>
            </div>

            {/* Live transcript */}
            <div className="rounded-xl bg-slate-800 p-4 min-h-[120px]">
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

            {/* Lead picker */}
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">Attach to lead</div>
              <div className="relative mb-2">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search leads…"
                  value={leadQuery}
                  onChange={e => { setLeadQuery(e.target.value); setSelectedLead(null); }}
                  className="w-full bg-slate-800 text-white placeholder-slate-500 rounded-lg pl-8 pr-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              {selectedLead ? (
                <div className="flex items-center justify-between bg-primary-600/20 border border-primary-500/40 rounded-lg px-3 py-2.5">
                  <div>
                    <div className="text-sm font-medium">{selectedLead.name}</div>
                    {selectedLead.company && <div className="text-xs text-slate-400">{selectedLead.company}</div>}
                  </div>
                  <button onClick={() => setSelectedLead(null)} className="text-slate-400 hover:text-white">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  {leads.slice(0, 8).map(lead => (
                    <button
                      key={lead.id}
                      onClick={() => { setSelectedLead(lead); setLeadQuery(lead.name); }}
                      className="w-full text-left px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                    >
                      <div className="text-sm font-medium">{lead.name}</div>
                      {lead.company && <div className="text-xs text-slate-500">{lead.company}</div>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Save button */}
          <div className="px-4 pb-safe pb-6 pt-3 border-t border-slate-700">
            <button
              onClick={handleSave}
              disabled={saving || !selectedLead || !(transcript + interim).trim()}
              className="w-full py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-40 font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <Check size={18} />
              {saving ? 'Saving…' : 'Save to Lead'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
