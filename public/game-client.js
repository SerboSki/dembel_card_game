class DembelGame {
    constructor() {
        this.valeurs = ["As","2","3","4","5","6","7","8","9","10","Valet","Dame","Roi"];
        this.couleurs = ["Trèfle","Carreau","Cœur","Pique"];
        this.couleurs_symboles = {"Trèfle":"♣","Carreau":"♦","Cœur":"♥","Pique":"♠"};
        this.couleurs_couleur = {"Trèfle":"black","Carreau":"red","Cœur":"red","Pique":"black"};
        this.points_valeur = {};
        this.valeurs.forEach((v,i)=>{ this.points_valeur[v] = Math.min(i+1,10); });
        this.joueurs = [];
        this.manche_actuelle = 1;
        this.pioche = [];
        this.last_defausse = [];
        this.tour_actuel = 0;
        this.game_over = false;
        this.messages = [];
        this.annonceur_dembel = null;
    }

    calculPoints(main){
        return main.reduce((sum, carte)=>sum+this.points_valeur[carte.valeur],0);
    }

    addMessage(msg){ this.messages.push(msg); }
    clearMessages(){ this.messages=[]; }
}

const socket = io();
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 5;

let currentUser = null;
let currentRoom = null;
let game = null;
let roomPlayers = [];
let isHost = false;
let selected_cards = [];
let selected_public_card = null;
let selected_from_pile = false;
let previousTurn = -1;
let isProcessing = false;

window.addEventListener('load', () => {
    const savedUser = sessionStorage.getItem('dembel_username');
    const savedRoom = sessionStorage.getItem('dembel_roomId');
    if (savedUser && savedRoom) {
        socket.emit('reconnect_to_game', { username: savedUser, roomId: savedRoom });
    } else {
        render();
    }
});

socket.on('connect', () => { console.log('✅ Connecte'); });
socket.on('reconnect_failed', () => {
    sessionStorage.removeItem('dembel_username');
    sessionStorage.removeItem('dembel_roomId');
    currentUser = null;
    currentRoom = null;
    game = null;
    render();
});
socket.on('registration_success', (data) => {
    currentUser = data.username;
    sessionStorage.setItem('dembel_username', data.username);
    render();
});
socket.on('error_notification', (m) => { showErrorNotification(m); });
socket.on('room_created', (data) => {
    currentRoom = data.roomId;
    sessionStorage.setItem('dembel_roomId', data.roomId);
    roomPlayers = [currentUser];
    isHost = true;
    render();
});
socket.on('player_joined', (data) => {
    if (data.players) {
        roomPlayers = data.players.map(p => p.username);
    } else if (!roomPlayers.includes(data.username)) {
        roomPlayers.push(data.username);
    }
    if (!currentRoom) {
        currentRoom = sessionStorage.getItem('dembel_roomId');
    }
    render();
});
socket.on('game_started', (data) => {
    game = new DembelGame();
    Object.assign(game, data.gameState);
    game.couleurs_symboles = data.gameState.couleurs_symboles;
    game.couleurs_couleur = data.gameState.couleurs_couleur;
    game.points_valeur = data.gameState.points_valeur;
    game.valeurs = data.gameState.valeurs;
    game.couleurs = data.gameState.couleurs;
    previousTurn = game.tour_actuel;
    if (!currentUser) currentUser = sessionStorage.getItem('dembel_username');
    if (!currentRoom) currentRoom = sessionStorage.getItem('dembel_roomId');
    selected_cards = [];
    selected_public_card = null;
    selected_from_pile = false;
    isProcessing = false;
    render();
});
socket.on('game_update', (data) => {
    if (!game) game = new DembelGame();
    Object.assign(game, data.gameState);
    const newTurn = game.tour_actuel;
    if (previousTurn !== newTurn) {
        previousTurn = newTurn;
        const currentPlayerName = game.joueurs[newTurn]?.nom;
        if (currentPlayerName === currentUser) {
            showSuccessNotification('🎮 Votre tour!');
        } else {
            showInfoNotification('⏳ ' + currentPlayerName);
        }
    }
    selected_cards = [];
    selected_public_card = null;
    selected_from_pile = false;
    isProcessing = false;
    render();
});
socket.on('game_ended', (data) => {
    renderClassement(data.scores);
});

function showErrorNotification(msg) {
    const existing = document.getElementById('notification-container');
    if (existing) existing.remove();
    const notif = document.createElement('div');
    notif.id = 'notification-container';
    notif.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#f44336;color:white;padding:15px 30px;border-radius:10px;font-weight:bold;z-index:9999;box-shadow:0 4px 12px rgba(244,67,54,0.5);animation:slideDown 0.3s';
    notif.textContent = msg;
    document.body.appendChild(notif);
    setTimeout(() => { notif.remove(); }, 4000);
}

