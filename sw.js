// sw.js - Service Worker for offline caching

const CACHE_NAME = 'atmosfera-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/icons/search.svg',
  '/icons/location.svg',
  '/icons/humidity.svg',
  '/icons/wind.svg',
  '/icons/pressure.svg',
  '/icons/uv-index.svg',
  '/icons/visibility.svg',
  '/icons/sunrise.svg',
  '/icons/sunset.svg',
  '/icons/sound-on.svg',
  '/icons/sound-off.svg',
  '/assets/particles/rain-particle.svg',
  '/assets/particles/snow-particle.svg',
  '/assets/particles/cloud-particle.svg'
];

// Install event - cache all assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip API calls
  if (event.request.url.includes('api.openweathermap.org')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});