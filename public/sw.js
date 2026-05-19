/* eslint-disable no-restricted-globals */
/*
 * Service Worker for econom-trainer
 * Uses runtime caching (no precaching) to avoid stale build hash issues.
 * Resources are cached on first visit, ensuring only actually-loaded assets
 * are stored and no 404s from outdated chunk references.
 */

const CACHE_NAME = 'econom-trainer-v1';
const RUNTIME_CACHE = 'econom-trainer-runtime-v1';

// Static assets that should always be cached on install
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/logo.svg',
];

// Install: cache core static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter(
            (name) =>
              name !== CACHE_NAME &&
              name !== RUNTIME_CACHE &&
              (name.startsWith('econom-trainer') ||
                name.startsWith('workbox') ||
                name.includes('precache'))
          )
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
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
