import type { Metadata, Viewport } from 'next';
import { Amiri, Noto_Naskh_Arabic, Reem_Kufi } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import BottomNav from '@/components/BottomNav';
import InstallPrompt from '@/components/InstallPrompt';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import SplashScreen from '@/components/SplashScreen';
import { OrganizationJsonLd } from '@/components/JsonLd';
import PushNotificationSetup from '@/components/PushNotificationSetup';
import PwaInstallTracker from '@/components/PwaInstallTracker';
import PageViewTracker from '@/components/PageViewTracker';

const GA_ID = 'G-FVBMSK5TD2';

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
  maximumScale: 5,
  viewportFit: 'cover',
};

const BASE_URL = 'https://modawana.app'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'المدوّنة — الموسوعة القانونية المغربية',
    template: '%s | المدوّنة',
  },
  description: 'الموسوعة القانونية المغربية — المسطرة الجنائية، القانون الجنائي، مدونة الأسرة، مدونة الشغل والنصوص التشريعية والتنظيمية. أكثر من 3,390 مادة قانونية مجاناً من الجريدة الرسمية.',
  keywords: [
    'قانون مغربي', 'نصوص تشريعية', 'نصوص تنظيمية', 'مدونة الأسرة', 'القانون الجنائي',
    'المسطرة الجنائية', 'مدونة الشغل', 'قانون الالتزامات والعقود', 'الدستور المغربي',
    'المادة الجنائية', 'المادة المدنية', 'المادة الأسرية', 'المادة التجارية', 'المادة العقارية',
    'ظهير شريف', 'مرسوم', 'الجريدة الرسمية', 'السلطة القضائية', 'التنظيم القضائي',
    'loi marocaine', 'code marocain', 'législation Maroc', 'droit marocain', 'code de procédure pénale',
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
    description: 'المسطرة الجنائية، القانون الجنائي، مدونة الأسرة، مدونة الشغل — 3,390 مادة قانونية من الجريدة الرسمية المغربية، مجاناً.',
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'المدوّنة — الموسوعة القانونية المغربية',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'المدوّنة — الموسوعة القانونية المغربية',
    description: 'المسطرة الجنائية، القانون الجنائي، مدونة الأسرة، مدونة الشغل — 3,390 مادة قانونية مجاناً.',
    images: [`${BASE_URL}/og-image.png`],
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
    google: 'yHaXEZ8qCMNa6vILRr3kfRA_08R3fwG_tuJ_yRIUskM',
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
        {/* Google Analytics 4 */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}', {
              page_path: window.location.pathname,
              anonymize_ip: true,
            });
          `}
        </Script>
        <Script id="sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js', { scope: '/' });
              });
            }
            // Capture appinstalled before React mounts
            window.addEventListener('appinstalled', function() {
              sessionStorage.setItem('pwa_just_installed', '1');
            });
          `}
        </Script>
      </head>
      <body className="min-h-full bg-slate-50 text-slate-900 font-naskh antialiased">
        <OrganizationJsonLd />
        <SplashScreen />
        {children}
        <BottomNav />
        <InstallPrompt />
        <ServiceWorkerRegister />
        <PushNotificationSetup />
        <PwaInstallTracker />
        <PageViewTracker />
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
