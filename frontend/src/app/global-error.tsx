'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f8fafc', padding: '1rem' }}>
          <div style={{ textAlign: 'center', maxWidth: '28rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a' }}>Critical Error</h1>
            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#64748b' }}>
              A critical error occurred. Please reload the page.
            </p>
            {error.digest && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>Error ID: {error.digest}</p>
            )}
            <button
              onClick={reset}
              style={{ marginTop: '1.5rem', padding: '0.625rem 1.25rem', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Reload Page
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
