'use client';

import { useEffect, useState } from 'react';

/**
 * Mobile splash/loading screen shown on first visit or PWA launch.
 * Shows the brand logo + tagline then fades out.
 * Only displays on standalone PWA or first-time mobile visitors.
 */
export default function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Show splash only for standalone PWA or first mobile visit
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    const isMobile = window.innerWidth < 768;
    const splashShown = sessionStorage.getItem('mudawwana_splash_shown');

    if ((isStandalone || isMobile) && !splashShown) {
      setVisible(true);
      sessionStorage.setItem('mudawwana_splash_shown', '1');

      // Start fade-out after 2s
      const fadeTimer = setTimeout(() => setFadeOut(true), 2000);
      // Remove from DOM after fade animation
      const removeTimer = setTimeout(() => setVisible(false), 2600);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(removeTimer);
      };
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center
        bg-gradient-to-b from-[#2152cc] to-[#0d1b4b] transition-opacity duration-500
        ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      dir="rtl"
    >
      {/* Logo */}
      <div className="animate-[splash-logo_0.8s_ease-out_both] mb-6">
        <svg className="w-28 h-28 drop-shadow-2xl" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M28 68 L28 132 L70 162 L70 38 Z" fill="#4a7fd4"/>
          <path d="M172 68 L172 132 L130 162 L130 38 Z" fill="#4a7fd4"/>
          <path d="M70 36 L100 20 L130 36 L130 164 L100 180 L70 164 Z" fill="#6ba3e8"/>
          <rect x="98" y="72" width="4" height="80" rx="2" fill="white"/>
          <path d="M96.5 72 Q100 63 103.5 72" fill="white"/>
          <path d="M50 94 Q100 87 150 94" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
          <circle cx="54" cy="94" r="3.5" fill="white"/>
          <circle cx="146" cy="94" r="3.5" fill="white"/>
          <line x1="54" y1="97" x2="48" y2="116" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
          <line x1="66" y1="97" x2="72" y2="116" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
          <path d="M46 116 Q59 112 74 116" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          <line x1="146" y1="97" x2="140" y2="116" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
          <line x1="134" y1="97" x2="128" y2="116" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
          <path d="M126 116 Q139 112 154 116" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          <ellipse cx="100" cy="152" rx="13" ry="4.5" fill="white" opacity="0.9"/>
        </svg>
      </div>

      {/* Brand name */}
      <h1
        className="font-kufi text-4xl font-bold text-white mb-3
          animate-[splash-text_0.6s_ease-out_0.3s_both]"
      >
        المدوّنة
      </h1>

      {/* Tagline */}
      <p
        className="text-blue-200 text-base font-naskh text-center max-w-xs leading-relaxed
          animate-[splash-text_0.6s_ease-out_0.5s_both]"
      >
        موسوعتك القانونية المغربية — مجانية وشاملة
      </p>

      {/* Subtitle */}
      <p
        className="text-blue-300/70 text-sm font-naskh mt-2
          animate-[splash-text_0.6s_ease-out_0.7s_both]"
      >
        الوصول السهل إلى القانون المغربي
      </p>

      {/* Loading indicator */}
      <div className="mt-10 animate-[splash-text_0.6s_ease-out_0.9s_both]">
        <div className="w-8 h-8 border-2 border-blue-400/30 border-t-white rounded-full animate-spin" />
      </div>
    </div>
  );
}
