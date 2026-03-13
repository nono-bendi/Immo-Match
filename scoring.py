import anthropic
from dotenv import load_dotenv
import os
import json

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


# ============================================================
# PARTIE 1 — SCORE OBJECTIF (code Python, pas de Claude)
# ============================================================

def calculer_score_objectif(prospect, bien):
    """
    Calcule un score objectif /60 basé sur les critères mesurables.
    Retourne le score et le détail point par point.
    """
    score = 0
    detail = {}

    # --- BUDGET /25 ---
    budget = prospect.get("budget_max")
    prix = bien.get("prix")

    if not budget or not prix:
        # Pas de budget renseigné = on ne pénalise pas
        detail["budget"] = {"points": 15, "note": "Budget non renseigné, score neutre"}
        score += 15
    else:
        ratio = prix / budget  # 1.0 = dans le budget exact
        if ratio <= 1.0:
            pts = 25
            note = f"Dans le budget ({prix:,.0f}€ / {budget:,.0f}€)"
        elif ratio <= 1.10:
            pts = 18
            note = f"Dépasse de {(ratio-1)*100:.0f}% ({prix:,.0f}€ / {budget:,.0f}€)"
        elif ratio <= 1.20:
            pts = 10
            note = f"Dépasse de {(ratio-1)*100:.0f}% ({prix:,.0f}€ / {budget:,.0f}€)"
        else:
            pts = 0
            note = f"Hors budget ({(ratio-1)*100:.0f}% de dépassement)"
        detail["budget"] = {"points": pts, "note": note}
        score += pts

    # --- TYPE DE BIEN /20 ---
    type_prospect = (prospect.get("bien") or "").lower().strip()
    type_bien = (bien.get("type") or "").lower().strip()

    if not type_prospect or "tous biens" in type_prospect:
        pts = 15
        note = "Type non spécifié, score neutre"
    else:
        # Correspondance exacte ou proche
        if type_prospect in type_bien or type_bien in type_prospect:
            pts = 20
            note = f"Type exact ({bien.get('type')})"
        # Maison vs maison de ville/village = ok
        elif "maison" in type_prospect and "maison" in type_bien:
            pts = 20
            note = f"Type compatible ({bien.get('type')})"
        # Appartement : tolérance ±1 pièce (T2 peut accepter T3 etc.)
        elif _types_proches(type_prospect, type_bien):
            pts = 10
            note = f"Type proche ({bien.get('type')} vs {prospect.get('bien')})"
        else:
            pts = 0
            note = f"Type incompatible ({bien.get('type')} vs {prospect.get('bien')})"

    detail["type"] = {"points": pts, "note": note}
    score += pts

    # --- VILLE / ZONE /15 ---
    ville_prospect = (prospect.get("villes") or "").lower().strip()
    ville_bien = (bien.get("ville") or "").lower().strip()

    if not ville_prospect or "tous secteurs" in ville_prospect:
        pts = 10
        note = "Zone non spécifiée, score neutre"
    elif ville_prospect in ville_bien or ville_bien in ville_prospect:
        pts = 15
        note = f"Ville exacte ({bien.get('ville')})"
    elif _villes_compatibles(ville_prospect, ville_bien):
        pts = 10
        note = f"Zone compatible ({bien.get('ville')})"
    else:
        pts = 0
        note = f"Hors zone ({bien.get('ville')} vs {prospect.get('villes')})"

    detail["ville"] = {"points": pts, "note": note}
    score += pts

    return score, detail


def _types_proches(t1, t2):
    """Vérifie si deux types d'appartements sont à ±1 pièce."""
    types_appart = ["t1", "t2", "t3", "t4", "t5"]
    idx1 = next((i for i, t in enumerate(types_appart) if t in t1), None)
    idx2 = next((i for i, t in enumerate(types_appart) if t in t2), None)
    if idx1 is not None and idx2 is not None:
        return abs(idx1 - idx2) == 1
    return False


def _villes_compatibles(ville_prospect, ville_bien):
    """Gère les cas spéciaux de zones géographiques."""
    # "De Fréjus à SR" / "Fréjus à Saint-Raphaël"
    if "fréjus" in ville_prospect and ("sr" in ville_prospect or "saint" in ville_prospect or "raphaël" in ville_prospect):
        return "fréjus" in ville_bien or "raphaël" in ville_bien or "raphael" in ville_bien
    return False


