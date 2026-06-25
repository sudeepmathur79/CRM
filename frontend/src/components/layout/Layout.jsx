import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  LayoutDashboard, Users, Columns, Mic, Settings, LogOut, Sun, Moon, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/leads', icon: Users, label: 'Leads' },
  { to: '/kanban', icon: Columns, label: 'Kanban' },
  { to: '/recordings', icon: Mic, label: 'Files' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const socket = io({ path: '/socket.io' });
    socket.emit('join', user?.id);
    socket.on('lead:assigned', ({ leadName }) => toast.success(`Lead assigned: ${leadName}`));
    socket.on('lead:created', ({ name }) => toast(`New lead: ${name}`, { icon: '👤' }));
    return () => socket.disconnect();
  }, [user?.id]);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar — hidden on mobile, shown on md+ */}
      <aside className={`hidden md:flex ${collapsed ? 'w-16' : 'w-56'} flex-shrink-0 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex-col transition-all duration-200`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
          {!collapsed && <span className="font-bold text-primary-600 dark:text-primary-400 text-lg">CRM</span>}
          <button onClick={() => setCollapsed(c => !c)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 ml-auto">
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {navItems.map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`
              }
            >
              <Icon size={18} className="flex-shrink-0" />
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

      <main className="flex-1 overflow-auto bg-gray-50 dark:bg-slate-900" style={{ paddingBottom: 'calc(56px + env(safe-area-inset-bottom, 0px))' }}>
        <style>{`@media (min-width: 768px) { main { padding-bottom: 0 !important; } }`}</style>
        <Outlet />
      </main>
        <Outlet />
      </main>

      {/* Bottom tab bar — mobile only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 flex items-center"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {navItems.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-medium transition-colors ${
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} className={isActive ? 'text-primary-600 dark:text-primary-400' : ''} />
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
