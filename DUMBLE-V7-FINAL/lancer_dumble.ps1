$PORT = 8000
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
cd $scriptPath
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🃏 JEU DU DUMBLE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
if (-not (Test-Path "index.html")) {
    Write-Host "❌ Erreur: Les fichiers du jeu n'ont pas été trouvés!" -ForegroundColor Red
    pause
    exit
}
Write-Host "✨ Démarrage du serveur sur le port $PORT..." -ForegroundColor Yellow
Write-Host "🌐 Accès: http://localhost:$PORT" -ForegroundColor Cyan
Write-Host "❌ Appuyez sur Ctrl+C pour arrêter le serveur" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Start-Sleep -Seconds 1
Write-Host "✅ Serveur démarré!" -ForegroundColor Green
Write-Host "🚀 Ouverture du navigateur..." -ForegroundColor Green
Start-Process "http://localhost:$PORT"
& python -m http.server $PORT