# ============================================================
# PARTIE 2 — SCORE QUALITATIF (Claude)
# ============================================================

def construire_contexte_bien(bien):
    """Formate les infos d'un bien pour le prompt Claude."""

    # Étage
    etage_str = "Non renseigné"
    if bien.get("etage_bien") is not None:
        etage_str = f"Étage {bien['etage_bien']}"
        if bien.get("nb_etages_immeuble"):
            etage_str += f"/{bien['nb_etages_immeuble']}"
        etage_str += " (avec ascenseur)" if bien.get("ascenseur") == 1 else " (sans ascenseur)"

    # Extérieurs
    exterieurs = []
    if bien.get("terrasse") == 1: exterieurs.append("terrasse")
    if bien.get("nb_balcons") and bien["nb_balcons"] > 0:
        exterieurs.append(f"{bien['nb_balcons']} balcon(s)")
    exterieur_str = ", ".join(exterieurs) if exterieurs else "Aucun"

    # Stationnement
    stats = []
    if bien.get("nb_parkings") and bien["nb_parkings"] > 0:
        stats.append(f"{bien['nb_parkings']} parking(s)")
    if bien.get("nb_boxes") and bien["nb_boxes"] > 0:
        stats.append(f"{bien['nb_boxes']} box(es)")
    if bien.get("cave") == 1: stats.append("cave")
    stationnement_str = ", ".join(stats) if stats else "Aucun"

    # Orientations
    orientations = []
    for k, label in [("orientation_sud", "Sud"), ("orientation_est", "Est"),
                     ("orientation_ouest", "Ouest"), ("orientation_nord", "Nord")]:
        if bien.get(k) == 1: orientations.append(label)
    orientation_str = ", ".join(orientations) if orientations else "Non renseignée"

    # DPE
    dpe_str = "Non renseigné"
    if bien.get("dpe_lettre"):
        dpe_str = f"Classe {bien['dpe_lettre']}"
        if bien.get("dpe_kwh"): dpe_str += f" ({bien['dpe_kwh']} kWh/m²/an)"

    ges_str = "Non renseigné"
    if bien.get("ges_lettre"):
        ges_str = f"Classe {bien['ges_lettre']}"
        if bien.get("ges_co2"): ges_str += f" ({bien['ges_co2']} kg CO₂/m²/an)"

    return f"""
- Référence : {bien.get('reference', 'N/A')}
- Type : {bien.get('type', 'N/A')}
- Ville : {bien.get('ville', 'N/A')} — {bien.get('quartier', 'quartier non précisé')}
- Prix : {bien.get('prix', 'N/A')}€
- Surface : {bien.get('surface', 'N/A')}m² — {bien.get('pieces', '?')} pièces ({bien.get('chambres', '?')} chambres)
- Étage : {etage_str}
- Extérieur : {exterieur_str}
- Stationnement : {stationnement_str}
- Orientation : {orientation_str}
- DPE : {dpe_str} | GES : {ges_str}
- Description : {(bien.get('description') or 'Aucune')[:600]}
- Points négatifs (usage interne) : {(bien.get('defauts') or 'Aucun renseigné')}"""


def construire_contexte_prospect(prospect):
    """Formate le profil d'un prospect pour le prompt Claude."""

    champs = [
        ("Type de bien recherché", prospect.get("bien")),
        ("Zone géographique", prospect.get("villes")),
        ("Quartier souhaité", prospect.get("quartiers")),
        ("Budget maximum", f"{prospect.get('budget_max'):,.0f}€" if prospect.get("budget_max") else None),
        ("État accepté", prospect.get("etat")),
        ("Critères spécifiques", prospect.get("criteres")),
        ("Exposition souhaitée", prospect.get("expo")),
        ("Stationnement", prospect.get("stationnement")),
        ("Copropriété", prospect.get("copro")),
        ("Extérieur", prospect.get("exterieur")),
        ("Étage préféré", prospect.get("etage")),
        ("Destination", prospect.get("destination")),
        ("Observations", prospect.get("observation")),
    ]

    lignes = []
    for label, val in champs:
        if val:
            lignes.append(f"- {label} : {val}")
        else:
            lignes.append(f"- {label} : Non renseigné (client flexible sur ce point)")

    return "\n".join(lignes)


