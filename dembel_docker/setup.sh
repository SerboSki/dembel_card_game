#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  setup.sh — Démarre Dembel depuis GitHub via Docker
#  Usage : bash setup.sh
# ─────────────────────────────────────────────────────────────
set -e

VOLUME_DIR="/home/nova/dev_dembel_docker"

echo ""
echo "🃏 ===== DEMBEL DOCKER ====="
echo "   Source : GitHub (SerboSki/dembel_card_game)"
echo ""

# Créer le volume persistant
echo "📁 Création du volume persistant..."
mkdir -p "$VOLUME_DIR/data"
echo "   → $VOLUME_DIR/data ✅"

# Vérifier Docker
echo ""
echo "🐳 Vérification de Docker..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker non installé → https://docs.docker.com/get-docker/"
    exit 1
fi
echo "   → OK ✅"

# Arrêter l'ancien container si présent
echo ""
echo "🛑 Arrêt du container existant (si présent)..."
docker compose down 2>/dev/null || true

# Build depuis GitHub + lancement
echo ""
echo "🔨 Clone GitHub + Build React + Lancement..."
echo "   (2-3 min la première fois)"
echo ""

docker compose up -d --build

echo ""
echo "✅ ===== DEMBEL EST LANCÉ ! ====="
echo ""
echo "   🌐  http://localhost:3001"
echo "   📦  Source : GitHub/SerboSki/dembel_card_game (develop)"
echo "   📂  Volume : $VOLUME_DIR/data"
echo ""
echo "   🪵  Logs            : docker compose logs -f"
echo "   🛑  Arrêter         : docker compose down"
echo "   🔄  Màj depuis Git  : docker compose down && docker compose up -d --build --no-cache"
echo ""
