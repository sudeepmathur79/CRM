import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { format } from 'date-fns';
import { Building2, Users, ChevronRight, ArrowLeft, Shield, CheckCircle, Clock, Plus, Trash2, UserCog } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const PLAN_COLORS = {
  free: 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300',
  trial: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  pro: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  premium: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
};

function RequestAccessModal({ org, onClose }) {
  const [sessionId, setSessionId] = useState(null);
  const [code, setCode] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const requestMutation = useMutation({
    mutationFn: () => api.post(`/superadmin/orgs/${org.id}/request-access`).then(r => r.data),
    onSuccess: (data) => { setSessionId(data.sessionId); toast.success(data.message); },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const confirmMutation = useMutation({
    mutationFn: () => api.post(`/superadmin/sessions/${sessionId}/confirm`, { code }).then(r => r.data),
    onSuccess: () => { setConfirmed(true); toast.success('Access confirmed!'); },
    onError: (e) => toast.error(e.response?.data?.error || 'Incorrect code'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <Shield size={20} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Request Support Access</h2>
            <p className="text-xs text-gray-500">{org.name}</p>
          </div>
        </div>

        {confirmed ? (
          <div className="text-center space-y-3">
            <CheckCircle size={40} className="text-green-500 mx-auto" />
            <p className="font-medium text-gray-900 dark:text-white">Access confirmed</p>
            <p className="text-sm text-gray-500">You now have authorised access to {org.name} for 1 hour.</p>
            <button onClick={onClose} className="w-full py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium">Done</button>
          </div>
        ) : !sessionId ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              This will send a 6-digit verification code to all admins of <strong>{org.name}</strong>.
              The customer must read the code back to you before you can access their workspace.
            </p>
            <button onClick={() => requestMutation.mutate()} disabled={requestMutation.isPending}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium">
              {requestMutation.isPending ? 'Sending code…' : 'Send verification code'}
            </button>
            <button onClick={onClose} className="w-full py-2.5 border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium">Cancel</button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
              <p className="text-sm text-amber-800 dark:text-amber-300 font-medium mb-1">Waiting for customer</p>
              <p className="text-xs text-amber-700 dark:text-amber-400">Ask the customer to check their email and read the code back to you.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Enter the code the customer reads to you</label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full text-center text-3xl tracking-[0.5em] font-mono px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button onClick={() => confirmMutation.mutate()} disabled={code.length !== 6 || confirmMutation.isPending}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium">
              {confirmMutation.isPending ? 'Verifying…' : 'Confirm access'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function OrgDetail({ orgId, onBack, canRequestAccess }) {
  const [showAccess, setShowAccess] = useState(false);
  const { data: org, isLoading } = useQuery({
    queryKey: ['superadmin-org', orgId],
    queryFn: () => api.get(`/superadmin/orgs/${orgId}`).then(r => r.data),
  });

  if (isLoading) return <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" /></div>;
  if (!org) return null;

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 mb-4 transition-colors">
        <ArrowLeft size={14} /> All organisations
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{org.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLAN_COLORS[org.plan] || PLAN_COLORS.free}`}>{org.plan}</span>
            <span className="text-xs text-gray-400">{org._count.leads} leads · {org._count.users} users</span>
            {org.trialEndsAt && <span className="text-xs text-gray-400">Trial ends {format(new Date(org.trialEndsAt), 'MMM d, yyyy')}</span>}
          </div>
        </div>
        {canRequestAccess && (
          <button onClick={() => setShowAccess(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium">
            <Shield size={14} /> Request Access
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"><Users size={14} /> Team members</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 dark:border-slate-700">
            <tr>
              <th className="p-4 text-left font-medium text-gray-500">Name</th>
              <th className="p-4 text-left font-medium text-gray-500">Email</th>
              <th className="p-4 text-left font-medium text-gray-500">Role</th>
              <th className="p-4 text-left font-medium text-gray-500">Verified</th>
              <th className="p-4 text-left font-medium text-gray-500">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
            {org.users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                <td className="p-4 font-medium text-gray-900 dark:text-white">{u.name}</td>
                <td className="p-4 text-gray-500">{u.email}</td>
                <td className="p-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300'}`}>{u.role}</span>
                </td>
                <td className="p-4">
                  {u.emailVerifiedAt
                    ? <span className="text-green-600 dark:text-green-400 text-xs">✓ Verified</span>
                    : <span className="text-amber-500 text-xs">Unverified</span>}
                </td>
                <td className="p-4 text-gray-400 text-xs">{format(new Date(u.createdAt), 'MMM d, yyyy')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAccess && <RequestAccessModal org={org} onClose={() => setShowAccess(false)} />}
    </div>
  );
}

function SupportUsersTab() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const { data: supportUsers = [], isLoading } = useQuery({
    queryKey: ['superadmin-support-users'],
    queryFn: () => api.get('/superadmin/support-users').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/superadmin/support-users', form).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['superadmin-support-users'] });
      setShowCreate(false);
      setForm({ name: '', email: '', password: '' });
      toast.success('Support user created');
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/superadmin/support-users/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['superadmin-support-users'] }); toast.success('Deleted'); },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <UserCog size={16} /> Support Users <span className="text-sm text-gray-400 font-normal">({supportUsers.length})</span>
        </h2>
        <button onClick={() => setShowCreate(v => !v)}
          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus size={14} /> New support user
        </button>
      </div>

      {showCreate && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 mb-4">
          <h3 className="font-medium text-gray-900 dark:text-white mb-4 text-sm">Create support user</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {[['Name', 'name', 'text', 'Jane Smith'], ['Email', 'email', 'email', 'jane@salesflow.io'], ['Password', 'password', 'password', 'min 8 chars']].map(([label, key, type, ph]) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
                <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={ph}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !form.name || !form.email || !form.password}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium">
              {createMutation.isPending ? 'Creating…' : 'Create'}
            </button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-300 rounded-lg text-sm">Cancel</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500" /></div>
      ) : supportUsers.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-10 text-center text-gray-400">
          <UserCog size={28} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">No support users yet.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
              <tr>
                <th className="p-4 text-left font-medium text-gray-500">Name</th>
                <th className="p-4 text-left font-medium text-gray-500">Email</th>
                <th className="p-4 text-left font-medium text-gray-500 hidden sm:table-cell">Created</th>
                <th className="p-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
              {supportUsers.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                  <td className="p-4 font-medium text-gray-900 dark:text-white">{u.name}</td>
                  <td className="p-4 text-gray-500">{u.email}</td>
                  <td className="p-4 text-gray-400 text-xs hidden sm:table-cell">{format(new Date(u.createdAt), 'MMM d, yyyy')}</td>
                  <td className="p-4">
                    <button onClick={() => { if (confirm(`Delete ${u.name}?`)) deleteMutation.mutate(u.id); }}
                      className="text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function SuperAdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('orgs');
  const [selectedOrgId, setSelectedOrgId] = useState(null);

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ['superadmin-orgs'],
    queryFn: () => api.get('/superadmin/orgs').then(r => r.data),
  });

  const { data: activeSessions = [] } = useQuery({
    queryKey: ['superadmin-sessions'],
    queryFn: () => api.get('/superadmin/sessions').then(r => r.data),
    enabled: user?.role === 'support',
  });

  if (!['superadmin', 'support'].includes(user?.role)) {
    return <div className="p-8 text-center text-gray-400">Access denied.</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {user.role === 'superadmin' ? 'Super Admin' : 'Customer Support'} Console
            </h1>
            <p className="text-xs text-gray-500">Signed in as {user.email}</p>
          </div>
        </div>

        {activeSessions.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Active support sessions</p>
            {activeSessions.map(s => (
              <div key={s.id} className="flex items-center gap-3 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl text-sm">
                <CheckCircle size={14} className="text-green-600 dark:text-green-400 flex-shrink-0" />
                <span className="text-green-800 dark:text-green-300 font-medium">{s.org.name}</span>
                <span className="text-green-600 dark:text-green-400 text-xs">({s.org.plan})</span>
                <span className="ml-auto flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                  <Clock size={11} /> expires {format(new Date(s.expiresAt), 'h:mm a')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs — only superadmin sees Support Users tab */}
      {user.role === 'superadmin' && !selectedOrgId && (
        <div className="flex gap-1 mb-5 border-b border-gray-200 dark:border-slate-700">
          {[['orgs', Building2, 'Organisations'], ['support', UserCog, 'Support Users']].map(([id, Icon, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === id ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'}`}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      )}

      {tab === 'support' && user.role === 'superadmin' ? (
        <SupportUsersTab />
      ) : selectedOrgId ? (
        <OrgDetail
          orgId={selectedOrgId}
          onBack={() => setSelectedOrgId(null)}
          canRequestAccess={user.role === 'support'}
        />
      ) : (
        <>
          <div className="mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Building2 size={16} /> All Organisations <span className="text-sm text-gray-400 font-normal">({orgs.length})</span>
            </h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" /></div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="p-4 text-left font-medium text-gray-500">Organisation</th>
                    <th className="p-4 text-left font-medium text-gray-500 hidden sm:table-cell">Plan</th>
                    <th className="p-4 text-left font-medium text-gray-500 hidden md:table-cell">Users</th>
                    <th className="p-4 text-left font-medium text-gray-500 hidden md:table-cell">Leads</th>
                    <th className="p-4 text-left font-medium text-gray-500 hidden lg:table-cell">Created</th>
                    <th className="p-4 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                  {orgs.map(org => (
                    <tr key={org.id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-700/30 cursor-pointer"
                      onClick={() => setSelectedOrgId(org.id)}>
                      <td className="p-4">
                        <div className="font-medium text-gray-900 dark:text-white">{org.name}</div>
                        <div className="text-xs text-gray-400">{org.slug}</div>
                      </td>
                      <td className="p-4 hidden sm:table-cell">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLAN_COLORS[org.plan] || PLAN_COLORS.free}`}>{org.plan}</span>
                      </td>
                      <td className="p-4 text-gray-500 hidden md:table-cell">{org._count.users}</td>
                      <td className="p-4 text-gray-500 hidden md:table-cell">{org._count.leads}</td>
                      <td className="p-4 text-gray-400 text-xs hidden lg:table-cell">{format(new Date(org.createdAt), 'MMM d, yyyy')}</td>
                      <td className="p-4"><ChevronRight size={16} className="text-gray-400" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
