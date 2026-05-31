# 🃏 Dembel Card Game

> Jeu de cartes multijoueur en ligne inspiré du jeu **Dembel**.
> Jouez entre amis ou contre des bots, en temps réel.

---

## 📦 Contenu de ce dépôt

```
/
├── dembel_game/        ← code source du jeu (à pusher sur GitHub)
│   ├── server.js       ← serveur Node.js + Socket.io
│   ├── package.json
│   ├── .gitignore
│   ├── README.md
│   └── client/         ← frontend React + Vite
│       └── src/
│           ├── App.jsx
│           ├── components/
│           └── hooks/
│
└── dembel_docker/      ← configuration Docker uniquement
    ├── Dockerfile      ← clone GitHub → build → serve
    ├── docker-compose.yml
    ├── setup.sh
    └── README.md
```

---

## 🎮 Le jeu

**Dembel** est un jeu de cartes où l'objectif est d'avoir le **moins de points possible**.

### Règles

- Chaque tour : défausser 1 ou plusieurs cartes (même valeur ou suite de même couleur), puis piocher 1 carte (depuis la pioche ou la défausse visible)
- Quand un joueur estime avoir ≤ 10 points, il peut annoncer **DEMBEL**
  - ✅ S'il a le score minimum → **0 points** (victoire)
  - ⚠️ S'il n'a pas le score minimum → score normal
  - ❌ S'il perd → **score × 2**
- Le classement final est par ordre **croissant** de points

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
- Mode solo contre des bots (1 à 4)

---

## 🛠️ Stack technique

| Côté | Technologie |
|------|-------------|
| Serveur | Node.js + Express + Socket.io |
| Frontend | React 18 + Vite + Framer Motion |
| Déploiement | Docker (image Alpine) |
| Temps réel | WebSocket via Socket.io |

---

## 🚀 Lancer le projet

### En local (développement)

```bash
# Terminal 1 — serveur
cd dembel_game
npm install
node server.js

# Terminal 2 — client React
cd dembel_game/client
npm install
npm run dev
```

→ **http://localhost:5173**

### Via Docker (production)

```bash
cd dembel_docker
bash setup.sh
```

→ **http://localhost:3001**

Le Dockerfile clone automatiquement le code depuis GitHub, build le client React et lance le serveur Express.

### Mettre à jour après un push GitHub

```bash
cd dembel_docker
docker compose down
docker compose up -d --build --no-cache
```

---

## 📁 Organisation

| Dossier | Rôle |
|---------|------|
| `dembel_game/` | Code source — **source de vérité** sur GitHub |
| `dembel_docker/` | Config Docker — clone depuis GitHub, aucun code de jeu |

> Le dossier `dembel_docker/` ne contient **aucun fichier de jeu**.
> Toute modification du jeu passe par `dembel_game/` → GitHub → rebuild Docker.
