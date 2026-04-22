// TxFlow Service Worker
const CACHE = 'txflow-v1';
const SHELL = [
  '/transaction-flow-app/',
  '/transaction-flow-app/index.html',
  '/transaction-flow-app/assets/index-fix5.js',
  '/transaction-flow-app/assets/index-DEQDGvGW.css',
  '/transaction-flow-app/manifest.json',
  '/transaction-flow-app/icons/icon-192x192.png',
  '/transaction-flow-app/icons/icon-512x512.png',
];

// Install: cache the app shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

// Activate: clear old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first for API/Supabase calls, cache-first for shell assets
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Always go network-first for Supabase and CDN requests
  if (url.hostname.includes('supabase.co') || url.hostname.includes('jsdelivr.net') || url.hostname.includes('fontshare.com')) {
    e.respondWith(fetch(e.request).catch(() => new Response('', { status: 503 })));
    return;
  }

  // Cache-first for app shell assets
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});
