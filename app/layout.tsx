import type { Metadata, Viewport } from 'next';
import { Amiri, Noto_Naskh_Arabic, Reem_Kufi } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import BottomNav from '@/components/BottomNav';
import InstallPrompt from '@/components/InstallPrompt';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import SplashScreen from '@/components/SplashScreen';

/* ── Amiri : corps des articles juridiques ─────────────────── */
const amiri = Amiri({
  subsets: ['arabic'],
  variable: '--font-amiri',
  weight: ['400', '700'],
  display: 'swap',
});

/* ── Noto Naskh Arabic : interface et navigation ───────────── */
const notoNaskh = Noto_Naskh_Arabic({
  subsets: ['arabic'],
  variable: '--font-naskh',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

/* ── Reem Kufi : logo et titres de section ─────────────────── */
const reemKufi = Reem_Kufi({
  subsets: ['arabic'],
  variable: '--font-kufi',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',  // Extends into notch/safe areas
};

export const metadata: Metadata = {
  title: 'المدوّنة — موسوعتك القانونية',
  description: 'الموسوعة القانونية المغربية الشاملة — القوانين والمدونات في متناول الجميع',
  keywords: ['قانون مغربي', 'تشريع', 'مجلة العقوبات', 'المسطرة الجنائية'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'المدوّنة',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${amiri.variable} ${notoNaskh.variable} ${reemKufi.variable} h-full`}
    >
      <head>
        <meta name="theme-color" content="#2152cc" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="المدوّنة" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192x192.png" />
      </head>
      <body className="min-h-full bg-slate-50 text-slate-900 font-naskh antialiased">
        <SplashScreen />
        {children}
        <BottomNav />
        <InstallPrompt />
        <ServiceWorkerRegister />
        <Toaster
          position="top-center"
          toastOptions={{
            style: { fontFamily: 'var(--font-naskh)', direction: 'rtl' },
            duration: 3500,
          }}
        />
      </body>
    </html>
  );
}
