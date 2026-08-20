'use client';
import { useEffect } from 'react';

const TRACKED_KEY = 'pwa_install_tracked';
const GA_CONVERSION_ID = 'AW-18401439468';

function getDeviceId(): string {
  const existing = localStorage.getItem('pwa_device_id');
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem('pwa_device_id', id);
  return id;
}

function getPlatform(): 'ios' | 'android' | 'desktop' | 'unknown' {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/i.test(ua)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  if (/Windows|Macintosh|Linux/i.test(ua)) return 'desktop';
  return 'unknown';
}

// ── Google Ads conversion ──────────────────────────────────────
function fireGoogleAdsConversion() {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'conversion', {
        send_to: GA_CONVERSION_ID,
        value: 1.0,
        currency: 'MAD',
        event_category: 'PWA',
        event_label: 'install',
      });
      console.log('[PwaInstallTracker] Google Ads conversion fired ✅');
    }
  } catch (e) {
    console.warn('[PwaInstallTracker] Google Ads conversion failed:', e);
  }
}

async function recordInstall(source: 'appinstalled' | 'standalone_launch') {
  try {
    const device_id = getDeviceId();
    const platform  = getPlatform();
    const res = await fetch('/api/pwa-install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id, platform, source }),
    });
    if (res.ok) {
      localStorage.setItem(TRACKED_KEY, '1');
      sessionStorage.removeItem('pwa_just_installed');
      // ── Déclencher la conversion Google Ads ──────────────────
      fireGoogleAdsConversion();
    } else {
      const body = await res.json().catch(() => ({}));
      console.warn('[PwaInstallTracker] API error:', body);
    }
  } catch (e) {
    console.warn('[PwaInstallTracker] fetch failed:', e);
  }
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
  );
}

export default function PwaInstallTracker() {
  useEffect(() => {
    const alreadyTracked = localStorage.getItem(TRACKED_KEY);
    if (alreadyTracked) return;

    // Signal 1: appinstalled fired before React mounted (caught by inline script)
    if (sessionStorage.getItem('pwa_just_installed')) {
      recordInstall('appinstalled');
      return;
    }

    // Signal 2: appinstalled fires after React mounts
    const onInstalled = () => recordInstall('appinstalled');
    window.addEventListener('appinstalled', onInstalled);

    // Signal 3: first launch in standalone mode (iOS + Android after install)
    if (isStandalone()) {
      recordInstall('standalone_launch');
    }

    return () => window.removeEventListener('appinstalled', onInstalled);
  }, []);

  return null;
}
