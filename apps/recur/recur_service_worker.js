const cacheName = 'recur-runtime-v1';
const shellResources = [
  './',
  './index.html',
  './manifest.json',
  './flutter_bootstrap.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(cacheName)
      .then((cache) => cache.addAll(shellResources))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('recur-') && key !== cacheName)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (
    request.method !== 'GET' ||
    !request.url.startsWith('http') ||
    (request.cache === 'only-if-cached' && request.mode !== 'same-origin')
  ) {
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(cacheName);
      try {
        const response = await fetch(request);
        if (response.ok || response.type === 'opaque') {
          try {
            await cache.put(request, response.clone());
          } catch (error) {
            console.warn('Recur could not cache a resource:', error);
          }
        }
        return response;
      } catch (error) {
        const cached = await cache.match(request);
        if (cached) {
          return cached;
        }
        if (request.mode === 'navigate') {
          const shell = await cache.match('./');
          if (shell) {
            return shell;
          }
        }
        throw error;
      }
    })(),
  );
});
