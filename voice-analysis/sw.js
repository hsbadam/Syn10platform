const CACHE_NAME = 'syn10-voice-analysis-v1';
const urlsToCache = [
  '/voice-analysis/',
  '/voice-analysis/index.html',
  '/voice-analysis/styles.css',
  '/voice-analysis/js/app.js',
  '/voice-analysis/js/audio-analysis.js',
  '/voice-analysis/js/demo-mode.js',
  '/voice-analysis/js/enhancements.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});
