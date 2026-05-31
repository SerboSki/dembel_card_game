# 🃏 Dembel Card Game

> Jeu de cartes multijoueur en ligne — jouez entre amis ou contre des bots, en temps réel.

---

## 🎮 Règles du jeu

**Objectif** : avoir le **moins de points** possible en fin de manche.

### Déroulement d'un tour
1. **Défausser** 1 ou plusieurs cartes de même valeur, ou une suite de même couleur
2. **Piocher** 1 carte — depuis la pioche ou la défausse visible

### DEMBEL
Quand un joueur estime avoir ≤ 10 points, il peut annoncer **DEMBEL** :

| Résultat | Conséquence |
|----------|-------------|
| ✅ Score le plus bas | **0 points** |
| ⚠️ Pas le score le plus bas | Score normal |
| ❌ Annonce perdante | **Score × 2** |

### Valeurs des cartes

| Carte | Points |
|-------|--------|
| As | 1 |
| 2 – 9 | 2 – 9 |
| 10 | 10 |
| Valet | 11 |
| Dame | 12 |
| Roi | 13 |

### Joueurs
- 2 à 5 joueurs (humains ou bots)
- Mode multijoueur en ligne avec code de salle
- Mode solo contre 1 à 4 bots

---

## 🛠️ Stack technique

| Couche | Technologie |
|--------|-------------|
| Serveur | Node.js + Express + Socket.io |
| Frontend | React 18 + Vite + Framer Motion |
| Temps réel | WebSocket via Socket.io |
| Conteneurisation | Docker (Alpine) |

---

## 📁 Structure du projet

```
dembel_card_game/
├── server.js              ← serveur Express + logique Socket.io
├── package.json           ← dépendances serveur
├── .gitignore
├── README.md
├── dembel_docker/         ← configuration Docker (voir section Docker)
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── setup.sh
└── client/                ← frontend React
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── hooks/
        │   └── useSocket.js
        └── components/
            ├── Card.jsx
            ├── OpponentSeat.jsx
            ├── Button.jsx
            ├── Panel.jsx
            └── Notification.jsx
```

---

## 🚀 Lancer en local

> Nécessite **Node.js 18+**

### Installation

```bash
# Dépendances serveur
npm install

# Dépendances client
cd client && npm install && cd ..
```

### Démarrage (2 terminaux)

```bash
# Terminal 1 — serveur Node.js
node server.js
# → http://localhost:3000

# Terminal 2 — client React (Vite)
cd client
npm run dev
# → http://localhost:5173
```

Vite proxifie automatiquement Socket.io vers le port 3000.

---

## 🐳 Docker

> Le dossier `dembel_docker/` contient toute la configuration Docker.
> Le Dockerfile clone ce repo depuis GitHub, build le client React et lance le serveur.

### Lancement rapide

```bash
cd dembel_docker
bash setup.sh
```

→ **http://localhost:3001**

### Commandes utiles

```bash
# Démarrer
docker compose up -d --build

# Voir les logs
docker compose logs -f

# Arrêter
docker compose down

# Mettre à jour après un push GitHub
docker compose down
docker compose up -d --build --no-cache
```

### Volume persistant

Les données sont stockées sur la machine hôte dans :
```
/home/nova/dev_dembel_docker/data/
```

### Ports

| Hôte | Container | Usage |
|------|-----------|-------|
| 3001 | 3000 | Jeu Dembel |

---

## 🔄 Workflow de mise à jour

```
1. Modifier le code (server.js ou client/)
2. git push → GitHub
3. docker compose down && docker compose up -d --build --no-cache
```

GitHub est la **source de vérité**. Docker clone toujours depuis GitHub.
