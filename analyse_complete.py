import pandas as pd

# Importer la fonction de pré-filtrage
from prefiltrage import prefiltre_biens

# Biens simulés (en attendant Hektor)
biens = [
    {"id": 1, "type": "Maison", "ville": "Fréjus", "quartier": "Centre Ville", "prix": 165000},
    {"id": 2, "type": "T2", "ville": "Saint-Raphaël", "quartier": "Boulouris", "prix": 145000},
    {"id": 3, "type": "Maison", "ville": "Fréjus", "quartier": "Fréjus Plage", "prix": 320000},
    {"id": 4, "type": "T3", "ville": "Fréjus", "quartier": "Centre Historique", "prix": 175000},
    {"id": 5, "type": "T2", "ville": "Fréjus", "quartier": "Centre Ville", "prix": 125000},
    {"id": 6, "type": "Maison", "ville": "Nice", "quartier": "Vieux Nice", "prix": 450000},
    {"id": 7, "type": "T5", "ville": "Cannes", "quartier": "Croisette", "prix": 890000},
]

# Lire les clients depuis Excel
df = pd.read_excel("Base_de_données_Clients_PP_122025.xlsx", sheet_name="Prospects")

print(f"=== ANALYSE DE {len(df)} CLIENTS ===\n")

total_candidats = 0

for index, row in df.iterrows():
    # Construire le dict client depuis la ligne Excel
    client = {
        "nom": row["Nom "] if pd.notna(row["Nom "]) else "Inconnu",
        "bien": row["Bien "] if pd.notna(row["Bien "]) else None,
        "ville": row["Villes"] if pd.notna(row["Villes"]) else None,
        "budget": row["Budget max"] if pd.notna(row["Budget max"]) else None,
    }
    
    # Pré-filtrage
    candidats = prefiltre_biens(client, biens)
    total_candidats += len(candidats)
    
    # Afficher seulement si y'a des matchs
    if len(candidats) > 0:
        print(f"{client['nom']} ({client['bien']} à {client['ville']}, {client['budget']}€)")
        print(f"  → {len(candidats)} bien(s) potentiel(s)")
        for b in candidats:
            print(f"     - Bien #{b['id']}: {b['type']} à {b['ville']} - {b['prix']}€")
        print()

print(f"=== RÉSUMÉ ===")
print(f"Clients analysés: {len(df)}")
print(f"Total combinaisons possibles: {len(df) * len(biens)}")
print(f"Candidats après pré-filtrage: {total_candidats}")