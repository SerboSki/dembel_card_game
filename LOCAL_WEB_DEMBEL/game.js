class DembelGame {
    constructor() {
        this.valeurs = ["As","2","3","4","5","6","7","8","9","10","Valet","Dame","Roi"];
        this.couleurs = ["Trèfle","Carreau","Cœur","Pique"];
        this.couleurs_symboles = { "Trèfle":"♣","Carreau":"♦","Cœur":"♥","Pique":"♠" };
        this.couleurs_couleur = { "Trèfle":"black","Carreau":"red","Cœur":"red","Pique":"black" };

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
                    if(indices_vals[i]-indices_vals[i-1]!==1){
                        return false;
                    }
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

        // ✅ On remplace la défausse publique, on n’accumule pas
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

    isGameOver(){ return this.game_over; }

    getWinner(){
        const scores=this.finManche();
        return Object.entries(scores).sort((a,b)=>a[1]-b[1]);
    }
}

// ------------------ Interface ------------------
let game=null;
let selected_cards=[];
let selected_public_card=null;
let selected_from_pile=false;

function toggleCard(idx){
    if(selected_cards.includes(idx)) selected_cards = selected_cards.filter(i=>i!==idx);
    else selected_cards.push(idx);
    render();
}

function selectPublicCard(idx){
    const carte = game.last_defausse[idx];
    if(selected_public_card === carte){
        selected_public_card = null;
    } else {
        selected_public_card = carte;
        selected_from_pile = false;
    }
    render();
}

function selectPile(){
    if(selected_from_pile){
        selected_from_pile=false;
    } else {
        selected_from_pile=true;
        selected_public_card=null;
    }
    render();
}

function endTurn(){
    const joueur = game.joueurs[game.tour_actuel];
    if(selected_cards.length===0){
        game.addMessage("⚠️ Défausse obligatoire !");
        render(); return;
    }
    if(!selected_from_pile && !selected_public_card){
        game.addMessage("⚠️ Pioche obligatoire !");
        render(); return;
    }

    if(!game.tourJoueur(selected_cards)){
        selected_cards=[]; render(); return;
    }

    if(selected_from_pile){ game.piocherCarte("pioche"); selected_from_pile=false; }
    if(selected_public_card){ game.piocherCarte(selected_public_card); selected_public_card=null; }

    selected_cards=[];
    game.clearMessages();
    render();
}

function callDembel(){
    const joueur = game.joueurs[game.tour_actuel];
    const pts = game.calculPoints(joueur.main);
    if(pts>10){
        game.addMessage("❌ Points supérieurs à 10 !");
        render(); return;
    }
    alert(`${joueur.nom} annonce 🎯 DEMBEL!`);
    game.demble();
    const scores = game.finManche();
    renderClassement(Object.entries(scores), game.annonceur_dembel);
}

function renderSetup(){
    return `<div class="container">
        <h1>🃏 Dembel</h1>
        <div class="form-group"><label>Joueurs humains:</label>
        <input type="number" id="nb_humains" min="0" max="5" value="1"></div>
        <div class="form-group"><label>IA:</label>
        <input type="number" id="nb_ia" min="0" max="5" value="1"></div>
        <div class="form-group"><label>Mode:</label>
        <button class="selected" style="background:#28a745; color:white;">⚡ Rapide</button></div>
        <button onclick="startGame()" style="font-size:18px;">▶️ Commencer</button>
    </div>`;
}

function startGame(){
    const nb_humains=parseInt(document.getElementById("nb_humains").value);
    const nb_ia=parseInt(document.getElementById("nb_ia").value);
    const total=nb_humains+nb_ia;
    if(total<2){ alert("❌ Minimum 2 joueurs"); return; }
    if(total>5){ alert("❌ Maximum 5 joueurs"); return; }

    game=new DembelGame();
    for(let i=0;i<nb_humains;i++) game.joueurs.push({nom:`Joueur ${i+1}`,main:[],humain:true});
    for(let i=0;i<nb_ia;i++) game.joueurs.push({nom:`Ordi ${i+1}`,main:[],humain:false});
    startRound();
}

function startRound(){
    selected_cards=[]; selected_public_card=null; selected_from_pile=false;
    game.initialiserManche();
    render();
}

function renderGameBoard(){
    const joueur = game.joueurs[game.tour_actuel];
    let html=`<div class="container">
        <h3>${joueur.nom} - Manche ${game.manche_actuelle}</h3>`;

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
    html+=`<div class="draw-pile-section"><button onclick="selectPile()" ${selected_from_pile ? "style='background:#28a745; color:white;'" : ""} ${pioche_disabled}>📚 Pioche</button></div>`;

    html+=`<div class="player-hand"><h4>Votre main</h4><div class="hand-cards">`;
    joueur.main.forEach((c,i)=>{
        html+=`<div class="card selectable ${selected_cards.includes(i)?'selected':''}" onclick="toggleCard(${i})">
            <div class="card-value">${c.valeur}</div>
            <div class="card-suit ${game.couleurs_couleur[c.couleur]}">${game.couleurs_symboles[c.couleur]}</div>
        </div>`;
    });
    html+=`</div></div>`;

    const canEndTurn = (selected_cards.length>0) && (selected_from_pile || selected_public_card);
    const endTurnStyle = canEndTurn ? "" : "disabled style='opacity:0.5; cursor:not-allowed;'";
    const pts = game.calculPoints(joueur.main);
    html+=`<div class="action-section">`;
    if(pts<=10) html+=`<button onclick="callDembel()" style="margin-bottom:10px; background:#28a745; color:white; width:100%;">🎯 DEMBEL!</button>`;
    html+=`<button onclick="endTurn()" ${endTurnStyle} style="width:100%;">✅ Fin du tour</button></div>`;

    if(game.messages.length>0){
        html+=`<div class="messages">`;
        game.messages.forEach(msg=>{ html+=`<div class="message">${msg}</div>`; });
        html+=`</div>`;
    }

    html+=`</div>`;
    return html;
}

function renderClassement(scores){
    let html=`<div class="container"><h1>🏆 Classement</h1><ol>`;
    for(let [nom,pts] of scores){
        html+=`<li>${nom} - ${pts} points</li>`;
    }
    html+=`</ol><button onclick="newGame()" style="font-size:16px;">🔄 Nouvelle partie</button></div>`;
    document.getElementById("app").innerHTML = html;
}

function render(){
    const app=document.getElementById("app");
    if(!game) app.innerHTML=renderSetup();
    else app.innerHTML=renderGameBoard();
}

function newGame(){ game=null; render(); }
render();
