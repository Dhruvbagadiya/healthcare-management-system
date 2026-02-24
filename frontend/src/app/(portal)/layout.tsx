'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Calendar,
  UserSquare2,
  ClipboardList,
  Wallet,
  FlaskConical,
  LogOut,
  ChevronRight,
  User as UserIcon,
  Stethoscope,
  Package,
  Building2,
  Microscope,
  DollarSign,
  Shield,
} from 'lucide-react';
import { useRequireAuth } from '@/hooks/auth';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/patients', label: 'Patients', icon: Users },
  { href: '/appointments', label: 'Appointments', icon: Calendar },
  { href: '/doctors', label: 'Doctors', icon: UserSquare2 },
  { href: '/prescriptions', label: 'Prescriptions', icon: ClipboardList },
  { href: '/billing', label: 'Billing', icon: Wallet },
  { href: '/laboratory', label: 'Laboratory', icon: FlaskConical },
  { href: '/staff', label: 'Staff', icon: Stethoscope },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/wards', label: 'Wards', icon: Building2 },
  { href: '/operation-theater', label: 'Operation Theater', icon: Microscope },
  { href: '/accounts', label: 'Accounts', icon: DollarSign },
  { href: '/compliance', label: 'Compliance', icon: Shield },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useRequireAuth();
  const pathname = usePathname();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // If we're not loading but still have no user, the hook will handle redirection.
  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-72 flex-col border-r border-slate-200 bg-white shadow-sm lg:flex">
        {/* Brand Header */}
        <div className="flex h-20 items-center border-b border-slate-50 px-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-xl shadow-lg ring-4 ring-blue-50">
              <img src="/logo.svg" alt="HealthCare logo" className="h-full w-full object-cover" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900 leading-none">HealthCare</h2>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-widest text-blue-600/80">Premium Portal</span>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-4 py-8">
          <nav className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200 translate-x-1'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="h-4 w-4 text-white/70" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Profile & Footer */}
        <div className="border-t border-slate-100 p-4">
          <div className="mb-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 overflow-hidden rounded-full ring-2 ring-white shadow-sm">
                <div className="flex h-full w-full items-center justify-center bg-blue-100 text-xs font-bold text-blue-700">
                  {user?.firstName?.[0] || '?'}{user?.lastName?.[0] || '?'}
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-bold text-slate-900">{user.firstName} {user.lastName}</p>
                <p className="truncate text-[11px] font-medium text-slate-500">{user.email}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-200/50">
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-700">
                {user.roles[0]}
              </span>
              <Link href="/auth/logout" className="group flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-600 active:scale-95">
                <LogOut className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col lg:pl-72 focus:outline-none">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/80 px-8 backdrop-blur-md lg:hidden shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 overflow-hidden rounded-lg">
              <img src="/logo.svg" alt="HealthCare logo" className="h-full w-full object-cover" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">HealthCare</h2>
          </div>
        </header>
        <main className="flex-1 p-6 md:p-8 lg:p-10 animate-in fade-in slide-in-from-bottom-2 duration-700">
          {children}
        </main>
      </div>
    </div>
  );
}
