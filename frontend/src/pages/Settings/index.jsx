import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, voiceDraftsApi, leadsApi, orgApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import Modal from '../../components/ui/Modal';
import { Plus, Edit, UserX, UserCheck, LogOut, Sun, Moon, User, Shield, Smartphone, CheckCircle, XCircle, Camera, Mic, Check, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../services/api';

const ROLES = ['admin', 'agent', 'viewer'];

const UserForm = ({ onSubmit, defaultValues = {}, loading, isEdit }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
        <input {...register('name', { required: 'Required' })}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
        <input type="email" {...register('email', { required: 'Required' })}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Password {isEdit && <span className="text-gray-400 font-normal">(leave blank to keep)</span>}
        </label>
        <input type="password" {...register('password', { required: isEdit ? false : 'Required' })}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
      </div>
      {!isEdit && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
          <select {...register('role')}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      )}
      {isEdit && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
          <select {...register('role')}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      )}
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading}
          className="px-5 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-medium rounded-lg text-sm">
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
};

const ProfileSection = () => {
  const { user, refreshUser } = useAuth();
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: { name: user?.name || '', email: user?.email || '', password: '', confirmPassword: '' },
  });

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  const avatarMutation = useMutation({
    mutationFn: (file) => {
      const fd = new FormData(); fd.append('avatar', file);
      return usersApi.uploadAvatar(fd);
    },
    onSuccess: () => { refreshUser(); toast.success('Photo updated'); },
    onError: () => toast.error('Upload failed'),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => {
      const payload = { name: data.name, email: data.email };
      if (data.password) payload.password = data.password;
      return usersApi.updateMe(payload);
    },
    onSuccess: () => {
      refreshUser();
      reset({ name: '', email: '', password: '', confirmPassword: '' });
      toast.success('Profile updated');
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed to update'),
  });

  return (
    <form onSubmit={handleSubmit(updateMutation.mutate)} className="space-y-4">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 rounded-full overflow-hidden bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-xl flex-shrink-0">
          {user?.avatar
            ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
            : initials}
          <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 cursor-pointer transition-opacity rounded-full">
            <Camera size={18} className="text-white" />
            <input type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files[0] && avatarMutation.mutate(e.target.files[0])} />
          </label>
        </div>
        <div>
          <div className="font-medium text-sm">{user?.name}</div>
          <div className="text-xs text-gray-400 capitalize">{user?.role}</div>
          <label className="text-xs text-primary-600 dark:text-primary-400 cursor-pointer hover:underline mt-0.5 block">
            {avatarMutation.isPending ? 'Uploading…' : 'Change photo'}
            <input type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files[0] && avatarMutation.mutate(e.target.files[0])} />
          </label>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
          <input defaultValue={user?.name} {...register('name', { required: 'Required' })}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
          <input type="email" defaultValue={user?.email} {...register('email', { required: 'Required' })}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password <span className="text-gray-400 font-normal">(optional)</span></label>
          <input type="password" {...register('password', {
            validate: v => !v || v.length >= 6 || 'At least 6 characters'
          })}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
          <div className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 text-sm capitalize text-gray-500 dark:text-gray-400">
            {user?.role}
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={updateMutation.isPending}
          className="px-5 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-medium rounded-lg text-sm">
          {updateMutation.isPending ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </form>
  );
};

