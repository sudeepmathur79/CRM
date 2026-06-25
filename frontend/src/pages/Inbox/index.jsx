import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi, usersApi, leadsApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Send, MessageSquare, ChevronLeft, X, ExternalLink, CornerDownRight, ChevronDown, ChevronUp } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import MentionTextarea, { MentionText } from '../../components/ui/MentionTextarea';

const fmtTime = (d) => {
  const date = new Date(d);
  if (isToday(date)) return format(date, 'h:mm a');
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d');
};

const avatar = (name) => name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
const ROLE_COLOR = { admin: 'bg-violet-500', viewer: 'bg-blue-500', agent: 'bg-emerald-500' };

/**
 * Split thread into:
 *   general: messages with no leadId, in order
 *   deals: Map<leadId, { lead, messages[], lastAt }>
 */
function partitionThread(messages) {
  const general = [];
  const dealsMap = new Map();

  for (const m of messages) {
    if (!m.leadId) {
      general.push(m);
    } else {
      if (!dealsMap.has(m.leadId)) {
        dealsMap.set(m.leadId, { leadId: m.leadId, lead: m.lead || null, messages: [], lastAt: m.createdAt });
      }
      const entry = dealsMap.get(m.leadId);
      entry.messages.push(m);
      entry.lastAt = m.createdAt;
      if (m.lead && !entry.lead) entry.lead = m.lead;
    }
  }

  // Sort deal threads by most recent message
  const deals = [...dealsMap.values()].sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt));
  return { general, deals };
}

function MessageBubble({ m, mine }) {
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] md:max-w-md flex flex-col gap-1 ${mine ? 'items-end' : 'items-start'}`}>
        <div className={`px-4 py-2.5 rounded-2xl text-sm ${mine
          ? 'bg-primary-500 text-white rounded-br-sm'
          : 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-bl-sm shadow-sm'}`}>
          <MentionText text={m.body} className={mine ? '[&_.text-primary-500]:text-white [&_.text-primary-500]:underline' : ''} />
        </div>
        <span className="text-xs text-gray-400">{fmtTime(m.createdAt)}</span>
      </div>
    </div>
  );
}

