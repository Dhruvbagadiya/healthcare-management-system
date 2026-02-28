'use client';
import Link from 'next/link';
import { useRequireAuth } from '@/hooks/auth';
import { useUIStore } from '@/lib/store';
import { MobileMenuOverlay } from '@/lib/mobile-menu-overlay';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { Header } from '@/components/layout/header';
import { MobileNav } from '@/components/layout/mobile-nav';
import { Sidebar } from '@/components/layout/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useRequireAuth();
  const { isMobileMenuOpen } = useUIStore();
  useMobileNavigation();

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

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <MobileMenuOverlay />

      <Sidebar user={user} />

      <div className="flex flex-1 flex-col lg:pl-72 focus:outline-none">
        <Header />
        <main className="flex-1 p-4 md:p-6 lg:p-10 animate-in fade-in slide-in-from-bottom-3 duration-700">
          {children}
        </main>
      </div>
    </div>
  );
}
