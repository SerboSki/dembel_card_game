# 🃏 Dembel Card Game

Jeu de cartes multijoueur en ligne — Node.js + Socket.io + React + Vite

## Structure

```
dembel_card_game/
├── server.js          ← serveur Express + Socket.io
├── package.json       ← dépendances serveur
├── .gitignore
└── client/            ← frontend React (Vite)
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

## Lancer en local (2 terminaux)

```bash
# Terminal 1 — serveur
npm install
node server.js

# Terminal 2 — client React
cd client
npm install
npm run dev
```

→ **http://localhost:5173**

## Déployer sur Railway

```bash
cd client && npm run build
```

Le build génère `public/` qui est servi par Express.
Railway lance automatiquement `npm start` → `node server.js`.

## Valeurs des cartes

| Carte  | Points |
|--------|--------|
| As     | 1      |
| 2 – 9  | 2 – 9  |
| 10     | 10     |
| Valet  | 11     |
| Dame   | 12     |
| Roi    | 13     |
