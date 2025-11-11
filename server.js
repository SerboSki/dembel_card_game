const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.static('public'));

const users = new Map();
const rooms = new Map();

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 5;
const MIN_AI_COUNT = 1;
const MAX_AI_COUNT = 4;

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
        this.old_defausse = [];
        this.tour_actuel = 0;
        this.game_over = false;
        this.messages = [];
        this.annonceur_dembel = null;
    }

    melanger(tableau){
        for(let i=tableau.length-1;i>0;i--){
            const j = Math.floor(Math.random()*(i+1));
            [tableau[i], tableau[j]] = [tableau[j], tableau[i]];
        }
        return tableau;
    }

    _makeCardId(couleur, valeur, idx){
        return `${couleur}_${valeur}_${idx}`;
    }

    creerPaquet() {
        const paquet = [];
        let idx = 0;
        for(let v of this.valeurs){
            for(let c of this.couleurs){
                paquet.push({id: this._makeCardId(c, v, idx), valeur: v, couleur: c});
                idx++;
            }
        }
        return this.melanger(paquet);
    }

    _findIndexByCardId(arr, card){
        if(!Array.isArray(arr) || !card) return -1;
        if(card.id !== undefined){
            return arr.findIndex(c => c && c.id === card.id);
        }
        return arr.findIndex(c => c && c.valeur === card.valeur && c.couleur === card.couleur);
    }

    calculPoints(main){
        return main.reduce((sum, carte)=>sum+this.points_valeur[carte.valeur],0);
    }

    _recyclerPioche(){
        if(!this.old_defausse || this.old_defausse.length === 0) {
            return;
        }

        const presentIds = new Set();
        for(const p of this.joueurs){
            if(Array.isArray(p.main)){
                for(const c of p.main){
                    if(c && c.id) presentIds.add(c.id);
                    else if(c) presentIds.add(`${c.couleur}_${c.valeur}`);
                }
            }
        }
        for(const c of this.last_defausse || []){
            if(c && c.id) presentIds.add(c.id);
            else if(c) presentIds.add(`${c.couleur}_${c.valeur}`);
        }

        const candidates = [];
        for(const c of this.old_defausse){
            if(!c) continue;
            const idKey = c.id ? c.id : `${c.couleur}_${c.valeur}`;
            if(!presentIds.has(idKey)){
                candidates.push(c);
            }
        }

        this.old_defausse = [];

        if(candidates.length === 0){
            this.pioche = [];
            return;
        }

        this.pioche = this.melanger(candidates);
    }

    piocher(){
        if((!this.pioche || this.pioche.length===0) && this.old_defausse && this.old_defausse.length >= 1){
            this._recyclerPioche();
        }

        if(!this.pioche || this.pioche.length===0) {
            return null;
        }

        return this.pioche.shift();
    }

    valideDefausse(indices, main){
        if(indices.length===0) return false;
        const cartes = indices.map(i=>main[i]);
        const valeurs = cartes.map(c=>c.valeur);
        const couleurs = cartes.map(c=>c.couleur);
        if(cartes.length===1) return true;
        const toutesValeursEgales = valeurs.every(v=>v===valeurs[0]);
        if(toutesValeursEgales) return true;
        if(cartes.length>=3){
            const toutesCouleursEgales = couleurs.every(c=>c===couleurs[0]);
            if(toutesCouleursEgales){
                const ordre = this.valeurs;
                const indices_vals = valeurs.map(v=>ordre.indexOf(v)).sort((a,b)=>a-b);
                for(let i=1;i<indices_vals.length;i++){
                    if(indices_vals[i]-indices_vals[i-1]!==1) return false;
                }
                return true;
            }
        }
        return false;
    }

    initialiserManche(){
        this.pioche = this.creerPaquet();
        this.last_defausse = [];
        this.old_defausse = [];
        for(let j of this.joueurs){
            j.main=[];
            for(let i=0;i<7;i++){
                const carte = this.piocher();
                if(carte) j.main.push(carte);
            }
        }
        const premiere_carte = this.piocher();
        if(premiere_carte) this.last_defausse = [premiere_carte];
    }

    addMessage(msg){ this.messages.push(msg); }
    clearMessages(){ this.messages=[]; }

    tourJoueur(indices){
        const joueur = this.joueurs[this.tour_actuel];
        if(indices.length>0 && !this.valideDefausse(indices, joueur.main)){
            this.addMessage("⚠️ Defausse invalide !");
            return false;
        }
        const cartes_defaussees = [];
        const indices_sorted = indices.sort((a,b)=>b-a);
        for(let i of indices_sorted){
            cartes_defaussees.push(joueur.main[i]);
            joueur.main.splice(i,1);
        }

        if(cartes_defaussees.length>0) {
            if(this.last_defausse && this.last_defausse.length>0){
                this.old_defausse.push(...this.last_defausse);
            }
            this.last_defausse = cartes_defaussees;
        }
        return true;
    }

    piocherCarte(carte){
        const joueur = this.joueurs[this.tour_actuel];
        if(carte==="pioche"){
            const c = this.piocher();
            if(c) joueur.main.push(c);
        } else if(carte && carte.valeur){
            const idx = this._findIndexByCardId(this.last_defausse, carte);
            if(idx!==-1){
                const taken = this.last_defausse.splice(idx,1)[0];
                joueur.main.push(taken);
            } else {
                const idxOld = this._findIndexByCardId(this.old_defausse, carte);
                if(idxOld!==-1){
                    const taken = this.old_defausse.splice(idxOld,1)[0];
                    joueur.main.push(taken);
                }
            }
        }
        if(this.joueurs && this.joueurs.length > 0) {
            this.tour_actuel=(this.tour_actuel+1)%this.joueurs.length;
        } else {
            this.tour_actuel = 0;
        }
    }

    canCallDembel(playerIdx){
        const joueur=this.joueurs[playerIdx];
        return this.calculPoints(joueur.main)<=10;
    }

    dembel(playerIdx){
        if(!this.canCallDembel(playerIdx)) return false;
        this.annonceur_dembel = playerIdx;
        console.log('🎯 DEMBEL annonce par index:', playerIdx, '=', this.joueurs[playerIdx].nom);
        return true;
    }

    finManche(){
        const scores = {};

        // Calculer les points de base pour tous les joueurs
        for(let j of this.joueurs) {
            scores[j.nom] = {
                points: this.calculPoints(j.main),
                dembel: false
            };
        }

        console.log('📊 Points de base:', JSON.stringify(scores, null, 2));

        // OPTION B AVEC RANDOM:
        // - Trouver le score minimum
        // - Choisir UN JOUEUR AU HASARD parmi ceux avec le score min
        // - Ce joueur obtient 0 points
        // - Les autres avec le même score gardent leurs points
        // - L'annonceur qui perd → points doublés

        let minScore = Math.min(...Object.values(scores).map(s => s.points));
        console.log('📊 Score minimum:', minScore);

        // Trouver TOUS les joueurs avec le score minimum
        const joueursMin = [];
        for(let i = 0; i < this.joueurs.length; i++){
            if(scores[this.joueurs[i].nom].points === minScore){
                joueursMin.push(i);
            }
        }

        console.log('📊 Joueurs avec score minimum:', joueursMin.map(i => this.joueurs[i].nom));

        // Choisir UN AU HASARD parmi les gagnants
        const gagnantIdx = joueursMin[Math.floor(Math.random() * joueursMin.length)];
        console.log('🏆 GAGNANT (tiré au sort) - 0 pts:', this.joueurs[gagnantIdx].nom);

        // Appliquer les règles
        for(let i = 0; i < this.joueurs.length; i++){
            const joueur = this.joueurs[i];

            if(i === gagnantIdx){
                // Le gagnant aléatoire obtient 0 points
                scores[joueur.nom].points = 0;
                scores[joueur.nom].dembel = (i === this.annonceur_dembel);
                console.log('✅', joueur.nom, '-> 0 points (GAGNANT TIRÉ AU SORT)');
            } else if(i === this.annonceur_dembel){
                // L'annonceur qui perd a les points doublés
                const scoreAnnonceur = scores[joueur.nom].points;
                scores[joueur.nom].points = scoreAnnonceur * 2;
                scores[joueur.nom].dembel = true;
                console.log('❌', joueur.nom, '-> points doublés:', scoreAnnonceur * 2, '(DEMBEL PERDU)');
            }
            // Les autres gardent leurs points normaux
        }

        console.log('📊 Scores FINAUX:', JSON.stringify(scores, null, 2));

        this.annonceur_dembel = null;
        this.manche_actuelle++;

        return scores;
    }
}