function TwoFactorSection() {
  const { user, refreshUser } = useAuth();
  const [phase, setPhase] = useState(null); // null | 'setup' | 'disable'
  const [qrCode, setQrCode] = useState(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const startSetup = async () => {
    setLoading(true);
    try {
      const { data } = await authApi.setup2FA();
      setQrCode(data.qrCode);
      setPhase('setup');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to start 2FA setup');
    } finally { setLoading(false); }
  };

  const confirmEnable = async () => {
    setLoading(true);
    try {
      await authApi.enable2FA({ code });
      toast.success('Two-factor authentication enabled');
      setPhase(null); setCode(''); setQrCode(null);
      refreshUser();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Invalid code');
      setCode('');
    } finally { setLoading(false); }
  };

  const confirmDisable = async () => {
    setLoading(true);
    try {
      await authApi.disable2FA({ code });
      toast.success('Two-factor authentication disabled');
      setPhase(null); setCode('');
      refreshUser();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Invalid code');
      setCode('');
    } finally { setLoading(false); }
  };

  const enabled = user?.twoFactorEnabled;

  return (
    <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Smartphone size={16} className="text-gray-400" />
          <h2 className="font-semibold text-sm">Two-Factor Authentication</h2>
        </div>
        {enabled
          ? <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400"><CheckCircle size={13} /> Enabled</span>
          : <span className="flex items-center gap-1 text-xs text-gray-400"><XCircle size={13} /> Not enabled</span>
        }
      </div>

      {phase === null && (
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            {enabled
              ? 'Your account is secured with an authenticator app. Disable only if you\'re switching devices.'
              : 'Add an extra layer of security. You\'ll need an authenticator app (Google Authenticator, Authy, etc.).'
            }
          </p>
          {enabled ? (
            <button onClick={() => setPhase('disable')}
              className="px-4 py-2 text-sm rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              Disable 2FA
            </button>
          ) : (
            <button onClick={startSetup} disabled={loading}
              className="px-4 py-2 text-sm rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium transition-colors disabled:opacity-60">
              {loading ? 'Setting up…' : 'Enable 2FA'}
            </button>
          )}
        </div>
      )}

      {phase === 'setup' && qrCode && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            1. Open your authenticator app and scan this QR code.<br />
            2. Enter the 6-digit code to confirm.
          </p>
          <div className="flex justify-center bg-white p-3 rounded-xl border border-gray-200 dark:border-slate-700">
            <img src={qrCode} alt="2FA QR Code" className="w-40 h-40" />
          </div>
          <input
            type="text" inputMode="numeric" maxLength={6}
            value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="w-full text-center text-xl tracking-[0.4em] font-mono px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <div className="flex gap-2">
            <button onClick={() => { setPhase(null); setCode(''); setQrCode(null); }}
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              Cancel
            </button>
            <button onClick={confirmEnable} disabled={code.length !== 6 || loading}
              className="flex-1 px-3 py-2 text-sm rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium disabled:opacity-60 transition-colors">
              {loading ? 'Verifying…' : 'Confirm & Enable'}
            </button>
          </div>
        </div>
      )}

      {phase === 'disable' && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Enter your current authenticator code to disable 2FA.</p>
          <input
            type="text" inputMode="numeric" maxLength={6}
            value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="w-full text-center text-xl tracking-[0.4em] font-mono px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <div className="flex gap-2">
            <button onClick={() => { setPhase(null); setCode(''); }}
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              Cancel
            </button>
            <button onClick={confirmDisable} disabled={code.length !== 6 || loading}
              className="flex-1 px-3 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium disabled:opacity-60 transition-colors">
              {loading ? 'Disabling…' : 'Disable 2FA'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function VoiceDraftsSection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [assigningId, setAssigningId] = useState(null);
  const [leadQuery, setLeadQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);

  const { data: drafts = [] } = useQuery({
    queryKey: ['voice-drafts'],
    queryFn: () => voiceDraftsApi.list().then(r => r.data),
    enabled: user?.role === 'agent' || user?.role === 'admin',
  });

  const { data: leadsData } = useQuery({
    queryKey: ['leads-draft-picker', leadQuery],
    queryFn: () => leadsApi.list({ search: leadQuery, take: 8, archived: 'false' }).then(r => r.data),
    enabled: !!assigningId,
  });
  const leads = Array.isArray(leadsData) ? leadsData : (leadsData?.leads || []);

  const resolveMutation = useMutation({
    mutationFn: ({ id, leadId }) => voiceDraftsApi.resolve(id, leadId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['voice-drafts'] }); setAssigningId(null); setSelectedLead(null); setLeadQuery(''); toast.success('Saved to lead'); },
    onError: () => toast.error('Failed'),
  });

  const dismissMutation = useMutation({
    mutationFn: (id) => voiceDraftsApi.dismiss(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['voice-drafts'] }); toast.success('Dismissed'); },
  });

  if (!drafts.length) return null;

  return (
    <section className="bg-white dark:bg-slate-800 rounded-2xl border border-amber-200 dark:border-amber-800">
      <div className="flex items-center gap-2 p-4 border-b border-amber-100 dark:border-amber-800">
        <Mic size={16} className="text-amber-500" />
        <h2 className="font-semibold text-sm">Unresolved Recordings</h2>
        <span className="ml-auto text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">{drafts.length}</span>
      </div>
      <div className="divide-y divide-gray-50 dark:divide-slate-700">
        {drafts.map(draft => (
          <div key={draft.id} className="p-4">
            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 mb-3">{draft.content}</p>
            <div className="text-xs text-gray-400 mb-3">{new Date(draft.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>

            {assigningId === draft.id ? (
              <div className="space-y-2">
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input autoFocus type="text" placeholder="Search leads…" value={leadQuery}
                    onChange={e => { setLeadQuery(e.target.value); setSelectedLead(null); }}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 outline-none focus:ring-1 focus:ring-primary-500" />
                </div>
                {selectedLead ? (
                  <div className="flex items-center gap-2 justify-between">
                    <span className="text-sm font-medium text-primary-600">{selectedLead.name}</span>
                    <div className="flex gap-2">
                      <button onClick={() => resolveMutation.mutate({ id: draft.id, leadId: selectedLead.id })}
                        className="px-3 py-1.5 bg-primary-600 text-white text-xs rounded-lg font-medium">Save</button>
                      <button onClick={() => { setAssigningId(null); setSelectedLead(null); setLeadQuery(''); }}
                        className="px-3 py-1.5 bg-gray-100 dark:bg-slate-700 text-xs rounded-lg">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {leads.map(l => (
                      <button key={l.id} onClick={() => { setSelectedLead(l); setLeadQuery(l.name); }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 text-sm">{l.name}
                        {l.company && <span className="text-gray-400 ml-1 text-xs">· {l.company}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => { setAssigningId(draft.id); setLeadQuery(''); setSelectedLead(null); }}
                  className="flex-1 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-xs font-medium rounded-lg hover:bg-primary-100 transition-colors">
                  Assign to lead
                </button>
                <button onClick={() => dismissMutation.mutate(draft.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function DemoModeSection() {
  const { user, org, refreshOrg } = useAuth();
  const [confirming, setConfirming] = useState(false);

  const disableMutation = useMutation({
    mutationFn: () => orgApi.disableDemo(),
    onSuccess: () => {
      refreshOrg();
      setConfirming(false);
      toast.success('Demo mode disabled. Demo leads have been archived.');
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  });

  if (!org) return null;

  if (!org.demoMode) {
    return (
      <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base">🎮</span>
          <h2 className="font-semibold text-sm">Demo Mode</h2>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Demo mode was disabled on {new Date(org.demoDisabledAt).toLocaleDateString()}. All demo data has been archived.
        </p>
      </section>
    );
  }

  return (
    <section className="bg-white dark:bg-slate-800 rounded-2xl border border-indigo-200 dark:border-indigo-800 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">🎮</span>
        <h2 className="font-semibold text-sm text-indigo-700 dark:text-indigo-400">Demo Mode is ON</h2>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
        Your workspace contains <strong>8 demo leads</strong> with realistic data so you can explore the CRM. When you're ready to start for real, turn off demo mode — all demo data will be archived and you'll start with a clean slate.
      </p>
      <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2 mb-4">
        ⚠️ This cannot be undone. Once demo mode is off, it stays off.
      </p>

      {user?.role === 'admin' && (
        confirming ? (
          <div className="flex gap-2">
            <button
              onClick={() => disableMutation.mutate()}
              disabled={disableMutation.isPending}
              className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-50"
            >
              {disableMutation.isPending ? 'Disabling…' : 'Yes, disable demo mode'}
            </button>
            <button onClick={() => setConfirming(false)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-sm">
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="w-full py-2 rounded-lg border-2 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400 text-sm font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
          >
            Turn off demo mode
          </button>
        )
      )}
      {user?.role !== 'admin' && (
        <p className="text-xs text-slate-400">Only an admin can disable demo mode.</p>
      )}
    </section>
  );
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list().then(r => [...r.data].sort((a, b) => (b.isActive - a.isActive) || a.name.localeCompare(b.name))),
    enabled: user?.role === 'admin',
  });

  const createMutation = useMutation({
    mutationFn: (data) => usersApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setShowCreate(false); toast.success('User created'); },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => usersApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setEditUser(null); toast.success('Updated'); },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }) => usersApi.update(id, { isActive }),
    onSuccess: (_, { isActive }) => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['users', 'active'] });
      toast.success(isActive ? 'User re-enabled' : 'User disabled');
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="p-4 md:p-6 max-w-3xl space-y-6">
      <h1 className="text-xl md:text-2xl font-bold">Settings</h1>

      {/* My Profile */}
      <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4">
        <ProfileSection />
      </section>

      {/* 2FA Section */}
      <TwoFactorSection />

      {/* Preferences */}
      <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4">
        <h2 className="font-semibold text-sm mb-3">Preferences</h2>
        <button onClick={toggle}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
          {dark ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} className="text-slate-500" />}
          <span>{dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
          <span className="ml-auto text-xs text-gray-400">{dark ? 'Light' : 'Dark'}</span>
        </button>
      </section>

      {/* Demo mode */}
      <DemoModeSection />

      {/* Unresolved voice recordings */}
      <VoiceDraftsSection />

      {/* Team Management — admin only */}
      {user?.role === 'admin' && (
        <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-gray-400" />
              <h2 className="font-semibold text-sm">Team Management</h2>
            </div>
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-medium">
              <Plus size={13} /> Add User
            </button>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden divide-y divide-gray-50 dark:divide-slate-700">
            {users.map(u => (
              <div key={u.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{u.name}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.role === 'admin' ? 'bg-primary-100 text-primary-700' : u.role === 'agent' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                        {u.role}
                      </span>
                      <span className={`text-xs ${u.isActive ? 'text-green-600' : 'text-red-400'}`}>
                        {u.isActive ? '● Active' : '● Disabled'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 truncate">{u.email}</div>
                  </div>
                  <div className="flex gap-1 ml-2 flex-shrink-0">
                    <button onClick={() => setEditUser(u)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700">
                      <Edit size={14} />
                    </button>
                    {u.id !== user.id && (
                      <button
                        onClick={() => { if (confirm(u.isActive ? 'Disable this user?' : 'Re-enable this user?')) toggleActiveMutation.mutate({ id: u.id, isActive: !u.isActive }); }}
                        className={`p-1.5 rounded ${u.isActive ? 'hover:bg-red-100 text-gray-400 hover:text-red-500' : 'hover:bg-green-100 text-gray-400 hover:text-green-600'}`}>
                        {u.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
                <tr>
                  <th className="p-4 text-left font-medium text-gray-600 dark:text-gray-400">Name</th>
                  <th className="p-4 text-left font-medium text-gray-600 dark:text-gray-400">Email</th>
                  <th className="p-4 text-left font-medium text-gray-600 dark:text-gray-400">Role</th>
                  <th className="p-4 text-left font-medium text-gray-600 dark:text-gray-400">Status</th>
                  <th className="p-4 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="p-4 font-medium">{u.name}</td>
                    <td className="p-4 text-gray-500">{u.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.role === 'admin' ? 'bg-primary-100 text-primary-700' : u.role === 'agent' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs ${u.isActive ? 'text-green-600' : 'text-red-400'}`}>
                        {u.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button onClick={() => setEditUser(u)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700">
                          <Edit size={14} />
                        </button>
                        {u.id !== user.id && (
                          <button
                            onClick={() => { if (confirm(u.isActive ? 'Disable this user?' : 'Re-enable this user?')) toggleActiveMutation.mutate({ id: u.id, isActive: !u.isActive }); }}
                            title={u.isActive ? 'Disable' : 'Re-enable'}
                            className={`p-1.5 rounded ${u.isActive ? 'hover:bg-red-100 text-gray-400 hover:text-red-500' : 'hover:bg-green-100 text-gray-400 hover:text-green-600'}`}>
                            {u.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add User">
        <UserForm onSubmit={createMutation.mutate} loading={createMutation.isPending} />
      </Modal>
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Edit User">
        {editUser && (
          <UserForm
            onSubmit={(data) => updateMutation.mutate({ id: editUser.id, ...data })}
            loading={updateMutation.isPending}
            defaultValues={editUser}
            isEdit
          />
        )}
      </Modal>

      {/* Logout */}
      <button onClick={handleLogout}
        className="w-full py-3 rounded-2xl border-2 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
        <LogOut size={16} />
        Sign out
      </button>
    </div>
  );
}
