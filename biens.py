# Simulation de biens immobiliers (en attendant Hektor)

biens = [
    {
        "id": 1,
        "type": "Maison",
        "ville": "Fréjus",
        "quartier": "Centre Ville",
        "prix": 165000,
        "surface": 85,
        "pieces": 4,
        "etat": "Travaux à prévoir",
        "description": "Maison de ville avec garage, proche commerces"
    },
    {
        "id": 2,
        "type": "T2",
        "ville": "Saint-Raphaël",
        "quartier": "Boulouris",
        "prix": 145000,
        "surface": 42,
        "pieces": 2,
        "etat": "Bon état",
        "description": "Appartement lumineux avec balcon vue mer"
    },
    {
        "id": 3,
        "type": "Maison",
        "ville": "Fréjus",
        "quartier": "Fréjus Plage",
        "prix": 320000,
        "surface": 120,
        "pieces": 5,
        "etat": "Refait à neuf",
        "description": "Grande maison familiale avec jardin et piscine"
    },
    {
        "id": 4,
        "type": "T3",
        "ville": "Fréjus",
        "quartier": "Centre Historique",
        "prix": 175000,
        "surface": 65,
        "pieces": 3,
        "etat": "Gros œuvre ok",
        "description": "Appartement de caractère, travaux de finition à prévoir"
    },
    {
        "id": 5,
        "type": "T2",
        "ville": "Fréjus",
        "quartier": "Centre Ville",
        "prix": 125000,
        "surface": 38,
        "pieces": 2,
        "etat": "Correct",
        "description": "Petit T2 idéal investissement locatif"
    }
]

# Fonction pour afficher un bien
def afficher_bien(bien):
    return f"""Bien #{bien['id']} - {bien['type']} à {bien['ville']}
Prix: {bien['prix']}€ | Surface: {bien['surface']}m² | {bien['pieces']} pièces
Quartier: {bien['quartier']} | État: {bien['etat']}
{bien['description']}"""

# Test
for bien in biens:
    print(afficher_bien(bien))
    print("---")