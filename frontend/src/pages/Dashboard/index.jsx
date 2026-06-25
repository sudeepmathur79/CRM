import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../services/api';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { Users, TrendingUp, Clock, AlertCircle, DollarSign, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const fmt = (n) => n >= 1000000 ? `$${(n/1000000).toFixed(1)}M` : n >= 1000 ? `$${(n/1000).toFixed(0)}K` : `$${n.toLocaleString()}`;

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">
    <div className="flex items-start justify-between">
      <div className="min-w-0">
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-2xl md:text-3xl font-bold mt-1 truncate">{value}</p>
        {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
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

export default function DashboardPage() {
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

  const hasValue = (stats?.totalPipelineValue || 0) > 0;

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{format(new Date(), 'EEEE, MMMM d yyyy')}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
        <StatCard icon={Users} label="Total Leads" value={stats?.total || 0} color="bg-primary-500" />
        <StatCard icon={TrendingUp} label="Conversion" value={`${stats?.conversionRate || 0}%`} color="bg-green-500" sub="Closed Won" />
        <StatCard icon={Clock} label="Follow-ups Today" value={stats?.followUpsToday || 0} color="bg-yellow-500" />
        <StatCard icon={AlertCircle} label="Overdue" value={stats?.overdue || 0} color="bg-red-500" />
        <StatCard icon={DollarSign} label="Pipeline Value" value={hasValue ? fmt(stats.totalPipelineValue) : '—'} color="bg-violet-500" sub="All active stages" />
        <StatCard icon={Trophy} label="Won Value" value={(stats?.wonValue || 0) > 0 ? fmt(stats.wonValue) : '—'} color="bg-emerald-500" sub="Closed Won" />
      </div>

      {/* Status breakdown — with value if available */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {['New','Contacted','Qualified','Proposal','Closed Won','Closed Lost'].map(status => {
          const count = stats?.byStatus?.[status] || 0;
          const val = stats?.valueByStatus?.[status];
          return (
            <div key={status} className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-gray-100 dark:border-slate-700 text-center">
              <div className="w-2 h-2 rounded-full mx-auto mb-2" style={{ background: STATUS_COLORS[status] }} />
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{status}</p>
              {val > 0 && <p className="text-xs font-medium mt-1" style={{ color: STATUS_COLORS[status] }}>{fmt(val)}</p>}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Leads over time */}
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

        {/* Pipeline by value or count */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm md:text-base">Pipeline by Stage</h2>
            {hasValue && <span className="text-xs text-gray-400">showing deal value</span>}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={charts?.pipeline || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }}
                tickFormatter={hasValue ? (v) => v >= 1000 ? `$${(v/1000).toFixed(0)}K` : `$${v}` : undefined} />
              <YAxis dataKey="status" type="category" tick={{ fontSize: 10 }} width={80} />
              <Tooltip formatter={(val) => hasValue ? [`$${val.toLocaleString()}`, 'Value'] : [val, 'Count']} />
              <Bar dataKey={hasValue ? 'value' : 'count'} radius={[0, 4, 4, 0]}>
                {(charts?.pipeline || []).map((entry) => (
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
