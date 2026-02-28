'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronRight,
  LayoutDashboard,
  Users,
  Calendar,
  UserSquare2,
  ClipboardList,
  Wallet,
  FlaskConical,
  Stethoscope,
  Clock,
  UserPlus,
  Package,
  Building2,
  Microscope,
  DollarSign,
  Shield,
  Bell,
  Settings,
  HelpCircle,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/patients', label: 'Patients', icon: Users },
  { href: '/appointments', label: 'Appointments', icon: Calendar },
  { href: '/doctors', label: 'Doctors', icon: UserSquare2 },
  { href: '/prescriptions', label: 'Prescriptions', icon: ClipboardList },
  { href: '/billing', label: 'Billing', icon: Wallet },
  { href: '/laboratory', label: 'Laboratory', icon: FlaskConical },
  { href: '/staff', label: 'Staff', icon: Stethoscope },
  { href: '/opd-queue', label: 'OPD Queue', icon: Clock },
  { href: '/admissions', label: 'Admissions', icon: UserPlus },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/wards', label: 'Wards', icon: Building2 },
  { href: '/operation-theater', label: 'Operation Theater', icon: Microscope },
  { href: '/accounts', label: 'Accounts', icon: DollarSign },
  { href: '/compliance', label: 'Compliance', icon: Shield },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/help', label: 'Help & Support', icon: HelpCircle },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1.5">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
              isActive
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200 translate-x-1'
                : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon
                className={`h-5 w-5 transition-colors ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'
                }`}
              />
              <span>{item.label}</span>
            </div>
            {isActive && <ChevronRight className="h-4 w-4 text-white/70" />}
          </Link>
        );
      })}
    </nav>
  );
}
