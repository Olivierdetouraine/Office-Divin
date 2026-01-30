const CACHE_NAME = 'office-divin-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/accueil.html',
  '/laudes.html',
  '/vepres.html',
  '/complies.html',
  '/lectures.html',
  '/milieu.html',
  '/menu.html',
  '/menu-lh.html',
  '/parametres.html',
  '/favicon.png',
  '/favicon.ico',
  '/vitrail.jpg',
  '/manifest.json',
  '/include/jquery-3.3.1.min.js',
  '/include/lh-calendrier.js',
  '/include/lh-psaumes.js',
  '/include/lh-ui.js',
  '/include/lh.js',
  '/include/lh.css',
  '/include/audio-player.js',
  '/include/polyfill.min.js',
  '/include/onsenui/onsenui.min.js',
  '/include/onsenui/onsenui.min.css',
  '/include/onsenui/onsen-css-components.min.css',
  '/include/onsenui/theme.css',
  '/include/pickadate/picker.js',
  '/include/pickadate/picker.date.js',
  '/include/pickadate/fr_FR.js',
  '/include/pickadate/lh.css',
  '/include/pickadate/lh.date.css',
  '/include/slider/nouislider.min.js',
  '/include/slider/nouislider.min.css'
];

// Installation du service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache ouvert');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activation et nettoyage des anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Stratégie de cache : Network First pour les fichiers audio, Cache First pour le reste
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Pour les fichiers audio (.opus), utiliser Network First avec fallback sur cache
  if (url.pathname.endsWith('.opus')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cloner la réponse pour la mettre en cache
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Si le réseau échoue, essayer le cache
          return caches.match(event.request);
        })
    );
  } 
  // Pour les autres ressources, utiliser Cache First
  else {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // Retourner depuis le cache si disponible
          if (response) {
            return response;
          }
          
          // Sinon, faire une requête réseau
          return fetch(event.request).then(response => {
            // Vérifier si la réponse est valide
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }
            
            // Cloner la réponse pour la mettre en cache
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
            
            return response;
          });
        })
    );
  }
});
