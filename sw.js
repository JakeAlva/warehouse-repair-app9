
const CACHE = 'hh-pwa-v9';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/hammerhead-logo.png',
  './assets/measure_depth.svg',
  './assets/measure_width.svg',
  './assets/strut_heights.svg',
  './assets/beam_measure.svg',
  './assets/hole_punch_styles.svg'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => k===CACHE?null:caches.delete(k)))));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, {ignoreSearch:true});
    if (cached) return cached;
    try {
      const res = await fetch(req);
      cache.put(req, res.clone());
      return res;
    } catch (err) {
      if (req.mode === 'navigate') return cache.match('./index.html');
      throw err;
    }
  })());
});
