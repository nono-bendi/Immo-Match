import anthropic
from dotenv import load_dotenv
import os

load_dotenv()

client = anthropic.Anthropic(
    api_key=os.getenv("ANTHROPIC_API_KEY")
)

def generer_prompt_scoring(client_data, biens_candidats):
    """
    Génère un prompt optimisé pour que Claude fasse un scoring intelligent.
    """
    
    # Construire la description du client
    client_desc = f"""NOM : {client_data.get('nom', 'Non renseigné')}

RECHERCHE :
- Type de bien : {client_data.get('bien', 'Non précisé')}
- Secteur : {client_data.get('ville', 'Non précisé')}
- Quartier souhaité : {client_data.get('quartier', 'Flexible')}
- Budget maximum : {client_data.get('budget', 'Non précisé')}€

CRITÈRES SPÉCIFIQUES :
- État accepté : {client_data.get('etat', 'Non précisé')}
- Critères particuliers : {client_data.get('criteres', 'Aucun')}
- Exposition souhaitée : {client_data.get('expo', 'Non précisé')}
- Stationnement : {client_data.get('stationnement', 'Non précisé')}
- Extérieur : {client_data.get('exterieur', 'Non précisé')}
- Étage : {client_data.get('etage', 'Non précisé')}
- Destination : {client_data.get('destination', 'Non précisé')}
- Observations : {client_data.get('observation', 'Aucune')}"""

    # Construire la liste des biens
    biens_desc = ""
    for i, bien in enumerate(biens_candidats, 1):
        biens_desc += f"""
BIEN #{bien.get('id', i)}
- Type : {bien.get('type', 'Non précisé')}
- Ville : {bien.get('ville', 'Non précisé')}
- Quartier : {bien.get('quartier', 'Non précisé')}
- Prix : {bien.get('prix', 'Non précisé')}€
- Surface : {bien.get('surface', 'Non précisé')}m²
- Pièces : {bien.get('pieces', 'Non précisé')}
- État : {bien.get('etat', 'Non précisé')}
- Description : {bien.get('description', 'Aucune')}
---"""

    prompt = f"""Tu es un agent immobilier expert avec 20 ans d'expérience sur la Côte d'Azur. 
Tu connais parfaitement les quartiers, les prix du marché, et les attentes des clients.

MISSION : Analyse les biens disponibles et évalue leur pertinence pour ce client.

=== CLIENT ===
{client_desc}

=== BIENS DISPONIBLES ===
{biens_desc}

=== INSTRUCTIONS DE SCORING ===

Pour chaque bien, attribue un score de 0 à 100 selon cette logique :

CRITÈRES ESSENTIELS (60 points max) :
- Budget respecté : +25pts (dans budget), +15pts (dépasse <10%), +5pts (dépasse 10-20%), 0pts (dépasse >20%)
- Type de bien correspond : +20pts (exact), +10pts (proche, ex: T2 vs T3)
- Localisation : +15pts (ville + quartier OK), +10pts (ville OK, autre quartier), +5pts (zone étendue)

CRITÈRES IMPORTANTS (25 points max) :
- État du bien compatible : +10pts
- Critères spécifiques respectés : +15pts (exposition, extérieur, étage, etc.)

CRITÈRES BONUS (15 points max) :
- Potentiel non exprimé par le client : +5 à +15pts
  (ex: le client n'a pas demandé de piscine mais le bien en a une et son budget le permet)

ANALYSE INTELLIGENTE :
- Si le client cherche "gros œuvre ok", un bien "refait à neuf" à bon prix reste intéressant
- Si le client a un gros budget mais cherche petit, propose des alternatives plus grandes
- Si "destination = investissement locatif", privilégie rendement et emplacement
- Si "destination = résidence principale", privilégie confort et qualité de vie
- Prends en compte les observations du client

=== FORMAT DE RÉPONSE ===

Pour chaque bien, réponds EXACTEMENT dans ce format :

**BIEN #[id] - [type] à [ville]**
**SCORE : [XX]/100** [🟢 si >75, 🟡 si 50-75, 🔴 si <50]

✅ Points forts :
- [point fort 1]
- [point fort 2]

⚠️ Points d'attention :
- [point faible ou vigilance 1]
- [point faible ou vigilance 2]

💡 Recommandation : [Une phrase sur l'action à mener : proposer en priorité / proposer en alternative / déconseiller / à creuser si le client est flexible sur X]

---

À la fin, donne un RÉSUMÉ avec :
1. Le classement des biens du plus pertinent au moins pertinent
2. Ta recommandation principale pour l'agent immobilier
"""

    return prompt


def scorer_biens(client_data, biens_candidats):
    """
    Appelle Claude pour scorer les biens.
    """
    prompt = generer_prompt_scoring(client_data, biens_candidats)
    
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2048,
        messages=[
            {"role": "user", "content": prompt}
        ]
    )
    
    return message.content[0].text


# ===== TEST =====

if __name__ == "__main__":
    
    # Client test complet
    client_test = {
        "nom": "Barbagallo et Matteuci",
        "bien": "Maison",
        "ville": "Fréjus",
        "quartier": "Centre Ville",
        "budget": 170000,
        "etat": "Gros œuvre ok",
        "criteres": None,
        "expo": None,
        "stationnement": "Garage",
        "exterieur": "Pas nécessaire",
        "etage": None,
        "destination": "Résidence principale",
        "observation": "Ont habité Centre Historique"
    }
    
    # Biens candidats (après pré-filtrage)
    biens_test = [
        {
            "id": 1,
            "type": "Maison",
            "ville": "Fréjus",
            "quartier": "Centre Ville",
            "prix": 165000,
            "surface": 85,
            "pieces": 4,
            "etat": "Travaux à prévoir",
            "description": "Maison de ville avec garage, proche commerces et écoles. Cachet ancien."
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
            "description": "Appartement de caractère dans immeuble ancien, travaux de finition à prévoir. Vue sur place du marché."
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
            "description": "Grande maison familiale avec jardin et piscine. Proche plage, quartier calme."
        }
    ]
    
    print("=" * 60)
    print("TEST DU SCORING INTELLIGENT")
    print("=" * 60)
    print(f"\nClient : {client_test['nom']}")
    print(f"Recherche : {client_test['bien']} à {client_test['ville']}")
    print(f"Budget : {client_test['budget']}€")
    print(f"Observation : {client_test['observation']}")
    print("\n" + "=" * 60)
    print("ANALYSE EN COURS...")
    print("=" * 60 + "\n")
    
    resultat = scorer_biens(client_test, biens_test)
    print(resultat)