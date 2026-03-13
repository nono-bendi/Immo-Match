import anthropic
import pandas as pd
from dotenv import load_dotenv
import os

# Charger les variables d'environnement
load_dotenv()

# Récupérer la clé API depuis le .env
client = anthropic.Anthropic(
    api_key=os.getenv("ANTHROPIC_API_KEY")
)

# Les biens (simulation)
biens = [
    {"id": 1, "type": "Maison", "ville": "Fréjus", "quartier": "Centre Ville", "prix": 165000, "surface": 85, "etat": "Travaux à prévoir", "description": "Maison de ville avec garage"},
    {"id": 2, "type": "T2", "ville": "Saint-Raphaël", "quartier": "Boulouris", "prix": 145000, "surface": 42, "etat": "Bon état", "description": "Appartement lumineux avec balcon vue mer"},
    {"id": 3, "type": "Maison", "ville": "Fréjus", "quartier": "Fréjus Plage", "prix": 320000, "surface": 120, "etat": "Refait à neuf", "description": "Grande maison avec jardin et piscine"},
    {"id": 4, "type": "T3", "ville": "Fréjus", "quartier": "Centre Historique", "prix": 175000, "surface": 65, "etat": "Gros œuvre ok", "description": "Appartement de caractère, travaux de finition"},
    {"id": 5, "type": "T2", "ville": "Fréjus", "quartier": "Centre Ville", "prix": 125000, "surface": 38, "etat": "Correct", "description": "Petit T2 idéal investissement locatif"}
]

# Formater les biens pour Claude
def formater_biens():
    texte = ""
    for b in biens:
        texte += f"Bien #{b['id']}: {b['type']} à {b['ville']} ({b['quartier']})\n"
        texte += f"  Prix: {b['prix']}€ | Surface: {b['surface']}m² | État: {b['etat']}\n"
        texte += f"  {b['description']}\n\n"
    return texte

# Un client test
client_test = {
    "nom": "Barbagallo et Matteuci",
    "bien": "Maison",
    "ville": "Fréjus",
    "quartier": "Centre Ville",
    "budget": 170000,
    "etat": "Gros œuvre ok"
}

# Créer le prompt
prompt = f"""Tu es un agent immobilier expert. Analyse les biens disponibles et trouve les meilleurs matchings pour ce client.

CLIENT:
Nom: {client_test['nom']}
Recherche: {client_test['bien']}
Secteur: {client_test['ville']} - {client_test['quartier']}
Budget max: {client_test['budget']}€
État accepté: {client_test['etat']}

BIENS DISPONIBLES:
{formater_biens()}

Pour chaque bien, donne un score de 0 à 100 et explique pourquoi. Classe les biens du plus pertinent au moins pertinent."""

# Appel à Claude
message = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": prompt}
    ]
)

print("=== RÉSULTAT DU MATCHING ===\n")
print(message.content[0].text)