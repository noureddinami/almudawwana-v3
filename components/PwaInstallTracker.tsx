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
    await fetch('/api/pwa-install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id, platform, source }),
    });
    localStorage.setItem(TRACKED_KEY, '1');
  } catch { /* silently ignore */ }
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

    // Signal 1: appinstalled event (Android/Chrome, fires at install moment)
    const onInstalled = () => recordInstall('appinstalled');
    window.addEventListener('appinstalled', onInstalled);

    // Signal 2: first launch in standalone mode (catches iOS + missed Android)
    if (!alreadyTracked && isStandalone()) {
      recordInstall('standalone_launch');
    }

    return () => window.removeEventListener('appinstalled', onInstalled);
  }, []);

  return null;
}