def scorer_bien_claude(prospect, bien, score_objectif, detail_objectif):
    """
    Demande à Claude uniquement le score qualitatif /40.
    Retourne un dict avec score_qualitatif, points_forts, points_attention, recommandation.
    """

    detail_str = "\n".join([
        f"  • {k.capitalize()} : {v['points']} pts — {v['note']}"
        for k, v in detail_objectif.items()
    ])

    prompt = f"""Tu es un agent immobilier expert sur la Côte d'Azur (Fréjus, Saint-Raphaël).

Un système automatique a déjà calculé un score objectif pour ce bien :
SCORE OBJECTIF : {score_objectif}/60
Détail :
{detail_str}

Ton rôle est d'attribuer un SCORE QUALITATIF /40 basé sur ce que le code ne peut pas évaluer :
- La pertinence du bien par rapport à la destination du client (résidence principale, investissement, rénovation)
- L'adéquation entre la description du bien et les attentes implicites du client
- Les critères de confort si renseignés (stationnement, extérieur, exposition, étage)
- Le potentiel de "coup de cœur" ou les signaux d'incompatibilité subtils

RÈGLES IMPORTANTES :
- Un champ vide côté prospect = client flexible sur ce point → jamais de pénalité
- Ne recalcule pas le budget, le type ou la ville (déjà dans le score objectif)
- Sois honnête : un bien moyen ne mérite pas 35/40
- Raisonne sur l'ensemble, pas critère par critère
- Si le bien a des "Points négatifs" renseignés : évalue leur impact réel sur CE prospect (un vis-à-vis peut être rédhibitoire pour l'un, sans importance pour l'autre). Pénalise le score qualitatif en conséquence et mentionne le point négatif pertinent dans points_attention

=== PROSPECT : {prospect.get('nom', 'N/A')} ===
{construire_contexte_prospect(prospect)}

=== BIEN #{bien.get('id')} ===
{construire_contexte_bien(bien)}

Réponds UNIQUEMENT en JSON valide, sans texte avant ou après :
{{
  "score_qualitatif": <entier 0-40>,
  "points_forts": ["point 1", "point 2", "point 3"],
  "points_attention": ["point 1", "point 2"],
  "recommandation": "Une phrase d'action concrète pour l'agent"
}}"""

    message = client.messages.create(
        model="claude-opus-4-20250514",
        max_tokens=600,
        messages=[{"role": "user", "content": prompt}]
    )

    raw = message.content[0].text.strip()

    # Nettoyage au cas où Claude ajoute des backticks
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    return json.loads(raw)


# ============================================================
# PARTIE 3 — ORCHESTRATEUR PRINCIPAL
# ============================================================

def scorer_biens(prospect, biens_candidats):
    """
    Point d'entrée principal. Remplace scorer_biens() de prompt_scoring.py.
    Retourne une liste de résultats triés par score final décroissant.
    """
    resultats = []

    for bien in biens_candidats:
        # 1. Score objectif (instantané, gratuit)
        score_obj, detail_obj = calculer_score_objectif(prospect, bien)

        # 2. Score qualitatif (Claude)
        try:
            qualitatif = scorer_bien_claude(prospect, bien, score_obj, detail_obj)
        except Exception as e:
            print(f"Erreur Claude pour bien #{bien.get('id')}: {e}")
            qualitatif = {
                "score_qualitatif": 15,
                "points_forts": ["Analyse indisponible"],
                "points_attention": ["Erreur lors de l'analyse IA"],
                "recommandation": "Vérifier manuellement ce bien."
            }

        score_final = score_obj + qualitatif["score_qualitatif"]

        resultats.append({
            "bien_id": bien.get("id"),
            "bien_ref": bien.get("reference"),
            "bien_label": f"{bien.get('type')} à {bien.get('ville')}",
            "score": score_final,
            "score_objectif": score_obj,
            "score_qualitatif": qualitatif["score_qualitatif"],
            "detail_objectif": detail_obj,
            "points_forts": qualitatif["points_forts"],
            "points_attention": qualitatif["points_attention"],
            "recommandation": qualitatif["recommandation"],
        })

    # Trier du plus pertinent au moins pertinent
    resultats.sort(key=lambda x: x["score"], reverse=True)
    return resultats


