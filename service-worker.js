/**
 * TodoList PWA Service Worker
 */

const CACHE_NAME = 'todolist-pwa-v1';

const STATIC_ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/app.js',
    './js/sw-register.js',
    './js/notifications.js',
    './manifest.json',
    './images/icon-192x192.png',
    './images/icon-512x512.png',
    './images/favicon.ico'
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
                            return caches.match('./index.html');
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

// Gestion des notifications push
self.addEventListener('push', event => {
    console.log('[Service Worker] Notification push reçue');
    
    let notificationData = {};
    
    try {
        notificationData = event.data.json();
    } catch (e) {
        notificationData = {
            title: 'Notification',
            body: event.data ? event.data.text() : 'Pas de contenu'
        };
    }
    
    const options = {
        body: notificationData.body || 'Détails non disponibles',
        icon: './images/icon-192x192.png',
        badge: './images/icon-192x192.png',
        vibrate: [100, 50, 100],
        data: notificationData.data || {},
        actions: [
            {
                action: 'complete',
                title: 'Marquer comme terminée'
            },
            {
                action: 'dismiss',
                title: 'Ignorer'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(notificationData.title, options)
    );
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', event => {
    console.log('[Service Worker] Notification cliquée');
    
    const notification = event.notification;
    const action = event.action;
    const todoId = notification.data && notification.data.id;
    
    notification.close();
    
    if (action === 'dismiss') {
        return;
    }
    
    // Si l'utilisateur a cliqué sur la notification elle-même ou sur le bouton "complete"
    const urlToOpen = new URL('./index.html', self.location.origin);
    
    // Envoi d'un message à l'application pour marquer la tâche comme terminée si nécessaire
    if (action === 'complete' && todoId) {
        event.waitUntil(
            self.clients.matchAll({
                type: 'window',
                includeUncontrolled: true
            }).then(clients => {
                // Si une fenêtre existe déjà, l'utiliser
                for (const client of clients) {
                    client.postMessage({
                        type: 'NOTIFICATION_ACTION',
                        payload: {
                            action: 'complete',
                            todoId: todoId
                        }
                    });
                    return client.focus();
                }
                
                // Sinon, ouvrir une nouvelle fenêtre
                return self.clients.openWindow(urlToOpen);
            })
        );
    } else {
        // Autrement, juste ouvrir l'application
        event.waitUntil(
            self.clients.matchAll({
                type: 'window',
                includeUncontrolled: true
            }).then(clients => {
                for (const client of clients) {
                    if (client.url === urlToOpen.toString() && 'focus' in client) {
                        return client.focus();
                    }
                }
                
                return self.clients.openWindow(urlToOpen);
            })
        );
    }
});

// Gestion des événements de synchronisation périodique
self.addEventListener('periodicsync', event => {
    if (event.tag === 'check-todos') {
        console.log('[Service Worker] Vérification périodique des tâches');
        event.waitUntil(checkTodos());
    }
});

// Vérifier les tâches pour les notifications
async function checkTodos() {
    try {
        // Récupérer les tâches depuis le stockage
        const todosResponse = await caches.match(new Request('./todos-data'));
        if (!todosResponse) return;
        
        const todos = await todosResponse.json();
        const now = new Date();
        
        // Vérifier les tâches avec des dates d'échéance proches
        todos.forEach(todo => {
            if (todo.dueDate && !todo.completed) {
                const dueDate = new Date(todo.dueDate);
                const diffTime = dueDate.getTime() - now.getTime();
                const diffMinutes = diffTime / (1000 * 60);
                
                // Notifier si moins de 30 minutes avant l'échéance
                if (diffMinutes > 0 && diffMinutes < 30) {
                    self.registration.showNotification('Rappel de tâche', {
                        body: `Bientôt à faire : ${todo.text}`,
                        icon: './images/icon-192x192.png',
                        badge: './images/icon-192x192.png',
                        vibrate: [100, 50, 100],
                        data: { id: todo.id },
                        actions: [
                            {
                                action: 'complete',
                                title: 'Marquer comme terminée'
                            },
                            {
                                action: 'dismiss',
                                title: 'Ignorer'
                            }
                        ]
                    });
                }
            }
        });
    } catch (error) {
        console.error('[Service Worker] Erreur lors de la vérification des tâches:', error);
    }
} 