# 🎲 Jeu Dembel - Projet Complet

## 📋 Description
Jeu de cartes multijoueur en ligne avec Socket.io

## 📁 Structure du projet
```
dembel-project/
├── server.js           # Serveur Node.js
├── package.json        # Dépendances
├── railway.json        # Configuration Railway
└── public/
    ├── index.html      # Interface HTML
    ├── game-client.js  # Logique cliente
    └── style.css       # Styles CSS
```

## 🚀 Installation

### Localement
```bash
npm install
npm start
```

Accédez à `http://localhost:3000`

### Déploiement Railway
```bash
railway link
railway up
```

## 🎮 Règles du Dembel
- Le joueur qui annonce DEMBEL doit avoir ≤ 10 points
- Le joueur avec le score minimum gagne (0 point)
- Si c'est un non-annonceur qui gagne: annonceur × 2 (pénalité)
- Joueurs peuvent choisir: pioche OU dernière défausse

## ✅ Fonctionnalités
- ✅ Création/Rejoindre salles
- ✅ Mode multijoueur 2-5 joueurs
- ✅ Système de tour par tour
- ✅ Annonce DEMBEL
- ✅ Copie rapide du code salle
- ✅ Notifications système
- ✅ Reconnexion automatique
- ✅ Recyclage des cartes sans doublon

## 🔧 Technos
- Node.js + Express
- Socket.io (temps réel)
- Vanilla JavaScript (client)
