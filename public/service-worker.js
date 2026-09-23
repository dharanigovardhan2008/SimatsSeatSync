// Service Worker for SeatSync PWA
const CACHE_NAME = 'seatsync-v1';
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/seatsync.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  // Don't cache sensitive/payment endpoints
  const url = new URL(e.request.url);
  if (url.pathname.startsWith('/payments') || url.pathname.includes('payment')) {
    return;
  }
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).catch(() => {
        if (e.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});
