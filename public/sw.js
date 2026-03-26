// Clinic-OS Service Worker v4
// NEVER caches auth routes - network-first for all HTML
const CACHE_NAME = 'clinic-os-v4-20260326-auth-fix';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const STATIC_ASSETS = [
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Routes that must NEVER be cached (always live from server)
const NEVER_CACHE_ROUTES = [
  '/api/',
  '/auth',
  '/login',
  '/dashboard',
  '/queue',
  '/clinical',
  '/analytics',
  '/marketing',
  '/approvals',
  '/settings'
];

// TTL-aware cache helpers
const cacheWithTTL = {
  async get(cache, request) {
    const cached = await cache.match(request);
    if (!cached) return null;

    const cachedTime = cached.headers.get('x-cached-time');
    if (cachedTime) {
      const age = Date.now() - parseInt(cachedTime, 10);
      if (age > CACHE_TTL) {
        await cache.delete(request);
        return null;
      }
    }
    return cached;
  },

  async set(cache, request, response) {
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

// Check if URL should never be cached
const shouldNeverCache = (pathname) => {
  return NEVER_CACHE_ROUTES.some(route => pathname.startsWith(route)) ||
         pathname.includes('supabase') ||
         pathname.includes('auth');
};

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Listen for messages from the app (e.g., logout -> clear all caches)
self.addEventListener('message', event => {
  if (event.data === 'CLEAR_ALL_CACHES') {
    console.log('SW: Clearing all caches on auth change');
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name));
    });
  }
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // CRITICAL: Auth and API routes - ALWAYS network only, never cache
  if (shouldNeverCache(url.pathname) ||
      url.host.includes('supabase') ||
      request.headers.get('Authorization')) {
    event.respondWith(
      fetch(request).catch(() => new Response('Network error', { status: 503 }))
    );
    return;
  }

  // For HTML pages - ALWAYS network first (no caching for pages)
  if (request.headers.get('Accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(response => response)
        .catch(() => caches.match('/'))
    );
    return;
  }

  // For static assets only - cache first with TTL
  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cached = await cacheWithTTL.get(cache, request);

      if (cached) {
        fetch(request).then(response => {
          if (response.status === 200) {
            cacheWithTTL.set(cache, request, response);
          }
        }).catch(() => {});
        return cached;
      }

      return fetch(request).then(response => {
        if (response.status === 200) {
          cacheWithTTL.set(cache, request, response);
        }
        return response;
      });
    })
  );
});
