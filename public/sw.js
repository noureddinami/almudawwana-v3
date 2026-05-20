/**
 * Al-Mudawwana Service Worker
 * - Cache First for static assets
 * - Network First for HTML pages
 * - Offline redirect: /codes/* → /offline (downloaded codes in IndexedDB)
 */

const CACHE_NAME = 'mudawwana-v4';
const STATIC_ASSETS = [
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/apple-touch-icon.png',
  '/favicon.svg',
  '/manifest.json',
];

// Pre-cache the offline page so it's always available
const OFFLINE_PRECACHE = ['/offline'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll([...STATIC_ASSETS, ...OFFLINE_PRECACHE])
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

/* ── Push Notifications ────────────────────────────────────────── */
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data = {};
  try { data = event.data.json(); } catch { data = { title: 'المدوّنة', body: event.data.text() }; }

  const title   = data.title   ?? 'المدوّنة';
  const options = {
    body:    data.body   ?? '',
    icon:    data.icon   ?? '/icon-192x192.png',
    badge:   data.badge  ?? '/icon-192x192.png',
    dir:     'rtl',
    lang:    'ar',
    tag:     'mudawwana-update',
    renotify: true,
    data:    { url: data.url ?? '/' },
    actions: [
      { action: 'open', title: 'فتح' },
      { action: 'close', title: 'إغلاق' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'close') return;

  const url = event.notification.data?.url ?? '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

/* ── Fetch Handler ─────────────────────────────────────────────── */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  // API/Supabase — network only (IndexedDB handles caching)
  if (url.hostname.includes('supabase') || url.pathname.startsWith('/api/')) {
    return;
  }

  // Static assets — Cache First
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|gif|ico|woff2?|ttf|css|js)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // HTML navigations — Network First with smart offline fallback
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // Offline — try cached version first
          return caches.match(request).then((cached) => {
            if (cached) return cached;

            // For /codes/X/articles/Y → redirect to offline reader
            const articleMatch = url.pathname.match(/^\/codes\/([^/]+)\/articles\/([^/]+)/);
            if (articleMatch) {
              return Response.redirect(
                url.origin + '/offline?code=' + articleMatch[1] + '&article=' + articleMatch[2],
                302
              );
            }

            // For /codes/X → redirect to offline reader for that code
            const codeMatch = url.pathname.match(/^\/codes\/([^/]+)$/);
            if (codeMatch) {
              return Response.redirect(
                url.origin + '/offline?code=' + codeMatch[1],
                302
              );
            }

            // For other pages → try serving cached /offline page
            return caches.match('/offline').then((offlinePage) => {
              return offlinePage || new Response(
                '<html dir="rtl"><body style="font-family:sans-serif;text-align:center;padding:4rem 1rem">' +
                '<h1 style="font-size:2rem">📱</h1>' +
                '<h2>غير متصل بالإنترنت</h2>' +
                '<p>المحتوى المحمّل متاح في صفحة القراءة بدون إنترنت</p>' +
                '<a href="/offline" style="color:#2563eb;text-decoration:underline;margin-top:1rem;display:inline-block">الذهاب إلى المحمّلة</a>' +
                '</body></html>',
                { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
              );
            });
          });
        })
    );
    return;
  }
});
