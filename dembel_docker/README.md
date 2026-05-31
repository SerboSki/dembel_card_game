# 🐳 Dembel — Docker

> Ce dossier contient **uniquement** la configuration Docker.
> Le code source est sur GitHub : `SerboSki/dembel_card_game`

## Contenu

```
dembel_docker/
├── Dockerfile          ← clone GitHub + build React + serve Express
├── docker-compose.yml  ← port 3001, volume /home/nova/dev_dembel_docker
├── .dockerignore
├── setup.sh            ← script tout-en-un
└── README.md
```

## Lancement rapide

```bash
bash setup.sh
```

→ **http://localhost:3001**

## Commandes utiles

```bash
# Lancer
docker compose up -d --build

# Voir les logs
docker compose logs -f

# Arrêter
docker compose down

# Mettre à jour depuis GitHub (sans cache)
docker compose down
docker compose up -d --build --no-cache
```

## Workflow — Mettre à jour le jeu

```
1. Modifier le code  →  dembel_game/
2. git push          →  GitHub (SerboSki/dembel_card_game)
3. Rebuild Docker    →  docker compose up -d --build --no-cache
```

GitHub est la **source de vérité**. Ce dossier Docker ne contient
aucun fichier de jeu.

## Volume persistant

```
/home/nova/dev_dembel_docker/
└── data/    ← données persistantes de l'app
```

## Ports

| Hôte | Container | Usage |
|------|-----------|-------|
| 3001 | 3000      | Jeu   |
