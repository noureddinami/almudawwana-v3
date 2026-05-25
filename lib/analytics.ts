/**
 * lib/analytics.ts
 * Client-side fire-and-forget tracking helpers.
 * Uses fetch with keepalive so the request survives page navigation.
 */

function getDeviceId(): string {
  if (typeof window === 'undefined') return '';
  const key = 'pwa_device_id';
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(key, id);
  return id;
}

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  const key = 'analytics_session_id';
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  sessionStorage.setItem(key, id);
  return id;
}

function getPlatform(): string {
  if (typeof window === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/i.test(ua)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  if (/Windows|Macintosh|Linux/i.test(ua)) return 'desktop';
  return 'unknown';
}

function send(url: string, body: Record<string, unknown>): void {
  // keepalive = survives navigation; no await = fire-and-forget
  try {
    fetch(url, {
      method:    'POST',
      headers:   { 'Content-Type': 'application/json' },
      body:      JSON.stringify(body),
      keepalive: true,
    }).catch(() => { /* silent */ });
  } catch { /* silent */ }
}

/** Track a page view. Call once per route change. */
export function logPageView(path: string): void {
  // skip admin / api / auth routes
  if (path.startsWith('/admin') || path.startsWith('/api') || path.startsWith('/auth')) return;
  send('/api/analytics/page-view', {
    path,
    platform:   getPlatform(),
    device_id:  getDeviceId(),
    session_id: getSessionId(),
  });
}

/** Track a search query. */
export function logSearch(
  query: string,
  resultsCount: number,
  options?: { codeSlug?: string; searchType?: string },
): void {
  if (!query.trim()) return;
  send('/api/analytics/search', {
    query:         query.trim(),
    results_count: resultsCount,
    search_type:   options?.searchType ?? 'text',
    code_slug:     options?.codeSlug ?? null,
    device_id:     getDeviceId(),
  });
}

/** Track a PDF / article download. */
export function logDownload(codeSlug: string, articleId?: string, format = 'pdf'): void {
  send('/api/analytics/download', {
    code_slug:  codeSlug,
    article_id: articleId ?? null,
    format,
    device_id:  getDeviceId(),
  });
}
