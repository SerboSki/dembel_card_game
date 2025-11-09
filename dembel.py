import random

# --- Définition des cartes ---
valeurs = ["As", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Valet", "Dame", "Roi"]
couleurs = ["Trèfle", "Carreau", "Cœur", "Pique"]

# Valeur en points
points_valeur = {
    "As": 1, "2": 2, "3": 3, "4": 4, "5": 5,
    "6": 6, "7": 7, "8": 8, "9": 9, "10": 10,
    "Valet": 10, "Dame": 10, "Roi": 10
}

# --- Construire le paquet ---
def creer_paquet():
    return [f"{v} de {c}" for v in valeurs for c in couleurs]

# --- Mélanger le paquet ---
def melanger(paquet):
    random.shuffle(paquet)
    return paquet

# --- Calcul points d'une main ---
def calcul_points(main):
    return sum(points_valeur[carte.split()[0]] for carte in main)

# --- Affichage main ---
def afficher_main(main):
    for i, carte in enumerate(main, 1):
        print(f"{i}. {carte}")

# --- Tirer carte de la pioche ---
def piocher(pioche):
    if len(pioche) == 0:
        return None
    return pioche.pop(0)

# --- Validation défausse ---
def valide_defausse(main, indices):
    cartes = [main[i] for i in indices]
    n = len(cartes)

    if n == 1:
        return True

    # Vérifier si toutes les cartes ont la même valeur (paire, brelan, carré)
    valeurs_cartes = [c.split()[0] for c in cartes]
    if all(v == valeurs_cartes[0] for v in valeurs_cartes):
        return True

    # Vérifier tierce (suite de 3 cartes de même couleur)
    if n == 3:
        couleurs_cartes = [c.split()[-1] for c in cartes]
        if len(set(couleurs_cartes)) == 1:
            mapping = {v:i for i,v in enumerate(valeurs, 1)}
            indices_valeurs = sorted(mapping[v] for v in valeurs_cartes)
            if indices_valeurs[2] - indices_valeurs[0] == 2 and indices_valeurs[1] - indices_valeurs[0] == 1:
                return True

    return False

# --- Jeu principal ---
def jouer():
    paquet = melanger(creer_paquet())
    main_joueur = [piocher(paquet) for _ in range(7)]
    main_ordi = [piocher(paquet) for _ in range(7)]
    defausse = [piocher(paquet)]  # première carte de la défausse

    print("=== 🃏 Jeu du DUMBLE (Python CLI) ===")
    print("Tu joues contre l'ordinateur. Le but : minimiser tes points.\n")

    dumble_joueur = False
    dumble_ordi = False

    while True:
        # Carte visible pour le joueur au début du tour
        carte_visible_defausse = defausse[-1] if defausse else None

        print("---------------------------------------------")
        if carte_visible_defausse:
            print("Dernière défausse :", carte_visible_defausse)
        else:
            print("Défausse vide")

        print("\nTa main :")
        afficher_main(main_joueur)
        pts = calcul_points(main_joueur)
        print(f"➡️  Total actuel : {pts} points\n")

        # --- Début du tour : annoncer Dumble si possible ---
        if pts <= 10:
            rep = input(f"Tu as {pts} points. Veux-tu annoncer DUMBLE au début de ton tour ? [O/N] : ").strip().upper()
            if rep == "O":
                dumble_joueur = True
                break

        # --- Défausse du joueur ---
        while True:
            choix = input("Entre les numéros des cartes à défausser (1 à 4 cartes, ex: 1 3 5) : ").split()
            if len(choix) == 0 or len(choix) > 4:
                print("⚠️  Tu dois défausser entre 1 et 4 cartes.")
                continue
            try:
                indices = [int(c)-1 for c in choix]
            except:
                print("⚠️ Entrée invalide")
                continue
            if any(i < 0 or i >= len(main_joueur) for i in indices):
                print("⚠️ Indices hors limites")
                continue
            if not valide_defausse(main_joueur, indices):
                print("⚠️ Défausse invalide selon les règles (valeurs différentes ou suite incorrecte).")
                continue
            break

        # --- Retirer les cartes de la main et les mettre dans la défausse ---
        indices = sorted(indices, reverse=True)
        cartes_defaussees = []
        for i in indices:
            cartes_defaussees.append(main_joueur.pop(i))
        defausse.extend(cartes_defaussees)

        print("Tu défausses :")
        for carte in cartes_defaussees:
            print(" -", carte)

        # --- Pioche du joueur ---
        choix_pioche = input("Piocher sur (P)pioche ou (D)défausse ? [P/D] : ").strip().upper()
        if choix_pioche == "D" and carte_visible_defausse:
            if carte_visible_defausse in defausse:
                main_joueur.append(defausse.pop(defausse.index(carte_visible_defausse)))
                print(f"Tu as pioché sur la défausse : {carte_visible_defausse}")
            else:
                # Carte déjà prise, fallback sur pioche
                print("⚠️ Carte déjà prise ! Piocher sur la pioche à la place.")
                carte = piocher(paquet)
                if carte:
                    main_joueur.append(carte)
                    print("Tu as pioché sur la pioche.")
        else:
            carte = piocher(paquet)
            if carte:
                main_joueur.append(carte)
                print("Tu as pioché sur la pioche.")

        # --- Tour de l'ordinateur ---
        print("\n💻 Tour de l'ordinateur...")
        if main_ordi:
            defausse.append(main_ordi.pop(0))
        if paquet:
            main_ordi.append(piocher(paquet))
        pts_ordi = calcul_points(main_ordi)
        if pts_ordi <= 10 and random.randint(0,3) == 0:
            dumble_ordi = True
            print(f"💻 L'ordinateur annonce DUMBLE ! ({pts_ordi} pts)")
            break

    # --- Fin de manche ---
    pts = calcul_points(main_joueur)
    pts_ordi = calcul_points(main_ordi)

    print("\n=== Fin de la manche ===")
    print("Tes cartes :")
    for c in main_joueur:
        print(" -", c)
    print("→", pts, "points")

    print("\nCartes ordi :")
    for c in main_ordi:
        print(" -", c)
    print("→", pts_ordi, "points\n")

    if dumble_joueur:
        if pts <= pts_ordi:
            print("🎉 Tu gagnes la manche !")
        else:
            print("😬 Tu as perdu, tes points sont doublés.")
            pts *= 2
    elif dumble_ordi:
        if pts_ordi <= pts:
            print("💻 L'ordinateur gagne la manche !")
        else:
            print("🎉 Tu gagnes la manche !")
    else:
        print("Fin de manche sans Dumble annoncé.")

    print(f"\nRésultat final : Toi = {pts} pts | Ordi = {pts_ordi} pts")
    print("Merci d'avoir joué à DUMBLE 🃏")

# --- Lancer le jeu ---
if __name__ == "__main__":
    jouer()