function showSuccessNotification(msg) {
    const existing = document.getElementById('notification-container');
    if (existing) existing.remove();
    const notif = document.createElement('div');
    notif.id = 'notification-container';
    notif.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#28a745;color:white;padding:15px 30px;border-radius:10px;font-weight:bold;z-index:9999;box-shadow:0 4px 12px rgba(40,167,69,0.5);animation:slideDown 0.3s';
    notif.textContent = msg;
    document.body.appendChild(notif);
    setTimeout(() => { notif.remove(); }, 3000);
}

function showInfoNotification(msg) {
    const existing = document.getElementById('notification-container');
    if (existing) existing.remove();
    const notif = document.createElement('div');
    notif.id = 'notification-container';
    notif.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#667eea;color:white;padding:15px 30px;border-radius:10px;font-weight:bold;z-index:9999;box-shadow:0 4px 12px rgba(102,126,234,0.5);animation:slideDown 0.3s';
    notif.textContent = msg;
    document.body.appendChild(notif);
    setTimeout(() => { notif.remove(); }, 3000);
}

function registerUser() {
    const username = document.getElementById('username_input')?.value?.trim();
    if (!username) {
        showErrorNotification('⚠️ Entrez un pseudo');
        return;
    }
    if (username.length < 3) {
        showErrorNotification('⚠️ Pseudo trop court (min 3)');
        return;
    }
    socket.emit('register_user', username);
}

function createRoom() { socket.emit('create_room'); }
function joinRoom() {
    const roomId = document.getElementById('room_id_input')?.value?.trim()?.toUpperCase();
    if (!roomId) {
        showErrorNotification('⚠️ Entrez un code');
        return;
    }
    sessionStorage.setItem('dembel_roomId', roomId);
    currentRoom = roomId;
    socket.emit('join_room', roomId);
}
function startGame() {
    if (roomPlayers.length < MIN_PLAYERS) {
        showErrorNotification('❌ Min '+MIN_PLAYERS+' joueurs');
        return;
    }
    socket.emit('start_game', {});
}

function toggleCard(idx) {
    if (!game || isProcessing) return;
    if (selected_cards.includes(idx)) {
        selected_cards = selected_cards.filter(i => i !== idx);
    } else {
        selected_cards.push(idx);
    }
    render();
}

function selectPublicCard(idx) {
    if (!game || isProcessing) return;
    const carte = game.last_defausse[idx];
    selected_public_card = selected_public_card === carte ? null : carte;
    selected_from_pile = false;
    render();
}

function selectPile() {
    if (!game || isProcessing) return;
    selected_from_pile = !selected_from_pile;
    selected_public_card = null;
    render();
}

function endTurn() {
    if (!game || isProcessing) return;
    if (!selected_cards || selected_cards.length === 0) {
        showErrorNotification('⚠️ Selectionnez une carte');
        return;
    }
    if (!selected_from_pile && !selected_public_card) {
        showErrorNotification('⚠️ Pioche obligatoire');
        return;
    }
    isProcessing = true;
    socket.emit('game_action', {
        type: 'turn',
        data: {
            defausse: selected_cards.slice(),
            pioche: selected_from_pile ? 'pioche' : selected_public_card
        }
    });
    setTimeout(() => { if (isProcessing) { isProcessing = false; render(); } }, 2000);
}

function callDembel() {
    if (!game || isProcessing) return;
    const joueur = game.joueurs.find(j => j.nom === currentUser);
    if (!joueur) return;
    const pts = game.calculPoints(joueur.main);
    if (pts > 10) {
        showErrorNotification('❌ Points > 10');
        return;
    }
    socket.emit('game_action', { type: 'dembel', data: {} });
    showSuccessNotification('🎯 DEMBEL annonce avec '+pts+' points!');
}

function copyRoomCode() {
    const roomCode = currentRoom;
    navigator.clipboard.writeText(roomCode).then(() => {
        const btn = document.getElementById('copy-room-btn');
        if (btn) {
            const originalText = btn.innerHTML;
            btn.innerHTML = '✅ Copié!';
            btn.style.background = '#2196F3';
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.background = '';
            }, 2000);
        }
    }).catch(err => {
        console.error('Erreur:', err);
        showErrorNotification('❌ Erreur copie');
    });
}

function newGame() {
    sessionStorage.removeItem('dembel_username');
    sessionStorage.removeItem('dembel_roomId');
    location.reload();
}

