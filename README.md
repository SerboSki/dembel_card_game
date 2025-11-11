# 🃏 DEMBEL - Jeu de Cartes Multijoueur

[![GitHub](https://img.shields.io/badge/GitHub-Dembel-blue?logo=github)](https://github.com)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)](https://nodejs.org)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.6+-red?logo=socket.io)](https://socket.io)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

**DEMBEL** est un jeu de cartes stratégique multijoueur en ligne. Défiez vos amis en temps réel pour avoir le **moins de points possible**!

---

## 🎮 Démo

🌐 **Jouer en ligne:** [dembel.com](https://dembel-game.com)

*(Note: Remplacez avec votre URL de déploiement)*

---

## 🎯 Caractéristiques

✅ **Multijoueur en temps réel** - Jusqu'à 5 joueurs par partie  
✅ **WebSocket** - Communication instantanée avec Socket.io  
✅ **Interface moderne** - Responsive et intuitive  
✅ **Règles simples mais stratégiques** - Facile à apprendre, difficile à maîtriser  
✅ **Notifications in-game** - Messages d'erreur et actions directement dans la page  
✅ **Système de scoring** - Calcul automatique des points avec pénalités  
✅ **Annonce DEMBEL** - Stratégie de fin de manche

---

## 📜 Règles du Jeu

### 🎯 Objectif
Avoir le **moins de points possible** pour gagner la manche!

### 🃏 Déroulement d'un tour
1. **Défausser** 1 ou plusieurs cartes:
   - Même valeur (ex: 5♣, 5♦)
   - Suite de même couleur (ex: 3♥, 4♥, 5♥)
2. **Piocher** 1 carte parmi:
   - La pioche (cachée)
   - La défausse visible

### 💯 Système de Points
- **As:** 1 point
- **2-9:** Valeur nominale
- **10/Valet/Dame/Roi:** 10 points

### 🎯 DEMBEL - L'Annonce Stratégique
**Condition:** Vous avez ≤10 points  
**Action:** Cliquez sur "🎯 DEMBEL!" pour finir la manche

**Résultats:**
- ✅ **Score minimum** → Score = **0 points** (Victoire!)
- ❌ **Pas score minimum** → Score = **Score ×2** (Pénalité!)

### 👥 Joueurs & Manche
- **2-5 joueurs** par partie
- **Classement par points croissants** après chaque manche

---

## 🚀 Installation Locale

### Prérequis
- **Node.js** 18+ ([télécharger](https://nodejs.org))
- **npm** (inclus avec Node.js)
- **Git** (optionnel, pour cloner)

### Étapes

**1. Cloner le projet:**
```bash
git clone https://github.com/votre-username/dembel-game.git
cd dembel-game
```

**2. Installer les dépendances:**
```bash
npm install
```

**3. Démarrer le serveur:**
```bash
npm start
```

**4. Accéder au jeu:**
```
http://localhost:3000
```

---

## 🌍 Déploiement sur Internet

### Option 1: Railway (Recommandé - Gratuit)

**1. Créer compte:** [railway.app](https://railway.app)  
**2. Connecter votre repo GitHub  
**3. Ajouter variables d'environnement:**
```
PORT=3000
NODE_ENV=production
```
**4. Deploy → Automatique!**

### Option 2: Heroku

**1. Créer compte:** [heroku.com](https://www.heroku.com)  
**2. Installer Heroku CLI**

```bash
heroku login
heroku create dembel-game
git push heroku main
```

### Option 3: Render

**1. Créer compte:** [render.com](https://render.com)  
**2. New Web Service → Connecter GitHub  
**3. Configuration automatique**

---

## 📁 Structure du Projet

```
dembel-game/
├── server.js              # Serveur Express + Socket.io
├── public/
│   ├── index.html         # Page HTML principale
│   ├── game-client.js     # Logique client
│   └── style.css          # Styles
├── package.json           # Dépendances Node.js
├── .gitignore             # Fichiers à ignorer
└── README.md              # Ce fichier
```

### Fichiers Clés

| Fichier | Description |
|---------|-------------|
| `server.js` | Serveur Node.js, gestion des salles, logique du jeu |
| `game-client.js` | Interface UI, événements Socket.io, rendu HTML |
| `index.html` | Conteneur principal, imports JS/CSS |
| `style.css` | Styles responsifs (cards, buttons, layout) |

---

## 🔧 Technologies Utilisées

- **Backend:** Node.js + Express.js
- **Communication:** Socket.io (WebSocket)
- **Frontend:** HTML5 + CSS3 + JavaScript Vanilla
- **Hosting:** Railway / Heroku / Render

---

## 📋 API Socket.io

### Client → Serveur

| Événement | Données | Description |
|-----------|---------|-------------|
| `register_user` | `{username}` | Connexion utilisateur |
| `create_room` | - | Créer une nouvelle salle |
| `join_room` | `{roomId}` | Rejoindre une salle |
| `start_game` | - | Démarrer la partie (hôte only) |
| `game_action` | `{type, data}` | Action en jeu (tour/dembel) |

### Serveur → Client

| Événement | Données | Description |
|-----------|---------|-------------|
| `registration_success` | `{username}` | Connexion confirmée |
| `error_notification` | `{message}` | Erreur utilisateur |
| `room_created` | `{roomId}` | Salle créée |
| `player_joined` | `{players}` | Joueur rejoint |
| `game_started` | `{gameState}` | Partie lancée |
| `game_update` | `{gameState}` | État du jeu mis à jour |
| `game_ended` | `{scores}` | Manche terminée |

---

## 🎨 Gameplay Screenshots

```
┌─────────────────────────┐
│    🃏 DEMBEL            │
│ Connectez-vous!         │
│                         │
│ 👤 Pseudo: [........]   │
│ [✅ Connecter]          │
│                         │
│ 📜 Règles               │
│ • Moins de points = Win │
│ • DEMBEL (≤10 pts)      │
│ • 2-5 joueurs          │
└─────────────────────────┘

LOBBY:
┌─────────────────────────┐
│ 🎲 ABC123               │
│ 3/5 🎮                  │
│ Min 2-5 joueurs        │
│ • Alice 👑              │
│ • Bob 🎮                │
│ • Charlie               │
│ [▶️ Démarrer]           │
└─────────────────────────┘

PARTIE:
🎮 VOTRE TOUR!
📊 Manche 1
📤 Défausse: 5 cartes
📚 Pioche: 42 cartes
🖐️ Main: 8 pts
  [5♥] [5♠] [K♣] ...
[🎯 DEMBEL!] [✅ Fin du tour]
```

---

## 🐛 Débogage & Logs

**Console serveur:**
```
✅ Connexion: socket-id
🎲 http://localhost:3000
```

**Erreurs courantes:**

| Erreur | Cause | Solution |
|--------|-------|----------|
| `EADDRINUSE 3000` | Port occupé | `lsof -ti:3000 \| xargs kill -9` |
| WebSocket déconnecté | Connexion réseau | Vérifier la console |
| Défausse invalide | Cartes incorrectes | Voir les règles |

---

## 📝 Contribution

Les contributions sont bienvenues! 🎉

1. **Fork** le projet
2. **Créer une branche:** `git checkout -b feature/new-feature`
3. **Commit:** `git commit -m "Add feature"`
4. **Push:** `git push origin feature/new-feature`
5. **Pull Request**

---

## 🚀 Roadmap

- [ ] Persistance des données (MongoDB)
- [ ] Historique des manches
- [ ] Système de classement global
- [ ] Modes de jeu additionnels
- [ ] Mobile app (React Native)
- [ ] Spectateurs en direct
- [ ] Chat in-game
- [ ] Avatars personnalisés

---

## 📄 License

Ce projet est sous **MIT License** - Voir [`LICENSE`](LICENSE) pour détails

---

## 👤 Auteur

**Développé avec ❤️**

- 💻 Développeur: [Votre nom]
- 📧 Email: [votre.email@example.com]
- 🔗 GitHub: [github.com/votre-username](https://github.com/votre-username)

---

## 💬 Support

Vous avez des questions?

- 📖 **Documentation:** Voir les règles in-game
- 🐛 **Bug Report:** Créer une [Issue](https://github.com/votre-username/dembel-game/issues)
- 💡 **Suggestion:** [Discussion](https://github.com/votre-username/dembel-game/discussions)

---

## 🎮 Jouez dès maintenant!

```bash
npm install && npm start
```

**Amusez-vous!** 🎲✨

---

**⭐ Si vous aimez ce projet, n'oubliez pas de mettre une étoile!**

```
  ⭐ → Haut de la page
     ↓
  [Star]
```

---

*Dernière mise à jour: 11 novembre 2025*
