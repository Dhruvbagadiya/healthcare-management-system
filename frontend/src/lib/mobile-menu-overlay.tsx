'use client';

import { useUIStore } from '@/lib/store';

export function MobileMenuOverlay() {
  const { isMobileMenuOpen, closeMobileMenu } = useUIStore();

  if (!isMobileMenuOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 transition-opacity lg:hidden"
      onClick={closeMobileMenu}
      aria-hidden="true"
    />
  );
}