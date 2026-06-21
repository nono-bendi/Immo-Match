"""
Compte démo ImmoMatch — demo@immowatch.fr / demo

Initialise data/demo.db avec :
  - 20 biens réels du groupement Primmo, anonymisés à la volée
  - 6 prospects fictifs variés
  - Matchings générés automatiquement (sans appel Claude)
"""

import os
import random
import sqlite3
from datetime import datetime

import agencies_db as adb
from database import init_db

DEMO_DB_PATH   = os.path.join(adb.DATA_DIR, "demo.db")
SOURCE_DB_PATH = os.path.join(adb.DATA_DIR, "saint_francois.db")

_NOM_AGENCE = "Agence Démo Immobilier"

# Quartiers génériques par ville (remplacent les adresses réelles)
_QUARTIERS = {
    "Fréjus":      ["Centre-ville", "Tour de Marc", "Port-Fréjus", "Saint-Aygulf", "Villepey"],
    "Saint-Raphaël": ["Valescure", "Boulouris", "Le Dramont", "Agay", "Les Pins"],
    "Grimaud":     ["Village", "Port-Grimaud", "Les Maures"],
    "Les Issambres": ["Baie des Anges", "San Peïre"],
    "Draguignan":  ["Centre", "Les Collettes", "Saint-Hermentaire"],
    "Agay":        ["Plage d'Agay", "Anthéor"],
    "default":     ["Centre-ville", "Quartier résidentiel", "Les Pins", "Le Village"],
}

# ── 6 prospects fictifs ───────────────────────────────────────────────────────
DEMO_PROSPECTS = [
    {  # idx=0 — Sophie Martin : T3 Fréjus/Saint-Raphaël ≤ 285k
        "nom": "Sophie Martin", "mail": "sophie.martin@demo.fr", "telephone": "06 12 34 56 78",
        "domicile": "Fréjus", "bien": "Appartement",
        "villes": "Fréjus,Saint-Raphaël", "quartiers": "",
        "budget_max": 285000, "etat": "bon état", "expo": "Sud",
        "stationnement": "oui", "copro": "oui", "exterieur": "oui", "etage": "",
        "destination": "résidence principale",
        "criteres": "Appartement T3 lumineux, balcon ou terrasse, parking souhaité, proche commerces et école",
        "observation": "Famille avec 2 enfants, cherche calme et sécurité du quartier",
        "archive": 0, "date": "2024-02-15",
    },
    {  # idx=1 — Jean-Pierre Aubert : Maison Fréjus/Saint-Raphaël ≤ 400k
        "nom": "Jean-Pierre Aubert", "mail": "jp.aubert@demo.fr", "telephone": "06 23 45 67 89",
        "domicile": "Toulon", "bien": "Maison/villa",
        "villes": "Fréjus,Saint-Raphaël", "quartiers": "",
        "budget_max": 400000, "etat": "", "expo": "",
        "stationnement": "oui", "copro": "non", "exterieur": "oui", "etage": "",
        "destination": "résidence principale",
        "criteres": "Maison 3-4 pièces avec jardin et stationnement, au calme. Accepte légers travaux.",
        "observation": "Couple, mutation professionnelle, recherche active depuis 3 mois",
        "archive": 0, "date": "2024-01-20",
    },
    {  # idx=2 — Marie et Thomas Dubois : Studio/T2 investissement ≤ 200k
        "nom": "Marie et Thomas Dubois", "mail": "m.t.dubois@demo.fr", "telephone": "06 34 56 78 90",
        "domicile": "Paris 15ème", "bien": "Appartement",
        "villes": "Fréjus,Saint-Raphaël,Grimaud", "quartiers": "",
        "budget_max": 200000, "etat": "bon état", "expo": "",
        "stationnement": "", "copro": "oui", "exterieur": "", "etage": "",
        "destination": "investissement locatif",
        "criteres": "Studio ou T2, proche plage, rentabilité locative prioritaire.",
        "observation": "Investisseurs parisiens, gestion locative saisonnière prévue",
        "archive": 0, "date": "2024-03-01",
    },
    {  # idx=3 — Hélène Beaumont : Grand appartement/villa prestige ≤ 700k
        "nom": "Hélène Beaumont", "mail": "h.beaumont@demo.fr", "telephone": "06 45 67 89 01",
        "domicile": "Lyon", "bien": "Appartement",
        "villes": "Saint-Raphaël,Grimaud,Les Issambres", "quartiers": "",
        "budget_max": 700000, "etat": "bon état", "expo": "Sud",
        "stationnement": "oui", "copro": "oui", "exterieur": "oui", "etage": "",
        "destination": "résidence secondaire",
        "criteres": "Grand appartement ou villa, vue mer ou proche mer, prestations haut de gamme. 3+ chambres.",
        "observation": "Retraitée, budget souple si coup de cœur. Visites possibles dès maintenant.",
        "archive": 0, "date": "2024-02-28",
    },
    {  # idx=4 — Antoine Fabre : T2/T3 Fréjus ≤ 250k
        "nom": "Antoine Fabre", "mail": "a.fabre@demo.fr", "telephone": "06 56 78 90 12",
        "domicile": "Fréjus", "bien": "Appartement",
        "villes": "Fréjus,Saint-Raphaël", "quartiers": "",
        "budget_max": 250000, "etat": "bon état", "expo": "",
        "stationnement": "oui", "copro": "oui", "exterieur": "", "etage": "",
        "destination": "résidence principale",
        "criteres": "T2 ou T3 bien agencé, idéalement avec parking. Étage élevé apprécié.",
        "observation": "Célibataire, CDI, studio actuel à vendre — achat conditionnel",
        "archive": 0, "date": "2024-03-10",
    },
    {  # idx=5 — David et Isabelle Moreau : Maison/villa ≤ 600k
        "nom": "David et Isabelle Moreau", "mail": "d.i.moreau@demo.fr", "telephone": "06 67 89 01 23",
        "domicile": "Fréjus", "bien": "Maison/villa",
        "villes": "Fréjus,Saint-Raphaël", "quartiers": "",
        "budget_max": 600000, "etat": "", "expo": "",
        "stationnement": "oui", "copro": "non", "exterieur": "oui", "etage": "",
        "destination": "résidence principale",
        "criteres": "Maison ou villa avec jardin, 4+ chambres. Piscine appréciée.",
        "observation": "Famille avec 3 enfants, cherche espace et calme en périphérie",
        "archive": 0, "date": "2024-03-05",
    },
]


