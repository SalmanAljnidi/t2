self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('math-game-store').then((cache) => cache.addAll([
      'index.html',
      'style.css',
      'script.js',
    ])),
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request)),
  );
});
