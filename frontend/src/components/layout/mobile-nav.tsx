'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSubscription } from '@/hooks/use-subscription';
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
  IndianRupee,
  Shield,
  Bell,
  Settings,
  HelpCircle,
  Pill,
  Scissors,
  FolderTree,
  Droplets,
  Siren,
  ShieldCheck,
  Truck,
  FileOutput,
  Crown,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, feature: 'dashboard' },
  { href: '/patients', label: 'Patients', icon: Users, feature: 'patients' },
  { href: '/appointments', label: 'Appointments', icon: Calendar, feature: 'appointments' },
  { href: '/opd-queue', label: 'OPD Queue', icon: Clock, feature: 'opd-queue' },
  { href: '/doctors', label: 'Doctors', icon: UserSquare2, feature: 'doctors' },
  { href: '/staff', label: 'Staff', icon: Stethoscope, feature: 'staff' },
  { href: '/departments', label: 'Departments', icon: FolderTree, feature: 'departments' },
  { href: '/prescriptions', label: 'Prescriptions', icon: ClipboardList, feature: 'prescriptions' },
  { href: '/pharmacy', label: 'Pharmacy', icon: Pill, feature: 'pharmacy' },
  { href: '/laboratory', label: 'Laboratory', icon: FlaskConical, feature: 'laboratory' },
  { href: '/radiology', label: 'Radiology', icon: Microscope, feature: 'radiology' },
  { href: '/admissions', label: 'Admissions', icon: UserPlus, feature: 'admissions' },
  { href: '/wards', label: 'Wards', icon: Building2, feature: 'wards' },
  { href: '/operation-theater', label: 'Operation Theater', icon: Scissors, feature: 'operation-theater' },
  { href: '/emergency', label: 'Emergency', icon: Siren, feature: 'emergency' },
  { href: '/blood-bank', label: 'Blood Bank', icon: Droplets, feature: 'blood-bank' },
  { href: '/insurance', label: 'Insurance & TPA', icon: ShieldCheck, feature: 'insurance' },
  { href: '/ambulance', label: 'Ambulance', icon: Truck, feature: 'ambulance' },
  { href: '/discharge-summary', label: 'Discharge Summary', icon: FileOutput, feature: 'discharge-summary' },
  { href: '/billing', label: 'Billing', icon: Wallet, feature: 'billing' },
  { href: '/inventory', label: 'Inventory', icon: Package, feature: 'inventory' },
  { href: '/accounts', label: 'Accounts', icon: IndianRupee, feature: 'accounts' },
  { href: '/compliance', label: 'Compliance', icon: Shield, feature: 'compliance' },
  { href: '/notifications', label: 'Notifications', icon: Bell, feature: 'notifications' },
  { href: '/settings', label: 'Settings', icon: Settings, feature: 'settings' },
  { href: '/help', label: 'Help & Support', icon: HelpCircle, feature: 'help' },
];

const ADMIN_ITEMS = [
  { href: '/admin', label: 'Admin Panel', icon: Crown },
];

export function MobileNav() {
  const pathname = usePathname();
  const { hasFeature } = useSubscription();
  const user = useAuthStore((s) => s.user);

  const filteredItems = NAV_ITEMS.filter((item) => hasFeature(item.feature));
  const isAdmin = user?.roles?.some((r) => ['admin', 'super_admin', 'owner'].includes(r.toLowerCase()));

  return (
    <nav className="space-y-1.5">
      {filteredItems.map((item) => {
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
              <Icon
                className={`h-5 w-5 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'
                  }`}
              />
              <span>{item.label}</span>
            </div>
            {isActive && <ChevronRight className="h-4 w-4 text-white/70" />}
          </Link>
        );
      })}

      {/* Admin Section - only visible to admins */}
      {isAdmin && (
        <>
          <div className="pt-4 pb-1 px-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Administration</p>
          </div>
          {ADMIN_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 translate-x-1'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-5 w-5 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'
                      }`}
                  />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="h-4 w-4 text-white/70" />}
              </Link>
            );
          })}
        </>
      )}
    </nav>
  );
}