def formater_pour_affichage(resultats):
    """
    Formate les résultats pour l'affichage dans le frontend (compatible avec le parsing existant).
    Génère le même format texte que l'ancien prompt_scoring.py.
    """
    lignes = []

    for r in resultats:
        emoji = "🟢" if r["score"] >= 75 else "🟡" if r["score"] >= 50 else "🔴"
        lignes.append(f"**BIEN #{r['bien_id']} - {r['bien_label']}**")
        lignes.append(f"**SCORE : {r['score']}/100** {emoji}")
        lignes.append(f"*(Objectif : {r['score_objectif']}/60 | Qualitatif : {r['score_qualitatif']}/40)*")
        lignes.append("")
        lignes.append("✅ Points forts :")
        for pf in r["points_forts"]:
            lignes.append(f"- {pf}")
        lignes.append("")
        lignes.append("⚠️ Points d'attention :")
        for pa in r["points_attention"]:
            lignes.append(f"- {pa}")
        lignes.append("")
        lignes.append(f"💡 Recommandation : {r['recommandation']}")
        lignes.append("")
        lignes.append("---")
        lignes.append("")

    # Résumé classement
    lignes.append("## CLASSEMENT FINAL")
    for i, r in enumerate(resultats, 1):
        emoji = "🟢" if r["score"] >= 75 else "🟡" if r["score"] >= 50 else "🔴"
        lignes.append(f"{i}. {emoji} Bien #{r['bien_id']} — {r['bien_label']} : **{r['score']}/100**")

    return "\n".join(lignes)


# ============================================================
# TEST
# ============================================================

if __name__ == "__main__":

    prospect_test = {
        "nom": "Barbagallo et Matteuci",
        "bien": "Maison",
        "villes": "Fréjus",
        "quartiers": "Centre Ville",
        "budget_max": 170000,
        "etat": "Gros œuvre ok",
        "criteres": None,
        "expo": None,
        "stationnement": "Garage",
        "exterieur": None,
        "etage": None,
        "destination": "Résidence principale",
        "observation": "Ont habité Centre Historique",
    }

    biens_test = [
        {
            "id": 1, "reference": "VMA001",
            "type": "Maison", "ville": "Fréjus", "quartier": "Centre Ville",
            "prix": 165000, "surface": 85, "pieces": 4, "chambres": 3,
            "etage_bien": None, "ascenseur": 0, "cave": 0,
            "nb_parkings": 1, "nb_boxes": 0, "terrasse": 0, "nb_balcons": 0,
            "orientation_sud": 0, "orientation_est": 0, "orientation_ouest": 0, "orientation_nord": 0,
            "dpe_lettre": "D", "dpe_kwh": 180, "ges_lettre": "C", "ges_co2": 12,
            "description": "Maison de ville avec garage, proche commerces et écoles. Cachet ancien. Travaux de rafraîchissement à prévoir."
        },
        {
            "id": 2, "reference": "VAP002",
            "type": "Appartement", "ville": "Fréjus", "quartier": "Centre Historique",
            "prix": 175000, "surface": 65, "pieces": 3, "chambres": 2,
            "etage_bien": 2, "nb_etages_immeuble": 4, "ascenseur": 1, "cave": 1,
            "nb_parkings": 0, "nb_boxes": 0, "terrasse": 0, "nb_balcons": 1,
            "orientation_sud": 0, "orientation_est": 1, "orientation_ouest": 0, "orientation_nord": 0,
            "dpe_lettre": "E", "dpe_kwh": 240, "ges_lettre": "D", "ges_co2": 18,
            "description": "Appartement de caractère dans immeuble ancien, travaux de finition à prévoir. Vue sur place du marché."
        },
        {
            "id": 3, "reference": "VMA003",
            "type": "Maison", "ville": "Fréjus", "quartier": "Fréjus Plage",
            "prix": 320000, "surface": 120, "pieces": 5, "chambres": 4,
            "etage_bien": None, "ascenseur": 0, "cave": 0,
            "nb_parkings": 2, "nb_boxes": 0, "terrasse": 1, "nb_balcons": 0,
            "orientation_sud": 1, "orientation_est": 0, "orientation_ouest": 0, "orientation_nord": 0,
            "dpe_lettre": "B", "dpe_kwh": 85, "ges_lettre": "A", "ges_co2": 4,
            "description": "Grande maison familiale avec terrasse et jardin. Proche plage, quartier calme. Refait à neuf."
        },
    ]

    print("=" * 60)
    print("TEST SCORING HYBRIDE")
    print("=" * 60)

    resultats = scorer_biens(prospect_test, biens_test)
    print(formater_pour_affichage(resultats))