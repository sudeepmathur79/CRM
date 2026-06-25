import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '../../services/api';
import {
  LayoutDashboard, Users, Columns, Mic, Settings, LogOut, Sun, Moon, ChevronLeft, ChevronRight, MessageSquare,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import VoiceCapture from '../VoiceCapture';

// Inline style applied only on mobile via JS — avoids needing a Tailwind plugin for safe-area
const mobileMainStyle = {
  paddingBottom: 'calc(56px + env(safe-area-inset-bottom, 0px))',
};

export default function Layout() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  const { data: unreadData } = useQuery({
    queryKey: ['messages-unread'],
    queryFn: () => messagesApi.unreadCount().then(r => r.data),
    refetchInterval: 15000,
  });
  const unread = unreadData?.count || 0;

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Request browser notification permission once
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const socket = io({ path: '/socket.io' });
    window.__socket = socket;
    socket.emit('join', user?.id);
    socket.on('lead:assigned', ({ leadName }) => toast.success(`Lead assigned: ${leadName}`));
    socket.on('lead:created', ({ name }) => toast(`New lead: ${name}`, { icon: '👤' }));
    socket.on('message:new', (msg) => {
      qc.invalidateQueries({ queryKey: ['messages-unread'] });
      qc.invalidateQueries({ queryKey: ['messages'] });
      qc.invalidateQueries({ queryKey: ['messages-thread'] });
      toast(`💬 ${msg.from?.name}: ${msg.body.slice(0, 60)}${msg.body.length > 60 ? '…' : ''}`, {
        duration: 5000,
        onClick: () => navigate(`/inbox?with=${msg.fromId}`),
      });
    });
    socket.on('followup:due', (data) => {
      const when = data.minutesUntil <= 1 ? 'now' : `in ${data.minutesUntil} min`;
      const title = `📅 Follow-up due ${when}`;
      const body = `${data.leadName}${data.company ? ` · ${data.company}` : ''}`;

      // Browser notification (works even if tab is in background)
      if ('Notification' in window && Notification.permission === 'granted') {
        const notif = new Notification(title, { body, icon: '/favicon.ico', tag: `followup-${data.leadId}` });
        notif.onclick = () => { window.focus(); navigate(`/leads/${data.leadId}`); notif.close(); };
      }

      // In-app toast
      toast(t => (
        <button onClick={() => { navigate(`/leads/${data.leadId}`); toast.dismiss(t.id); }}
          className="text-left">
          <div className="font-medium text-sm">{title}</div>
          <div className="text-xs text-gray-500 mt-0.5">{body}</div>
        </button>
      ), { duration: 10000, icon: '📅' });
    });

    socket.on('mention:new', (data) => {
      const from = data.from?.name || 'Someone';
      const context = data.lead ? ` on "${data.lead.name}"` : '';
      const preview = (data.message?.body || data.note?.content || '').slice(0, 50);
      toast(`🔔 ${from} mentioned you${context}: ${preview}…`, {
        duration: 6000,
        onClick: () => data.lead ? navigate(`/leads/${data.lead.id}`) : navigate(`/inbox?with=${data.from?.id}`),
      });
      qc.invalidateQueries({ queryKey: ['messages-unread'] });
    });
    return () => { socket.disconnect(); window.__socket = null; };
  }, [user?.id]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { to: '/leads', icon: Users, label: 'Leads' },
    { to: '/kanban', icon: Columns, label: 'Kanban' },
    { to: '/recordings', icon: Mic, label: 'Files' },
    { to: '/inbox', icon: MessageSquare, label: 'Messages', badge: unread },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar — hidden on mobile */}
      <aside className={`hidden md:flex ${collapsed ? 'w-16' : 'w-56'} flex-shrink-0 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex-col transition-all duration-200`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
          {!collapsed && <span className="font-bold text-primary-600 dark:text-primary-400 text-lg">CRM</span>}
          <button onClick={() => setCollapsed(c => !c)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 ml-auto">
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {navItems.map(({ to, icon: Icon, label, exact, badge }) => (
            <NavLink key={to} to={to} end={exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`
              }
            >
              <div className="relative flex-shrink-0">
                <Icon size={18} />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
              {!collapsed && label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-200 dark:border-slate-700 space-y-2">
          <button onClick={toggle} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 w-full">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
            {!collapsed && (dark ? 'Light mode' : 'Dark mode')}
          </button>
          {!collapsed && (
            <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 truncate">
              <div className="font-medium text-gray-900 dark:text-gray-100">{user?.name}</div>
              <div className="capitalize">{user?.role}</div>
            </div>
          )}
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full">
            <LogOut size={18} />
            {!collapsed && 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main
        className="flex-1 overflow-auto bg-gray-50 dark:bg-slate-900"
        style={isMobile ? mobileMainStyle : undefined}
      >
        <Outlet />
      </main>

      {/* Voice capture — agent only, hidden on desktop via CSS */}
      {user?.role === 'agent' && <VoiceCapture />}

      {/* Bottom tab bar — mobile only */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 flex items-center"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {navItems.map(({ to, icon: Icon, label, exact, badge }) => (
          <NavLink key={to} to={to} end={exact}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-medium transition-colors ${
                isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <Icon size={20} className={isActive ? 'text-primary-600 dark:text-primary-400' : ''} />
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </div>
                {label}
              </>
            )}
          </NavLink>
        ))}
        <button
          onClick={toggle}
          className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-medium text-gray-500 dark:text-gray-400"
        >
          {dark ? <Sun size={20} /> : <Moon size={20} />}
          {dark ? 'Light' : 'Dark'}
        </button>
      </nav>
    </div>
  );
}
