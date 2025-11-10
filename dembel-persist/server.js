const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const users = new Map();
const rooms = new Map();

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 5;

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

    piocher(){
        if(this.pioche.length===0) return null;
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
            this.addMessage("⚠️ Défausse invalide !");
            return false;
        }
        const cartes_defaussees = [];
        const indices_sorted = indices.sort((a,b)=>b-a);
        for(let i of indices_sorted){
            cartes_defaussees.push(joueur.main[i]);
            joueur.main.splice(i,1);
        }
        if(cartes_defaussees.length>0) this.last_defausse = cartes_defaussees;
        return true;
    }

    piocherCarte(carte){
        const joueur = this.joueurs[this.tour_actuel];
        if(carte==="pioche"){
            const c = this.piocher();
            if(c) joueur.main.push(c);
        } else if(carte && carte.valeur){
            joueur.main.push(carte);
            const idx = this.last_defausse.indexOf(carte);
            if(idx!==-1) this.last_defausse.splice(idx,1);
        }
        this.tour_actuel=(this.tour_actuel+1)%this.joueurs.length;
    }

    canCallDembel(){
        const joueur=this.joueurs[this.tour_actuel];
        return this.calculPoints(joueur.main)<=10;
    }

    dembel(){
        if(!this.canCallDembel()) return false;
        this.annonceur_dembel = this.tour_actuel;
        return true;
    }

    finManche(){
        const scores = {};
        for(let j of this.joueurs) scores[j.nom]=this.calculPoints(j.main);
        if(this.annonceur_dembel!==null){
            const idx=this.annonceur_dembel;
            const score_annonceur=scores[this.joueurs[idx].nom];
            const minScore = Math.min(...Object.values(scores));
            if(score_annonceur===minScore){
                scores[this.joueurs[idx].nom]=0;
            } else {
                scores[this.joueurs[idx].nom]=score_annonceur*2;
            }
        }
        this.manche_actuelle++;
        this.annonceur_dembel=null;
        return scores;
    }
}

