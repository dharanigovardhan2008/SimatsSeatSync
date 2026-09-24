const CACHE_NAME = 'seatsync-v1';
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/favicon-48.png',
  '/icon-192.png',
  '/icon-512.png',
  '/maskable-512.png',
  '/seatsync.png',
  '/manifest.webmanifest'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // DO NOT cache Firebase authentication, Firestore, or any private API data.
  // Explicitly bypass caching for Google APIs, Firebase, and payment endpoints.
  if (
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('gstatic.com') ||
    url.pathname.startsWith('/payments') ||
    url.pathname.includes('payment') ||
    url.pathname.startsWith('/api/') ||
    e.request.method !== 'GET'
  ) {
    return;
  }

  // Cache-first for static shell assets
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