# ── Sélection et anonymisation des biens ──────────────────────────────────────

def _quartier_generique(ville: str) -> str:
    options = _QUARTIERS.get(ville, _QUARTIERS["default"])
    return random.choice(options)


def _anonymize_bien(row: dict) -> dict:
    """Anonymise un bien réel pour la démo."""
    prix_original = row.get("prix") or 0
    # Variation ±5% arrondie au millier
    variation = random.uniform(0.95, 1.05)
    prix_demo = round(prix_original * variation / 1000) * 1000

    return {
        "reference":    f"DEMO-{row['id']:04d}",
        "type":         row.get("type", ""),
        "ville":        row.get("ville", ""),
        "quartier":     _quartier_generique(row.get("ville", "")),
        "prix":         prix_demo,
        "surface":      row.get("surface"),
        "pieces":       row.get("pieces"),
        "chambres":     row.get("chambres"),
        "etat":         row.get("etat", ""),
        "exposition":   row.get("exposition", ""),
        "stationnement": row.get("stationnement", ""),
        "copropriete":  row.get("copropriete", ""),
        "exterieur":    row.get("exterieur", ""),
        "etage":        row.get("etage", ""),
        "description":  row.get("description", ""),
        "defauts":      row.get("defauts"),
        "date_ajout":   row.get("date_ajout", datetime.now().isoformat()),
        "nom_agence":   _NOM_AGENCE,
        "photos":       row.get("photos", ""),
        "statut":       "actif",
        "source":       "manual",
        "vendeur":      None,
        "lien_annonce": None,
        # Colonnes Hektor utiles
        "nb_parkings":         row.get("nb_parkings"),
        "terrasse":            row.get("terrasse"),
        "nb_balcons":          row.get("nb_balcons"),
        "dpe_lettre":          row.get("dpe_lettre"),
        "dpe_kwh":             row.get("dpe_kwh"),
        "ges_lettre":          row.get("ges_lettre"),
        "charges_mensuelles":  row.get("charges_mensuelles"),
        "latitude":            row.get("latitude"),
        "longitude":           row.get("longitude"),
    }


