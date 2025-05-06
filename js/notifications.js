/**
 * Gestion des notifications pour TodoList PWA
 */

// Variables globales
let notificationPermission = 'default';
let pushSubscription = null;
const applicationServerPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
const notificationsBanner = document.getElementById('notifications-banner');
const enableNotificationsBtn = document.getElementById('enable-notifications');
const closeNotificationsBannerBtn = document.getElementById('close-notifications-banner');

// Initialisation
document.addEventListener('DOMContentLoaded', initNotifications);

function initNotifications() {
    // Vérifier si les notifications et le push sont supportés
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('Ce navigateur ne supporte pas les notifications push');
        return;
    }

    // Vérifier la permission actuelle
    notificationPermission = Notification.permission;
    
    // Si la permission est déjà accordée, vérifier l'abonnement push
    if (notificationPermission === 'granted') {
        console.log('Notifications déjà autorisées');
        checkPushSubscription();
        registerPeriodicSync();
        return;
    }

    // Si la permission a été refusée, on ne montre pas la bannière
    if (notificationPermission === 'denied') {
        console.log('Notifications refusées par l\'utilisateur');
        return;
    }

    // Si la bannière a déjà été fermée, on ne la montre pas
    if (localStorage.getItem('notificationBannerClosed') === 'true') {
        return;
    }

    // Montrer la bannière de demande de permission
    notificationsBanner.style.display = 'flex';

    // Ajouter les événements
    enableNotificationsBtn.addEventListener('click', requestNotificationPermission);
    closeNotificationsBannerBtn.addEventListener('click', () => {
        notificationsBanner.style.display = 'none';
        localStorage.setItem('notificationBannerClosed', 'true');
    });

    // Vérifier les tâches existantes pour programmer des notifications
    checkExistingTodos();
}

// Demander la permission pour les notifications et s'abonner aux push
async function requestNotificationPermission() {
    try {
        const permission = await Notification.requestPermission();
        notificationPermission = permission;
        
        if (permission === 'granted') {
            notificationsBanner.style.display = 'none';
            showNotification('Notifications activées', 'Vous recevrez désormais des rappels pour vos tâches!');
            await subscribeToPushNotifications();
            registerPeriodicSync();
            checkExistingTodos();
        } else {
            alert('Sans notifications, nous ne pourrons pas vous rappeler vos tâches à temps.');
        }
    } catch (error) {
        console.error('Erreur lors de la demande de permission:', error);
    }
}

// Convertir la clé base64 en Uint8Array
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// S'abonner aux notifications push
async function subscribeToPushNotifications() {
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            console.log('Déjà abonné aux notifications push');
            pushSubscription = subscription;
            await sendSubscriptionToServer(subscription);
            return subscription;
        }

        const options = {
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(applicationServerPublicKey)
        };

        const newSubscription = await registration.pushManager.subscribe(options);
        console.log('Nouvel abonnement créé:', JSON.stringify(newSubscription));
        pushSubscription = newSubscription;
        await sendSubscriptionToServer(newSubscription);
        return newSubscription;
    } catch (error) {
        console.error('Erreur lors de l\'abonnement aux notifications push:', error);
    }
}

// Vérifier si l'utilisateur est déjà abonné aux push
async function checkPushSubscription() {
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            console.log('Abonnement push existant trouvé');
            pushSubscription = subscription;
            await sendSubscriptionToServer(subscription);
        } else {
            console.log('Pas d\'abonnement push existant');
            await subscribeToPushNotifications();
        }
    } catch (error) {
        console.error('Erreur lors de la vérification de l\'abonnement push:', error);
    }
}

// Envoyer l'abonnement au serveur
async function sendSubscriptionToServer(subscription) {
    // NOTE: Dans une vraie application, envoyez cet abonnement à votre serveur
    // pour pouvoir envoyer des notifications push même lorsque l'app est fermée
    
    console.log('Envoi de l\'abonnement au serveur:', JSON.stringify(subscription));
    
    // Exemple d'envoi au serveur (à implémenter)
    /*
    try {
        const response = await fetch('https://votre-serveur.com/api/push-subscriptions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                subscription: subscription,
                userId: 'user-id' // Identifiant de l'utilisateur
            }),
        });
        
        if (response.ok) {
            console.log('Abonnement enregistré avec succès sur le serveur');
        } else {
            console.error('Erreur serveur lors de l\'enregistrement de l\'abonnement');
        }
    } catch (error) {
        console.error('Erreur réseau lors de l\'envoi de l\'abonnement:', error);
    }
    */
}

