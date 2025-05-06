/**
 * TodoList PWA Service Worker
 */

const CACHE_NAME = 'todolist-pwa-v1';

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/app.js',
    '/js/sw-register.js',
    '/manifest.json',
    '/images/icon-192x192.png',
    '/images/icon-512x512.png',
    '/images/favicon.ico'
];

// Installation du Service Worker
self.addEventListener('install', event => {
    console.log('[Service Worker] Installation');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] Mise en cache des ressources statiques');
                return cache.addAll(STATIC_ASSETS);
            })
    );
    
    // Activer immédiatement sans attendre la fermeture des onglets
    self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', event => {
    console.log('[Service Worker] Activation');
    
    // Nettoyer les anciens caches
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(cacheName => {
                    return cacheName !== CACHE_NAME;
                }).map(cacheName => {
                    console.log('[Service Worker] Suppression de l\'ancien cache:', cacheName);
                    return caches.delete(cacheName);
                })
            );
        })
    );
    
    // Prendre le contrôle de tous les clients immédiatement
    return self.clients.claim();
});

// Interception des requêtes
self.addEventListener('fetch', event => {
    console.log('[Service Worker] Récupération:', event.request.url);
    
    // Stratégie Cache-First avec Network Fallback
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                // Retourner la réponse du cache si elle existe
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                // Sinon, faire la requête au réseau
                return fetch(event.request)
                    .then(response => {
                        // Retourner la réponse immédiatement
                        return response;
                    })
                    .catch(error => {
                        console.error('[Service Worker] Erreur de récupération:', error);
                        
                        // Pour les requêtes de navigation, renvoyer une page d'erreur hors ligne
                        if (event.request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }
                        
                        // Pour les autres types de requêtes, on ne peut pas faire grand-chose
                        return new Response('Contenu non disponible hors ligne.', {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: new Headers({
                                'Content-Type': 'text/plain'
                            })
                        });
                    });
            })
    );
}); 