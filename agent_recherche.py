"""
Agent de recherche immobilière — exemple concret
------------------------------------------------
L'agent reçoit une demande en langage naturel,
décide seul quels outils appeler, et répond avec
les meilleures annonces de ta base.

Usage :
    python agent_recherche.py
"""

import sqlite3
import json
import sys
import anthropic
from dotenv import load_dotenv
load_dotenv()

# UTF-8 sur le terminal Windows
sys.stdout.reconfigure(encoding="utf-8")

DB_PATH = "immomatch.db"
client = anthropic.Anthropic()

# ─────────────────────────────────────────────
# OUTILS que l'agent peut utiliser
# ─────────────────────────────────────────────

def chercher_biens(
    type_bien: str = None,
    ville: str = None,
    budget_max: float = None,
    pieces_min: int = None,
    surface_min: float = None,
) -> str:
    """Cherche des biens dans la base selon les critères."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    query = "SELECT * FROM biens WHERE 1=1"
    params = []

    if type_bien:
        query += " AND LOWER(type) LIKE ?"
        params.append(f"%{type_bien.lower()}%")
    if ville:
        query += " AND LOWER(ville) LIKE ?"
        params.append(f"%{ville.lower()}%")
    if budget_max:
        query += " AND prix <= ?"
        params.append(budget_max)
    if pieces_min:
        query += " AND pieces >= ?"
        params.append(pieces_min)
    if surface_min:
        query += " AND surface >= ?"
        params.append(surface_min)

    query += " ORDER BY prix ASC LIMIT 5"

    rows = conn.execute(query, params).fetchall()
    conn.close()

    if not rows:
        return "Aucun bien trouvé avec ces critères."

    results = []
    for r in rows:
        results.append({
            "reference": r["reference"],
            "type": r["type"],
            "ville": r["ville"],
            "prix": r["prix"],
            "surface": r["surface"],
            "pieces": r["pieces"],
            "description": (r["description"] or "")[:200],
        })
    return json.dumps(results, ensure_ascii=False, indent=2)


def compter_biens(ville: str = None, type_bien: str = None) -> str:
    """Compte combien de biens sont disponibles."""
    conn = sqlite3.connect(DB_PATH)
    query = "SELECT COUNT(*) as total FROM biens WHERE 1=1"
    params = []
    if ville:
        query += " AND LOWER(ville) LIKE ?"
        params.append(f"%{ville.lower()}%")
    if type_bien:
        query += " AND LOWER(type) LIKE ?"
        params.append(f"%{type_bien.lower()}%")
    total = conn.execute(query, params).fetchone()[0]
    conn.close()
    return f"{total} bien(s) disponible(s)"


def fourchette_prix(ville: str = None, type_bien: str = None) -> str:
    """Retourne la fourchette de prix pour un type/ville."""
    conn = sqlite3.connect(DB_PATH)
    query = "SELECT MIN(prix) as min_p, MAX(prix) as max_p, AVG(prix) as avg_p FROM biens WHERE prix > 0"
    params = []
    if ville:
        query += " AND LOWER(ville) LIKE ?"
        params.append(f"%{ville.lower()}%")
    if type_bien:
        query += " AND LOWER(type) LIKE ?"
        params.append(f"%{type_bien.lower()}%")
    row = conn.execute(query, params).fetchone()
    conn.close()
    if not row or not row[0]:
        return "Pas assez de données pour cette recherche."
    return f"Min: {row[0]:,.0f}€  Max: {row[1]:,.0f}€  Moyenne: {row[2]:,.0f}€"


# ─────────────────────────────────────────────
# DÉFINITION DES OUTILS pour Claude
# ─────────────────────────────────────────────

TOOLS = [
    {
        "name": "chercher_biens",
        "description": "Cherche des biens immobiliers dans la base selon des critères. Utilise cet outil quand l'utilisateur veut voir des annonces.",
        "input_schema": {
            "type": "object",
            "properties": {
                "type_bien":    {"type": "string", "description": "Type de bien : appartement, maison, studio..."},
                "ville":        {"type": "string", "description": "Ville ou quartier recherché"},
                "budget_max":   {"type": "number", "description": "Budget maximum en euros"},
                "pieces_min":   {"type": "integer", "description": "Nombre minimum de pièces"},
                "surface_min":  {"type": "number", "description": "Surface minimum en m²"},
            },
        },
    },
    {
        "name": "compter_biens",
        "description": "Compte le nombre de biens disponibles selon des filtres. Utile pour répondre à 'combien y a-t-il de...'",
        "input_schema": {
            "type": "object",
            "properties": {
                "ville":     {"type": "string"},
                "type_bien": {"type": "string"},
            },
        },
    },
    {
        "name": "fourchette_prix",
        "description": "Donne la fourchette de prix (min/max/moyenne) pour un type de bien ou une ville.",
        "input_schema": {
            "type": "object",
            "properties": {
                "ville":     {"type": "string"},
                "type_bien": {"type": "string"},
            },
        },
    },
]

TOOL_MAP = {
    "chercher_biens": chercher_biens,
    "compter_biens": compter_biens,
    "fourchette_prix": fourchette_prix,
}

# ─────────────────────────────────────────────
# BOUCLE AGENT
# ─────────────────────────────────────────────

def agent(question: str) -> str:
    """Lance l'agent avec une question en langage naturel."""
    messages = [{"role": "user", "content": question}]

    print(f"\nQuestion : {question}")
    print("-" * 50)

    while True:
        response = client.messages.create(
            model="claude-opus-4-6",
            max_tokens=1024,
            system=(
                "Tu es un assistant immobilier expert. "
                "Tu aides les clients à trouver des biens en utilisant les outils disponibles. "
                "Réponds toujours en français, de façon concise et utile."
            ),
            tools=TOOLS,
            messages=messages,
        )

        # Claude veut utiliser un outil
        if response.stop_reason == "tool_use":
            # Ajoute la réponse de Claude au contexte
            messages.append({"role": "assistant", "content": response.content})

            # Exécute chaque outil demandé
            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    print(f"  >> Outil: {block.name}({block.input})")
                    result = TOOL_MAP[block.name](**block.input)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": result,
                    })

            # Renvoie les résultats à Claude
            messages.append({"role": "user", "content": tool_results})

        # Claude a fini de répondre
        else:
            final = next(b.text for b in response.content if hasattr(b, "text"))
            print(f"\nRéponse agent :\n{final}")
            return final


# ─────────────────────────────────────────────
# DEMO
# ─────────────────────────────────────────────

if __name__ == "__main__":
    exemples = [
        "Combien y a-t-il d'appartements disponibles ?",
        "Je cherche une maison avec au moins 4 pièces, budget 300 000€",
        "Quel est le prix moyen d'un appartement ?",
    ]

    for question in exemples:
        agent(question)
        print()
