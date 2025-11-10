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
    creerPaquet() {
        const paquet = [];
        for(let v of this.valeurs){
            for(let c of this.couleurs){
                paquet.push({valeur:v,couleur:c});
            }
        }
        return this.melanger(paquet);
    }
    melanger(tableau){
        for(let i=tableau.length-1;i>0;i--){
            const j = Math.floor(Math.random()*(i+1));
            [tableau[i], tableau[j]] = [tableau[j], tableau[i]];
        }
        return tableau;
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

// ✅ RESTAURER état au chargement
window.addEventListener('load', () => {
    const savedUser = sessionStorage.getItem('dembel_username');
    const savedRoom = sessionStorage.getItem('dembel_roomId');

    console.log('🔄 Restauration:', savedUser, savedRoom);

    if (savedUser && savedRoom) {
        // Tenter reconnexion
        console.log('🔄 Tentative reconnexion...');
        socket.emit('reconnect_to_game', {
            username: savedUser,
            roomId: savedRoom
        });
    } else {
        render();
    }
});

socket.on('connect', () => {
    console.log('✅ Connecté');
});

socket.on('reconnect_failed', (message) => {
    console.log('❌ Reconnexion échouée:', message);
    // Nettoyer et recommencer
    sessionStorage.removeItem('dembel_username');
    sessionStorage.removeItem('dembel_roomId');
    currentUser = null;
    currentRoom = null;
    game = null;
    render();
});

socket.on('registration_success', (data) => {
    currentUser = data.username;
    sessionStorage.setItem('dembel_username', data.username); // ✅ SAUVEGARDER
    console.log('👤 Connecté:', currentUser);
    render();
});

socket.on('registration_error', (message) => {
    alert('❌ ' + message);
});

socket.on('room_created', (data) => {
    currentRoom = data.roomId;
    sessionStorage.setItem('dembel_roomId', data.roomId); // ✅ SAUVEGARDER
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

    // Si c'est moi qui rejoins (reconnexion)
    if (data.username === currentUser && !currentRoom) {
        const savedRoom = sessionStorage.getItem('dembel_roomId');
        if (savedRoom) {
            currentRoom = savedRoom;
        }
    }

    render();
});

socket.on('player_left', (data) => {
    if (data.players) {
        roomPlayers = data.players.map(p => p.username);
    }
    render();
});

socket.on('game_started', (data) => {
    console.log('🎮 Partie démarrée/restaurée');
    game = new DembelGame();
    Object.assign(game, data.gameState);
    game.couleurs_symboles = data.gameState.couleurs_symboles;
    game.couleurs_couleur = data.gameState.couleurs_couleur;
    game.points_valeur = data.gameState.points_valeur;
    game.valeurs = data.gameState.valeurs;
    game.couleurs = data.gameState.couleurs;
    previousTurn = game.tour_actuel;

    // ✅ Récupérer currentUser et currentRoom si reconnexion
    if (!currentUser) {
        currentUser = sessionStorage.getItem('dembel_username');
    }
    if (!currentRoom) {
        currentRoom = sessionStorage.getItem('dembel_roomId');
    }

    selected_cards = [];
    selected_public_card = null;
    selected_from_pile = false;
    isProcessing = false;

    render();
    if (game.joueurs[game.tour_actuel]?.nom === currentUser) {
        showNotification('🎮 C\'est votre tour!');
    }
});

socket.on('game_update', (data) => {
    console.log('🔄 Mise à jour reçue');
    if (!game) game = new DembelGame();
    Object.assign(game, data.gameState);

    const newTurn = game.tour_actuel;
    if (previousTurn !== newTurn) {
        previousTurn = newTurn;
        const currentPlayerName = game.joueurs[newTurn]?.nom;
        if (currentPlayerName === currentUser) {
            showNotification('🎮 C\'est votre tour!');
            playNotificationSound();
        } else {
            showNotification(`⏳ Tour de ${currentPlayerName}`);
        }
    }

    selected_cards = [];
    selected_public_card = null;
    selected_from_pile = false;
    isProcessing = false;

    render();
});

socket.on('game_ended', (data) => {
    renderClassement(Object.entries(data.scores));
});

socket.on('error_message', (message) => {
    alert('❌ ' + message);
    isProcessing = false;
});

socket.on('action_error', (message) => {
    alert('❌ ' + message);
    isProcessing = false;
});

function showNotification(message) {
    const existingNotif = document.getElementById('game-notification');
    if (existingNotif) existingNotif.remove();
    const notif = document.createElement('div');
    notif.id = 'game-notification';
    notif.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#667eea;color:white;padding:15px 30px;border-radius:10px;font-size:18px;font-weight:bold;box-shadow:0 4px 15px rgba(0,0,0,0.3);z-index:9999;animation:slideDown 0.3s ease-out';
    notif.textContent = message;
    document.body.appendChild(notif);
    setTimeout(() => {
        notif.style.animation = 'slideUp 0.3s ease-out';
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

function playNotificationSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {}
}

function registerUser() {
    const username = document.getElementById('username_input')?.value?.trim();
    if (username) socket.emit('register_user', username);
}

function createRoom() {
    socket.emit('create_room');
}

function joinRoom() {
    const roomId = document.getElementById('room_id_input')?.value?.trim()?.toUpperCase();
    if (roomId) {
        sessionStorage.setItem('dembel_roomId', roomId); // ✅ SAUVEGARDER
        socket.emit('join_room', roomId);
    }
}

function startGame() {
    if (roomPlayers.length < MIN_PLAYERS) {
        alert(`❌ Min ${MIN_PLAYERS} joueurs`);
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

    if (isProcessing) {
        console.log('⏳ Déjà en cours');
        return;
    }

    console.log('Fin tour:');
    console.log('  Cartes:', selected_cards);
    console.log('  Pioche:', selected_from_pile);
    console.log('  Publique:', selected_public_card);
    console.log('  User:', currentUser);
    console.log('  Room:', currentRoom);

    if (!selected_cards || selected_cards.length === 0) {
        alert('⚠️ Sélectionnez au moins UNE carte!');
        return;
    }

    if (!selected_from_pile && !selected_public_card) {
        alert('⚠️ Choisissez pioche OU défausse!');
        return;
    }

    console.log('✅ Envoi');
    isProcessing = true;

    socket.emit('game_action', {
        type: 'turn',
        data: {
            defausse: selected_cards.slice(),
            pioche: selected_from_pile ? 'pioche' : selected_public_card
        }
    });

    setTimeout(() => {
        if (isProcessing) {
            console.log('⚠️ Timeout');
            isProcessing = false;
            render();
        }
    }, 2000);
}

function callDembel() {
    if (!game || isProcessing) return;
    const joueur = game.joueurs.find(j => j.nom === currentUser);
    if (!joueur) return;
    const pts = game.calculPoints(joueur.main);
    if (pts > 10) {
        alert('❌ Points > 10!');
        return;
    }
    if (confirm(`Annoncer DEMBEL avec ${pts} points?`)) {
        socket.emit('game_action', { type: 'dembel', data: {} });
    }
}

function newGame() {
    sessionStorage.removeItem('dembel_username');
    sessionStorage.removeItem('dembel_roomId');
    location.reload();
}

function renderLogin() {
    return `<div class="container">
        <h1>🃏 Dembel</h1>
        <div class="form-group">
            <h3>Créer profil</h3>
            <input type="text" id="username_input" placeholder="Pseudo (min 3)" maxlength="20" />
            <button onclick="registerUser()">✅ Connecter</button>
        </div>
        <div class="info-box">
            <p><strong>${MIN_PLAYERS}-${MAX_PLAYERS} joueurs</strong></p>
        </div>
    </div>`;
}

function renderLobby() {
    return `<div class="container">
        <h1>🃏 Dembel</h1>
        <h3>Bienvenue <strong>${currentUser}</strong></h3>
        <div class="form-group">
            <h4>Créer</h4>
            <button onclick="createRoom()">➕ Créer</button>
        </div>
        <div class="form-group">
            <h4>Rejoindre</h4>
            <input type="text" id="room_id_input" placeholder="Code" maxlength="6" style="text-transform:uppercase" />
            <button onclick="joinRoom()">🚪 Rejoindre</button>
        </div>
    </div>`;
}

function renderWaiting() {
    const canStart = isHost && roomPlayers.length >= MIN_PLAYERS;
    const statusColor = roomPlayers.length < MIN_PLAYERS ? '#ff6b6b' : roomPlayers.length === MAX_PLAYERS ? '#51cf66' : '#ffd43b';
    return `<div class="container">
        <h1>🃏 ${currentRoom}</h1>
        <div style="text-align:center;padding:10px;background:${statusColor};border-radius:8px;margin:10px 0;font-weight:bold">
            ${roomPlayers.length}/${MAX_PLAYERS}
        </div>
        <h3>Joueurs:</h3>
        <ul style="list-style:none;padding:0;text-align:center">
            ${roomPlayers.map(p => `<li style="padding:5px"><strong>${p}</strong>${p === currentUser ? ' (vous)' : ''}${isHost && p === currentUser ? ' 👑' : ''}</li>`).join('')}
        </ul>
        <div style="text-align:center">
            ${isHost ? 
                `<button onclick="startGame()" ${!canStart ? 'disabled' : ''}>▶️ Démarrer</button>` :
                `<p>En attente...</p>`
            }
        </div>
        <div class="info-box"><p><strong>Code:</strong> ${currentRoom}</p></div>
    </div>`;
}

function renderGameBoard() {
    if (!game) return '<p>Chargement...</p>';
    const monJoueur = game.joueurs.find(j => j.nom === currentUser);
    if (!monJoueur) return '<p>Erreur joueur</p>';

    const myTurn = game.joueurs[game.tour_actuel]?.nom === currentUser;
    const currentPlayerName = game.joueurs[game.tour_actuel]?.nom || '';
    const turnBannerStyle = myTurn ? 
        'background:#28a745;color:white;padding:15px;text-align:center;font-size:20px;font-weight:bold;border-radius:10px;margin:10px 0;animation:pulse 2s infinite' :
        'background:#ffd43b;color:#000;padding:15px;text-align:center;font-size:18px;font-weight:bold;border-radius:10px;margin:10px 0';

    let html = `<div class="container">
        <div style="${turnBannerStyle}">
            ${myTurn ? '🎮 VOTRE TOUR!' : '⏳ ' + currentPlayerName}
        </div>
        <h4>Manche ${game.manche_actuelle}</h4>`;

    html += `<div style="margin:10px 0;padding:8px;background:#f0f0f0;border-radius:8px;font-size:13px">`;
    game.joueurs.forEach((j, idx) => {
        const isCurrent = idx === game.tour_actuel;
        const isMe = j.nom === currentUser;
        html += `<div style="padding:2px;${isCurrent ? 'font-weight:bold;color:#28a745' : ''}">
            ${isCurrent ? '▶️' : '⏸️'} ${j.nom}${isMe ? ' (vous)' : ''}: ${j.main.length} 🃏
        </div>`;
    });
    html += `</div>`;

    if (game.last_defausse && game.last_defausse.length > 0) {
        html += `<h4>Défausse</h4><div class="draw-cards-row">`;
        game.last_defausse.forEach((c, i) => {
            const disabled = selected_from_pile || !myTurn || isProcessing ? "style='opacity:0.5;pointer-events:none'" : "";
            const cls = selected_public_card === c ? 'selected' : '';
            html += `<div class="card ${cls}" onclick="selectPublicCard(${i})" ${disabled}>
                <div class="card-value">${c.valeur}</div>
                <div class="card-suit" style="color:${game.couleurs_couleur[c.couleur]}">${game.couleurs_symboles[c.couleur]}</div>
            </div>`;
        });
        html += `</div>`;
    }

    html += `<h4>📚 Pioche</h4>
    <button onclick="selectPile()" 
            class="${selected_from_pile ? 'selected' : ''}" 
            ${selected_public_card || !myTurn || isProcessing ? 'disabled' : ''}>
        ${selected_from_pile ? '✅ Pioche' : 'Piocher'}
    </button>`;

    html += `<h4>Votre main (${game.calculPoints(monJoueur.main)} pts)</h4><div class="hand-cards">`;
    monJoueur.main.forEach((c, i) => {
        const cls = selected_cards.includes(i) ? 'selected' : '';
        const op = !myTurn || isProcessing ? "style='opacity:0.7;pointer-events:none'" : "";
        html += `<div class="card ${cls}" onclick="toggleCard(${i})" ${op}>
            <div class="card-value">${c.valeur}</div>
            <div class="card-suit" style="color:${game.couleurs_couleur[c.couleur]}">${game.couleurs_symboles[c.couleur]}</div>
        </div>`;
    });
    html += `</div>`;

    html += `<div class="action-section">`;
    if (selected_cards.length > 0 && !isProcessing) {
        html += `<p style="color:#28a745;font-weight:bold">✅ ${selected_cards.length} carte(s)</p>`;
    }
    if (selected_from_pile && !isProcessing) {
        html += `<p style="color:#28a745;font-weight:bold">✅ Pioche pile</p>`;
    }
    if (selected_public_card && !isProcessing) {
        html += `<p style="color:#28a745;font-weight:bold">✅ Pioche défausse</p>`;
    }
    if (isProcessing) {
        html += `<p style="color:#ffd43b;font-weight:bold">⏳ En cours...</p>`;
    }

    const canEnd = myTurn && selected_cards.length > 0 && (selected_from_pile || selected_public_card) && !isProcessing;
    if (game.calculPoints(monJoueur.main) <= 10 && myTurn && !isProcessing) {
        html += `<button onclick="callDembel()" style="background:#28a745">🎯 DEMBEL!</button>`;
    }
    html += `<button onclick="endTurn()" ${canEnd ? '' : 'disabled'}>
        ${isProcessing ? '⏳ Envoi...' : '✅ Fin du tour'}
    </button></div>`;

    if (game.messages && game.messages.length > 0) {
        game.messages.forEach(msg => { html += `<div class="message">${msg}</div>`; });
    }

    html += `</div>`;
    return html;
}

function renderClassement(scores) {
    let html = `<div class="container"><h1>🏆 Classement</h1><ol>`;
    for (let [nom, pts] of scores) {
        html += `<li>${nom} - ${pts} pts</li>`;
    }
    html += `</ol><button onclick="newGame()">🔄 Nouveau</button></div>`;
    document.getElementById("app").innerHTML = html;
}

function render() {
    const app = document.getElementById("app");
    if (!currentUser) {
        app.innerHTML = renderLogin();
    } else if (!currentRoom) {
        app.innerHTML = renderLobby();
    } else if (!game) {
        app.innerHTML = renderWaiting();
    } else {
        app.innerHTML = renderGameBoard();
    }
}

render();
