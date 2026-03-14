'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useOrganization } from '@/hooks/use-organization';
import { useSubscription } from '@/hooks/use-subscription';
import Link from 'next/link';
import {
  Users,
  ShieldCheck,
  UserCheck,
  UserX,
  Clock,
  Activity,
  ScrollText,
  Building2,
  ChevronRight,
  Shield,
} from 'lucide-react';

interface Stats {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  suspendedUsers: number;
}

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { organization } = useOrganization();
  const { plan } = useSubscription();

  useEffect(() => {
    Promise.all([
      apiClient.get('/admin/stats').then((r) => setStats(r.data)).catch(() => {}),
      apiClient
        .get('/compliance/access-logs?page=1&limit=5')
        .then((r) => setRecentLogs(r.data.data || []))
        .catch(() => {}),
    ]).finally(() => setIsLoading(false));
  }, []);

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: Users, color: 'blue' },
    { label: 'Active', value: stats?.activeUsers ?? 0, icon: UserCheck, color: 'emerald' },
    { label: 'Pending', value: stats?.pendingUsers ?? 0, icon: Clock, color: 'amber' },
    { label: 'Suspended', value: stats?.suspendedUsers ?? 0, icon: UserX, color: 'rose' },
  ];

  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100' },
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Overview of your organization&apos;s users, roles, and system activity
        </p>
      </div>

      {/* Organization Info Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Building2 size={22} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">{organization?.name || 'Loading...'}</h2>
            <p className="text-xs text-slate-500">
              {organization?.slug ? `${organization.slug}.aarogentix.com` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
              organization?.status === 'active'
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : 'bg-slate-50 text-slate-500 border border-slate-200'
            }`}
          >
            {organization?.status || 'loading'}
          </span>
          {plan && (
            <span className="text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-200">
              {plan} Plan
            </span>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          const colors = colorMap[card.color];
          return (
            <div
              key={card.label}
              className={`bg-white rounded-2xl border ${colors.border} shadow-sm p-5`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`h-11 w-11 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center`}
                >
                  <Icon size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {isLoading ? (
                      <span className="inline-block h-7 w-12 bg-slate-100 rounded animate-pulse" />
                    ) : (
                      card.value
                    )}
                  </p>
                  <p className="text-xs font-medium text-slate-500">{card.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions + Recent Activity */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            Quick Actions
          </h3>
          {[
            { href: '/admin/users', label: 'Manage Users', desc: 'View, search, assign roles', icon: Users, color: 'blue' },
            { href: '/admin/roles', label: 'Roles & Permissions', desc: 'Create roles, assign permissions', icon: ShieldCheck, color: 'indigo' },
            { href: '/admin/audit-logs', label: 'Audit Logs', desc: 'View system activity logs', icon: ScrollText, color: 'slate' },
            { href: '/admin/organization', label: 'Organization Settings', desc: 'Hospital info, branding', icon: Building2, color: 'violet' },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:shadow-md hover:border-slate-300 transition-all group"
              >
                <div className={`h-10 w-10 rounded-lg bg-${action.color}-50 flex items-center justify-center shrink-0`}>
                  <Icon size={18} className={`text-${action.color}-600`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {action.label}
                  </p>
                  <p className="text-xs text-slate-500">{action.desc}</p>
                </div>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
              </Link>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              Recent Activity
            </h3>
            <Link
              href="/admin/audit-logs"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View All
            </Link>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="h-8 w-8 rounded-lg bg-slate-100" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-48 bg-slate-100 rounded" />
                      <div className="h-2 w-24 bg-slate-100 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentLogs.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <Activity size={14} className="text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 truncate">
                        <span className="font-semibold">{log.action}</span>
                        {' on '}
                        <span className="font-medium text-slate-500">{log.entityType}</span>
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {new Date(log.timestamp).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {' · '}
                        {log.entityId !== 'N/A' ? log.entityId : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <Shield size={32} className="mx-auto text-slate-300 mb-3" />
                <p className="text-sm font-semibold text-slate-500">No activity logs yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  Audit logs will appear here as users interact with the system
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