io.on('connection', (socket) => {
    console.log('✅ Connexion:', socket.id);

    // ✅ RECONNEXION - Restaurer état si possible
    socket.on('reconnect_to_game', (data) => {
        const { username, roomId } = data;
        console.log('🔄 Tentative reconnexion:', username, 'à', roomId);

        const room = rooms.get(roomId);
        if (!room) {
            console.log('❌ Salle inexistante');
            socket.emit('reconnect_failed', 'Salle inexistante');
            return;
        }

        // Vérifier si joueur est dans la partie
        const playerExists = room.players.find(p => p.username === username);
        if (!playerExists) {
            console.log('❌ Joueur pas dans cette salle');
            socket.emit('reconnect_failed', 'Vous n\'êtes pas dans cette salle');
            return;
        }

        // Mettre à jour socketId
        const player = room.players.find(p => p.username === username);
        player.socketId = socket.id;

        // Rejoindre la room socket.io
        socket.join(roomId);
        socket.username = username;

        // Mettre à jour users map
        users.set(username, { socketId: socket.id, currentRoom: roomId });

        console.log('✅ Reconnexion OK:', username);

        // Renvoyer état actuel
        if (room.isGameStarted && room.gameState) {
            socket.emit('game_started', {
                gameState: {
                    joueurs: room.gameState.joueurs,
                    pioche: room.gameState.pioche,
                    last_defausse: room.gameState.last_defausse,
                    tour_actuel: room.gameState.tour_actuel,
                    manche_actuelle: room.gameState.manche_actuelle,
                    messages: room.gameState.messages,
                    annonceur_dembel: room.gameState.annonceur_dembel,
                    couleurs_symboles: room.gameState.couleurs_symboles,
                    couleurs_couleur: room.gameState.couleurs_couleur,
                    points_valeur: room.gameState.points_valeur,
                    valeurs: room.gameState.valeurs,
                    couleurs: room.gameState.couleurs
                }
            });
        } else {
            socket.emit('player_joined', {
                username: username,
                players: room.players
            });
        }
    });

    socket.on('register_user', (username) => {
        username = username.trim();
        if (!username || username.length < 3) {
            socket.emit('registration_error', 'Pseudo trop court');
            return;
        }
        if (users.has(username)) {
            socket.emit('registration_error', 'Pseudo déjà pris');
            return;
        }
        users.set(username, { socketId: socket.id, currentRoom: null });
        socket.username = username;
        socket.emit('registration_success', { username });
        console.log('👤', username);
    });

    socket.on('create_room', () => {
        if (!socket.username) return;
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const room = {
            id: roomId,
            hostId: socket.id,
            players: [{ socketId: socket.id, username: socket.username, isHost: true }],
            gameState: null,
            isGameStarted: false
        };
        rooms.set(roomId, room);
        socket.join(roomId);
        users.get(socket.username).currentRoom = roomId;
        socket.emit('room_created', { roomId });
        console.log('🏠 Salle', roomId);
    });

    socket.on('join_room', (roomId) => {
        if (!socket.username) return;
        const room = rooms.get(roomId);
        if (!room) {
            socket.emit('error_message', 'Salle inexistante');
            return;
        }
        if (room.isGameStarted) {
            socket.emit('error_message', 'Partie commencée');
            return;
        }
        if (room.players.length >= MAX_PLAYERS) {
            socket.emit('error_message', `Max ${MAX_PLAYERS} joueurs`);
            return;
        }
        room.players.push({ socketId: socket.id, username: socket.username, isHost: false });
        socket.join(roomId);
        users.get(socket.username).currentRoom = roomId;
        io.to(roomId).emit('player_joined', { username: socket.username, players: room.players });
        console.log('👋', socket.username, 'rejoint', roomId);
    });

    socket.on('start_game', () => {
        if (!socket.username) return;
        const userInfo = users.get(socket.username);
        if (!userInfo || !userInfo.currentRoom) return;
        const room = rooms.get(userInfo.currentRoom);
        if (!room || room.hostId !== socket.id) return;
        if (room.players.length < MIN_PLAYERS || room.players.length > MAX_PLAYERS) return;

        room.isGameStarted = true;
        const game = new DembelGame();
        for (let player of room.players) {
            game.joueurs.push({ nom: player.username, main: [], humain: true });
        }
        game.initialiserManche();
        room.gameState = game;

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
        console.log('🎮 Partie démarrée');
    });

    socket.on('game_action', (action) => {
        if (!socket.username) {
            console.log('❌ Pas de username');
            return;
        }

        const userInfo = users.get(socket.username);
        if (!userInfo || !userInfo.currentRoom) {
            console.log('❌ User ou room manquant pour', socket.username);
            console.log('   userInfo:', userInfo);
            return;
        }

        const room = rooms.get(userInfo.currentRoom);
        if (!room || !room.isGameStarted) {
            console.log('❌ Room', userInfo.currentRoom, 'inexistante ou partie non démarrée');
            console.log('   Rooms disponibles:', Array.from(rooms.keys()));
            socket.emit('action_error', 'Erreur de connexion, rechargez la page');
            return;
        }

        console.log('📥 Action reçue de', socket.username, ':', action.type);

        const game = room.gameState;
        const playerIndex = game.joueurs.findIndex(j => j.nom === socket.username);

        console.log('Tour actuel:', game.tour_actuel, '- Index joueur:', playerIndex);

        if (playerIndex !== game.tour_actuel) {
            console.log('❌ Pas le tour de', socket.username);
            socket.emit('action_error', 'Pas votre tour');
            return;
        }

        if (action.type === 'turn') {
            console.log('🎴 Défausse:', action.data.defausse);
            console.log('📚 Pioche:', action.data.pioche);

            if (!game.tourJoueur(action.data.defausse)) {
                console.log('❌ Défausse invalide');
                socket.emit('action_error', 'Défausse invalide');
                return;
            }

            if (action.data.pioche === 'pioche') {
                console.log('📚 Pioche de la pile');
                game.piocherCarte('pioche');
            } else if (action.data.pioche) {
                console.log('📚 Pioche de défausse');
                game.piocherCarte(action.data.pioche);
            }

            game.clearMessages();

            console.log('✅ Tour validé, nouveau tour:', game.tour_actuel);
            console.log('📤 Envoi game_update à la room', room.id);

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

            console.log('✅ game_update envoyé');

        } else if (action.type === 'dembel') {
            if (!game.canCallDembel()) {
                socket.emit('action_error', 'Points > 10');
                return;
            }
            game.dembel();
            const scores = game.finManche();
            io.to(room.id).emit('game_ended', { scores });
        }
    });

    socket.on('disconnect', () => {
        if (socket.username) {
            console.log('❌', socket.username, 'déconnecté');
            // Ne pas supprimer immédiatement - permettre reconnexion
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`\n🃏 http://localhost:${PORT}\n`);
});
