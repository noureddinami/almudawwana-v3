'use client';

import { useEffect } from 'react';

const TRACKED_KEY = 'pwa_install_tracked';

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

    // Signal 3: first launch in standalone mode (catches iOS + Android after install)
    if (isStandalone()) {
      recordInstall('standalone_launch');
    }

    return () => window.removeEventListener('appinstalled', onInstalled);
  }, []);

  return null;
}
