import type { Metadata, Viewport } from 'next';
import { Toaster } from 'react-hot-toast';
import '@/styles/globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'Aarogentix Management System',
  description: 'Professional Hospital & Clinic Management System',
  authors: [{ name: 'Aarogentix Team' }],
  keywords: ['healthcare', 'hospital', 'clinic', 'management'],
  icons: {
    icon: '/favicon.svg',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
