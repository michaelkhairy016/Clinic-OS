import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ClientLayout } from '@/modules/core/ClientLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Dr. Amgad Khairy Kamel Clinics',
  description: 'Psychiatry EMR & Clinic Management System by Dr. Amgad',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Clinic-OS',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1e3a8a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar">
      <head>
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="icon" href="/icon-192x192.png" />
      </head>
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .then(registration => console.log('SW registered: ', registration))
                    .catch(registrationError => console.log('SW registration failed: ', registrationError));
                });
              }
            `
          }}
        />
      </body>
    </html>
  );
}
