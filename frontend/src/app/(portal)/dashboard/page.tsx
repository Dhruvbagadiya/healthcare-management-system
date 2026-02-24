'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { apiClient } from '@/lib/api-client';
import { 
  Users, 
  Calendar, 
  Heart, 
  DollarSign, 
  Package, 
  Bed, 
  Stethoscope, 
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  Clock,
  Building2
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [moduleMetrics, setModuleMetrics] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch main dashboard stats
        const [statsRes, activityRes] = await Promise.all([
          apiClient.get('/dashboard/stats'),
          apiClient.get('/dashboard/recent-activity'),
        ]);
        setStats(statsRes.data);
        setRecentActivity(activityRes.data);

        // Fetch metrics from new modules in parallel
        try {
          const [wardsStats, financialRes, inventoryRes, staffRes, complianceRes] = await Promise.all([
            apiClient.get('/wards/stats').catch(() => ({})),
            apiClient.get('/accounts/financial-summary').catch(() => ({})),
            apiClient.get('/inventory/low-stock').catch(() => []),
            apiClient.get('/staff?limit=1').catch(() => ({})),
            apiClient.get('/compliance/non-compliant').catch(() => []),
          ]);
          
          setModuleMetrics({
            wards: wardsStats.data || {},
            financial: financialRes.data || { totalRevenue: 0, totalExpenses: 0, netProfit: 0 },
            lowStockItems: (inventoryRes.data || []).length,
            staffCount: staffRes.data?.total || 0,
            nonCompliantItems: (complianceRes.data || []).length,
          });
        } catch (error) {
          console.error('Failed to fetch module metrics', error);
        }
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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

  // Primary metrics cards
  const primaryMetrics = [
    { 
      label: 'Total Patients', 
      value: stats?.totalPatients || 0, 
      icon: Users, 
      color: 'blue',
      trend: '+12%'
    },
    { 
      label: 'Appointments Today', 
      value: stats?.totalAppointments || 0, 
      icon: Calendar, 
      color: 'purple',
      trend: '+8%'
    },
    { 
      label: 'Active Doctors', 
      value: stats?.totalDoctors || 0, 
      icon: Heart, 
      color: 'red',
      trend: '+2%'
    },
    { 
      label: 'Monthly Revenue', 
      value: `₹${(stats?.revenue || 0).toLocaleString()}`, 
      icon: DollarSign, 
      color: 'green',
      trend: '+15%'
    },
    { 
      label: 'Occupied Beds', 
      value: moduleMetrics.wards?.occupiedBeds || 0, 
      icon: Bed, 
      color: 'orange',
      trend: `${Math.round(((moduleMetrics.wards?.occupiedBeds || 0) / (moduleMetrics.wards?.totalBeds || 1) * 100))}%`
    },
    { 
      label: 'Net Profit', 
      value: `₹${(moduleMetrics.financial?.netProfit || 0).toLocaleString()}`, 
      icon: TrendingUp, 
      color: 'indigo',
      trend: moduleMetrics.financial?.netProfit >= 0 ? '+' : '-'
    },
  ];

  const colorMap: any = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-100' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-100' },
    red: { bg: 'bg-red-50', icon: 'text-red-600', border: 'border-red-100' },
    green: { bg: 'bg-green-50', icon: 'text-green-600', border: 'border-green-100' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'border-orange-100' },
    indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', border: 'border-indigo-100' },
  };

  const appointmentStatus = [
    { name: 'Completed', value: 40, color: '#10b981' },
    { name: 'Pending', value: 30, color: '#f59e0b' },
    { name: 'Cancelled', value: 30, color: '#ef4444' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">Dashboard</h1>
        <p className="mt-1 text-slate-500">Hospital Operations Overview</p>
      </div>

      {/* Primary KPI Metrics Grid - 6 columns */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {primaryMetrics.map((metric, idx) => {
          const color = colorMap[metric.color];
          const Icon = metric.icon;
          return (
            <div key={idx} className={`card group hover:shadow-lg transition-all border-l-4 ${color.border} ${color.bg}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{metric.label}</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">{metric.value}</p>
                  <p className={`text-xs font-semibold mt-2 ${metric.trend.includes('+') ? 'text-green-600' : metric.trend.includes('%') ? 'text-blue-600' : 'text-red-600'}`}>
                    {metric.trend}
                  </p>
                </div>
                <Icon className={`${color.icon} h-8 w-8 opacity-70`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Critical Alerts Section - 3 columns */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Low Stock Inventory */}
        <div className="card border-l-4 border-orange-200 bg-orange-50/50 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600">Low Stock Items</p>
              <p className="mt-1 text-2xl font-bold text-orange-600">{moduleMetrics.lowStockItems || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Items require attention</p>
            </div>
            <Package className="h-10 w-10 text-orange-600 opacity-60" />
          </div>
        </div>

        {/* Compliance Issues */}
        <div className="card border-l-4 border-red-200 bg-red-50/50 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600">Compliance Issues</p>
              <p className="mt-1 text-2xl font-bold text-red-600">{moduleMetrics.nonCompliantItems || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Urgent: Review needed</p>
            </div>
            <AlertCircle className="h-10 w-10 text-red-600 opacity-60" />
          </div>
        </div>

        {/* Staff Count */}
        <div className="card border-l-4 border-blue-200 bg-blue-50/50 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600">Active Staff</p>
              <p className="mt-1 text-2xl font-bold text-blue-600">{moduleMetrics.staffCount || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Personnel on duty</p>
            </div>
            <Stethoscope className="h-10 w-10 text-blue-600 opacity-60" />
          </div>
        </div>
      </div>

      {/* Financial & Analytics Section - 2 cols */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Financial Summary */}
        <div className="card lg:col-span-2">
          <h2 className="mb-6 text-lg font-bold text-slate-900">Financial Summary</h2>
          
          {/* Financial KPIs */}
          <div className="grid gap-4 sm:grid-cols-3 mb-8">
            <div className="p-3 bg-green-50 rounded-lg border border-green-100">
              <p className="text-xs font-semibold text-gray-600 uppercase">Total Revenue</p>
              <p className="mt-2 text-2xl font-bold text-green-600">₹{(moduleMetrics.financial?.totalRevenue || 0).toLocaleString()}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg border border-red-100">
              <p className="text-xs font-semibold text-gray-600 uppercase">Total Expenses</p>
              <p className="mt-2 text-2xl font-bold text-red-600">₹{(moduleMetrics.financial?.totalExpenses || 0).toLocaleString()}</p>
            </div>
            <div className={`p-3 rounded-lg border ${moduleMetrics.financial?.netProfit >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-red-50 border-red-100'}`}>
              <p className="text-xs font-semibold text-gray-600 uppercase">Net Profit</p>
              <p className={`mt-2 text-2xl font-bold ${moduleMetrics.financial?.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                ₹{(moduleMetrics.financial?.netProfit || 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Revenue Trend Chart */}
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Revenue vs Expenses Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={[
              { month: 'Jan', revenue: 45000, expenses: 32000 },
              { month: 'Feb', revenue: 52000, expenses: 38000 },
              { month: 'Mar', revenue: 48000, expenses: 35000 },
              { month: 'Apr', revenue: 61000, expenses: 42000 },
              { month: 'May', revenue: 55000, expenses: 40000 },
              { month: 'Jun', revenue: 67000, expenses: 45000 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
              <Tooltip
                cursor={{ fill: '#F1F5F9' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 5 }} />
              <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={3} dot={{ fill: '#ef4444', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Hospital Operations Metrics */}
        <div className="card">
          <h2 className="mb-6 text-lg font-bold text-slate-900">Hospital Metrics</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Bed className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Occupied Beds</span>
              </div>
              <span className="text-lg font-bold text-gray-900">{moduleMetrics.wards?.occupiedBeds || 0}</span>
            </div>
            
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">Available Beds</span>
              </div>
              <span className="text-lg font-bold text-green-600">{moduleMetrics.wards?.availableBeds || 0}</span>
            </div>

            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Stethoscope className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Total Wards</span>
              </div>
              <span className="text-lg font-bold text-gray-900">{moduleMetrics.wards?.totalWards || 0}</span>
            </div>

            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-gray-700">Appointments</span>
              </div>
              <span className="text-lg font-bold text-gray-900">{stats?.totalAppointments || 0}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Last Updated</span>
              </div>
              <span className="text-xs font-medium text-gray-500">Just now</span>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Charts Section */}
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
          <h2 className="mb-6 text-lg font-bold text-slate-900">Appointment Status</h2>
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
      {recentActivity && recentActivity.length > 0 && (
        <div className="card">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
            <button className="text-sm font-semibold text-blue-600 hover:text-blue-700">View all</button>
          </div>
          <div className="divide-y divide-slate-100">
            {recentActivity.slice(0, 5).map((activity, idx) => (
              <div key={idx} className="flex items-center justify-between py-4 group hover:bg-slate-50 rounded-xl px-2 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                    {activity.patientName ? activity.patientName.charAt(0) : '•'}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{activity.patientName || activity.description || 'Activity'}</p>
                    <p className="text-sm text-slate-500 font-medium">
                      {activity.doctorName || activity.timestamp || 'Recently'}
                    </p>
                  </div>
                </div>
                <span className={`badge ${activity.status === 'completed' ? 'badge-success' : activity.status === 'scheduled' ? 'badge-primary' : 'badge-warning'}`}>
                  {activity.status || 'pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
