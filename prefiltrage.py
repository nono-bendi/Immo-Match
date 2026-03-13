def prefiltre_biens(client, biens):
    """
    Filtre les biens pour garder uniquement ceux qui ont une chance de matcher.
    """
    candidats = []
    
    for bien in biens:
        exclu = False
        
        # 1. BUDGET : exclut si dépasse de plus de 20%
        if client.get("budget") and bien.get("prix"):
            budget_max_tolere = client["budget"] * 1.20
            if bien["prix"] > budget_max_tolere:
                exclu = True
        
        # 2. TYPE DE BIEN
        if client.get("bien") and bien.get("type") and not exclu:
            type_client = client["bien"].lower().strip()
            type_bien = bien["type"].lower().strip()
            
            # "Tous biens" = on garde tout
            if "tous biens" not in type_client:
                
                # LOCAL COMMERCIAL : ne matcher qu'avec des locaux
                if "local" in type_client:
                    if "local" not in type_bien:
                        exclu = True
                
                # MAISON (inclut "maison de village", "maison de ville", etc.)
                elif "maison" in type_client:
                    if "maison" not in type_bien:
                        exclu = True
                
                # APPARTEMENTS T1 à T5
                elif "t1" in type_client:
                    if "t1" not in type_bien:
                        exclu = True
                elif "t2" in type_client:
                    if "t2" not in type_bien:
                        exclu = True
                elif "t3" in type_client:
                    if "t3" not in type_bien:
                        exclu = True
                elif "t4" in type_client:
                    if "t4" not in type_bien:
                        exclu = True
                elif "t5" in type_client:
                    if "t5" not in type_bien:
                        exclu = True
        
        # 3. VILLE / SECTEUR
        if client.get("ville") and bien.get("ville") and not exclu:
            ville_client = client["ville"].lower().strip()
            ville_bien = bien["ville"].lower().strip()
            
            # "Tous secteurs" = on garde tout
            if "tous secteurs" not in ville_client:
                
                # Cas spécial : "De Fréjus à SR" ou "Fréjus à Saint-Raphaël"
                if "fréjus" in ville_client and ("sr" in ville_client or "saint" in ville_client or "raphael" in ville_client or "raphaël" in ville_client):
                    # Accepte Fréjus ET Saint-Raphaël
                    if "fréjus" not in ville_bien and "saint" not in ville_bien and "raphaël" not in ville_bien and "raphael" not in ville_bien:
                        exclu = True
                
                # Cas normal : ville simple
                else:
                    if ville_client not in ville_bien and ville_bien not in ville_client:
                        exclu = True
        
        if not exclu:
            candidats.append(bien)
    
    return candidats


# ===== TESTS =====

# Biens simulés (ajout d'un local commercial)
biens = [
    {"id": 1, "type": "Maison", "ville": "Fréjus", "quartier": "Centre Ville", "prix": 165000},
    {"id": 2, "type": "T2", "ville": "Saint-Raphaël", "quartier": "Boulouris", "prix": 145000},
    {"id": 3, "type": "Maison", "ville": "Fréjus", "quartier": "Fréjus Plage", "prix": 320000},
    {"id": 4, "type": "T3", "ville": "Fréjus", "quartier": "Centre Historique", "prix": 175000},
    {"id": 5, "type": "T2", "ville": "Fréjus", "quartier": "Centre Ville", "prix": 125000},
    {"id": 6, "type": "Maison", "ville": "Nice", "quartier": "Vieux Nice", "prix": 450000},
    {"id": 7, "type": "T5", "ville": "Cannes", "quartier": "Croisette", "prix": 890000},
    {"id": 8, "type": "Local commercial", "ville": "Fréjus", "quartier": "Centre Ville", "prix": 150000},
]

print("=" * 50)
print("TEST 1 : Maison à Fréjus")
print("=" * 50)

client_test = {
    "nom": "Barbagallo et Matteuci",
    "bien": "Maison",
    "ville": "Fréjus",
    "budget": 170000,
}

print(f"Client: {client_test['nom']}")
print(f"Recherche: {client_test['bien']} à {client_test['ville']}, budget {client_test['budget']}€")

candidats = prefiltre_biens(client_test, biens)

print(f"Biens après pré-filtrage: {len(candidats)}")
for b in candidats:
    print(f"  ✓ Bien #{b['id']}: {b['type']} à {b['ville']} - {b['prix']}€")


print("\n" + "=" * 50)
print("TEST 2 : T2 tous secteurs")
print("=" * 50)

client_test2 = {
    "nom": "Mr Pucelle",
    "bien": "T2 mini",
    "ville": "Tous secteurs",
    "budget": 170000,
}

print(f"Client: {client_test2['nom']}")
print(f"Recherche: {client_test2['bien']} à {client_test2['ville']}, budget {client_test2['budget']}€")

candidats2 = prefiltre_biens(client_test2, biens)

print(f"Biens après pré-filtrage: {len(candidats2)}")
for b in candidats2:
    print(f"  ✓ Bien #{b['id']}: {b['type']} à {b['ville']} - {b['prix']}€")


print("\n" + "=" * 50)
print("TEST 3 : Local commercial à Fréjus")
print("=" * 50)

client_test3 = {
    "nom": "Mr et Mme Salas",
    "bien": "Local comm.",
    "ville": "Fréjus",
    "budget": 160000,
}

print(f"Client: {client_test3['nom']}")
print(f"Recherche: {client_test3['bien']} à {client_test3['ville']}, budget {client_test3['budget']}€")

candidats3 = prefiltre_biens(client_test3, biens)

print(f"Biens après pré-filtrage: {len(candidats3)}")
for b in candidats3:
    print(f"  ✓ Bien #{b['id']}: {b['type']} à {b['ville']} - {b['prix']}€")


print("\n" + "=" * 50)
print("TEST 4 : T2 de Fréjus à Saint-Raphaël")
print("=" * 50)

client_test4 = {
    "nom": "Mr et Mme Garcia",
    "bien": "T2 mini",
    "ville": "De Fréjus à SR",
    "budget": 140000,
}

print(f"Client: {client_test4['nom']}")
print(f"Recherche: {client_test4['bien']} à {client_test4['ville']}, budget {client_test4['budget']}€")

candidats4 = prefiltre_biens(client_test4, biens)

print(f"Biens après pré-filtrage: {len(candidats4)}")
for b in candidats4:
    print(f"  ✓ Bien #{b['id']}: {b['type']} à {b['ville']} - {b['prix']}€")


print("\n" + "=" * 50)
print("TEST 5 : Client sans budget (Tous biens, Fréjus)")
print("=" * 50)

client_test5 = {
    "nom": "Mr Elbou",
    "bien": "Tous biens",
    "ville": "Fréjus",
    "budget": None,
}

print(f"Client: {client_test5['nom']}")
print(f"Recherche: {client_test5['bien']} à {client_test5['ville']}, budget {client_test5['budget']}")

candidats5 = prefiltre_biens(client_test5, biens)

print(f"Biens après pré-filtrage: {len(candidats5)}")
for b in candidats5:
    print(f"  ✓ Bien #{b['id']}: {b['type']} à {b['ville']} - {b['prix']}€")