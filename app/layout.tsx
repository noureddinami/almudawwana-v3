import type { Metadata, Viewport } from 'next';
import { Amiri, Noto_Naskh_Arabic, Reem_Kufi } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import BottomNav from '@/components/BottomNav';
import InstallPrompt from '@/components/InstallPrompt';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import SplashScreen from '@/components/SplashScreen';
import { OrganizationJsonLd } from '@/components/JsonLd';

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

const BASE_URL = 'https://modawana.app'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'المدوّنة — الموسوعة القانونية المغربية',
    template: '%s | المدوّنة',
  },
  description: 'الموسوعة القانونية المغربية الشاملة — ابحث وتصفّح القوانين والمدونات المغربية مجاناً. أكثر من آلاف المواد القانونية من المصادر الرسمية.',
  keywords: [
    'قانون مغربي', 'تشريع', 'مدونة الأسرة', 'القانون الجنائي', 'المسطرة الجنائية',
    'قانون الالتزامات والعقود', 'مدونة الشغل', 'الدستور المغربي', 'الجريدة الرسمية',
    'loi marocaine', 'code marocain', 'législation Maroc', 'droit marocain',
  ],
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
  openGraph: {
    type: 'website',
    locale: 'ar_MA',
    url: BASE_URL,
    siteName: 'المدوّنة — Al-Mudawwana',
    title: 'المدوّنة — الموسوعة القانونية المغربية',
    description: 'ابحث وتصفّح القوانين والمدونات المغربية مجاناً — أكثر من آلاف المواد القانونية من المصادر الرسمية',
    images: [
      {
        url: '/icon-512x512.png',
        width: 512,
        height: 512,
        alt: 'المدوّنة — الموسوعة القانونية المغربية',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'المدوّنة — الموسوعة القانونية المغربية',
    description: 'ابحث وتصفّح القوانين والمدونات المغربية مجاناً',
    images: ['/icon-512x512.png'],
  },
  alternates: {
    canonical: BASE_URL,
    languages: {
      'ar-MA': BASE_URL,
      'x-default': BASE_URL,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  verification: {
    // Add Google Search Console verification when available
    // google: 'your-verification-code',
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
        <OrganizationJsonLd />
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
