import Link from 'next/link';
import { FileQuestion, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100">
          <FileQuestion className="h-8 w-8 text-amber-600" />
        </div>
        <h1 className="text-6xl font-bold text-slate-900">404</h1>
        <h2 className="mt-2 text-xl font-bold text-slate-700">Page not found</h2>
        <p className="mt-2 text-sm text-slate-500">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition-colors"
          >
            <Home className="h-4 w-4" />
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