// Envoyer les détails d'une tâche au serveur pour programmer des notifications
async function scheduleServerNotification(todo) {
    if (!pushSubscription || !todo.dueDate) return;
    
    // NOTE: Dans une vraie application, envoyez ces détails à votre serveur
    // pour programmer l'envoi d'une notification push au moment voulu
    
    console.log('Programmation d\'une notification serveur pour:', todo.text, 'à', todo.dueDate);
    
    // Exemple d'envoi au serveur (à implémenter)
    /*
    try {
        const response = await fetch('https://votre-serveur.com/api/schedule-notification', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                subscription: pushSubscription,
                todo: {
                    id: todo.id,
                    text: todo.text,
                    dueDate: todo.dueDate
                }
            }),
        });
        
        if (response.ok) {
            console.log('Notification programmée avec succès sur le serveur');
        } else {
            console.error('Erreur serveur lors de la programmation de la notification');
        }
    } catch (error) {
        console.error('Erreur réseau lors de l\'envoi de la programmation:', error);
    }
    */
}

// Envoyer une notification
function showNotification(title, body, data = {}) {
    if (notificationPermission !== 'granted') return;

    const options = {
        body: body,
        icon: './images/icon-192x192.png',
        badge: './images/icon-192x192.png',
        vibrate: [100, 50, 100],
        data: data,
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

    navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, options);
    });
}

// Vérifier les tâches existantes pour programmer des notifications
function checkExistingTodos() {
    const todos = JSON.parse(localStorage.getItem('todos')) || [];
    
    todos.forEach(todo => {
        if (todo.dueDate && !todo.completed) {
            scheduleNotification(todo);
            
            // Également envoyer au serveur pour les notifications push
            scheduleServerNotification(todo);
        }
    });
}

// Programmer une notification locale (côté client)
function scheduleNotification(todo) {
    if (!todo.dueDate) return;
    
    const now = new Date();
    const dueDate = new Date(todo.dueDate);
    
    // Si la date est déjà passée, on ne programme pas de notification
    if (dueDate < now) return;
    
    const timeUntilDue = dueDate.getTime() - now.getTime();
    
    // Programmer la notification
    setTimeout(() => {
        if (!isTaskCompleted(todo.id)) {
            showNotification(
                'Rappel de tâche',
                `Il est temps de : ${todo.text}`,
                { id: todo.id }
            );
        }
    }, timeUntilDue);
    
    // Programmer aussi une notification 15 minutes avant
    const timeUntilReminder = timeUntilDue - (15 * 60 * 1000);
    if (timeUntilReminder > 0) {
        setTimeout(() => {
            if (!isTaskCompleted(todo.id)) {
                showNotification(
                    'Rappel de tâche',
                    `Dans 15 minutes : ${todo.text}`,
                    { id: todo.id }
                );
            }
        }, timeUntilReminder);
    }
}

// Vérifier si une tâche est complétée
function isTaskCompleted(id) {
    const todos = JSON.parse(localStorage.getItem('todos')) || [];
    const todo = todos.find(t => t.id === id);
    return todo ? todo.completed : true;
}

// Enregistrer la synchronisation périodique (pour le mode hors ligne)
async function registerPeriodicSync() {
    if ('serviceWorker' in navigator && 'periodicSync' in navigator.serviceWorker) {
        try {
            const registration = await navigator.serviceWorker.ready;
            
            // Vérifier si periodicSync est disponible
            if ('periodicSync' in registration) {
                // Enregistrer une tâche de synchronisation périodique
                await registration.periodicSync.register('check-todos', {
                    minInterval: 60 * 60 * 1000, // 1 heure
                });
                console.log('Synchronisation périodique enregistrée');
            }
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement de la synchronisation périodique:', error);
        }
    }
}

// Exporter les fonctions pour les rendre disponibles à app.js
window.notificationHandler = {
    showNotification,
    scheduleNotification,
    scheduleServerNotification
}; 