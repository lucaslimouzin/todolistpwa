# TodoList PWA

Une application de liste de tâches simple développée en JavaScript pur, qui fonctionne comme une Progressive Web App (PWA).

## Fonctionnalités

- Création, suppression et marquage des tâches comme terminées
- Filtrage des tâches (toutes, actives, terminées)
- Persistance des données grâce au stockage local
- Fonctionne hors ligne
- Installation sur l'appareil comme une application native

## Technologies utilisées

- HTML5
- CSS3 avec variables CSS
- JavaScript pur (Vanilla JS)
- Service Workers pour les fonctionnalités hors ligne
- Web App Manifest pour l'installation de la PWA

## Comment utiliser

1. Clonez ce dépôt ou téléchargez les fichiers
2. Ouvrez le projet dans un serveur web (vous pouvez utiliser Live Server dans VS Code ou WAMP/XAMPP)
3. Accédez à l'application via votre navigateur
4. Pour une expérience complète de PWA, assurez-vous d'utiliser HTTPS

## Structure du projet

```
todolistpwa/
├── index.html             # Page principale
├── css/
│   └── style.css          # Styles de l'application
├── js/
│   ├── app.js             # Logique principale de l'application
│   └── sw-register.js     # Enregistrement du Service Worker
├── images/                # Icônes et images
│   ├── icon-192x192.png
│   ├── icon-512x512.png
│   └── favicon.ico
├── service-worker.js      # Service Worker pour le mode hors ligne
└── manifest.json          # Manifest pour l'installation de la PWA
```

## Pour créer/modifier les icônes

Vous devez créer les icônes suivantes pour que la PWA fonctionne correctement :
- `images/icon-192x192.png` (192×192 pixels)
- `images/icon-512x512.png` (512×512 pixels)
- `images/favicon.ico` (pour les navigateurs traditionnels)

## Compatibilité

Cette application est compatible avec les navigateurs modernes qui supportent les Service Workers et le Web App Manifest :
- Chrome (version 45+)
- Firefox (version 44+)
- Safari (version 11.1+)
- Edge (version 17+)

## Licence

Ce projet est libre d'utilisation pour vos propres projets. 