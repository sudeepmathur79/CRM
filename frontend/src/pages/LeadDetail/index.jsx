import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi, recordingsApi } from '../../services/api';
import { StatusBadge, TagBadge } from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import LeadForm from '../../components/forms/LeadForm';
import { format } from 'date-fns';
import { ArrowLeft, Edit, Mic, Upload, Play, Pause, Trash2, FileText, Clock, Plus, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import MentionTextarea, { MentionText } from '../../components/ui/MentionTextarea';
import { useAuth } from '../../contexts/AuthContext';

const ACTION_LABELS = {
  created: '✨ Lead created', updated: '✏️ Updated', status_changed: '🔄 Status changed',
  assigned: '👤 Assigned', recording_added: '🎙️ Recording added', notes_updated: '📝 Notes updated',
  note_added: '📝 Note added', recording_deleted: '🗑️ Recording deleted',
};

const AudioPlayer = ({ recording }) => {
  const [playing, setPlaying] = useState(false);
  const ref = useRef(null);
  const toggle = () => {
    if (playing) { ref.current.pause(); } else { ref.current.play(); }
    setPlaying(p => !p);
  };
  const isAudio = ['.mp3', '.wav', '.webm', '.ogg', '.m4a'].some(ext => recording.fileUrl.includes(ext));
  if (!isAudio) return null;
  return (
    <div className="flex items-center gap-2 mt-2">
      <audio ref={ref} src={recording.fileUrl} onEnded={() => setPlaying(false)} />
      <button onClick={toggle} className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-full text-primary-600 hover:bg-primary-200">
        {playing ? <Pause size={14} /> : <Play size={14} />}
      </button>
      <span className="text-xs text-gray-400">{recording.fileName}</span>
    </div>
  );
};

const ROLE_COLOR = { admin: 'bg-violet-500', viewer: 'bg-blue-500', agent: 'bg-emerald-500' };
const avatar = (name) => name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

const PersonChip = ({ label, person, isSelf, onMessage }) => (
  <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700/50 rounded-xl px-3 py-2 min-w-0">
    <div className={`w-8 h-8 rounded-full ${ROLE_COLOR[person.role] || 'bg-gray-400'} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
      {avatar(person.name)}
    </div>
    <div className="min-w-0">
      <div className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</div>
      <div className="text-sm font-medium truncate">{person.name}{isSelf ? ' (you)' : ''}</div>
    </div>
    {!isSelf && (
      <button onClick={onMessage} title={`Message ${person.name}`}
        className="ml-1 p-1.5 rounded-lg text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 flex-shrink-0 transition-colors">
        <MessageSquare size={15} />
      </button>
    )}
  </div>
);

export default function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user: currentUser } = useAuth();
  const [showEdit, setShowEdit] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [expandedNotes, setExpandedNotes] = useState({});
  const fileInputRef = useRef(null);

  const { data: lead, isLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => leadsApi.get(id).then(r => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => leadsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lead', id] }); setShowEdit(false); toast.success('Updated'); },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const uploadMutation = useMutation({
    mutationFn: (formData) => recordingsApi.upload(id, formData),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lead', id] }); toast.success('File uploaded'); },
    onError: () => toast.error('Upload failed'),
  });

  const analyzeMutation = useMutation({
    mutationFn: (recId) => recordingsApi.analyze(recId).then(r => r.data),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['lead', id] });
      if (updated?.summary || updated?.nextSteps) {
        toast.success('AI analysis complete');
      } else {
        toast.error('AI ran but could not extract summary — check transcript content');
      }
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Analysis failed'),
  });

  const deleteRecMutation = useMutation({
    mutationFn: (recId) => recordingsApi.delete(recId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lead', id] }); toast.success('File deleted'); },
  });

  const addNoteMutation = useMutation({
    mutationFn: (content) => leadsApi.addNote(id, content),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lead', id] }); setNewNote(''); toast.success('Note saved'); },
    onError: () => toast.error('Failed to save note'),
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId) => leadsApi.deleteNote(id, noteId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lead', id] }); toast.success('Note deleted'); },
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const c = [];
      mr.ondataavailable = e => c.push(e.data);
      mr.onstop = async () => {
        const blob = new Blob(c, { type: 'audio/webm' });
        const fd = new FormData();
        fd.append('audio', blob, `recording_${Date.now()}.webm`);
        uploadMutation.mutate(fd);
        stream.getTracks().forEach(t => t.stop());
      };
      setChunks(c); setMediaRecorder(mr);
      mr.start(); setRecording(true);
    } catch { toast.error('Microphone access denied'); }
  };

  const stopRecording = () => { mediaRecorder?.stop(); setRecording(false); };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    uploadMutation.mutate(fd);
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" /></div>;
  if (!lead) return <div className="p-6 text-gray-400">Lead not found</div>;

  const safeFormat = (val, fmt) => { try { return val ? format(new Date(val), fmt) : '—'; } catch { return '—'; } };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <button onClick={() => navigate('/leads')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 border border-gray-100 dark:border-slate-700">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl md:text-2xl font-bold">{lead.name}</h1>
                {lead.company && <p className="text-gray-500 dark:text-gray-400">{lead.company}</p>}
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <StatusBadge status={lead.status} />
                  {lead.source && <span className="text-xs text-gray-400">📍 {lead.source}</span>}
                </div>
              </div>
              <button onClick={() => setShowEdit(true)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
                <Edit size={18} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {lead.email && (
                <div><span className="text-xs text-gray-400 uppercase tracking-wide">Email</span>
                  <div className="font-medium break-all">{lead.email}</div></div>
              )}
              {lead.phone && (
                <div><span className="text-xs text-gray-400 uppercase tracking-wide">Phone</span>
                  <div className="font-medium">{lead.phone}</div></div>
              )}
              {lead.value > 0 && (
                <div><span className="text-xs text-gray-400 uppercase tracking-wide">Deal Value</span>
                  <div className="font-semibold text-green-600 dark:text-green-400">{lead.value >= 1000000 ? `$${(lead.value/1000000).toFixed(2)}M` : lead.value >= 1000 ? `$${(lead.value/1000).toFixed(1)}K` : `$${lead.value.toLocaleString()}`}</div></div>
              )}
              {lead.nextFollowUp && (
                <div><span className="text-xs text-gray-400 uppercase tracking-wide">Follow-up</span>
                  <div className={`font-medium ${new Date(lead.nextFollowUp) < new Date() && !['Closed Won','Closed Lost'].includes(lead.status) ? 'text-red-500' : ''}`}>
                    {new Date(lead.nextFollowUp) < new Date() && !['Closed Won','Closed Lost'].includes(lead.status) ? '⚠ ' : ''}{safeFormat(lead.nextFollowUp, 'MMM d, yyyy')}
                  </div>
                </div>
              )}
              <div><span className="text-xs text-gray-400 uppercase tracking-wide">Created</span>
                <div className="font-medium">{safeFormat(lead.createdAt, 'MMM d, yyyy')}</div></div>
            </div>

            {lead.tags?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1">
                {lead.tags.map(t => <TagBadge key={t.id} tag={t} />)}
              </div>
            )}

            {/* People: assigned + creator */}
            {(lead.assignedTo || lead.createdBy) && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 flex flex-wrap gap-3">
                {lead.assignedTo && (
                  <PersonChip
                    label="Assigned to"
                    person={lead.assignedTo}
                    isSelf={lead.assignedTo.id === currentUser?.id}
                    onMessage={() => navigate(`/inbox?with=${lead.assignedTo.id}`)}
                  />
                )}
                {lead.createdBy && lead.createdBy.id !== lead.assignedTo?.id && (
                  <PersonChip
                    label="Created by"
                    person={lead.createdBy}
                    isSelf={lead.createdBy.id === currentUser?.id}
                    onMessage={() => navigate(`/inbox?with=${lead.createdBy.id}`)}
                  />
                )}
              </div>
            )}

          </div>

          {/* Notes Timeline */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 border border-gray-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2"><FileText size={16} /> Notes</h2>
            </div>

            {/* Add note input */}
            <div className="mb-4">
              <MentionTextarea
                value={newNote}
                onChange={setNewNote}
                placeholder="Add a note… @ to mention someone, Enter to save"
                rows={2}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (newNote.trim()) addNoteMutation.mutate(newNote.trim());
                  }
                }}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <div className="flex justify-end mt-1">
                <button
                  onClick={() => { if (newNote.trim()) addNoteMutation.mutate(newNote.trim()); }}
                  disabled={!newNote.trim() || addNoteMutation.isPending}
                  className="flex items-center gap-1 px-3 py-1 text-xs bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-40"
                >
                  <Plus size={12} /> Save Note
                </button>
              </div>
            </div>

            {/* Notes list */}
            {(!lead.leadNotes || lead.leadNotes.length === 0) && (
              <p className="text-sm text-gray-400 text-center py-3">No notes yet</p>
            )}
            <div className="space-y-2">
              {lead.leadNotes?.map(note => {
                const isAI = note.type === 'ai_summary';
                const isExpanded = expandedNotes[note.id];
                const lines = note.content.split('\n');
                const preview = lines.slice(0, 2).join('\n');
                const hasMore = lines.length > 2;
                return (
                  <div key={note.id} className={`rounded-xl border p-3 text-xs ${isAI ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-100 dark:border-primary-800' : 'bg-gray-50 dark:bg-slate-700/50 border-gray-100 dark:border-slate-600'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {isAI && <span className="text-[10px] font-semibold uppercase tracking-wide text-primary-500">AI Summary</span>}
                          <span className="text-[10px] text-gray-400">{safeFormat(note.createdAt, 'MMM d, yyyy HH:mm')}</span>
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed text-gray-700 dark:text-gray-300">
                          <MentionText text={isAI && hasMore && !isExpanded ? preview + '…' : note.content} />
                        </p>
                        {isAI && hasMore && (
                          <button
                            onClick={() => setExpandedNotes(prev => ({ ...prev, [note.id]: !isExpanded }))}
                            className="mt-1 flex items-center gap-1 text-primary-500 hover:text-primary-700"
                          >
                            {isExpanded ? <><ChevronUp size={11} /> Show less</> : <><ChevronDown size={11} /> Show full history</>}
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => { if (confirm('Delete note?')) deleteNoteMutation.mutate(note.id); }}
                        className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 flex-shrink-0"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recordings */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 border border-gray-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Recordings & Files</h2>
              <div className="flex gap-2">
                <button onClick={recording ? stopRecording : startRecording}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${recording ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-100 dark:bg-slate-700 hover:bg-gray-200'}`}>
                  <Mic size={13} />{recording ? 'Stop' : 'Record'}
                </button>
                <button onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 transition-colors">
                  <Upload size={13} /> Upload
                </button>
                <input ref={fileInputRef} type="file" accept=".mp3,.wav,.mp4,.webm,.ogg,.m4a,.txt,.vtt,.srt" className="hidden" onChange={handleFileUpload} />
              </div>
            </div>

            {lead.recordings?.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No recordings yet</p>}
            <div className="space-y-3">
              {lead.recordings?.map(rec => (
                <div key={rec.id} className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-gray-400" />
                        <span className="text-sm font-medium truncate max-w-xs">{rec.fileName}</span>
                        <span className="text-xs bg-gray-200 dark:bg-slate-600 px-1.5 py-0.5 rounded">{rec.type}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{safeFormat(rec.createdAt, 'MMM d, yyyy HH:mm')}</p>
                      <AudioPlayer recording={rec} />
                      {rec.transcript && (
                        <details className="mt-2">
                          <summary className="text-xs text-primary-500 cursor-pointer">View transcript</summary>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 whitespace-pre-wrap">{rec.transcript}</p>
                        </details>
                      )}
                      {rec.nextSteps && (
                        <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-xs text-green-800 dark:text-green-300 border border-green-100 dark:border-green-800">
                          <p className="font-semibold mb-1">🎯 Next Steps</p>
                          <p className="whitespace-pre-line">{rec.nextSteps}</p>
                        </div>
                      )}
                      {rec.summary && (
                        <div className="mt-2 p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-xs text-primary-700 dark:text-primary-300">
                          <p className="font-semibold mb-1">AI Summary</p>
                          <div className="space-y-1">
                            {rec.summary.split(/(?=\[\d{2}\/\d{2}\/\d{4}\]|\[\d+\s\w+\]|\[\w{3}\s\d+\])/g).filter(Boolean).map((entry, i) => (
                              <p key={i} className="leading-relaxed">{entry.trim()}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 ml-2">
                      {!rec.summary && (
                        <button onClick={() => analyzeMutation.mutate(rec.id)}
                          disabled={analyzeMutation.isPending}
                          title="Analyze with AI"
                          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-600 text-xs text-gray-500">
                          <FileText size={13} />
                        </button>
                      )}
                      <button onClick={() => { if (confirm('Delete?')) deleteRecMutation.mutate(rec.id); }}
                        className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 border border-gray-100 dark:border-slate-700 h-fit">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><Clock size={16} /> Activity</h2>
          <div className="space-y-3 max-h-64 md:max-h-96 overflow-y-auto scrollbar-thin">
            {lead.activities?.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No activity yet</p>}
            {lead.activities?.map(act => (
              <div key={act.id} className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-2 flex-shrink-0" />
                <div>
                  <p className="text-sm">{ACTION_LABELS[act.action] || act.action}</p>
                  {act.details?.from && <p className="text-xs text-gray-400">{act.details.from} → {act.details.to}</p>}
                  <p className="text-xs text-gray-400">{act.user?.name} · {safeFormat(act.createdAt, 'MMM d, HH:mm')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Lead" size="lg">
        <LeadForm
          onSubmit={updateMutation.mutate}
          loading={updateMutation.isPending}
          defaultValues={{
            ...lead,
            assignedToId: lead.assignedToId || '',
            value: lead.value ?? '',
            nextFollowUp: safeFormat(lead.nextFollowUp, 'yyyy-MM-dd') === '—' ? '' : safeFormat(lead.nextFollowUp, 'yyyy-MM-dd')
          }}
        />
      </Modal>
    </div>
  );
}
