#!/bin/bash
echo "=========================================="
echo "🃏 JEU DU DUMBLE"
echo "=========================================="
echo ""
PORT=8000
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"
if [ ! -f "index.html" ]; then
    echo "❌ Erreur: Les fichiers du jeu n'ont pas été trouvés!"
    exit 1
fi
echo "✨ Démarrage du serveur sur le port $PORT..."
echo "🌐 Accès: http://localhost:$PORT"
echo "❌ Appuyez sur Ctrl+C pour arrêter le serveur"
echo "=========================================="
echo ""
sleep 1
echo "✅ Serveur démarré!"
echo "🚀 Ouverture du navigateur..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "http://localhost:$PORT"
else
    xdg-open "http://localhost:$PORT" 2>/dev/null || firefox "http://localhost:$PORT"
fi
python3 -m http.server $PORT