function renderLogin() {
    return '<div class="container"><h1>🃏 Dembel</h1><div class="form-group"><h3>👤 Pseudo</h3><input type="text" id="username_input" placeholder="Min 3 caracteres" maxlength="20" /><button onclick="registerUser()">✅ Connecter</button></div><div class="rules"><h3>📜 Regles</h3><div class="rules-text">🎯 OBJECTIF du DEMBEL : Moins de points possible<br><br>🃏 TOUR:<br>  • Defausser 1 carte ou plus (meme valeur ou suite couleur)<br>  • Piocher 1 carte (pioche ou defausse)<br><br>💯 POINTS: As=1, 2-9=valeur, 10/J/Q/K=10<br><br>🎯 DEMBEL (Si ≤10 pts):<br>  ✅ SI Score minimum = 0 pts (Victoire!)<br>  ⚠️ SI Pas score minimum = Score normal<br>  ❌ SI ANNONCE non gagnante = Penalite (SCORE ×2)<br><br>👥 2-5 joueurs | 🏆 Classement par points croissants</div></div></div>';
}

function renderLobby() {
    let html = '<div class="container"><h1>🃏 Dembel</h1><h3>👋 Bienvenue ' + currentUser + '</h3>';
    html += '<div class="form-group"><h4>👥 Multijoueur</h4><button onclick="createRoom()" style="background:#2196F3">➕ Creer</button></div><div class="form-group"><input type="text" id="room_id_input" placeholder="Code" maxlength="6" style="text-transform:uppercase" /><button onclick="joinRoom()" style="background:#FF9800">🔗 Rejoindre</button></div></div>';
    return html;
}

function renderWaiting() {
    const canStart = isHost && roomPlayers.length >= MIN_PLAYERS;
    const statusColor = roomPlayers.length < MIN_PLAYERS ? '#ff6b6b' : '#51cf66';
    const playerList = roomPlayers.map(p => {
        const badge = (isHost && p === currentUser) ? ' 👑' : (p === currentUser ? ' 🎮' : '');
        return '<li>👤 <strong>' + p + '</strong>' + badge + '</li>';
    }).join('');
    return '<div class="container"><h1>🎲 ' + currentRoom + ' <button id="copy-room-btn" onclick="copyRoomCode()" style="background:#2196F3;color:white;border:none;padding:8px 16px;cursor:pointer;border-radius:4px;font-size:16px;margin-left:8px;transition:all 0.2s ease;font-weight:bold">📋 Copier</button></h1><div style="text-align:center;padding:10px;background:' + statusColor + ';border-radius:8px;font-weight:bold">' + roomPlayers.length + '/' + MAX_PLAYERS + ' 🎮</div><div style="text-align:center;padding:8px;background:#f0f0f0;border-radius:8px;font-size:12px;margin:10px 0">Min '+MIN_PLAYERS+' joueurs - Max '+MAX_PLAYERS+' joueurs</div><h3>👥 Joueurs:</h3><ul style="list-style:none;text-align:center">' + playerList + '</ul><div style="text-align:center">' + (isHost ? '<button onclick="startGame()" ' + (!canStart ? 'disabled' : '') + ' style="background:#4caf50">▶️ Demarrer</button>' : '<p>⏳ En attente...</p>') + '</div></div>';
}

