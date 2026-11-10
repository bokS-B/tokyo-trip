const home = self.registration.scope;
const index = new URL('index.html', home).href;
const frame = new URL('frame.html', home).href;
const cacheName = `tokyo-trip-shell:${home}`;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll([home, frame])));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.mode !== 'navigate' || request.method !== 'GET') return;

  const url = new URL(request.url);
  url.search = '';
  const cacheKey = url.href === index ? home : url.href;
  if (cacheKey !== home && cacheKey !== frame) return;

  event.respondWith(loadPage(request, cacheKey));
});

async function loadPage(request, cacheKey) {
  const cache = await caches.open(cacheName).catch(() => null);
  try {
    const response = await fetch(request);
    if (cache && response.ok && !response.redirected) {
      await cache.put(cacheKey, response.clone()).catch(() => {});
    }
    return response;
  } catch (error) {
    const saved = cache && await cache.match(cacheKey);
    if (saved) return saved;
    throw error;
  }
}
