'use client';
import { useRequireAuth } from '@/hooks/auth';
import { MobileMenuOverlay } from '@/components/layout/mobile-menu-overlay';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useRequireAuth();
  const router = useRouter();
  useMobileNavigation();
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Check onboarding progress — redirect PENDING/incomplete orgs
    apiClient.get('/onboarding/progress')
      .then(res => {
        if (!res.data.isCompleted) {
          router.replace('/onboarding');
        } else {
          setOnboardingChecked(true);
        }
      })
      .catch(() => {
        // If endpoint fails (e.g. existing active org with no progress row), show portal
        setOnboardingChecked(true);
      });
  }, [user, router]);

  if (isLoading || (user && !onboardingChecked)) {
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
    <div className="flex min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-white">
      <MobileMenuOverlay />

      <Sidebar user={user} />

      <div className="flex flex-1 flex-col lg:pl-72 focus:outline-none">
        {/* Desktop top bar with NotificationBell */}
        <div className="hidden lg:flex sticky top-0 z-20 h-14 items-center justify-end border-b border-slate-100 bg-white/70 backdrop-blur-md px-8 gap-3">
          <NotificationBell />
        </div>

        {/* Mobile header */}
        <Header />

        <main className="flex-1 px-4 py-8 md:px-8 md:py-10 lg:px-12 lg:py-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-out">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

