/**
 * Gestion des notifications pour TodoList PWA
 */

// Variables globales
let notificationPermission = 'default';
const notificationsBanner = document.getElementById('notifications-banner');
const enableNotificationsBtn = document.getElementById('enable-notifications');
const closeNotificationsBannerBtn = document.getElementById('close-notifications-banner');

// Initialisation
document.addEventListener('DOMContentLoaded', initNotifications);

function initNotifications() {
    // Vérifier si les notifications sont supportées
    if (!('Notification' in window)) {
        console.log('Ce navigateur ne supporte pas les notifications desktop');
        return;
    }

    // Vérifier la permission actuelle
    notificationPermission = Notification.permission;
    
    // Si la permission est déjà accordée, on ne fait rien
    if (notificationPermission === 'granted') {
        console.log('Notifications déjà autorisées');
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

// Demander la permission pour les notifications
async function requestNotificationPermission() {
    try {
        const permission = await Notification.requestPermission();
        notificationPermission = permission;
        
        if (permission === 'granted') {
            notificationsBanner.style.display = 'none';
            showNotification('Notifications activées', 'Vous recevrez désormais des rappels pour vos tâches!');
            registerPeriodicSync();
            checkExistingTodos();
        } else {
            alert('Sans notifications, nous ne pourrons pas vous rappeler vos tâches à temps.');
        }
    } catch (error) {
        console.error('Erreur lors de la demande de permission:', error);
    }
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
        }
    });
}

// Programmer une notification pour une tâche
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
    scheduleNotification
}; 