io.on('connection', (socket) => {
    console.log('✅ Connexion:', socket.id);

    socket.on('register_user', (username) => {
        username = username.trim();
        if (!username || username.length < 3) {
            socket.emit('error_notification', '⚠️ Pseudo trop court (min 3 caracteres)');
            return;
        }
        if (users.has(username)) {
            socket.emit('error_notification', '⚠️ Pseudo deja utilise');
            return;
        }
        users.set(username, { socketId: socket.id, currentRoom: null });
        socket.username = username;
        console.log('✅ Utilisateur enregistre:', username);
        socket.emit('registration_success', { username });
    });

    socket.on('create_room', () => {
        if (!socket.username) return;
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const room = {
            id: roomId,
            hostId: socket.id,
            players: [{ socketId: socket.id, username: socket.username, isHost: true }],
            gameState: null,
            isGameStarted: false,
            isSolo: false
        };
        rooms.set(roomId, room);
        socket.join(roomId);
        users.get(socket.username).currentRoom = roomId;
        console.log('✅ Salle creee:', roomId, 'par', socket.username);
        socket.emit('room_created', { roomId });
    });

    socket.on('create_solo_room', (data) => {
        if (!socket.username) return;
        const nbAI = data.nbAI;
        console.log('🤖 Demande solo avec', nbAI, 'bot(s)');
        if (nbAI < MIN_AI_COUNT || nbAI > MAX_AI_COUNT) {
            socket.emit('error_notification', '❌ Nombre bot invalide');
            return;
        }
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const players = [{ socketId: socket.id, username: socket.username, isHost: true }];
        const botNames = ['🤖 Bot-Alpha', '🤖 Bot-Beta', '🤖 Bot-Gamma', '🤖 Bot-Delta'];
        for (let i = 0; i < nbAI; i++) {
            players.push({ socketId: 'bot-' + i, username: botNames[i], isHost: false, isAI: true });
        }
        const room = {
            id: roomId,
            hostId: socket.id,
            players: players,
            gameState: null,
            isGameStarted: false,
            isSolo: true,
            nbAI: nbAI
        };
        rooms.set(roomId, room);
        socket.join(roomId);
        users.get(socket.username).currentRoom = roomId;
        console.log('✅ Partie solo creee:', roomId, 'contre', nbAI, 'bot(s)');
        socket.emit('player_joined', { username: socket.username, players: players });
        socket.emit('solo_room_created', { roomId: roomId, nbAI: nbAI });
    });

    socket.on('join_room', (roomId) => {
        if (!socket.username) return;
        const room = rooms.get(roomId);
        if (!room) {
            socket.emit('error_notification', '❌ Salle inexistante');
            return;
        }
        if (room.isGameStarted) {
            socket.emit('error_notification', '❌ Partie deja commencee');
            return;
        }
        if (room.players.length >= MAX_PLAYERS) {
            socket.emit('error_notification', '❌ Salle complete (max '+MAX_PLAYERS+')');
            return;
        }
        room.players.push({ socketId: socket.id, username: socket.username, isHost: false });
        socket.join(roomId);
        users.get(socket.username).currentRoom = roomId;
        console.log('✅ Joueur', socket.username, 'a rejoint la salle', roomId);
        io.to(roomId).emit('player_joined', { username: socket.username, players: room.players });
    });

    socket.on('reconnect_to_game', (data) => {
        const { username, roomId } = data;
        console.log('🔄 Tentative reconnexion:', username, 'roomId:', roomId);

        if (!username || !roomId) {
            console.log('❌ Donnees manquantes pour reconnexion');
            socket.emit('reconnect_failed');
            return;
        }

        const room = rooms.get(roomId);
        if (!room) {
            console.log('❌ Salle non trouvee:', roomId);
            socket.emit('reconnect_failed');
            return;
        }

        const playerInRoom = room.players.find(p => p.username === username);
        if (!playerInRoom) {
            console.log('❌ Joueur', username, 'non trouve dans la salle', roomId);
            socket.emit('reconnect_failed');
            return;
        }

        playerInRoom.socketId = socket.id;
        socket.username = username;

        if (users.has(username)) {
            users.get(username).socketId = socket.id;
            users.get(username).currentRoom = roomId;
        } else {
            users.set(username, { socketId: socket.id, currentRoom: roomId });
        }

        socket.join(roomId);

        console.log('✅ Reconnexion reussie:', username, 'vers salle', roomId);

        if (room.isGameStarted) {
            console.log('📊 Renvoi de letat du jeu');
            const game = room.gameState;
            socket.emit('game_started', {
                gameState: {
                    joueurs: game.joueurs,
                    pioche: game.pioche,
                    last_defausse: game.last_defausse,
                    tour_actuel: game.tour_actuel,
                    manche_actuelle: game.manche_actuelle,
                    messages: game.messages,
                    annonceur_dembel: game.annonceur_dembel,
                    couleurs_symboles: game.couleurs_symboles,
                    couleurs_couleur: game.couleurs_couleur,
                    points_valeur: game.points_valeur,
                    valeurs: game.valeurs,
                    couleurs: game.couleurs
                }
            });
        } else {
            console.log('👥 Renvoi de letat du lobby');
            socket.emit('player_joined', { 
                username: username, 
                players: room.players 
            });
        }
    });

    socket.on('start_game', () => {
        if (!socket.username) return;
        const userInfo = users.get(socket.username);
        if (!userInfo || !userInfo.currentRoom) return;
        const room = rooms.get(userInfo.currentRoom);
        if (!room || room.hostId !== socket.id) return;

        const minRequired = room.isSolo ? 1 : MIN_PLAYERS;
        if (room.players.length < minRequired) {
            socket.emit('error_notification', '❌ Min '+minRequired+' joueurs');
            return;
        }

        room.isGameStarted = true;
        const game = new DembelGame();
        for (let player of room.players) {
            game.joueurs.push({ nom: player.username, main: [], isAI: player.isAI || false });
        }
        game.initialiserManche();
        room.gameState = game;

        console.log('🎮 Partie lancee dans la salle', room.id);

        io.to(room.id).emit('game_started', {
            gameState: {
                joueurs: game.joueurs,
                pioche: game.pioche,
                last_defausse: game.last_defausse,
                tour_actuel: game.tour_actuel,
                manche_actuelle: game.manche_actuelle,
                messages: game.messages,
                annonceur_dembel: game.annonceur_dembel,
                couleurs_symboles: game.couleurs_symboles,
                couleurs_couleur: game.couleurs_couleur,
                points_valeur: game.points_valeur,
                valeurs: game.valeurs,
                couleurs: game.couleurs
            }
        });

        if (room.isSolo && game.joueurs[game.tour_actuel].isAI) {
            scheduleAITurn(room, io);
        }
    });

    socket.on('game_action', (action) => {
        if (!socket.username) return;
        const userInfo = users.get(socket.username);
        if (!userInfo || !userInfo.currentRoom) return;
        const room = rooms.get(userInfo.currentRoom);
        if (!room || !room.isGameStarted) {
            socket.emit('error_notification', '❌ Erreur: partie non trouvee');
            return;
        }
        const game = room.gameState;
        const playerIndex = game.joueurs.findIndex(j => j.nom === socket.username);
        if (playerIndex !== game.tour_actuel) {
            socket.emit('error_notification', '⏳ Ce n est pas votre tour');
            return;
        }
        if (action.type === 'turn') {
            if (!game.tourJoueur(action.data.defausse)) {
                socket.emit('error_notification', '❌ Defausse invalide');
                return;
            }
            if (action.data.pioche === 'pioche') {
                game.piocherCarte('pioche');
            } else if (action.data.pioche) {
                game.piocherCarte(action.data.pioche);
            }
            game.clearMessages();

            io.to(room.id).emit('game_update', {
                gameState: {
                    joueurs: game.joueurs,
                    pioche: game.pioche,
                    last_defausse: game.last_defausse,
                    tour_actuel: game.tour_actuel,
                    manche_actuelle: game.manche_actuelle,
                    messages: game.messages,
                    annonceur_dembel: game.annonceur_dembel
                }
            });

            if (room.isSolo && game.joueurs[game.tour_actuel].isAI) {
                scheduleAITurn(room, io);
            }
        } else if (action.type === 'dembel') {
            const playerIdx = game.joueurs.findIndex(j => j.nom === socket.username);
            if (!game.canCallDembel(playerIdx)) {
                socket.emit('error_notification', '❌ DEMBEL impossible: points > 10');
                return;
            }
            game.dembel(playerIdx);
            const scores = game.finManche();
            io.to(room.id).emit('game_ended', { scores });
        }
    });

    socket.on('leave_room', () => {
        if (!socket.username) return;

        const userInfo = users.get(socket.username);
        if (!userInfo || !userInfo.currentRoom) return;

        const roomId = userInfo.currentRoom;
        const room = rooms.get(roomId);
        if (!room) return;

        console.log('👋 Joueur', socket.username, 'quitte la salle', roomId);

        room.players = room.players.filter(p => p.socketId !== socket.id);

        if (room.isGameStarted) {
            console.log('❌ Partie en cours - Salle supprimee');
            io.to(roomId).emit('error_notification', '❌ ' + socket.username + ' a quitte la partie. Salle fermee.');
            io.to(roomId).emit('room_closed');
            rooms.delete(roomId);
        } else {
            console.log('⭕ Salle dattente - Mise a jour');

            if (room.players.length === 0) {
                console.log('🗑️ Salle', roomId, 'supprimee (vide)');
                rooms.delete(roomId);
            } else {
                if (room.hostId === socket.id && room.players.length > 0) {
                    const newHost = room.players[0];
                    room.hostId = newHost.socketId;
                    newHost.isHost = true;
                    console.log('👑 Nouvel hote elu:', newHost.username);
                }

                io.to(roomId).emit('player_joined', { 
                    username: socket.username + ' a quitte', 
                    players: room.players 
                });
            }
        }

        userInfo.currentRoom = null;
        socket.leave(roomId);
    });

    socket.on('disconnect', () => {
        if (!socket.username) return;

        const userInfo = users.get(socket.username);
        if (!userInfo || !userInfo.currentRoom) {
            users.delete(socket.username);
            return;
        }

        const roomId = userInfo.currentRoom;
        const room = rooms.get(roomId);
        if (!room) {
            users.delete(socket.username);
            return;
        }

        console.log('❌ Deconnexion:', socket.username, 'de la salle', roomId);

        room.players = room.players.filter(p => p.socketId !== socket.id);

        if (room.isGameStarted) {
            console.log('❌ Joueur deconnecte en plein jeu - Salle supprimee');
            io.to(roomId).emit('error_notification', '❌ ' + socket.username + ' a quitte la partie. Salle fermee.');
            io.to(roomId).emit('room_closed');
            rooms.delete(roomId);
        } else {
            console.log('⭕ Joueur deconnecte en salle dattente');

            if (room.players.length === 0) {
                console.log('🗑️ Salle', roomId, 'supprimee (vide)');
                rooms.delete(roomId);
            } else {
                if (room.hostId === socket.id && room.players.length > 0) {
                    const newHost = room.players[0];
                    room.hostId = newHost.socketId;
                    newHost.isHost = true;
                    console.log('👑 Nouvel hote elu:', newHost.username);
                }

                io.to(roomId).emit('player_joined', { 
                    username: socket.username + ' s est deconnecte', 
                    players: room.players 
                });
            }
        }

        users.delete(socket.username);
    });
});

