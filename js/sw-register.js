/**
 * Service Worker Registration
 */

// Enregistrement du service worker principal
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            // Enregistrer le service worker principal
            const registration = await navigator.serviceWorker.register('../service-worker.js');
            console.log('Service Worker enregistré avec succès:', registration.scope);
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement du Service Worker:', error);
        }
    });
} 