def _select_biens_from_primmo(n: int = 20) -> list[dict]:
    """
    Sélectionne n biens variés depuis saint_francois.db :
    - Studios / petits T2 (< 200k)
    - T2 / T3 milieu de gamme (200-350k)
    - T3 / T4 haut de gamme appartements (> 350k)
    - Maisons / villas toutes gammes
    """
    if not os.path.exists(SOURCE_DB_PATH):
        return []

    conn = sqlite3.connect(SOURCE_DB_PATH)
    conn.row_factory = sqlite3.Row

    base_filter = "(statut IS NULL OR statut = 'actif') AND photos IS NOT NULL AND photos != ''"

    segments = [
        # (requête, limite)
        (f"SELECT * FROM biens WHERE {base_filter} AND type = 'Appartement' AND prix < 200000 ORDER BY prix", 4),
        (f"SELECT * FROM biens WHERE {base_filter} AND type = 'Appartement' AND prix BETWEEN 200000 AND 350000 ORDER BY prix", 6),
        (f"SELECT * FROM biens WHERE {base_filter} AND type = 'Appartement' AND prix > 350000 ORDER BY prix", 4),
        (f"SELECT * FROM biens WHERE {base_filter} AND type = 'Maison/villa' ORDER BY prix", 6),
    ]

    selected = []
    used_ids = set()

    for query, limit in segments:
        rows = conn.execute(query).fetchall()
        added = 0
        for row in rows:
            if added >= limit:
                break
            if row["id"] not in used_ids:
                selected.append(dict(row))
                used_ids.add(row["id"])
                added += 1

    conn.close()

    # Anonymise et retourne exactement n biens
    result = [_anonymize_bien(b) for b in selected[:n]]
    return result


# ── Génération automatique des matchings ──────────────────────────────────────

def _villes_prospect(prospect: dict) -> list[str]:
    return [v.strip().lower() for v in (prospect.get("villes") or "").split(",") if v.strip()]


