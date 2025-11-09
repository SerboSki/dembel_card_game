class DembelGame {
    constructor() {
        this.valeurs = ["As","2","3","4","5","6","7","8","9","10","Valet","Dame","Roi"];
        this.couleurs = ["Trèfle","Carreau","Cœur","Pique"];
        this.couleurs_symboles = { "Trèfle":"♣","Carreau":"♦","Cœur":"♥","Pique":"♠" };
        this.couleurs_couleur = { "Trèfle":"black","Carreau":"red","Cœur":"red","Pique":"black" };

        this.points_valeur = {};
        this.valeurs.forEach((v,i)=>{ this.points_valeur[v] = Math.min(i+1,10); });

        this.joueurs = [];
        this.mode = "rapide";
        this.scores_cumulatifs = {};
        this.manche_actuelle = 1;
        this.pioche = [];
        this.last_defausse = [];
        this.tour_actuel = 0;
        this.game_over = false;
        this.messages = [];
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
        if(indices.length===0) return false; // au moins 1 carte
        const cartes = indices.map(i=>main[i]);
        const valeurs = cartes.map(c=>c.valeur);
        const couleurs = cartes.map(c=>c.couleur);

        // 1 carte → toujours valide
        if(cartes.length===1) return true;

        // Toutes mêmes valeurs → paire/brelan/carré
        const toutesValeursEgales = valeurs.every(v=>v===valeurs[0]);
        if(toutesValeursEgales) return true;

        // Suite couleur → au moins 3 cartes
        if(cartes.length>=3){
            const toutesCouleursEgales = couleurs.every(c=>c===couleurs[0]);
            if(toutesCouleursEgales){
                const ordre = this.valeurs;
                const indices_vals = valeurs.map(v=>ordre.indexOf(v)).sort((a,b)=>a-b);
                for(let i=1;i<indices_vals.length;i++){
                    if(indices_vals[i]-indices_vals[i-1]!==1){
                        return false; // ce n'est pas une suite
                    }
                }
                return true; // suite valide
            }
        }

        return false; // défausse invalide
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
            this.addMessage("⚠️ Défausse invalide!");
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

    dembel(){ return this.canCallDembel(); }

    finManche(){
        const scores={};
        for(let j of this.joueurs) scores[j.nom]=this.calculPoints(j.main);
        const classement = Object.entries(scores).sort((a,b)=>a[1]-b[1]);
        this.game_over = true;
        return classement;
    }
}

// --- Interface ---
let game=null;
let selected_cards=[];
let selected_public_card=null;
let selected_from_pile=false;

function toggleCard(idx){
    if(selected_cards.includes(idx)) selected_cards = selected_cards.filter(i=>i!==idx);
    else selected_cards.push(idx);
    render();
}

// ------------------------- Sélection unique pioche / défausse -------------------------
function selectPublicCard(idx){
    if(selected_public_card === game.last_defausse[idx]){
        selected_public_card = null;
    } else {
        selected_public_card = game.last_defausse[idx];
        selected_from_pile = false;
    }
    render();
}

function selectPile(){
    if(selected_from_pile){
        selected_from_pile = false;
    } else {
        selected_from_pile = true;
        selected_public_card = null;
    }
    render();
}

// --- FIN DU TOUR AVEC RÈGLE OBLIGATOIRE ---
function endTurn(){
    const joueur = game.joueurs[game.tour_actuel];

    if(!selected_from_pile && !selected_public_card){
        game.addMessage("⚠️ Vous devez piocher une carte avant de finir le tour !");
        render();
        return;
    }

    if(selected_cards.length === 0){
        game.addMessage("⚠️ Vous devez défausser au moins une carte avant de finir le tour !");
        render();
        return;
    }

    if(!game.tourJoueur(selected_cards)) {
        selected_cards = [];
        render();
        return;
    }

    if(selected_from_pile) { game.piocherCarte("pioche"); selected_from_pile = false; }
    if(selected_public_card) { game.piocherCarte(selected_public_card); selected_public_card = null; }

    selected_cards = [];
    game.clearMessages();
    render();
}

function callDembel(){
    const joueur = game.joueurs[game.tour_actuel];
    const pts = game.calculPoints(joueur.main);
    if(pts > 10){
        game.addMessage("❌ Vous devez avoir 10 points ou moins pour DEMBEL!");
        render();
        return;
    }
    alert(`${joueur.nom} annonce DEMBEL! 🎯`);
    const classement = game.finManche();
    renderClassement(classement);
}

// --- Render ---
function render(){
    const app=document.getElementById("app");
    if(!game) app.innerHTML=renderSetup();
    else if(game.game_over) app.innerHTML=renderGameOver();
    else app.innerHTML=renderGameBoard();
}

function renderSetup(){
    return `<div class="container">
        <h1>🃏 Jeu du DEMBEL</h1>
        <div class="form-group">
            <label>Nombre de joueurs humains (0-5):</label>
            <input type="number" id="nb_humains" min="0" max="5" value="1">
        </div>
        <div class="form-group">
            <label>Nombre d'IA (0-5):</label>
            <input type="number" id="nb_ia" min="0" max="5" value="1">
        </div>
        <div class="form-group">
            <label>Mode:</label>
            <button onclick="selectMode('rapide')">Rapide</button>
            <button onclick="selectMode('complet')">Complet</button>
        </div>
        <button onclick="startGame()">▶️ Commencer</button>
    </div>`;
}

function selectMode(mode){ window.selected_mode = mode; }

function startGame(){
    const nb_humains=parseInt(document.getElementById("nb_humains").value);
    const nb_ia=parseInt(document.getElementById("nb_ia").value);
    const total_joueurs = nb_humains + nb_ia;
    const mode=window.selected_mode||"rapide";

    if(total_joueurs < 2){
        alert("❌ Il faut au moins 2 joueurs pour commencer la partie !");
        return;
    }
    if(total_joueurs > 5){
        alert("❌ Le nombre maximum de joueurs est de 5 !");
        return;
    }

    game=new DembelGame();
    game.mode = mode;
    for(let i=0;i<nb_humains;i++) game.joueurs.push({nom:`Joueur ${i+1}`,main:[],humain:true});
    for(let i=0;i<nb_ia;i++) game.joueurs.push({nom:`Ordi ${i+1}`,main:[],humain:false});
    startRound();
}

function startRound(){
    selected_cards=[];
    selected_public_card=null;
    selected_from_pile=false;
    game.initialiserManche();
    render();
}

function renderGameBoard(){
    const joueur = game.joueurs[game.tour_actuel];
    let html=`<div class="container">`;
    html+=`<h3>${joueur.nom} - Manche ${game.manche_actuelle}</h3>`;

    if(game.last_defausse.length>0){
        html+=`<div class="draw-section"><h4>Défausse publique</h4><div class="draw-cards-row">`;
        game.last_defausse.forEach((c,i)=>{
            const disabled = selected_from_pile ? "style='opacity:0.5; pointer-events:none;'" : "";
            html+=`<div class="card selectable ${selected_public_card===c?'selected':''}" onclick="selectPublicCard(${i})" ${disabled}>
                <div class="card-value">${c.valeur}</div>
                <div class="card-suit ${game.couleurs_couleur[c.couleur]}">${game.couleurs_symboles[c.couleur]}</div>
            </div>`;
        });
        html+=`</div></div>`;
    }

    const pioche_disabled = selected_public_card ? "disabled style='opacity:0.5'" : "";
    html+=`<div class="draw-pile-section"><button onclick="selectPile()" ${selected_from_pile ? "style='background:#28a745'" : ""} ${pioche_disabled}>📚 Pioche</button></div>`;

    html+=`<div class="player-hand"><h4>Votre main</h4><div class="hand-cards">`;
    joueur.main.forEach((c,i)=>{
        html+=`<div class="card selectable ${selected_cards.includes(i)?'selected':''}" onclick="toggleCard(${i})">
            <div class="card-value">${c.valeur}</div>
            <div class="card-suit ${game.couleurs_couleur[c.couleur]}">${game.couleurs_symboles[c.couleur]}</div>
        </div>`;
    });
    html+=`</div></div>`;

    // --- Bouton Fin du tour grisé si conditions non remplies ---
    const canEndTurn = (selected_cards.length>0) && (selected_from_pile || selected_public_card);
    const endTurnStyle = canEndTurn ? "" : "disabled style='opacity:0.5; cursor:not-allowed;'";
    html+=`<div class="action-section">`;
    const pts = game.calculPoints(joueur.main);
    if(pts <= 10){
        html+=`<button onclick="callDembel()" style="margin-bottom:10px; background:#28a745; width:100%; padding:12px;">🎯 DEMBEL!</button>`;
    }
    html+=`<button onclick="endTurn()" ${endTurnStyle}>✅ Fin du tour</button></div>`;
    html+=`</div>`;
    return html;
}

function renderClassement(classement){
    let html=`<div class="container"><h1>🏆 Classement final</h1>`;
    html+=`<ol>`;
    classement.forEach(([nom,pts])=>{
        html+=`<li>${nom} - ${pts} points</li>`;
    });
    html+=`</ol><button onclick="newGame()">Nouvelle partie</button></div>`;
    document.getElementById("app").innerHTML = html;
}

function renderGameOver(){ return `<div class="container"><h1>Partie terminée</h1><button onclick="newGame()">Nouvelle partie</button></div>`; }

function newGame(){ game=null; render(); }

render();
