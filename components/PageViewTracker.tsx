'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { logPageView } from '@/lib/analytics';

export default function PageViewTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string>('');

  useEffect(() => {
    if (!pathname || pathname === lastPath.current) return;
    lastPath.current = pathname;
    // small delay so the page has settled
    const t = setTimeout(() => logPageView(pathname), 300);
    return () => clearTimeout(t);
  }, [pathname]);

  return null;
}
