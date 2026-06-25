import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { Users, TrendingUp, Clock, AlertCircle, DollarSign, Trophy, UserCheck, AlertTriangle, Inbox, Sparkles, UserX, Ghost } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const fmt = (n) => n >= 1000000 ? `$${(n/1000000).toFixed(1)}M` : n >= 1000 ? `$${(n/1000).toFixed(0)}K` : `$${Number(n).toLocaleString()}`;
const safeFormat = (v, f) => { try { return v ? format(new Date(v), f) : '—'; } catch { return '—'; } };

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">
    <div className="flex items-start justify-between">
      <div className="min-w-0">
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-2xl md:text-3xl font-bold mt-1 truncate">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
      <div className={`p-3 rounded-xl flex-shrink-0 ml-2 ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
    </div>
  </motion.div>
);

const STATUS_COLORS = {
  'New': '#6366f1', 'Contacted': '#3b82f6', 'Qualified': '#f59e0b',
  'Proposal': '#8b5cf6', 'Closed Won': '#10b981', 'Closed Lost': '#ef4444',
};

const FUNNEL_STAGES = ['New', 'Contacted', 'Qualified', 'Proposal', 'Closed Won'];

function ConversionFunnel({ stats }) {
  const navigate = useNavigate();
  const counts = FUNNEL_STAGES.map(s => stats?.byStatus?.[s] || 0);
  const max = Math.max(...counts, 1);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4 md:p-5">
      <h2 className="font-semibold text-sm mb-4">Conversion Funnel</h2>
      <div className="space-y-2">
        {FUNNEL_STAGES.map((stage, i) => {
          const count = counts[i];
          const prev = i > 0 ? counts[i - 1] : null;
          const dropPct = prev > 0 ? Math.round((1 - count / prev) * 100) : null;
          const barWidth = max > 0 ? Math.max((count / max) * 100, 2) : 2;
          return (
            <button key={stage} onClick={() => navigate(`/leads?status=${encodeURIComponent(stage)}`)}
              className="w-full text-left group">
              <div className="flex items-center gap-3">
                <div className="w-24 text-xs text-gray-500 dark:text-gray-400 text-right flex-shrink-0">{stage}</div>
                <div className="flex-1 relative h-7 flex items-center">
                  <div className="absolute inset-y-0 left-0 rounded-lg transition-all duration-500"
                    style={{ width: `${barWidth}%`, background: STATUS_COLORS[stage], opacity: 0.85 }} />
                  <span className="relative z-10 pl-2 text-xs font-semibold text-white mix-blend-multiply dark:mix-blend-normal">{count}</span>
                </div>
                {dropPct !== null && (
                  <div className={`text-xs flex-shrink-0 w-16 text-right font-medium ${dropPct > 50 ? 'text-red-500' : dropPct > 25 ? 'text-amber-500' : 'text-gray-400'}`}>
                    {dropPct > 0 ? `↓ ${dropPct}%` : '—'}
                  </div>
                )}
                {dropPct === null && <div className="w-16 flex-shrink-0" />}
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-gray-400 mt-3">Drop-off % vs previous stage · click a stage to filter leads</p>
    </div>
  );
}

function AlertsRow({ stats }) {
  const navigate = useNavigate();
  const stale = stats?.stale || 0;
  const unassigned = stats?.unassigned || 0;

  if (!stale && !unassigned) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {stale > 0 && (
        <button onClick={() => navigate('/leads?stale=1')}
          className="flex items-center gap-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 text-left hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors group">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
            <Ghost size={20} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <div className="font-semibold text-amber-800 dark:text-amber-300">{stale} stale lead{stale !== 1 ? 's' : ''}</div>
            <div className="text-xs text-amber-600 dark:text-amber-400">No activity in 14+ days</div>
          </div>
        </button>
      )}
      {unassigned > 0 && (
        <button onClick={() => navigate('/leads?unassigned=1')}
          className="flex items-center gap-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 text-left hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors group">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
            <UserX size={20} className="text-red-600 dark:text-red-400" />
          </div>
          <div>
            <div className="font-semibold text-red-800 dark:text-red-300">{unassigned} unassigned lead{unassigned !== 1 ? 's' : ''}</div>
            <div className="text-xs text-red-600 dark:text-red-400">Need to be assigned to an agent</div>
          </div>
        </button>
      )}
    </div>
  );
}

function MyDashboard({ stats, charts }) {
  const hasValue = (stats?.totalPipelineValue || 0) > 0;
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
        <StatCard icon={Users} label="Total Leads" value={stats?.total || 0} color="bg-primary-500" />
        <StatCard icon={TrendingUp} label="Conversion" value={`${stats?.conversionRate || 0}%`} color="bg-green-500" sub="Closed Won" />
        <StatCard icon={Clock} label="Follow-ups Today" value={stats?.followUpsToday || 0} color="bg-yellow-500" />
        <StatCard icon={AlertCircle} label="Overdue" value={stats?.overdue || 0} color="bg-red-500" />
        <StatCard icon={Ghost} label="Stale" value={stats?.stale || 0} color="bg-amber-500" sub="14+ days quiet" />
        <StatCard icon={UserX} label="Unassigned" value={stats?.unassigned || 0} color="bg-slate-500" sub="Need assignment" />
      </div>

      {/* Conversion funnel */}
      <ConversionFunnel stats={stats} />

      {/* Stale + Unassigned alerts */}
      <AlertsRow stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">
          <h2 className="font-semibold mb-4 text-sm md:text-base">Leads — Last 30 Days</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={charts?.leadsOverTime || []}>
              <defs>
                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#6366f1" fill="url(#colorLeads)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm md:text-base">Pipeline by Stage</h2>
            {hasValue && <span className="text-xs text-gray-400">deal value</span>}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={charts?.pipeline || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }}
                tickFormatter={hasValue ? v => v >= 1000 ? `$${(v/1000).toFixed(0)}K` : `$${v}` : undefined} />
              <YAxis dataKey="status" type="category" tick={{ fontSize: 10 }} width={80} />
              <Tooltip formatter={val => hasValue ? [`$${Number(val).toLocaleString()}`, 'Value'] : [val, 'Count']} />
              <Bar dataKey={hasValue ? 'value' : 'count'} radius={[0, 4, 4, 0]}>
                {(charts?.pipeline || []).map(entry => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#6366f1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function ManagementView() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-management'],
    queryFn: () => dashboardApi.management().then(r => r.data),
    refetchInterval: 120000,
  });

  if (isLoading) return <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" /></div>;

  const { agentStats = [], unassigned = [], staleLeads = [] } = data || {};

  return (
    <div className="space-y-6">

      {/* Agent leaderboard */}
      <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-2 p-4 border-b border-gray-100 dark:border-slate-700">
          <UserCheck size={16} className="text-gray-400" />
          <h2 className="font-semibold text-sm">Team Performance</h2>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-gray-50 dark:divide-slate-700">
          {agentStats.length === 0 && <p className="p-4 text-sm text-gray-400">No agents yet</p>}
          {agentStats.map(a => (
            <div key={a.id} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-medium text-sm">{a.name}</div>
                  <div className="text-xs text-gray-400 capitalize">{a.role}</div>
                </div>
                {a.overdue > 0 && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{a.overdue} overdue</span>}
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[['Leads', a.total], ['Won', a.won], ['New/30d', a.newThisMonth], ['Conv%', `${a.conversionRate}%`]].map(([l, v]) => (
                  <div key={l}>
                    <div className="text-sm font-bold">{v}</div>
                    <div className="text-xs text-gray-400">{l}</div>
                  </div>
                ))}
              </div>
              {a.pipelineValue > 0 && <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">Pipeline: {fmt(a.pipelineValue)}</div>}
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700">
              <tr>
                {['Agent', 'Role', 'Leads', 'Won', 'Conv %', 'New (30d)', 'Pipeline Value', 'Overdue'].map(h => (
                  <th key={h} className="p-3 text-left font-medium text-gray-500 text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
              {agentStats.length === 0 && <tr><td colSpan={8} className="p-4 text-center text-gray-400">No agents yet</td></tr>}
              {agentStats.map(a => (
                <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                  <td className="p-3 font-medium">{a.name}</td>
                  <td className="p-3 capitalize text-gray-500 text-xs">{a.role}</td>
                  <td className="p-3 font-semibold">{a.total}</td>
                  <td className="p-3 text-green-600 font-semibold">{a.won}</td>
                  <td className="p-3">{a.conversionRate}%</td>
                  <td className="p-3">{a.newThisMonth}</td>
                  <td className="p-3 text-green-600">{a.pipelineValue > 0 ? fmt(a.pipelineValue) : '—'}</td>
                  <td className="p-3">
                    {a.overdue > 0
                      ? <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-600">{a.overdue}</span>
                      : <span className="text-gray-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* AI Recommendations */}
      <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-2 p-4 border-b border-gray-100 dark:border-slate-700">
          <Sparkles size={16} className="text-violet-500" />
          <h2 className="font-semibold text-sm">AI Recommendations</h2>
          <span className="text-xs text-gray-400 ml-1">— powered by live data</span>
        </div>
        {!data?.recommendations ? (
          <div className="p-6 text-center text-sm text-gray-400">Loading recommendations…</div>
        ) : data.recommendations.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-400">No recommendations — team is on track ✓</div>
        ) : (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.recommendations.map((r, i) => {
              const CATEGORY_LABEL = { pipeline: 'Pipeline', workload: 'Workload', followup: 'Follow-up', conversion: 'Conversion', risk: 'Risk' };
              const priorityStyles = {
                high: { border: 'border-red-400', bg: 'bg-red-50 dark:bg-red-900/10', text: 'text-red-600', badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
                medium: { border: 'border-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/10', text: 'text-amber-600', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
                low: { border: 'border-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/10', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
                info: { border: 'border-gray-300', bg: 'bg-gray-50 dark:bg-slate-700/30', text: 'text-gray-500', badge: 'bg-gray-100 text-gray-600' },
              };
              const s = priorityStyles[r.priority] || priorityStyles.info;
              return (
                <div key={i} className={`rounded-xl p-3 border-l-4 ${s.border} ${s.bg}`}>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${s.badge}`}>{r.priority}</span>
                    {r.category && <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{CATEGORY_LABEL[r.category] || r.category}</span>}
                  </div>
                  <p className="text-sm font-medium leading-snug">{r.action}</p>
                  {r.reason && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{r.reason}</p>}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Unassigned leads */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Inbox size={16} className="text-gray-400" />
              <h2 className="font-semibold text-sm">Unassigned Leads</h2>
            </div>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{unassigned.length}</span>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-slate-700 max-h-64 overflow-y-auto">
            {unassigned.length === 0 && <p className="p-4 text-sm text-gray-400">All leads are assigned ✓</p>}
            {unassigned.map(l => (
              <div key={l.id} onClick={() => navigate(`/leads/${l.id}`)}
                className="p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/30 cursor-pointer">
                <div>
                  <div className="text-sm font-medium">{l.name}</div>
                  <div className="text-xs text-gray-400">{l.company || l.status} · {safeFormat(l.createdAt, 'MMM d')}</div>
                </div>
                {l.value > 0 && <span className="text-xs text-green-600 font-medium">{fmt(l.value)}</span>}
              </div>
            ))}
          </div>
        </section>

        {/* Stale leads */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" />
              <h2 className="font-semibold text-sm">Stale Leads <span className="text-gray-400 font-normal">(14+ days no activity)</span></h2>
            </div>
            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{staleLeads.length}</span>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-slate-700 max-h-64 overflow-y-auto">
            {staleLeads.length === 0 && <p className="p-4 text-sm text-gray-400">No stale leads ✓</p>}
            {staleLeads.map(l => (
              <div key={l.id} onClick={() => navigate(`/leads/${l.id}`)}
                className="p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/30 cursor-pointer">
                <div>
                  <div className="text-sm font-medium">{l.name}</div>
                  <div className="text-xs text-gray-400">
                    {l.assignedTo?.name || 'Unassigned'} · {l.status} · since {safeFormat(l.createdAt, 'MMM d')}
                  </div>
                </div>
                {l.value > 0 && <span className="text-xs text-green-600 font-medium">{fmt(l.value)}</span>}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('my');

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.stats().then(r => r.data),
    refetchInterval: 60000,
  });
  const { data: charts } = useQuery({
    queryKey: ['dashboard-charts'],
    queryFn: () => dashboardApi.charts().then(r => r.data),
  });

  if (statsLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" /></div>;

  const isAdmin = user?.role === 'admin';
  const canManage = user?.role === 'admin' || user?.role === 'viewer';

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">{format(new Date(), 'EEEE, MMMM d yyyy')}</p>
        </div>
        {canManage && (
          <div className="flex bg-gray-100 dark:bg-slate-700 rounded-xl p-1 gap-1 self-start sm:self-auto">
            {[['my', 'Overview'], ['mgmt', 'Management']].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === key ? 'bg-white dark:bg-slate-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {tab === 'my' && <MyDashboard stats={stats} charts={charts} />}
      {tab === 'mgmt' && canManage && <ManagementView />}
    </div>
  );
}