function renderGameBoard() {
    if (!game) return '<p>Chargement...</p>';
    const monJoueur = game.joueurs.find(j => j.nom === currentUser);
    if (!monJoueur) return '<p>Erreur</p>';
    const myTurn = game.joueurs[game.tour_actuel]?.nom === currentUser;
    const currentPlayerName = game.joueurs[game.tour_actuel]?.nom || '';
    const turnBg = myTurn ? '#28a745' : '#ffd43b';

    let html = '<div class="container"><div style="background:' + turnBg + ';color:white;padding:15px;text-align:center;font-weight:bold;border-radius:10px;margin:10px 0;font-size:18px">';
    html += myTurn ? '🎮 VOTRE TOUR!' : '⏳ ' + currentPlayerName;
    html += '</div><h4>📊 Manche ' + game.manche_actuelle + '</h4>';

    if (game.messages && game.messages.length > 0) {
        html += '<div style="background:#e3f2fd;border-left:4px solid #2196F3;color:#1565c0;padding:12px;margin:10px 0;border-radius:4px;font-weight:500">';
        game.messages.forEach(msg => {
            html += '<div style="margin:5px 0">📢 ' + msg + '</div>';
        });
        html += '</div>';
    }

    html += '<div style="margin:10px 0;padding:8px;background:#f0f0f0;border-radius:8px;font-size:13px">';
    game.joueurs.forEach((j, idx) => {
        const isCurrent = idx === game.tour_actuel;
        const isMe = j.nom === currentUser;
        html += '<div style="padding:2px;' + (isCurrent ? 'font-weight:bold;color:#28a745;font-size:15px' : '') + '">' + (isCurrent ? '▶️ ' : '⭕ ') + j.nom + (isMe ? ' 🎮' : '') + ': ' + j.main.length + '🃏</div>';
    });
    html += '</div>';

    if (game.last_defausse && game.last_defausse.length > 0) {
        html += '<h4>📤 Defausse (' + game.last_defausse.length + ' - Derniere main)</h4><div class="draw-cards-row">';
        game.last_defausse.forEach((c, i) => {
            const disabled = selected_from_pile || !myTurn ? "style='opacity:0.5'" : "";
            const cls = selected_public_card === c ? 'selected' : '';
            html += '<div class="card ' + cls + '" onclick="selectPublicCard(' + i + ')" ' + disabled + '><div class="card-value">' + c.valeur + '</div><div class="card-suit" style="color:' + game.couleurs_couleur[c.couleur] + '">' + game.couleurs_symboles[c.couleur] + '</div></div>';
        });
        html += '</div>';
    }

    html += '<h4>📚 Pioche (' + game.pioche.length + ' cartes)</h4><button onclick="selectPile()" class="' + (selected_from_pile ? 'selected' : '') + '" ' + (selected_public_card || !myTurn ? 'disabled' : '') + '>' + (selected_from_pile ? '✅ Pioche' : '📖 Piocher') + '</button>';

    html += '<h4>🖐️ Main (' + game.calculPoints(monJoueur.main) + ' pts)</h4><div class="hand-cards">';
    monJoueur.main.forEach((c, i) => {
        const cls = selected_cards.includes(i) ? 'selected' : '';
        const op = !myTurn ? "style='opacity:0.7'" : "";
        html += '<div class="card ' + cls + '" onclick="toggleCard(' + i + ')" ' + op + '><div class="card-value">' + c.valeur + '</div><div class="card-suit" style="color:' + game.couleurs_couleur[c.couleur] + '">' + game.couleurs_symboles[c.couleur] + '</div></div>';
    });
    html += '</div><div class="action-section">';

    const canEnd = myTurn && selected_cards.length > 0 && (selected_from_pile || selected_public_card);
    if (game.calculPoints(monJoueur.main) <= 10 && myTurn) {
        html += '<button onclick="callDembel()" style="background:#ff6b35;font-size:16px">🎯 DEMBEL!</button>';
    }
    html += '<button onclick="endTurn()" ' + (canEnd ? '' : 'disabled') + ' style="background:#667eea;font-size:16px">✅ Fin du tour</button></div></div>';

    return html;
}

function renderClassement(scores) {
    const sorted = Object.entries(scores)
        .map(([nom, data]) => ({
            nom: nom,
            points: typeof data === 'object' ? data.points : data,
            dembel: typeof data === 'object' ? data.dembel : false
        }))
        .sort((a,b) => a.points - b.points);

    let html = '<div class="container ranking"><h1>🏆 CLASSEMENT 🏆</h1>';
    const medals = ['🥇', '🥈', '🥉'];
    sorted.forEach((entry, idx) => {
        const emoji = medals[idx] || (idx+1)+'️⃣';
        const dembel = entry.dembel ? ' 🎯 DEMBEL!' : '';
        const bgColor = idx === 0 ? '#fffacd' : idx === 1 ? '#e8e8e8' : idx === 2 ? '#ffe4b5' : '#f5f5f5';
        const borderColor = idx === 0 ? '#ffd700' : idx === 1 ? '#c0c0c0' : idx === 2 ? '#cd7f32' : '#ddd';
        html += '<div class="ranking-item" style="background:' + bgColor + ';padding:15px;margin:10px 0;border-radius:10px;border-left:8px solid ' + borderColor + ';box-shadow:0 4px 8px rgba(0,0,0,0.1)"><div style="font-size:26px;font-weight:bold;display:flex;align-items:center;gap:10px"><span>' + emoji + '</span><span>' + entry.nom + '</span></div><div style="font-size:18px;color:#666;margin-top:5px">💯 ' + entry.points + ' points' + dembel + '</div></div>';
    });
    html += '<button onclick="newGame()" style="width:100%;margin-top:20px;background:#667eea;padding:15px;font-size:18px;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:bold">🔄 Nouvelle partie</button></div>';
    document.getElementById("app").innerHTML = html;
}

function render() {
    const app=document.getElementById("app");
    if (!currentUser) {
        app.innerHTML=renderLogin();
    } else if (!currentRoom) {
        app.innerHTML=renderLobby();
    } else if (!game) {
        app.innerHTML=renderWaiting();
    } else {
        app.innerHTML=renderGameBoard();
    }
}

render();
