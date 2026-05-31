# ─────────────────────────────────────────────────────────────
#  STAGE 1 — Clone depuis GitHub + Build React
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN apk add --no-cache git

WORKDIR /app

# Cloner la branche develop depuis GitHub
# Pour utiliser une autre branche : changer --branch develop
ARG GITHUB_BRANCH=develop
ARG GITHUB_REPO=https://github.com/SerboSki/dembel_card_game.git

RUN git clone --depth=1 --branch ${GITHUB_BRANCH} ${GITHUB_REPO} .

# Build du client React
# Vite génère les fichiers dans /app/public/
RUN cd client && npm install && npm run build

# ─────────────────────────────────────────────────────────────
#  STAGE 2 — Image de production légère
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS production

LABEL maintainer="SerboSki"
LABEL description="Dembel Card Game — source: GitHub"

WORKDIR /app

# On récupère uniquement ce dont le serveur a besoin
COPY --from=builder /app/server.js    ./server.js
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public/      ./public/

# Dépendances serveur uniquement (pas de devDependencies)
RUN npm install --omit=dev

EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:3000 || exit 1

CMD ["node", "server.js"]
