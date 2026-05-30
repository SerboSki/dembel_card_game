# 🃏 Dembel Card Game

> Le jeu de cartes multijoueur en ligne le plus simple.

## Description

**Dembel** est un jeu de cartes multijoueur en ligne développé avec Node.js et Socket.IO. Il permet à plusieurs joueurs de jouer en temps réel via une interface web.

## Stack technique

| Technologie | Usage |
|---|---|
| **Node.js** | Serveur backend |
| **Express** `^4.18.2` | Serveur HTTP & fichiers statiques |
| **Socket.IO** `^4.6.1` | Communication temps réel (WebSocket) |
| **JavaScript** | Logique client & serveur (74.6%) |
| **Python** | Scripts utilitaires (17.3%) |
| **CSS** | Styles (7.1%) |
| **HTML** | Interface (1.0%) |

## Structure du projet

```
dembel_card_game/
├── public/             # Fichiers statiques (HTML, CSS, JS client)
├── old_folder/         # Anciennes versions / archives
├── server.js           # Point d'entrée du serveur Node.js
├── package.json        # Dépendances et scripts npm
├── railway.json        # Configuration déploiement Railway
└── .gitignore
```

## Installation

```bash
# Cloner le dépôt
git clone https://github.com/SerboSki/dembel_card_game.git
cd dembel_card_game

# Installer les dépendances
npm install

# Lancer le serveur
npm start
```

## Scripts disponibles

```bash
npm start   # Lance le serveur (node server.js)
npm run dev # Identique à start
```

## Déploiement

Le projet est configuré pour un déploiement sur **Railway** via `railway.json` :

- **Builder** : Nixpacks
- **Commande de démarrage** : `npm start`

## Branches

- `develop` — branche principale de développement

## Licence

MIT
