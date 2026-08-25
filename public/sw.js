// Self-destructing Cache Buster Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => {
        console.log('[SW Cache Buster] Deleting stale cache:', key);
        return caches.delete(key);
      }));
    }).then(() => {
      return self.registration.unregister();
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Pass through all requests directly to network to avoid stale JS bundle caches
  return;
});
