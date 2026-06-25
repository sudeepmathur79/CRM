import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import Modal from '../../components/ui/Modal';
import { Plus, Edit, UserX, UserCheck, LogOut, Sun, Moon, User, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

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

  const updateMutation = useMutation({
    mutationFn: (data) => {
      const payload = { name: data.name, email: data.email };
      if (data.password) payload.password = data.password;
      return usersApi.update(user.id, payload);
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
      <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-slate-700">
          <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-700 dark:text-primary-400">
            <User size={18} />
          </div>
          <div>
            <div className="font-semibold text-sm">{user?.name}</div>
            <div className="text-xs text-gray-500 capitalize">{user?.email} · {user?.role}</div>
          </div>
        </div>
        <div className="p-4">
          <ProfileSection />
        </div>
      </section>

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

      {/* Logout — always visible, especially useful on mobile */}
      <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4">
        <button onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium">
          <LogOut size={18} />
          Sign out
        </button>
      </section>

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
    </div>
  );
}