function DealThread({ deal, userId, isOpen, onToggle, onReply, navigate }) {
  const unread = deal.messages.filter(m => !m.read && m.toId === userId).length;

  return (
    <div className={`rounded-2xl border overflow-hidden transition-colors ${isOpen
      ? 'border-primary-200 dark:border-primary-800'
      : 'border-gray-200 dark:border-slate-700'}`}>

      {/* Collapsible header */}
      <button onClick={onToggle}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isOpen
          ? 'bg-primary-50 dark:bg-primary-900/20'
          : 'bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/50'}`}>
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isOpen ? 'bg-primary-400' : 'bg-gray-300 dark:bg-slate-600'}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-semibold truncate ${isOpen ? 'text-primary-700 dark:text-primary-300' : 'text-gray-800 dark:text-gray-200'}`}>
              {deal.lead?.name || 'Lead'}
            </span>
            {deal.lead?.company && (
              <span className="text-xs text-gray-400 truncate">{deal.lead.company}</span>
            )}
            {unread > 0 && (
              <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">{unread} new</span>
            )}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {deal.messages.length} message{deal.messages.length !== 1 ? 's' : ''} · last {fmtTime(deal.lastAt)}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {deal.lead && (
            <button onClick={e => { e.stopPropagation(); navigate(`/leads/${deal.lead.id}`); }}
              title="Open lead" className="p-1 text-gray-400 hover:text-primary-500 transition-colors">
              <ExternalLink size={14} />
            </button>
          )}
          {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>

      {/* Messages — shown when open */}
      {isOpen && (
        <div className="bg-gray-50 dark:bg-slate-900/40 border-t border-primary-100 dark:border-primary-900/30">
          <div className="px-4 py-3 space-y-3">
            {deal.messages.map(m => (
              <MessageBubble key={m.id} m={m} mine={m.fromId === userId} />
            ))}
          </div>
          <div className="px-4 py-2 border-t border-primary-100 dark:border-primary-900/30">
            <button onClick={onReply}
              className="flex items-center gap-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200 transition-colors py-1">
              <CornerDownRight size={13} /> Reply in this thread
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InboxPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeUserId = searchParams.get('with');
  const leadIdParam = searchParams.get('lead');
  const [body, setBody] = useState('');
  const [leadRef, setLeadRef] = useState(leadIdParam || '');
  // Track which deal threads are open: Set of leadIds
  const [openThreads, setOpenThreads] = useState(() => new Set(leadIdParam ? [leadIdParam] : []));
  const bottomRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLeadRef(leadIdParam || '');
    if (leadIdParam) setOpenThreads(s => new Set([...s, leadIdParam]));
  }, [leadIdParam]);

  const { data: conversations = [] } = useQuery({
    queryKey: ['messages'],
    queryFn: () => messagesApi.list().then(r => r.data),
    refetchInterval: 10000,
  });

  const { data: thread = [] } = useQuery({
    queryKey: ['messages-thread', activeUserId],
    queryFn: () => messagesApi.thread(activeUserId).then(r => r.data),
    enabled: !!activeUserId,
    refetchInterval: 5000,
    // Auto-open threads with unread messages
    onSuccess: (data) => {
      const unreadLeads = data.filter(m => !m.read && m.toId === user.id && m.leadId).map(m => m.leadId);
      if (unreadLeads.length) setOpenThreads(s => new Set([...s, ...unreadLeads]));
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users-all'],
    queryFn: () => usersApi.list().then(r => r.data),
  });

  const { data: refLead } = useQuery({
    queryKey: ['lead', leadRef],
    queryFn: () => leadsApi.get(leadRef).then(r => r.data),
    enabled: !!leadRef,
    staleTime: 60000,
  });

  const sendMutation = useMutation({
    mutationFn: (data) => messagesApi.send(data),
    onSuccess: () => {
      setBody('');
      qc.invalidateQueries({ queryKey: ['messages'] });
      qc.invalidateQueries({ queryKey: ['messages-thread', activeUserId] });
      qc.invalidateQueries({ queryKey: ['messages-unread'] });
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread]);

  useEffect(() => {
    const socket = window.__socket;
    if (!socket) return;
    const handler = (msg) => {
      qc.invalidateQueries({ queryKey: ['messages'] });
      qc.invalidateQueries({ queryKey: ['messages-thread'] });
      qc.invalidateQueries({ queryKey: ['messages-unread'] });
      // Auto-open the thread if a new message arrives for a deal
      if (msg.leadId) setOpenThreads(s => new Set([...s, msg.leadId]));
    };
    socket.on('message:new', handler);
    return () => socket.off('message:new', handler);
  }, [qc]);

  const activeConv = conversations.find(c => c.user.id === activeUserId);
  const activeUser = activeConv?.user || users.find(u => u.id === activeUserId);
  const messageable = users.filter(u => u.id !== user.id && u.isActive !== false);

  const { general, deals } = partitionThread(thread);

  const handleSend = () => {
    if (!body.trim() || !activeUserId) return;
    sendMutation.mutate({ toId: activeUserId, body, leadId: leadRef || undefined });
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleReplyInThread = (leadId) => {
    setLeadRef(leadId);
    setOpenThreads(s => new Set([...s, leadId]));
    setSearchParams(p => { p.set('lead', leadId); return p; });
  };

  const clearLeadRef = () => {
    setLeadRef('');
    setSearchParams(p => { p.delete('lead'); return p; });
  };

  const toggleThread = (leadId) => {
    setOpenThreads(s => {
      const next = new Set(s);
      next.has(leadId) ? next.delete(leadId) : next.add(leadId);
      return next;
    });
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)] overflow-hidden">

      {/* Sidebar */}
      <div className={`${activeUserId ? 'hidden md:flex' : 'flex'} w-full md:w-72 flex-col border-r border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800`}>
        <div className="p-4 border-b border-gray-100 dark:border-slate-700">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <MessageSquare size={20} className="text-primary-500" /> Messages
          </h1>
        </div>

        {messageable.filter(u => !conversations.find(c => c.user.id === u.id)).length > 0 && (
          <div className="px-4 pt-3">
            <p className="text-xs font-medium text-gray-400 mb-2">START A CONVERSATION</p>
            <div className="space-y-1">
              {messageable.filter(u => !conversations.find(c => c.user.id === u.id)).map(u => (
                <button key={u.id} onClick={() => setSearchParams({ with: u.id })}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/50 text-left">
                  <div className={`w-8 h-8 rounded-full ${ROLE_COLOR[u.role] || 'bg-gray-400'} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                    {avatar(u.name)}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{u.name}</div>
                    <div className="text-xs text-gray-400 capitalize">{u.role}</div>
                  </div>
                </button>
              ))}
            </div>
            {conversations.length > 0 && <div className="border-t border-gray-100 dark:border-slate-700 mt-3" />}
          </div>
        )}

        <div className="flex-1 overflow-y-auto py-2">
          {conversations.length === 0 && messageable.length === 0 && (
            <p className="text-sm text-gray-400 text-center mt-8">No other users to message yet</p>
          )}
          {conversations.map(conv => {
            const last = conv.messages[0];
            const isActive = conv.user.id === activeUserId;
            return (
              <button key={conv.user.id} onClick={() => setSearchParams({ with: conv.user.id })}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isActive ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-gray-50 dark:hover:bg-slate-700/30'}`}>
                <div className="relative flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full ${ROLE_COLOR[conv.user.role] || 'bg-gray-400'} flex items-center justify-center text-white text-sm font-bold`}>
                    {avatar(conv.user.name)}
                  </div>
                  {conv.unread > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">{conv.unread}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{conv.user.name}</span>
                    {last && <span className="text-xs text-gray-400 flex-shrink-0 ml-1">{fmtTime(last.createdAt)}</span>}
                  </div>
                  {last && (
                    <p className={`text-xs truncate mt-0.5 ${conv.unread > 0 ? 'font-semibold text-gray-700 dark:text-gray-200' : 'text-gray-400'}`}>
                      {last.fromId === user.id ? 'You: ' : ''}
                      {last.lead ? `[${last.lead.name}] ` : ''}
                      {last.body}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Thread panel */}
      {activeUserId ? (
        <div className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-slate-900">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
            <button className="md:hidden p-1 -ml-1" onClick={() => setSearchParams({})}>
              <ChevronLeft size={20} />
            </button>
            {activeUser && (
              <>
                <div className={`w-9 h-9 rounded-full ${ROLE_COLOR[activeUser.role] || 'bg-gray-400'} flex items-center justify-center text-white text-sm font-bold`}>
                  {avatar(activeUser.name)}
                </div>
                <div>
                  <div className="font-semibold text-sm">{activeUser.name}</div>
                  <div className="text-xs text-gray-400 capitalize">{activeUser.role}</div>
                </div>
              </>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {thread.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <MessageSquare size={40} className="mb-2 opacity-30" />
                <p className="text-sm">Start the conversation</p>
              </div>
            )}

            {/* General messages */}
            {general.length > 0 && (
              <div className="space-y-3">
                {general.map(m => (
                  <MessageBubble key={m.id} m={m} mine={m.fromId === user.id} />
                ))}
              </div>
            )}

            {/* Deal threads — one card per lead, collapsed/expanded */}
            {deals.length > 0 && (
              <div className="space-y-2">
                {general.length > 0 && (
                  <div className="flex items-center gap-2 py-1">
                    <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
                    <span className="text-xs text-gray-400 px-2">Deal threads</span>
                    <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
                  </div>
                )}
                {deals.map(deal => (
                  <DealThread
                    key={deal.leadId}
                    deal={deal}
                    userId={user.id}
                    isOpen={openThreads.has(deal.leadId)}
                    onToggle={() => toggleThread(deal.leadId)}
                    onReply={() => handleReplyInThread(deal.leadId)}
                    navigate={navigate}
                  />
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Compose */}
          <div className="p-4 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700">
            {leadRef && (
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1.5 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg px-2.5 py-1 text-xs text-primary-700 dark:text-primary-300 min-w-0">
                  <CornerDownRight size={12} className="flex-shrink-0 text-primary-400" />
                  <span className="text-gray-400 flex-shrink-0">Replying in:</span>
                  <button onClick={() => navigate(`/leads/${leadRef}`)} className="font-medium hover:underline truncate">
                    {refLead ? `${refLead.name}${refLead.company ? ` · ${refLead.company}` : ''}` : 'Loading…'}
                  </button>
                  <button onClick={clearLeadRef} title="Leave thread"
                    className="ml-0.5 flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors">
                    <X size={12} />
                  </button>
                </div>
              </div>
            )}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <MentionTextarea
                  rows={2}
                  value={body}
                  onChange={setBody}
                  onKeyDown={handleKey}
                  placeholder={leadRef ? 'Reply in thread… (Enter to send)' : 'Type a message… @ to mention, Enter to send'}
                  className="w-full resize-none rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <button onClick={handleSend} disabled={!body.trim() || sendMutation.isPending}
                className="p-3 rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0">
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50 dark:bg-slate-900">
          <div className="text-center text-gray-400">
            <MessageSquare size={48} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">Select a conversation or start a new one</p>
          </div>
        </div>
      )}
    </div>
  );
}
