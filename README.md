# 🃏 JEU DU Dembel - Package Complet

Bienvenue! Vous avez téléchargé le jeu Dembel avec tous les scripts de lancement.

## 🚀 DÉMARRAGE RAPIDE

### Pour Windows 🪟
1. **Double-cliquez sur `lancer_Dembel.bat`**
2. Le jeu s'ouvre automatiquement dans votre navigateur
3. C'est tout! 🎮

### Pour macOS 🍎
1. Ouvrez un terminal dans ce dossier
2. Tapez:
```bash
chmod +x lancer_Dembel.sh
./lancer_Dembel.sh
```

### Pour Linux 🐧
1. Ouvrez un terminal dans ce dossier
2. Tapez:
```bash
chmod +x lancer_Dembel.sh
./lancer_Dembel.sh
```

### Avec Python (tous les OS) 🐍
1. Ouvrez un terminal dans ce dossier
2. Tapez:
```bash
python lancer_Dembel.py
# ou
python3 lancer_Dembel.py
```

## 📦 Contenu du dossier

```
📦 Dembel-complet/
├── 🎮 Fichiers du jeu:
│   ├── index.html         - Page principale
│   ├── style.css          - Design
│   └── game.js            - Logique du jeu
│
├── 🚀 Scripts de lancement:
│   ├── lancer_Dembel.bat  - Windows (le plus simple)
│   ├── lancer_Dembel.ps1  - Windows (PowerShell)
│   ├── lancer_Dembel.sh   - macOS/Linux
│   └── lancer_Dembel.py   - Python (tous les OS)
│
└── 📄 Documentation:
    ├── README.md          - Ce fichier
    ├── REGLES.md          - Règles du jeu
    └── requirements.txt   - Dépendances (aucune!)
```

## 💻 Prérequis

✅ **Python 3.x** (pour lancer le serveur)  
✅ **Un navigateur web moderne** (Chrome, Firefox, Safari, Edge...)  

**C'est tout!** Aucune autre dépendance.

## 📋 Règles du jeu

### Objectif
Être le premier à crier "Dembel" avec 10 points ou moins!

### Points par carte
- As = 1 point
- 2-10 = valeur nominale
- Valet, Dame, Roi = 10 points

### Défausses valides
1. **1 carte** → toujours valide
2. **2-4 cartes de même valeur** → valide (ex: deux 7, trois Rois)
3. **Exactement 3 cartes consécutives même couleur** → valide (ex: 5-6-7 ♥)

### Modes de jeu
- **Rapide** → Une seule manche, gagnant = moins de points
- **Complet** → Plusieurs manches avec score cumulatif (première à 100+ perd)

## 🔧 Installation de Python (si nécessaire)

### Windows
1. Allez sur https://www.python.org
2. Cliquez sur "Download"
3. Exécutez l'installateur
4. ⚠️ **IMPORTANT:** Cochez "Add Python to PATH"
5. Terminez l'installation

### macOS
```bash
brew install python3
```

### Linux (Ubuntu/Debian)
```bash
sudo apt-get install python3
```

## 🛠️ Dépannage

### "Python n'a pas été trouvé"
→ Installez Python 3 depuis https://www.python.org

### "Port 8000 déjà utilisé"
→ Modifiez le PORT dans le script (changez 8000 en 8001)

### Le navigateur ne s'ouvre pas
→ Ouvrez manuellement http://localhost:8000

### "Accès refusé" (macOS/Linux)
→ Tapez: `chmod +x lancer_Dembel.sh` avant de lancer

## 🎮 Comment jouer

1. Lancez un script
2. Configurez le nombre de joueurs (humains + IA)
3. Choisissez un mode (Rapide ou Complet)
4. Cliquez "Commencer"
5. Sélectionnez des cartes à défausser
6. Cliquez "Défausser"
7. Pichez une carte
8. Quand vous avez ≤10 points, cliquez "Dembel!"

## 📞 Support

Si vous avez des problèmes:
1. Vérifiez que Python 3.x est installé
2. Vérifiez que le port 8000 est libre
3. Essayez un autre port (changez dans le script)
4. Essayez un navigateur différent

## ✨ Caractéristiques

✅ Jeu Dembel complet  
✅ Multijoueur (2-5 joueurs)  
✅ Joueurs IA intelligents  
✅ Mode Rapide et Complet  
✅ Interface moderne et responsive  
✅ Aucune installation complexe  
✅ Fonctionne sur Windows/macOS/Linux  

## 📝 Licence

Libre d'utilisation et de modification.

---

**Bon jeu!** 🎲🃏
