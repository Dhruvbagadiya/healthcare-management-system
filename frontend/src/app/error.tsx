'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100">
          <AlertTriangle className="h-8 w-8 text-rose-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Something went wrong</h1>
        <p className="mt-2 text-sm text-slate-500">
          An unexpected error occurred. Please try again or return to the dashboard.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-slate-400">Error ID: {error.digest}</p>
        )}
        <div className="mt-8 flex justify-center gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
