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
        this.last_defausse = []; // array of cards (top discard shown on table)
        this.old_defausse = [];  // array of cards to recycle when pioche empty
        this.tour_actuel = 0;
        this.game_over = false;
        this.messages = [];
        this.annonceur_dembel = null;
    }

    // --- utilitaires ---
    melanger(tableau){
        for(let i=tableau.length-1;i>0;i--){
            const j = Math.floor(Math.random()*(i+1));
            [tableau[i], tableau[j]] = [tableau[j], tableau[i]];
        }
        return tableau;
    }

    // crée un id unique pour chaque carte (stable pour la partie)
    _makeCardId(couleur, valeur, idx){
        // forme: COULEUR_VALEUR_index
        return `${couleur}_${valeur}_${idx}`;
    }

    // crée le paquet (avec id unique)
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

    // compare cartes par id si possible, sinon par valeur+couleur
    _cardEqual(a, b){
        if(!a || !b) return false;
        if(a.id !== undefined && b.id !== undefined) return a.id === b.id;
        return a.valeur === b.valeur && a.couleur === b.couleur;
    }

    // retourne true si la carte (par id) existe dans un tableau
    _findIndexByCardId(arr, card){
        if(!Array.isArray(arr) || !card) return -1;
        if(card.id !== undefined){
            return arr.findIndex(c => c && c.id === card.id);
        }
        // fallback : value + couleur
        return arr.findIndex(c => c && c.valeur === card.valeur && c.couleur === card.couleur);
    }

    calculPoints(main){
        return main.reduce((sum, carte)=>sum+this.points_valeur[carte.valeur],0);
    }

    // Méthode défensive de recyclage de la pioche
    _recyclerPioche(){
        // On reconstruit la pioche à partir de old_defausse,
        // mais on exclut toute carte qui se trouve déjà dans :
        // - les mains des joueurs
        // - la last_defausse (top visible)
        if(!this.old_defausse || this.old_defausse.length === 0) {
            // rien à recycler
            return;
        }

        // Construire set d'ids présents dans les mains des joueurs
        const presentIds = new Set();
        for(const p of this.joueurs){
            if(Array.isArray(p.main)){
                for(const c of p.main){
                    if(c && c.id) presentIds.add(c.id);
                    else if(c) presentIds.add(`${c.couleur}_${c.valeur}`); // fallback
                }
            }
        }
        // ajouter la carte(s) de last_defausse dans presentIds pour ne pas les remettre en pioche
        for(const c of this.last_defausse || []){
            if(c && c.id) presentIds.add(c.id);
            else if(c) presentIds.add(`${c.couleur}_${c.valeur}`);
        }

        // Construire candidats à remettre dans la pioche (exclure présents)
        const candidates = [];
        for(const c of this.old_defausse){
            if(!c) continue;
            const idKey = c.id ? c.id : `${c.couleur}_${c.valeur}`;
            if(!presentIds.has(idKey)){
                candidates.push(c);
            } else {
                // Si la carte est déjà dans une main ou dans last_defausse, on l'ignore lors du recyclage.
            }
        }

        // On vide old_defausse (on va reconstruire la pioche à partir des candidats)
        this.old_defausse = [];

        if(candidates.length === 0){
            // Rien à remettre dans la pioche : on laisse pioche vide (rare)
            this.pioche = [];
            return;
        }

        this.pioche = this.melanger(candidates);
        // last_defausse reste inchangé (on ne le met PAS dans la pioche)
    }

    piocher(){
        // Si pioche vide : tenter recycle
        if((!this.pioche || this.pioche.length===0) && this.old_defausse && this.old_defausse.length >= 1){
            this._recyclerPioche();
        }

        if(!this.pioche || this.pioche.length===0) {
            return null;
        }

        // On utilise shift pour garder le comportement initial (début du tableau)
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
            // On ajoute les cartes précédemment sur la table dans old_defausse
            // (les cartes visibles sur table = this.last_defausse)
            if(this.last_defausse && this.last_defausse.length>0){
                // push copies/references : on veut conserver l'objet carte
                this.old_defausse.push(...this.last_defausse);
            }
            // puis on remplace last_defausse par les nouvelles cartes déposées
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
            // Le client a choisi de prendre une carte depuis la défausse (last_defausse)
            // il nous envoie probablement un objet carte (mais pas forcément la même référence)
            // On recherche la carte dans last_defausse par id / valeur+couleur, et on la retire.
            const idx = this._findIndexByCardId(this.last_defausse, carte);
            if(idx!==-1){
                const taken = this.last_defausse.splice(idx,1)[0];
                // on ajoute la carte prise à la main du joueur
                joueur.main.push(taken);
            } else {
                // Par sécurité, si idx introuvable (références divergentes), on tente de chercher dans old_defausse
                const idxOld = this._findIndexByCardId(this.old_defausse, carte);
                if(idxOld!==-1){
                    const taken = this.old_defausse.splice(idxOld,1)[0];
                    joueur.main.push(taken);
                } else {
                    // Si on ne trouve pas, on n'ajoute rien mais on log si debug
                    if(process.env.DEBUG_CARD_COUNT === "1") {
                        console.warn('Warning: carte demandee par client introuvable dans last_defausse/old_defausse', carte);
                    }
                }
            }
        }
        // passer au joueur suivant si il y a des joueurs
        if(this.joueurs && this.joueurs.length > 0) {
            this.tour_actuel=(this.tour_actuel+1)%this.joueurs.length;
        } else {
            this.tour_actuel = 0;
        }
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
        const annonceur_nom = this.annonceur_dembel !== null ? this.joueurs[this.annonceur_dembel].nom : null;
        for(let j of this.joueurs) {
            scores[j.nom] = {
                points: this.calculPoints(j.main),
                dembel: j.nom === annonceur_nom
            };
        }
        if(this.annonceur_dembel!==null){
            const idx=this.annonceur_dembel;
            const score_annonceur=scores[this.joueurs[idx].nom].points;
            const minScore = Math.min(...Object.values(scores).map(s=>s.points));
            if(score_annonceur===minScore){
                scores[this.joueurs[idx].nom].points=0;
            } else {
                scores[this.joueurs[idx].nom].points=score_annonceur*2;
            }
        }
        this.manche_actuelle++;
        this.annonceur_dembel=null;
        return scores;
    }

    // Helper debug : compter toutes les cartes (pioche + old_defausse + last_defausse + mains)
    _countAllCards(){
        const inPlayers = (this.joueurs || []).reduce((acc, p) => acc + (p.main ? p.main.length : 0), 0);
        const piocheCount = this.pioche ? this.pioche.length : 0;
        const oldDefCount = this.old_defausse ? this.old_defausse.length : 0;
        const lastDefCount = this.last_defausse ? this.last_defausse.length : 0;
        return { total: inPlayers + piocheCount + oldDefCount + lastDefCount, breakdown: {inPlayers, piocheCount, oldDefCount, lastDefCount} };
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
            isGameStarted: false
        };
        rooms.set(roomId, room);
        socket.join(roomId);
        users.get(socket.username).currentRoom = roomId;
        socket.emit('room_created', { roomId });
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
        io.to(roomId).emit('player_joined', { username: socket.username, players: room.players });
    });

    socket.on('start_game', () => {
        if (!socket.username) return;
        const userInfo = users.get(socket.username);
        if (!userInfo || !userInfo.currentRoom) return;
        const room = rooms.get(userInfo.currentRoom);
        if (!room || room.hostId !== socket.id) return;
        if (room.players.length < MIN_PLAYERS || room.players.length > MAX_PLAYERS) {
            socket.emit('error_notification', '❌ Min '+MIN_PLAYERS+' joueurs, max '+MAX_PLAYERS);
            return;
        }
        room.isGameStarted = true;
        const game = new DembelGame();
        for (let player of room.players) {
            game.joueurs.push({ nom: player.username, main: [] });
        }
        game.initialiserManche();
        room.gameState = game;
        // Optionnel : debug total cartes
        if(process.env.DEBUG_CARD_COUNT === "1"){
            console.log('DEBUG card counts after init:', game._countAllCards());
        }
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

            // Optionnel debug counts
            if(process.env.DEBUG_CARD_COUNT === "1"){
                console.log('DEBUG card counts after turn:', game._countAllCards());
            }

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
        } else if (action.type === 'dembel') {
            if (!game.canCallDembel()) {
                socket.emit('error_notification', '❌ DEMBEL impossible: points > 10');
                return;
            }
            game.dembel();
            const scores = game.finManche();
            io.to(room.id).emit('game_ended', { scores });
        }
    });

    socket.on('disconnect', () => {
        if (socket.username) {
            users.delete(socket.username);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('🎲 Serveur lancé sur port ' + PORT);
});