function sendGameState(room, io) {
    const game = room.gameState;
    if (!game) return;

    io.to(room.id).emit('game_update', {
        gameState: {
            joueurs: game.joueurs,
            pioche: game.pioche,
            last_defausse: game.last_defausse,
            tour_actuel: game.tour_actuel,
            manche_actuelle: game.manche_actuelle,
            messages: game.messages,
            annonceur_dembel: game.annonceur_dembel
        }
    });
}

function findBestMove(game) {
    const joueur = game.joueurs[game.tour_actuel];
    const main = joueur.main;

    if (!main || main.length === 0) return null;

    const valeurs = {};
    for (let i = 0; i < main.length; i++) {
        const v = main[i].valeur;
        if (!valeurs[v]) valeurs[v] = [];
        valeurs[v].push(i);
    }

    for (let v in valeurs) {
        if (valeurs[v].length >= 2) {
            return valeurs[v];
        }
    }

    const couleurs = {};
    for (let i = 0; i < main.length; i++) {
        const c = main[i].couleur;
        if (!couleurs[c]) couleurs[c] = [];
        couleurs[c].push(i);
    }

    for (let c in couleurs) {
        if (couleurs[c].length >= 3) {
            const indices = couleurs[c];
            const valeurs_ordre = game.valeurs;
            const vals = indices.map(i => valeurs_ordre.indexOf(main[i].valeur)).sort((a,b)=>a-b);

            let suite = [vals[0]];
            for (let i = 1; i < vals.length; i++) {
                if (vals[i] - vals[i-1] === 1) {
                    suite.push(vals[i]);
                } else {
                    break;
                }
            }

            if (suite.length >= 3) {
                return indices.slice(0, suite.length);
            }
        }
    }

    let cartesCheres = [];
    for (let i = 0; i < main.length; i++) {
        const pts = game.points_valeur[main[i].valeur];
        if (pts >= 10) {
            cartesCheres.push(i);
        }
    }

    if (cartesCheres.length > 0) {
        return [cartesCheres[0]];
    }

    return [Math.floor(Math.random() * main.length)];
}