def _score_bien_prospect(bien: dict, prospect: dict) -> tuple[int, list[str], list[str]]:
    """
    Score objectif simplifié (sans Claude).
    Retourne (score_total, points_forts, points_attention).
    """
    score = 0
    forts = []
    attention = []

    bien_type  = (bien.get("type") or "").lower()
    prosp_type = (prospect.get("bien") or "").lower()
    budget     = prospect.get("budget_max") or 0
    prix       = bien.get("prix") or 0
    ville_bien = (bien.get("ville") or "").lower()
    villes_ok  = _villes_prospect(prospect)

    # ── Type /25 ──────────────────────────────────────────────────────────────
    if prosp_type and prosp_type in bien_type:
        score += 25
        forts.append(f"Type {bien.get('type')} correspond à votre recherche")
    elif prosp_type == "appartement" and "appartement" in bien_type:
        score += 25
    elif prosp_type == "maison/villa" and bien_type in ("maison/villa", "maison", "villa"):
        score += 25
    else:
        attention.append(f"Type différent de celui recherché ({bien.get('type')})")

    # ── Budget /30 ────────────────────────────────────────────────────────────
    if budget > 0 and prix > 0:
        ratio = prix / budget
        if ratio <= 1.0:
            score += 30
            if ratio <= 0.90:
                forts.append(f"Prix {int(prix):,}€ — {int((1-ratio)*100)}% sous votre budget".replace(",", " "))
            else:
                forts.append(f"Prix {int(prix):,}€ dans votre budget".replace(",", " "))
        elif ratio <= 1.05:
            score += 20
            attention.append(f"Prix légèrement au-dessus du budget ({int((ratio-1)*100)}%)")
        elif ratio <= 1.10:
            score += 10
            attention.append(f"Prix {int((ratio-1)*100)}% au-dessus du budget — négociation possible")
        else:
            attention.append(f"Prix nettement supérieur au budget ({int(prix):,}€)".replace(",", " "))

    # ── Localisation /20 ──────────────────────────────────────────────────────
    if villes_ok and ville_bien in villes_ok:
        score += 20
        forts.append(f"Localisation {bien.get('ville')} correspond à vos villes souhaitées")
    elif villes_ok:
        # Même département Var → score partiel
        score += 8
        attention.append(f"Ville {bien.get('ville')} hors de vos villes prioritaires")
    else:
        score += 10

    # ── Surface / pièces /15 ──────────────────────────────────────────────────
    surface = bien.get("surface") or 0
    pieces  = bien.get("pieces") or 0
    dest    = (prospect.get("destination") or "").lower()

    if dest == "investissement locatif":
        if surface > 0 and surface <= 50:
            score += 15
            forts.append(f"Surface {int(surface)}m² idéale pour la location saisonnière")
        elif surface <= 70:
            score += 10
        else:
            score += 5
            attention.append("Grande surface — moins rentable en locatif saisonnier")
    elif pieces >= 3:
        score += 15
        forts.append(f"{int(pieces)} pièces bien dimensionné pour votre projet")
    elif pieces == 2:
        score += 10
    else:
        score += 5
        attention.append("Superficie réduite par rapport aux besoins exprimés")

    # ── Stationnement /5 ──────────────────────────────────────────────────────
    if prospect.get("stationnement") == "oui":
        if (bien.get("stationnement") or "").lower() in ("oui", "garage", "parking"):
            score += 5
            forts.append("Parking disponible")
        else:
            attention.append("Pas de stationnement inclus")
    else:
        score += 3

    # ── Extérieur /5 ──────────────────────────────────────────────────────────
    if prospect.get("exterieur") == "oui":
        if (bien.get("exterieur") or "").lower() == "oui":
            score += 5
            forts.append("Extérieur (terrasse/balcon/jardin) disponible")
        else:
            attention.append("Pas d'extérieur mentionné")
    else:
        score += 3

    # Compléments qualitatifs
    if bien.get("dpe_lettre") in ("A", "B", "C"):
        forts.append(f"DPE {bien['dpe_lettre']} — faible consommation énergétique")
    if bien.get("photos"):
        nb_photos = len(bien["photos"].split("|"))
        if nb_photos >= 3:
            forts.append(f"{nb_photos} photos disponibles")

    if not attention:
        attention = ["Bien à valider lors de la visite"]

    return min(score, 100), forts[:4], attention[:3]


def _recommandation(score: int, prospect: dict, bien: dict) -> str:
    ville = bien.get("ville", "")
    typ   = bien.get("type", "bien")
    if score >= 85:
        return f"Coup de cœur — {typ} à {ville} correspond parfaitement au profil. Organiser une visite rapidement."
    elif score >= 70:
        return f"Très bon match — proposer une visite de ce {typ.lower()} à {ville} en priorité."
    elif score >= 55:
        return f"Match intéressant — à montrer si les premières options ne conviennent pas."
    else:
        return f"Match partiel — à présenter uniquement en option de repli."


def _generate_matchings(prospect_ids: list[int], prospects: list[dict],
                        bien_ids: list[int], biens: list[dict]) -> list[tuple]:
    """
    Pour chaque prospect, trouve les 5 meilleurs biens et génère des matchings.
    Retourne une liste de (prospect_db_id, bien_db_id, score, points_forts_str, points_attention_str, recommandation).
    """
    matchings = []
    for p_idx, prospect in enumerate(prospects):
        p_id = prospect_ids[p_idx]
        scored = []
        for b_idx, bien in enumerate(biens):
            score, forts, attention = _score_bien_prospect(bien, prospect)
            scored.append((score, b_idx, forts, attention))

        # Trier par score décroissant, garder top 5
        scored.sort(key=lambda x: x[0], reverse=True)
        top = scored[:5]

        for score, b_idx, forts, attention in top:
            b_id = bien_ids[b_idx]
            reco = _recommandation(score, prospect, biens[b_idx])
            forts_str     = "\n".join(f"- {p}" for p in forts)
            attention_str = "\n".join(f"- {p}" for p in attention)
            matchings.append((p_id, b_id, score, forts_str, attention_str, reco))

    return matchings


