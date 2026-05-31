# ─────────────────────────────────────────────────────────────
#  STAGE 1 — Clone GitHub + Build React
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN apk add --no-cache git python3 make g++

WORKDIR /app

ARG GITHUB_BRANCH=develop
ARG GITHUB_REPO=https://github.com/SerboSki/dembel_card_game.git

# Clone depuis GitHub
RUN git clone --depth=1 --branch ${GITHUB_BRANCH} ${GITHUB_REPO} .

# Build du client React
# Vite génère les fichiers dans /app/client/dist/
RUN cd client \
    && npm install \
    && npm run build

# ─────────────────────────────────────────────────────────────
#  STAGE 2 — Image de production légère
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS production

LABEL maintainer="SerboSki"
LABEL description="Dembel Card Game — source: GitHub"

WORKDIR /app

# Serveur
COPY --from=builder /app/server.js    ./server.js
COPY --from=builder /app/package.json ./package.json

# Build React (client/dist) → public/ (servi par Express)
COPY --from=builder /app/client/dist/ ./public/

# Dépendances serveur uniquement
RUN npm install --omit=dev

EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:3000 || exit 1

CMD ["node", "server.js"]