function scheduleAITurn(room, io) {
    setTimeout(() => {
        const game = room.gameState;
        if (!game || game.joueurs.length === 0) return;

        const joueur = game.joueurs[game.tour_actuel];
        if (!joueur || !joueur.isAI) return;

        console.log('🤖 Tour de', joueur.nom, '- Cartes:', joueur.main.length);

        if (!joueur.main || joueur.main.length === 0) {
            game.tour_actuel = (game.tour_actuel + 1) % game.joueurs.length;
            sendGameState(room, io);
            if (room.isSolo && game.joueurs[game.tour_actuel].isAI) {
                scheduleAITurn(room, io);
            }
            return;
        }

        const indiceDefausse = findBestMove(game);
        if (!indiceDefausse) {
            console.log('❌ Pas de coup possible pour', joueur.nom);
            return;
        }

        console.log('🤖', joueur.nom, 'defausse', indiceDefausse.length, 'carte(s)');
        const playerIdx = game.tour_actuel;
        game.tourJoueur(indiceDefausse);
        game.piocherCarte('pioche');

        const pointsBot = game.calculPoints(joueur.main);
        if (pointsBot <= 10) {
            console.log('🎯', joueur.nom, 'annonce DEMBEL avec', pointsBot, 'points!');
            game.dembel(playerIdx);
            const scores = game.finManche();
            console.log('📊 Scores finaux avec DEMBEL');
            io.to(room.id).emit('game_ended', { scores });
            return;
        }

        sendGameState(room, io);

        if (room.isSolo && game.joueurs[game.tour_actuel].isAI) {
            scheduleAITurn(room, io);
        }
    }, 1500);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('🎲 Serveur lance sur port ' + PORT);
});
