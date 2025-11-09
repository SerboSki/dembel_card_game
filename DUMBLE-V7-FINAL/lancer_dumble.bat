@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
echo.
echo ========================================
echo 🃏 JEU DU DUMBLE
echo ========================================
echo.
set PORT=8000
if not exist "index.html" (
    echo ❌ Erreur: Les fichiers du jeu n'ont pas été trouvés!
    pause
    exit /b
)
echo ✨ Démarrage du serveur sur le port %PORT%...
echo 🌐 Accès: http://localhost:%PORT%
echo ❌ Appuyez sur Ctrl+C pour arrêter le serveur
echo ========================================
echo.
timeout /t 1 /nobreak >nul
echo ✅ Serveur démarré!
echo 🚀 Ouverture du navigateur...
start http://localhost:%PORT%
python -m http.server %PORT%
if errorlevel 1 (
    echo ❌ Erreur: Python n'a pas été trouvé!
    pause
)