# ── Initialisation de demo.db ─────────────────────────────────────────────────

def init_demo_db(force: bool = False):
    """
    Crée et peuple data/demo.db depuis les vrais biens du groupement Primmo.
    Idempotent sauf si force=True.
    """
    os.makedirs(adb.DATA_DIR, exist_ok=True)
    init_db(DEMO_DB_PATH)

    conn = sqlite3.connect(DEMO_DB_PATH)
    count = conn.execute("SELECT COUNT(*) FROM biens").fetchone()[0]
    if count > 0 and not force:
        conn.close()
        return

    conn.execute("DELETE FROM matchings")
    conn.execute("DELETE FROM prospects")
    conn.execute("DELETE FROM biens")
    conn.commit()

    now = datetime.now().isoformat()

    # ── Sélectionner 20 vrais biens anonymisés ────────────────────────────────
    random.seed(42)  # reproductible
    biens = _select_biens_from_primmo(20)
    if not biens:
        print("[demo] WARN saint_francois.db introuvable -- demo.db non peuplee")
        conn.close()
        return

    bien_ids = []
    for bien in biens:
        cur = conn.execute("""
            INSERT INTO biens
                (reference, type, ville, quartier, prix, surface, pieces, chambres,
                 etat, exposition, stationnement, copropriete, exterieur, etage,
                 description, defauts, date_ajout, nom_agence, photos, statut, source,
                 vendeur, lien_annonce, date_creation,
                 nb_parkings, terrasse, nb_balcons, dpe_lettre, dpe_kwh, ges_lettre,
                 charges_mensuelles, latitude, longitude)
            VALUES
                (:reference, :type, :ville, :quartier, :prix, :surface, :pieces, :chambres,
                 :etat, :exposition, :stationnement, :copropriete, :exterieur, :etage,
                 :description, :defauts, :date_ajout, :nom_agence, :photos, :statut, :source,
                 :vendeur, :lien_annonce, :date_ajout,
                 :nb_parkings, :terrasse, :nb_balcons, :dpe_lettre, :dpe_kwh, :ges_lettre,
                 :charges_mensuelles, :latitude, :longitude)
        """, bien)
        bien_ids.append(cur.lastrowid)
    conn.commit()

    # ── Insérer les 6 prospects ───────────────────────────────────────────────
    prospect_ids = []
    for p in DEMO_PROSPECTS:
        cur = conn.execute("""
            INSERT INTO prospects
                (date, nom, mail, telephone, domicile, bien, villes, quartiers,
                 budget_max, criteres, etat, expo, stationnement, copro, exterieur,
                 etage, destination, observation, archive)
            VALUES
                (:date, :nom, :mail, :telephone, :domicile, :bien, :villes, :quartiers,
                 :budget_max, :criteres, :etat, :expo, :stationnement, :copro, :exterieur,
                 :etage, :destination, :observation, :archive)
        """, p)
        prospect_ids.append(cur.lastrowid)
    conn.commit()

    # ── Générer et insérer les matchings ─────────────────────────────────────
    matchings = _generate_matchings(prospect_ids, DEMO_PROSPECTS, bien_ids, biens)
    for (p_id, b_id, score, forts_str, attention_str, reco) in matchings:
        conn.execute("""
            INSERT INTO matchings
                (prospect_id, bien_id, score, points_forts, points_attention,
                 recommandation, date_analyse, date_creation)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (p_id, b_id, score, forts_str, attention_str, reco, now, now))
    conn.commit()
    conn.close()

    print(f"[demo] OK demo.db : {len(biens)} biens Primmo anonymises, "
          f"{len(DEMO_PROSPECTS)} prospects, {len(matchings)} matchings")
