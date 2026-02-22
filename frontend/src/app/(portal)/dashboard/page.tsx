'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { apiClient } from '@/lib/api-client';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, activityRes] = await Promise.all([
          apiClient.get('/dashboard/stats'),
          apiClient.get('/dashboard/recent-activity'),
        ]);
        setStats(statsRes.data);
        setRecentActivity(activityRes.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card h-32 animate-pulse" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="card h-80 animate-pulse lg:col-span-2" />
          <div className="card h-80 animate-pulse" />
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Patients', value: stats?.totalPatients || 0, change: stats?.change?.patients, color: 'primary' },
    { label: 'Appointments', value: stats?.totalAppointments || 0, change: stats?.change?.appointments, color: 'secondary' },
    { label: 'Active Doctors', value: stats?.totalDoctors || 0, change: stats?.change?.doctors, color: 'primary' },
    { label: 'Revenue (Month)', value: `$${stats?.revenue?.toLocaleString() || 0}`, change: stats?.change?.revenue, color: 'success' },
  ];

  const appointmentStatus = [
    { name: 'Completed', value: 40, color: '#10b981' },
    { name: 'Pending', value: 30, color: '#f59e0b' },
    { name: 'Cancelled', value: 30, color: '#ef4444' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">Dashboard</h1>
        <p className="mt-1 text-slate-500">Real-time overview of your healthcare system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="card group hover:scale-[1.02] transition-transform">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{stat.value}</p>
            <div className="mt-4 flex items-center text-sm font-medium text-emerald-600">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 mr-1.5">↑</span>
              {stat.change} from last month
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h2 className="mb-6 text-lg font-bold text-slate-900">Activity Analytics</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { month: 'Jan', patients: 45, appt: 120 },
                { month: 'Feb', patients: 52, appt: 135 },
                { month: 'Mar', patients: 48, appt: 150 },
                { month: 'Apr', patients: 61, appt: 140 },
                { month: 'May', patients: 55, appt: 160 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: '#F1F5F9' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="patients" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="appt" fill="#8B5CF6" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2 className="mb-6 text-lg font-bold text-slate-900">Appointment Mix</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={appointmentStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {appointmentStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Recent Appointments</h2>
          <button className="text-sm font-semibold text-blue-600 hover:text-blue-700">View all</button>
        </div>
        <div className="divide-y divide-slate-100">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between py-4 group hover:bg-slate-50 rounded-xl px-2 transition-colors">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                  {activity.patientName.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{activity.patientName}</p>
                  <p className="text-sm text-slate-500 font-medium">
                    {activity.doctorName} • {new Date(activity.date).toLocaleDateString()} at {activity.time}
                  </p>
                </div>
              </div>
              <span className={`badge ${activity.status === 'completed' ? 'badge-success' :
                activity.status === 'scheduled' ? 'badge-primary' : 'badge-warning'
                }`}>
                {activity.status}
              </span>
            </div>
          ))}
          {recentActivity.length === 0 && (
            <p className="py-8 text-center text-slate-500 font-medium">No recent appointments found</p>
          )}
        </div>
      </div>
    </div>
  );
}
