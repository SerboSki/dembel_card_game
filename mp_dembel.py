import random

# --- Définition des cartes ---
valeurs = ["As", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Valet", "Dame", "Roi"]
couleurs = ["Trèfle", "Carreau", "Cœur", "Pique"]
points_valeur = {v: (i + 1 if i < 10 else 10) for i, v in enumerate(valeurs)}

def creer_paquet():
    return [f"{v} de {c}" for v in valeurs for c in couleurs]

def melanger(paquet):
    random.shuffle(paquet)
    return paquet

def calcul_points(main):
    return sum(points_valeur[c.split()[0]] for c in main)

def afficher_main(main):
    for i, c in enumerate(main, 1):
        print(f"{i}. {c}")

def piocher(pioche, defausse):
    """Pioche une carte, reconstitue la pioche si elle est vide."""
    if not pioche:
        if len(defausse) <= 1:
            return None
        nouvelle_pioche = defausse[:-1]
        defausse[:] = defausse[-1:]
        random.shuffle(nouvelle_pioche)
        pioche.extend(nouvelle_pioche)
        print("♻️  Pioche reconstituée à partir de la défausse.")
    return pioche.pop(0) if pioche else None

def valide_defausse(main, indices):
    """Vérifie si les cartes à défausser respectent les règles du jeu."""
    cartes = [main[i] for i in indices]
    n = len(cartes)
    if n == 1:
        return True
    valeurs_cartes = [c.split()[0] for c in cartes]
    if all(v == valeurs_cartes[0] for v in valeurs_cartes):
        return True
    if n == 3:
        couleurs_cartes = [c.split()[-1] for c in cartes]
        if len(set(couleurs_cartes)) == 1:
            mapping = {v: i for i, v in enumerate(valeurs, 1)}
            idx_vals = sorted(mapping[v] for v in valeurs_cartes)
            if idx_vals[2] - idx_vals[0] == 2 and idx_vals[1] - idx_vals[0] == 1:
                return True
    return False

def tour_joueur(joueur, pioche, derniere_defausse, defausse, premier_tour=False):
    print(f"\n=== Tour de {joueur['nom']} ===")
    carte_visible_defausse = defausse[-len(derniere_defausse):] if derniere_defausse else (defausse[-1:] if premier_tour else [])

    if carte_visible_defausse:
        print("Dernière main défaussée :")
        for idx, c in enumerate(carte_visible_defausse, 1):
            print(f"{idx}. {c}")
    else:
        print("Défausse vide")

    print("\nTa main :")
    afficher_main(joueur["main"])
    pts = calcul_points(joueur["main"])
    print(f"➡️ Total actuel : {pts} points")

    # --- DUMBLE ---
    if joueur["humain"] and pts <= 10:
        rep = input(f"Tu as {pts} points. Veux-tu annoncer DUMBLE ? [O/N] ").strip().upper()
        if rep == "O":
            return True, []

    # --- Défausse ---
    if joueur["humain"]:
        while True:
            choix = input("Défaussez 1-4 cartes (ex: 1 3 5) : ").split()
            if len(choix) < 1 or len(choix) > 4:
                print("⚠️ 1 à 4 cartes seulement")
                continue
            try:
                indices = [int(c) - 1 for c in choix]
            except:
                print("⚠️ Entrée invalide")
                continue
            if any(i < 0 or i >= len(joueur["main"]) for i in indices):
                print("⚠️ Indices hors limite")
                continue
            if not valide_defausse(joueur["main"], indices):
                print("⚠️ Défausse invalide")
                continue
            break
    else:
        indices = [0]
        if len(joueur["main"]) >= 2 and joueur["main"][0].split()[0] == joueur["main"][1].split()[0]:
            indices = [0, 1]

    indices = sorted(indices, reverse=True)
    defausse_courante = []
    for i in indices:
        defausse_courante.append(joueur["main"].pop(i))
    print(f"{joueur['nom']} défausse :")
    for c in defausse_courante:
        print(" -", c)
    defausse.extend(defausse_courante)

    # --- Pioche ---
    if joueur["humain"] and carte_visible_defausse:
        print("\nChoisissez une carte à piocher dans la dernière défausse ou dans la pioche :")
        print("0. Pioche")
        for idx, c in enumerate(carte_visible_defausse, 1):
            print(f"{idx}. {c}")
        while True:
            sel = input("Sélectionnez le numéro de la carte à piocher : ")
            try:
                idx = int(sel)
                if idx == 0:
                    carte = piocher(pioche, defausse)
                    if carte:
                        joueur["main"].append(carte)
                    break
                elif 1 <= idx <= len(carte_visible_defausse):
                    c = carte_visible_defausse[idx - 1]
                    joueur["main"].append(c)
                    defausse.remove(c)
                    break
                else:
                    print("Numéro invalide")
            except:
                print("Entrée invalide")
    else:
        carte = piocher(pioche, defausse)
        if carte:
            joueur["main"].append(carte)

    return False, defausse_courante

def jouer_manche(joueurs):
    paquet = melanger(creer_paquet())
    for j in joueurs:
        j["main"] = [piocher(paquet, []) for _ in range(7)]

    defausse = []
    carte_defausse_init = piocher(paquet, defausse)
    if carte_defausse_init:
        defausse.append(carte_defausse_init)
        print("\nPremière carte de la défausse tirée de la pioche :", carte_defausse_init)
    else:
        print("Erreur : la pioche est vide !")

    dumble = False
    n = len(joueurs)
    tour = 0
    derniere_defausse_joueur = [[] for _ in joueurs]

    while not dumble:
        joueur = joueurs[tour % n]
        premier = (tour == 0)
        dumble, jc = tour_joueur(joueur, paquet, derniere_defausse_joueur[(tour - 1) % n], defausse, premier_tour=premier)
        derniere_defausse_joueur[tour % n] = jc
        if dumble:
            break
        tour += 1

    print("\n=== Fin de la manche ===")
    scores = {}
    for j in joueurs:
        pts = calcul_points(j["main"])
        scores[j["nom"]] = pts
        print(f"{j['nom']} : {pts} points")
    return scores

def jouer_multijoueur():
    print("=== 🃏 Jeu du DUMBLE Multi-joueurs ===")
    max_joueurs = 5
    while True:
        nb_h = int(input("Nombre de joueurs humains (1-4) : "))
        nb_ai = int(input("Nombre d'IA (0-4) : "))
        total = nb_h + nb_ai
        if total > max_joueurs or total < 2:
            print(f"⚠️ Nombre total entre 2 et {max_joueurs}")
            continue
        else:
            break

    joueurs = []
    for i in range(nb_h):
        joueurs.append({"nom": f"Joueur {i+1}", "main": [], "humain": True})
    for i in range(nb_ai):
        joueurs.append({"nom": f"Ordi {i+1}", "main": [], "humain": False})

    mode = input("Choisir le mode de jeu : (R)apide ou (C)omplet : ").strip().upper()
    if mode == "R":
        jouer_manche(joueurs)
        print("\n=== Partie rapide terminée ===")
    else:
        scores = {j['nom']: 0 for j in joueurs}
        manche = 1
        fin_partie = False

        while not fin_partie:
            print(f"\n=== Manche {manche} ===")
            pts = jouer_manche(joueurs)

            for nom, p in pts.items():
                scores[nom] += p
                if scores[nom] == 100:
                    print(f"💥 {nom} atteint exactement 100 points et retombe à 50 !")
                    scores[nom] = 50
                elif scores[nom] > 100:
                    print(f"💥 {nom} dépasse 100 points ({scores[nom]}) ! Fin de la partie.")
                    fin_partie = True
                    break

            print("\nScores cumulés :")
            for nom, s in scores.items():
                print(f"{nom} : {s} points")
            manche += 1

        # --- Fin de partie ---
        print("\n=== Partie complète terminée ===")
        classement = sorted(scores.items(), key=lambda x: x[1])
        print("\n🏆 Classement final (du meilleur au pire) :")
        for i, (nom, s) in enumerate(classement, 1):
            print(f"{i}. {nom} - {s} points")

        gagnant = classement[0][0]
        print(f"\n🥇 {gagnant} remporte la partie avec {scores[gagnant]} points !")

if __name__ == "__main__":
    jouer_multijoueur()
