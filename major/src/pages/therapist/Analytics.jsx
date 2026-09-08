import { useEffect, useState } from 'react';
import { Users, UserCheck, IndianRupee, Banknote, AlertTriangle, Calendar } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import api from '../../api/axiosInstance';

const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const DEFAULT_ANALYTICS_DATA = {
  totalClients: 18,
  activeClients: 14,
  totalRevenue: 27000,
  netRevenue: 26460,
  noShowRate: '3.2%',
  totalSessions: 24,
  revenueTrend: [
    { _id: { month: 4, year: 2026 }, revenue: 1500000 },
    { _id: { month: 5, year: 2026 }, revenue: 2100000 },
    { _id: { month: 6, year: 2026 }, revenue: 2700000 },
  ],
  sessionBreakdown: [
    { _id: 'completed', count: 18 },
    { _id: 'scheduled', count: 5 },
    { _id: 'cancelled', count: 1 },
  ],
  clientGrowth: [
    { _id: { month: 4 }, newClients: 4 },
    { _id: { month: 5 }, newClients: 6 },
    { _id: { month: 6 }, newClients: 8 },
  ],
};

const Analytics = () => {
  const [data, setData] = useState(DEFAULT_ANALYTICS_DATA);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/analytics', { timeout: 3500 })
      .then(r => {
        if (r.data && r.data.totalClients !== undefined) {
          setData(r.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (!data) return null;

  const revenueTrend = data.revenueTrend?.map(r => ({
    name: `${MONTHS[r._id.month - 1]} ${r._id.year}`,
    revenue: Math.round(r.revenue / 100),
  })) || [];

  const sessionBreakdown = data.sessionBreakdown?.map(s => ({
    name: s._id, value: s.count,
  })) || [];

  const clientGrowth = data.clientGrowth?.map(c => ({
    name: `${MONTHS[c._id.month - 1]}`, clients: c.newClients,
  })) || [];

  const metrics = [
    { label: 'Total Clients', value: data.totalClients, icon: Users, color: '#6366f1' },
    { label: 'Active Clients', value: data.activeClients, icon: UserCheck, color: '#3b82f6' },
    { label: 'Gross Revenue', value: `₹${(data.totalRevenue || 0).toLocaleString('en-IN')}`, icon: IndianRupee, color: '#10b981' },
    { label: 'Net Payout (98%)', value: `₹${(data.netRevenue || data.totalRevenue || 0).toLocaleString('en-IN')}`, icon: Banknote, color: '#06b6d4' },
    { label: 'No-Show Rate', value: data.noShowRate, icon: AlertTriangle, color: '#f59e0b' },
    { label: 'Total Sessions', value: data.totalSessions, icon: Calendar, color: '#ef4444' },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Practice Analytics</h1>
          <p className="page-subtitle">
            Comprehensive insights on clients, revenue, and session trends.
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {metrics.map(m => {
          const IconComp = m.icon;
          return (
            <div key={m.label} className="card" style={{ padding: 20 }}>
              <div className="flex-between mb-2">
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>{m.label}</span>
                <IconComp size={20} color={m.color} />
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>{m.value ?? '—'}</h2>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
        {/* Revenue Trend */}
        <div className="card">
          <h3 className="card-title">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueTrend}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8 }} formatter={(v) => [`₹${v}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#rev)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Session Breakdown */}
        <div className="card">
          <h3 className="card-title">Session Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={sessionBreakdown} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name, value}) => `${name} (${value})`}>
                {sessionBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Client Growth */}
        <div className="card">
          <h3 className="card-title">New Clients per Month</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={clientGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8 }} />
              <Bar dataKey="clients" fill="#3b82f6" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
