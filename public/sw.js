/* eslint-disable no-restricted-globals */
/*
 * Service Worker for econom-trainer v7.2.0
 * Uses runtime caching with version tracking and update notifications.
 * Notifies clients when a new service worker is installed.
 */

const CACHE_VERSION = 'v7.2.0';
const CACHE_NAME = `econom-trainer-${CACHE_VERSION}`;
const RUNTIME_CACHE = `econom-trainer-runtime-${CACHE_VERSION}`;

// Static assets that should always be cached on install
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/logo.svg',
  '/icons/icon-192x192.png',
  '/manifest.webmanifest',
];

// Install: cache core static assets and notify clients
self.addEventListener('install', (event) => {
  console.log(`[SW] Installing version ${CACHE_VERSION}`);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
  // Notify clients about update
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => client.postMessage({ type: 'SW_UPDATE_AVAILABLE' }));
  });
});

// Activate: clean old caches and notify clients
self.addEventListener('activate', (event) => {
  console.log(`[SW] Activating version ${CACHE_VERSION}`);
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter(
            (name) =>
              !name.includes(CACHE_VERSION) &&
              (name.startsWith('econom-trainer') ||
                name.startsWith('workbox') ||
                name.includes('precache'))
          )
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: runtime caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and non-http(s) requests
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) return;

  // Skip auth routes — never cache
  if (url.pathname.startsWith('/api/auth/')) return;

  // Navigation requests: NetworkFirst with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match('/offline'))
    );
    return;
  }

  // API routes: NetworkFirst with short timeout
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Static JS/CSS chunks: StaleWhileRevalidate
  if (
    url.pathname.includes('/_next/static/chunks/') ||
    url.pathname.match(/\.(js|css)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, response.clone()));
          }
          return response;
        }).catch(() => caches.match('/offline'));
      })
    );
    return;
  }

  // Fonts: CacheFirst, long TTL
  if (
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.pathname.match(/\.(woff2?|ttf|otf|eot)$/)
  ) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then((cache) =>
        cache.match(request).then((cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
        )
      )
    );
    return;
  }

  // Images: CacheFirst
  if (request.destination === 'image' || url.pathname.match(/\.(svg|png|jpe?g|gif|webp|ico)$/)) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then((cache) =>
        cache.match(request).then((cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
        )
      )
    );
    return;
  }

  // Everything else: NetworkFirst with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, response.clone()));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
