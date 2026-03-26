// Clinic-OS Service Worker for PWA Support
// Version 3 with TTL support
const CACHE_NAME = 'clinic-os-v3-20260326';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const STATIC_ASSETS = [
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// TTL-aware cache helpers
const cacheWithTTL = {
  async get(cache, request) {
    const cached = await cache.match(request);
    if (!cached) return null;

    // Check TTL
    const cachedTime = cached.headers.get('x-cached-time');
    if (cachedTime) {
      const age = Date.now() - parseInt(cachedTime, 10);
      if (age > CACHE_TTL) {
        // Stale, delete and return null
        await cache.delete(request);
        return null;
      }
    }

    return cached;
  },

  async set(cache, request, response) {
    // Clone response and add timestamp header
    const headers = new Headers(response.headers);
    headers.set('x-cached-time', Date.now().toString());

    const cachedResponse = new Response(await response.clone().blob(), {
      status: response.status,
      statusText: response.statusText,
      headers
    });

    await cache.put(request, cachedResponse);
  }
};

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Delete old caches
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control immediately
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip auth-related requests and API calls - always go to network
  if (url.pathname.startsWith('/api/') ||
      url.pathname.includes('supabase') ||
      url.pathname.includes('auth') ||
      url.host.includes('supabase') ||
      request.headers.get('Authorization')) {
    event.respondWith(fetch(request));
    return;
  }

  // For HTML pages - network first, fallback to cache
  if (request.headers.get('Accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful responses
          if (response.status === 200) {
            caches.open(CACHE_NAME).then(cache => {
              cacheWithTTL.set(cache, request, response);
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed, try cache with TTL
          return caches.open(CACHE_NAME).then(cache =>
            cacheWithTTL.get(cache, request).then(cached =>
              cached || caches.match('/')
            )
          );
        })
    );
    return;
  }

  // For static assets - cache first with TTL, fallback to network
  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cached = await cacheWithTTL.get(cache, request);

      if (cached) {
        // Return cache but update in background
        fetch(request).then(response => {
          if (response.status === 200) {
            cacheWithTTL.set(cache, request, response);
          }
        }).catch(() => {});
        return cached;
      }

      // Not in cache or stale, fetch from network
      return fetch(request).then(response => {
        if (response.status === 200) {
          cacheWithTTL.set(cache, request, response);
        }
        return response;
      });
    })
  );
});
