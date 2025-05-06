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
    './manifest.json',
    './images/icon-192x192.png',
    './images/icon-512x512.png',
    './images/favicon.ico'
];

// Map des notifications programmées (id -> timeoutId)
const scheduledNotifications = new Map();

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

// Gestion des messages de l'application
self.addEventListener('message', event => {
    const data = event.data;
    
    if (data.type === 'SCHEDULE_NOTIFICATION') {
        const todo = data.payload.todo;
        
        // Programmer les notifications
        scheduleNotification(todo);
    }
});

// Programmer une notification pour une tâche
function scheduleNotification(todo) {
    if (!todo.dueDate) return;
    
    // Annuler les notifications existantes pour cette tâche
    if (scheduledNotifications.has(todo.id)) {
        clearTimeout(scheduledNotifications.get(todo.id));
        scheduledNotifications.delete(todo.id);
    }
    
    const now = new Date();
    const dueDate = new Date(todo.dueDate);
    
    // Si la date est déjà passée, ne pas programmer de notification
    if (dueDate <= now) return;
    
    const timeUntilDue = dueDate.getTime() - now.getTime();
    
    // Programmer une notification à l'heure exacte
    const notificationId = setTimeout(() => {
        self.registration.showNotification('Rappel de tâche', {
            body: `Il est temps de : ${todo.text}`,
            icon: './images/icon-192x192.png',
            badge: './images/icon-192x192.png',
            vibrate: [100, 50, 100],
            data: { todoId: todo.id },
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
        
        scheduledNotifications.delete(todo.id);
    }, timeUntilDue);
    
    scheduledNotifications.set(todo.id, notificationId);
    
    // Si plus de 15 minutes avant l'échéance, programmer une notification de rappel
    const reminderTime = timeUntilDue - (15 * 60 * 1000);
    if (reminderTime > 0) {
        setTimeout(() => {
            self.registration.showNotification('Rappel de tâche', {
                body: `Dans 15 minutes : ${todo.text}`,
                icon: './images/icon-192x192.png',
                badge: './images/icon-192x192.png',
                vibrate: [100, 50, 100],
                data: { todoId: todo.id },
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
        }, reminderTime);
    }
}

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', event => {
    console.log('[Service Worker] Notification cliquée');
    
    const notification = event.notification;
    const action = event.action;
    const data = notification.data;
    
    notification.close();
    
    if (action === 'dismiss') {
        return;
    }
    
    // URL pour ouvrir l'application
    const urlToOpen = new URL('./index.html', self.location.origin);
    
    // Si l'utilisateur a cliqué sur "complete", envoyer un message pour marquer la tâche comme terminée
    if (action === 'complete' && data && data.todoId) {
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
                            todoId: data.todoId
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