'use client';

import { useRequireRole } from '@/hooks/auth';
import { useAuth } from '@/hooks/auth';
import { useOrganization } from '@/hooks/use-organization';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  ScrollText,
  Building2,
  ArrowLeft,
  LogOut,
  Crown,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

const ADMIN_NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'User Management', icon: Users },
  { href: '/admin/roles', label: 'Roles & Permissions', icon: ShieldCheck },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
  { href: '/admin/organization', label: 'Organization', icon: Building2 },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  useRequireRole('admin', 'super_admin', 'owner');
  const { user, logout } = useAuth();
  const { organization } = useOrganization();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[280px] flex-col bg-slate-900 text-white transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/50">
              <Crown size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight">Admin Panel</h1>
              <p className="text-[10px] text-slate-400 font-medium truncate max-w-[140px]">
                {organization?.name || 'Organization'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {ADMIN_NAV.map((item) => {
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Back to Portal + User */}
        <div className="border-t border-slate-700/50 p-4 space-y-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
          >
            <ArrowLeft size={16} />
            Back to Portal
          </Link>
          <div className="rounded-xl bg-slate-800/70 p-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-indigo-600/30 flex items-center justify-center text-indigo-300 font-bold text-xs">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-rose-400 transition-colors"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:pl-[280px]">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 shadow-sm">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Crown size={18} className="text-indigo-600" />
            <span className="text-sm font-bold text-slate-900">Admin Panel</span>
          </div>
          <div className="w-10" />
        </header>

        <main className="p-4 md:p-8 lg:p-10">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
