'use client';

import { useState, useEffect, useCallback } from 'react';
import { Download, X, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'mudawwana_install_dismissed';
const DISMISS_DAYS = 7; // Re-show after 7 days

function wasDismissedRecently(): boolean {
  if (typeof window === 'undefined') return true;
  const dismissed = localStorage.getItem(DISMISS_KEY);
  if (!dismissed) return false;
  const diff = Date.now() - Number(dismissed);
  return diff < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
  );
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Already installed or dismissed recently
    if (isStandalone() || wasDismissedRecently()) return;

    // iOS Safari — no beforeinstallprompt
    if (isIOS()) {
      const timer = setTimeout(() => {
        setShowIOSGuide(true);
        setVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    // Android / Chrome / Edge
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setVisible(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  }, []);

  if (!visible) return null;

  // iOS guide
  if (showIOSGuide) {
    return (
      <div className="fixed bottom-[calc(60px+env(safe-area-inset-bottom))] inset-x-0 z-50 px-3 sm:hidden animate-slide-up">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 relative">
          <button
            onClick={handleDismiss}
            className="absolute top-3 left-3 w-7 h-7 flex items-center justify-center
                       rounded-full bg-slate-100 text-slate-400 hover:text-slate-600"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-3">
            <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <img src="/icon-192x192.png" alt="" className="w-8 h-8 rounded-lg" />
            </div>
            <div className="flex-1 min-w-0 pr-6">
              <h3 className="font-kufi font-bold text-slate-900 text-sm">
                ثبّت تطبيق المدوّنة
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                اضغط على
                <span className="inline-flex items-center gap-0.5 mx-1 text-blue-600 font-medium">
                  <Share className="w-3.5 h-3.5" /> مشاركة
                </span>
                ثم اختر
                <span className="font-medium text-slate-700 mx-1">
                  &laquo;إضافة إلى الشاشة الرئيسية&raquo;
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Android / Chrome prompt
  return (
    <div className="fixed bottom-[calc(60px+env(safe-area-inset-bottom))] inset-x-0 z-50 px-3 sm:hidden animate-slide-up">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 relative">
        <button
          onClick={handleDismiss}
          className="absolute top-3 left-3 w-7 h-7 flex items-center justify-center
                     rounded-full bg-slate-100 text-slate-400 hover:text-slate-600"
          aria-label="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <img src="/icon-192x192.png" alt="" className="w-8 h-8 rounded-lg" />
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <h3 className="font-kufi font-bold text-slate-900 text-sm">
              ثبّت تطبيق المدوّنة
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              الوصول السريع بدون متصفح
            </p>
          </div>
          <button
            onClick={handleInstall}
            className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium
                       px-4 py-2 rounded-xl flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" />
            تثبيت
          </button>
        </div>
      </div>
    </div>
  );
}
