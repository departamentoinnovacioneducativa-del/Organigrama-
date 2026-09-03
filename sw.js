const CACHE_NAME = 'org-juventud-v1.0.1'; 

// Archivos esenciales para que funcione sin internet
const urlsToCache = [
    './',
    './index.html',
    './styles.css',
    './script.js',
    './manifest.json',
    './chema1.png',
    './chema2.png'
];

// INSTALACIÓN: Guarda los archivos en la memoria del dispositivo
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting()) 
    );
});

// ACTIVACIÓN: Limpia cachés viejos si actualizamos la versión
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Borrando caché antigua:', cacheName);
                        return caches.delete(cacheName); 
                    }
                })
            );
        }).then(() => self.clients.claim()) 
    );
});

// INTERCEPTOR DE RED (Estrategia: Red primero, Caché como respaldo)
// Esto asegura que siempre veas la última versión si hay internet, 
// pero carga la versión guardada si estás offline.
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request) 
            .then(response => {
                // Si la red responde bien, guardamos una copia fresca en caché
                if (response && response.status === 200 && response.type === 'basic') {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return response;
            })
            .catch(() => {
                // Si no hay internet (fetch falla), sacamos el archivo de la memoria caché
                return caches.match(event.request);
            })
    );
});
