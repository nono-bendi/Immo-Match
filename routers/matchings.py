import sqlite3
from logger import get_logger
log = get_logger('matchings')
import os
import json
from datetime import datetime
from fastapi import APIRouter, Depends

from config import _analyse_all_lock, COOLDOWN_SECONDS
from agencies_db import get_db_path, get_monthly_usage, increment_monthly_usage
from plans import check_quota
from routers.auth import get_current_user, require_not_demo
from scoring import scorer_biens as scorer_biens_hybride, formater_pour_affichage, trier_biens_par_score_objectif

router = APIRouter()


# ============================================================
# FONCTIONS PARTAGÉES
# ============================================================

def get_settings_values(db_path: str = None):
    """Charge les settings depuis la base de données"""
    conn = sqlite3.connect(db_path or get_db_path("saint_francois"))
    conn.row_factory = sqlite3.Row

    # Valeurs par défaut
    settings = {
        'model': 'claude-sonnet-4-20250514',
        'max_biens_par_prospect': 5,
        'max_matchings_par_prospect': 5,
        'score_minimum': 0,
        'budget_tolerance_min': 70,
        'budget_tolerance_max': 120,
        'ftp_host': '',
        'ftp_user': '',
        'ftp_pass': '',
        'ftp_port': '21',
        'ftp_path': '',
        'sync_interval_hours': '6',
        'analyse_auto_import': True
    }

    rows = conn.execute("SELECT key, value FROM settings").fetchall()
    conn.close()

    for row in rows:
        key = row['key']
        value = row['value']

        # Met à jour toutes les clés trouvées en base
        try:
            settings[key] = json.loads(value)
        except (json.JSONDecodeError, TypeError):
            settings[key] = value

    log.info(f"Settings chargés: model={settings['model']}, max_biens={settings['max_biens_par_prospect']}, budget={settings['budget_tolerance_min']}-{settings['budget_tolerance_max']}%")

    return settings


def extraire_contraintes_observations(observation_text):
    """
    Extrait les contraintes dures depuis le champ observations d'un prospect.
    Ces contraintes sont des exigences non-négociables qui doivent être filtrées
    en pré-filtre (pas laissées à Claude qui peut halluciner la compatibilité).
    Retourne un dict de flags de contraintes.
    """
    if not observation_text:
        return {}
    obs = observation_text.lower()
    contraintes = {}

    if any(k in obs for k in ["divisible en lots", "division en lots", "diviser en lots", "découpable en lots"]):
        contraintes["divisible_en_lots"] = True

    if any(k in obs for k in ["rachat immeuble", "racheter immeuble", "achat immeuble", "immeuble entier", "immeuble de rapport"]):
        contraintes["immeuble_entier"] = True

    return contraintes


def bien_respecte_contraintes_observations(bien, contraintes):
    """
    Retourne False si le bien ne peut PAS satisfaire une contrainte dure
    extraite des observations prospect (exclusion avant appel Claude).
    """
    if not contraintes:
        return True

    type_bien = (bien.get("type") or "").lower()
    surface = bien.get("surface") or 0

    if contraintes.get("divisible_en_lots"):
        # Un appartement en copropriété standard est PHYSIQUEMENT indivisible en lots.
        # Types exclus : appartement, studio, T1-T5 (unités en copropriété)
        types_indivisibles = ["appartement", "studio", "t1", "t2", "t3", "t4", "t5"]
        for t in types_indivisibles:
            if t in type_bien:
                log.info(f"[CONTRAINTE] Bien #{bien.get('id')} ({bien.get('type')}) exclu : prospect exige 'divisible en lots'")
                return False
        # Surface minimale viable pour envisager une division en 2 lots
        if surface and surface < 80:
            log.info(f"[CONTRAINTE] Bien #{bien.get('id')} ({surface}m²) exclu : trop petit pour 'divisible en lots'")
            return False

    if contraintes.get("immeuble_entier"):
        # Le prospect veut racheter un immeuble entier — uniquement les biens de type "immeuble"
        if "immeuble" not in type_bien:
            log.info(f"[CONTRAINTE] Bien #{bien.get('id')} ({bien.get('type')}) exclu : prospect exige un immeuble entier")
            return False

    return True


def prefiltre_biens(client, biens, budget_min_tolerance=50, budget_max_tolerance=130):
    """
    Préfiltre les biens pour ne garder que les candidats potentiels.
    - Exclut les biens de zones géographiques trop éloignées
    - Exclut les biens dont le type est incompatible avec la recherche du prospect
    - Exclut les biens qui violent des contraintes dures issues des observations
    - Ajoute un flag 'hors_secteur' pour les biens dans des villes proches mais différentes
    """
    candidats = []

    # Contraintes dures issues des observations du prospect
    contraintes_obs = extraire_contraintes_observations(client.get("observation"))
    if contraintes_obs:
        log.info(f"[PREFILT] Contraintes observations actives pour {client.get('nom', '?')}: {contraintes_obs}")

    # Table d'incompatibilités strictes : clé = mot dans type prospect, valeurs = mots exclus dans type bien
    INCOMPATIBLES_TYPE = {
        "local": ["appartement", "maison", "villa", "t1", "t2", "t3", "t4", "t5", "studio", "immeuble"],
        "immeuble": ["appartement", "local", "studio"],
        "parking": ["appartement", "maison", "villa", "local", "immeuble"],
        "maison de village": ["appartement", "local", "immeuble"],
    }

    def types_incompatibles(type_prospect, type_bien):
        """Retourne True si le type bien est clairement incompatible avec la recherche."""
        if not type_prospect or not type_bien:
            return False
        tp = type_prospect.lower().strip()
        tb = type_bien.lower().strip()
        # "Tous biens" = pas de filtre
        if "tous" in tp:
            return False
        for mot_p, exclusions in INCOMPATIBLES_TYPE.items():
            if mot_p in tp:
                for exclu in exclusions:
                    if exclu in tb:
                        return True
        # Maison cherche maison : exclure appartement et local
        if ("maison" in tp or "villa" in tp) and ("appartement" in tb or "local" in tb or "immeuble" in tb):
            return True
        return False

    # Définir les zones géographiques (villes proches entre elles)
    zones_geographiques = [
        # Zone Fréjus / Saint-Raphaël / Estérel
        ["frejus", "fréjus", "saint-raphael", "saint-raphaël", "st-raphael", "st raphael",
         "roquebrune-sur-argens", "roquebrune sur argens", "puget-sur-argens", "puget sur argens",
         "saint-aygulf", "st-aygulf", "le muy", "les adrets", "bagnols-en-foret", "bagnols en foret",
         "les adrets-de-l'esterel", "adrets de l'esterel"],
        # Zone Cannes / Antibes / Grasse
        ["cannes", "antibes", "grasse", "mougins", "le cannet", "mandelieu", "vallauris",
         "valbonne", "biot", "villeneuve-loubet", "cagnes-sur-mer"],
        # Zone Nice / Monaco
        ["nice", "monaco", "menton", "villefranche-sur-mer", "beaulieu-sur-mer", "eze",
         "cap-d'ail", "roquebrune-cap-martin", "la trinite", "saint-laurent-du-var"],
        # Zone Toulon / Hyères
        ["toulon", "hyeres", "hyères", "la seyne-sur-mer", "six-fours", "sanary",
         "bandol", "le pradet", "carqueiranne", "la garde"],
        # Zone Draguignan / Var intérieur
        ["draguignan", "lorgues", "vidauban", "trans-en-provence", "flayosc",
         "taradeau", "les arcs", "le thoronet"],
        # Zone Marseille / Aix
        ["marseille", "aix-en-provence", "aix en provence", "cassis", "la ciotat",
         "aubagne", "gardanne", "vitrolles", "martigues", "istres"],
        # Zone Avignon / Cavaillon
        ["avignon", "cavaillon", "carpentras", "orange", "apt", "l'isle-sur-la-sorgue",
         "isle sur la sorgue", "pertuis", "gordes", "roussillon"]
    ]

    def trouver_zone(ville):
        """Trouve la zone géographique d'une ville"""
        ville_clean = ville.lower().strip().replace('é', 'e').replace('è', 'e').replace('ë', 'e')
        for i, zone in enumerate(zones_geographiques):
            for v in zone:
                v_clean = v.replace('é', 'e').replace('è', 'e')
                if v_clean in ville_clean or ville_clean in v_clean:
                    return i
        return -1  # Zone inconnue

    def villes_meme_zone(ville1, ville2):
        """Vérifie si deux villes sont dans la même zone géographique"""
        zone1 = trouver_zone(ville1)
        zone2 = trouver_zone(ville2)
        # Si une des zones est inconnue, on accepte (on laisse Claude décider)
        if zone1 == -1 or zone2 == -1:
            return True
        return zone1 == zone2

    villes_client = []
    zones_client = set()
    if client.get("ville"):
        villes_raw = client["ville"].lower().strip()
        villes_client = [v.strip() for v in villes_raw.replace(';', ',').split(',')]
        # Identifier toutes les zones recherchées par le client
        for v in villes_client:
            zone = trouver_zone(v)
            if zone != -1:
                zones_client.add(zone)

    for bien in biens:
        exclu = False
        hors_secteur = False

        # Filtre contraintes dures observations (ex: "divisible en lots" → exclure les appartements)
        if not bien_respecte_contraintes_observations(bien, contraintes_obs):
            exclu = True

        # Filtre type (exclusions strictes)
        if not exclu and types_incompatibles(client.get("bien"), bien.get("type")):
            exclu = True

        # Filtre budget (très souple)
        if not exclu and client.get("budget") and bien.get("prix"):
            budget_max_tolere = client["budget"] * (budget_max_tolerance / 100)
            if bien["prix"] > budget_max_tolere:
                exclu = True

        # Filtre géographique
        if not exclu and villes_client and bien.get("ville"):
            ville_bien = bien["ville"].lower().strip()
            zone_bien = trouver_zone(ville_bien)

            # Si "tous secteurs" ou "tous", on garde tout
            if any("tous" in v for v in villes_client):
                hors_secteur = False
            # Si le bien est dans une zone complètement différente → EXCLURE
            elif zone_bien != -1 and zones_client and zone_bien not in zones_client:
                exclu = True  # Trop loin, on exclut complètement
            else:
                # Le bien est dans une zone acceptable, vérifier si c'est la ville exacte
                ville_bien_clean = ville_bien.replace('é', 'e').replace('è', 'e').replace('ë', 'e')
                dans_secteur = False

                for ville_recherchee in villes_client:
                    ville_recherchee_clean = ville_recherchee.replace('é', 'e').replace('è', 'e').replace('ë', 'e')
                    if (ville_recherchee_clean in ville_bien_clean or
                            ville_bien_clean in ville_recherchee_clean or
                            (ville_recherchee_clean.startswith('st ') and ville_bien_clean.startswith('saint')) or
                            (ville_recherchee_clean.startswith('st-') and ville_bien_clean.startswith('saint'))):
                        dans_secteur = True
                        break

                hors_secteur = not dans_secteur

        if not exclu:
            bien_copy = bien.copy()
            bien_copy['hors_secteur'] = hors_secteur
            candidats.append(bien_copy)

    return candidats


def prefiltre_prospects_pour_bien(bien, prospects, budget_min_pct=70, budget_max_pct=130):
    """Filtre inverse : trouve les prospects potentiellement compatibles avec un bien."""
    compatibles = []
    prix_bien = bien.get("prix") or 0
    type_bien = (bien.get("type") or "").lower()
    ville_bien = (bien.get("ville") or "").lower()

    for prospect in prospects:
        budget_max = prospect.get("budget_max") or 0
        if budget_max and prix_bien:
            seuil_min = budget_max * budget_min_pct / 100
            seuil_max = budget_max * budget_max_pct / 100
            if prix_bien < seuil_min or prix_bien > seuil_max:
                continue

        types_prospect = (prospect.get("bien") or "").lower()
        if types_prospect and types_prospect not in ("tous", "tous biens", "tous types", ""):
            types_list = [t.strip() for t in types_prospect.replace(";", ",").split(",")]
            if not any(t in type_bien or type_bien in t for t in types_list if t):
                continue

        villes_prospect = (prospect.get("villes") or "").lower()
        if villes_prospect:
            villes_list = [v.strip() for v in villes_prospect.replace(";", ",").split(",")]
            if not any(v in ville_bien or ville_bien in v for v in villes_list if v):
                continue

        compatibles.append(prospect)
    return compatibles


def _core_analyser_bien(bien_id: int, db_path: str = None) -> dict:
    """
    Logique pure d'analyse d'un bien contre tous les prospects compatibles.
    Appelable depuis une route FastAPI ou un thread background.
    """
    settings = get_settings_values(db_path)
    budget_min = settings["budget_tolerance_min"]
    budget_max = settings["budget_tolerance_max"]
    score_minimum = int(settings.get("score_minimum", 0))

    conn = sqlite3.connect(db_path or get_db_path("saint_francois"))
    conn.row_factory = sqlite3.Row
    bien = conn.execute("SELECT * FROM biens WHERE id = ?", (bien_id,)).fetchone()
    if not bien:
        conn.close()
        return {"error": "Bien non trouve"}
    bien = dict(bien)
    prospects = [dict(r) for r in conn.execute(
        "SELECT * FROM prospects WHERE archive = 0 OR archive IS NULL"
    ).fetchall()]
    conn.close()

    if not prospects:
        return {"error": "Aucun prospect en base"}

    compatibles = prefiltre_prospects_pour_bien(bien, prospects, budget_min, budget_max)
    if not compatibles:
        return {"message": "Aucun prospect compatible avec ce bien", "matchings_count": 0}

    nb_matchings = 0
    try:
        for prospect in compatibles:
            conn = sqlite3.connect(db_path or get_db_path("saint_francois"))
            existing = conn.execute(
                "SELECT id FROM matchings WHERE prospect_id = ? AND bien_id = ?",
                (prospect["id"], bien_id)
            ).fetchone()
            conn.close()
            if existing:
                continue

            try:
                resultats = scorer_biens_hybride(prospect, [bien], model=settings["model"], agency_slug=db_path.split("/")[-1].replace(".db",""))
            except Exception as e:
                log.error(f"Erreur Claude prospect #{prospect.get('id')}: {e}")
                continue

            if not resultats:
                continue

            r = resultats[0]
            if r["score"] < score_minimum:
                continue

            conn = sqlite3.connect(db_path or get_db_path("saint_francois"))
            conn.execute("""
                INSERT INTO matchings
                    (prospect_id, bien_id, score, points_forts, points_attention, recommandation, date_analyse, date_creation)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                prospect["id"], bien_id, r["score"],
                "\n".join(r["points_forts"]),
                "\n".join(r["points_attention"]),
                r["recommandation"],
                datetime.now().isoformat(),
                datetime.now().isoformat()
            ))
            conn.commit()
            conn.close()
            nb_matchings += 1

        return {
            "message": f"{nb_matchings} matching(s) trouve(s) sur {len(compatibles)} prospect(s) compatible(s)",
            "prospects_compatibles": len(compatibles),
            "matchings_count": nb_matchings
        }
    except Exception as e:
        return {"error": "Une erreur interne est survenue"}


# ============================================================
# ROUTES
# ============================================================

def _calculer_completude(prospect: dict) -> float:
    """
    Calcule le taux de complétude d'un profil prospect (0.0 à 1.0).
    Les champs clés pour un matching précis ont chacun un poids.
    Un profil complet = Claude a tous les éléments pour scorer correctement.
    """
    champs = [
        ("budget_max",    0.25),  # Le plus déterminant — sans budget, le scoring est aveugle
        ("bien",          0.20),  # Type de bien
        ("villes",        0.20),  # Zone géographique
        ("destination",   0.15),  # Résidence principale / investissement / marchand...
        ("criteres",      0.10),  # Critères spécifiques libres
        ("stationnement", 0.05),
        ("exterieur",     0.05),
    ]
    score = 0.0
    for champ, poids in champs:
        valeur = prospect.get(champ)
        if valeur and str(valeur).strip() and str(valeur).strip().lower() not in ("tous biens", "tous secteurs", "tous"):
            score += poids
    return round(score, 2)


@router.get("/matchings")
def get_matchings(
    destination: str = None,
    tri: str = "pondere",  # "pondere" | "score" | "completude"
    current_user: dict = Depends(get_current_user)
):
    """
    Retourne les matchings avec score pondéré par la complétude du profil prospect.

    - tri=pondere (défaut) : score × complétude — les profils bien renseignés remontent
    - tri=score            : tri pur par score de matching (comportement original)
    - tri=completude       : tri par complétude du profil d'abord
    - destination          : filtre optionnel (ex: "Principal", "Marchands", "Investissement")
    """
    db_path = get_db_path(current_user["agency_slug"])
    settings = get_settings_values(db_path)
    score_minimum = int(settings.get('score_minimum', 0))
    max_matchings = int(settings.get('max_matchings_par_prospect', 5))

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.execute('''
        SELECT m.*, p.nom as prospect_nom, p.budget_max as prospect_budget,
               p.mail as prospect_mail, p.telephone as prospect_tel,
               p.bien as prospect_type, p.villes as prospect_villes,
               p.destination as prospect_destination, p.criteres as prospect_criteres,
               p.stationnement as prospect_stationnement, p.exterieur as prospect_exterieur,
               b.type as bien_type, b.ville as bien_ville, b.prix as bien_prix,
               b.surface as bien_surface, b.pieces as bien_pieces, b.photos as bien_photos
        FROM matchings m
        JOIN prospects p ON m.prospect_id = p.id
        JOIN biens b ON m.bien_id = b.id
        WHERE (p.archive = 0 OR p.archive IS NULL)
          AND m.score >= ?
        ORDER BY m.prospect_id, m.score DESC
    ''', (score_minimum,))
    all_matchings = [dict(row) for row in cursor.fetchall()]
    conn.close()

    # Filtre par destination (recherche partielle insensible à la casse)
    if destination:
        dest_low = destination.lower()
        all_matchings = [
            m for m in all_matchings
            if dest_low in (m.get('prospect_destination') or '').lower()
        ]

    # Calcul de complétude et score pondéré pour chaque matching
    for m in all_matchings:
        prospect_data = {
            'budget_max':    m.get('prospect_budget'),
            'bien':          m.get('prospect_type'),
            'villes':        m.get('prospect_villes'),
            'destination':   m.get('prospect_destination'),
            'criteres':      m.get('prospect_criteres'),
            'stationnement': m.get('prospect_stationnement'),
            'exterieur':     m.get('prospect_exterieur'),
        }
        completude = _calculer_completude(prospect_data)
        m['completude'] = completude
        m['completude_pct'] = int(completude * 100)
        # Score pondéré : profil vide = 60% du score, profil complet = 100%
        # Formule : score * (0.60 + 0.40 * completude)
        m['score_pondere'] = round(m['score'] * (0.60 + 0.40 * completude))

    # Limiter à max_matchings par prospect (déjà triés score DESC)
    seen = {}
    result = []
    for m in all_matchings:
        pid = m['prospect_id']
        if seen.get(pid, 0) < max_matchings:
            result.append(m)
            seen[pid] = seen.get(pid, 0) + 1

    # Tri final selon le paramètre
    if tri == "score":
        result.sort(key=lambda m: m['score'], reverse=True)
    elif tri == "completude":
        result.sort(key=lambda m: (m['completude'], m['score']), reverse=True)
    else:  # "pondere" par défaut
        result.sort(key=lambda m: m['score_pondere'], reverse=True)

    return result


@router.get("/matchings/by-bien/{bien_id}")
def get_matchings_by_bien(bien_id: int, current_user: dict = Depends(get_current_user)):
    conn = sqlite3.connect(get_db_path(current_user["agency_slug"]))
    conn.row_factory = sqlite3.Row
    rows = conn.execute('''
        SELECT m.score, m.points_forts, m.points_attention, m.recommandation,
               p.nom as prospect_nom, p.budget_max as prospect_budget
        FROM matchings m
        JOIN prospects p ON m.prospect_id = p.id
        WHERE m.bien_id = ? AND (p.archive = 0 OR p.archive IS NULL)
        ORDER BY m.score DESC
    ''', (bien_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@router.get("/matchings/by-date")
def get_matchings_by_date(date_analyse: str, current_user: dict = Depends(get_current_user)):
    """Récupère les matchings d'une analyse spécifique (par minute)"""
    conn = sqlite3.connect(get_db_path(current_user["agency_slug"]))
    conn.row_factory = sqlite3.Row

    # Extraire la date jusqu'à la minute (sans secondes) pour grouper les analyses faites ensemble
    date_minute = date_analyse[:16]  # "2026-02-09T21:32"

    matchings = conn.execute('''
        SELECT m.*,
               p.nom as prospect_nom, p.budget_max as prospect_budget, p.mail as prospect_mail, p.telephone as prospect_tel,
               b.type as bien_type, b.ville as bien_ville, b.prix as bien_prix, b.surface as bien_surface, b.pieces as bien_pieces, b.id as bien_id
        FROM matchings m
        JOIN prospects p ON m.prospect_id = p.id
        JOIN biens b ON m.bien_id = b.id
        WHERE m.date_analyse LIKE ? AND (p.archive = 0 OR p.archive IS NULL)
        ORDER BY p.nom, m.score DESC
    ''', (f"{date_minute}%",)).fetchall()

    conn.close()
    return [dict(m) for m in matchings]


@router.get("/stats")
def get_stats(current_user: dict = Depends(get_current_user)):
    conn = sqlite3.connect(get_db_path(current_user["agency_slug"]))
    conn.row_factory = sqlite3.Row

    # Compteurs de base
    nb_prospects = conn.execute("SELECT COUNT(*) as count FROM prospects").fetchone()['count']
    nb_biens = conn.execute("SELECT COUNT(*) as count FROM biens").fetchone()['count']
    nb_matchings = conn.execute("SELECT COUNT(*) as count FROM matchings").fetchone()['count']

    # Matchings par score
    excellents = conn.execute("SELECT COUNT(*) as count FROM matchings WHERE score >= 75").fetchone()['count']
    bons = conn.execute("SELECT COUNT(*) as count FROM matchings WHERE score >= 50 AND score < 75").fetchone()['count']

    # Budget moyen des prospects
    budget_moy = conn.execute("SELECT AVG(budget_max) as avg FROM prospects WHERE budget_max IS NOT NULL").fetchone()['avg']

    # Dernière analyse
    derniere_analyse = conn.execute("SELECT MAX(date_analyse) as date FROM matchings").fetchone()['date']

    # Top 5 matchings
    top_matchings = conn.execute('''
        SELECT m.*, p.nom as prospect_nom, p.telephone as prospect_tel, p.mail as prospect_mail,
               b.type as bien_type, b.ville as bien_ville, b.prix as bien_prix
        FROM matchings m
        JOIN prospects p ON m.prospect_id = p.id
        JOIN biens b ON m.bien_id = b.id
        WHERE (p.archive = 0 OR p.archive IS NULL)
        ORDER BY m.score DESC
        LIMIT 5
    ''').fetchall()

    # Prospects sans matching
    prospects_sans_matching = conn.execute('''
        SELECT p.* FROM prospects p
        LEFT JOIN matchings m ON p.id = m.prospect_id
        WHERE m.id IS NULL
        LIMIT 5
    ''').fetchall()

    # Biens populaires (plus de matchings)
    biens_populaires = conn.execute('''
        SELECT b.*, COUNT(m.id) as nb_matchings, AVG(m.score) as score_moyen
        FROM biens b
        LEFT JOIN matchings m ON b.id = m.bien_id
        GROUP BY b.id
        ORDER BY nb_matchings DESC
        LIMIT 5
    ''').fetchall()

    # Évolution des scores sur les 10 dernières analyses
    evolution = conn.execute('''
        SELECT
            DATE(date_analyse) as date,
            substr(TIME(date_analyse), 1, 5) as heure,
            ROUND(AVG(score), 1) as score_moyen,
            COUNT(*) as nb_matchings,
            SUM(CASE WHEN score >= 75 THEN 1 ELSE 0 END) as excellents
        FROM matchings
        GROUP BY DATE(date_analyse), substr(TIME(date_analyse), 1, 5)
        ORDER BY date_analyse DESC
        LIMIT 10
    ''').fetchall()
    evolution_list = list(reversed([dict(r) for r in evolution]))

    # Distribution des scores (tranches de 10)
    dist_raw = conn.execute('''
        SELECT
            CASE
                WHEN score >= 90 THEN '90-100'
                WHEN score >= 80 THEN '80-89'
                WHEN score >= 70 THEN '70-79'
                WHEN score >= 60 THEN '60-69'
                WHEN score >= 50 THEN '50-59'
                ELSE '< 50'
            END as tranche,
            COUNT(*) as nb
        FROM matchings
        GROUP BY tranche
        ORDER BY tranche DESC
    ''').fetchall()
    distribution = [dict(r) for r in dist_raw]

    # Prospects avec le meilleur score max
    top_prospects = conn.execute('''
        SELECT p.nom, p.telephone, p.mail, MAX(m.score) as best_score, COUNT(m.id) as nb_matchings
        FROM prospects p
        JOIN matchings m ON p.id = m.prospect_id
        GROUP BY p.id
        ORDER BY best_score DESC
        LIMIT 5
    ''').fetchall()

    # Faibles : matchings < 50 (prospects difficiles à matcher)
    faibles = conn.execute("SELECT COUNT(*) as count FROM matchings WHERE score < 50").fetchone()['count']

    # Score moyen global
    score_global = conn.execute("SELECT ROUND(AVG(score),1) as avg FROM matchings").fetchone()['avg'] or 0

    # Bug #2 — Prospects "oubliés" : actifs mais non analysés depuis >30j (ou jamais)
    prospects_oublies = conn.execute('''
        SELECT p.id, p.nom, p.bien, p.villes, p.budget_max, p.telephone, p.mail,
               MAX(m.date_analyse) as derniere_analyse,
               COUNT(m.id) as nb_matchings
        FROM prospects p
        LEFT JOIN matchings m ON p.id = m.prospect_id
        WHERE (p.archive = 0 OR p.archive IS NULL)
        GROUP BY p.id
        HAVING derniere_analyse IS NULL
           OR julianday('now') - julianday(derniere_analyse) > 30
        ORDER BY derniere_analyse ASC
    ''').fetchall()

    # Faille #8 — Biens actifs sans aucun matching
    biens_sans_matching = conn.execute('''
        SELECT b.id, b.type, b.ville, b.prix, b.surface, b.pieces, b.reference
        FROM biens b
        LEFT JOIN matchings m ON b.id = m.bien_id
        WHERE m.id IS NULL AND (b.statut IS NULL OR b.statut = 'actif')
        ORDER BY b.prix DESC
    ''').fetchall()

    # Faille #9 — Taux de calibration (feedback prospects)
    nb_feedbacks = conn.execute("SELECT COUNT(*) FROM calibration_feedback").fetchone()[0]
    taux_calibration = round(nb_feedbacks / nb_matchings * 100, 1) if nb_matchings > 0 else 0

    conn.close()

    return {
        "nb_prospects": nb_prospects,
        "nb_biens": nb_biens,
        "nb_matchings": nb_matchings,
        "excellents": excellents,
        "bons": bons,
        "faibles": faibles,
        "budget_moyen": round(budget_moy) if budget_moy else 0,
        "score_global": float(score_global),
        "derniere_analyse": derniere_analyse,
        "top_matchings": [dict(row) for row in top_matchings],
        "prospects_sans_matching": [dict(row) for row in prospects_sans_matching],
        "biens_populaires": [dict(row) for row in biens_populaires],
        "evolution": evolution_list,
        "distribution": distribution,
        "top_prospects": [dict(r) for r in top_prospects],
        # Alertes qualité matchmaking
        "prospects_oublies": [dict(r) for r in prospects_oublies],
        "biens_sans_matching": [dict(r) for r in biens_sans_matching],
        "taux_calibration": taux_calibration,
        "nb_feedbacks": nb_feedbacks,
    }


@router.get("/stats/comparaison")
def get_comparaison_snapshot(label: str = None, current_user: dict = Depends(get_current_user)):
    """
    Compare les matchings actuels avec un snapshot précédent.
    Retourne : évolution des scores, matchings apparus/disparus, prospects récupérés.
    - label : nom du snapshot à comparer (défaut = le plus récent)
    """
    db_path = get_db_path(current_user["agency_slug"])
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row

    # Snapshot à comparer
    if not label:
        row = conn.execute("SELECT DISTINCT snapshot_label, snapshot_date FROM matchings_snapshot ORDER BY snapshot_date DESC LIMIT 1").fetchone()
        if not row:
            conn.close()
            return {"error": "Aucun snapshot disponible. Lancez d'abord POST /snapshot."}
        label = row["snapshot_label"]
        snapshot_date = row["snapshot_date"]
    else:
        row = conn.execute("SELECT snapshot_date FROM matchings_snapshot WHERE snapshot_label = ? LIMIT 1", (label,)).fetchone()
        snapshot_date = row["snapshot_date"] if row else "inconnue"

    # ── Statistiques snapshot (avant) ──
    snap = conn.execute("""
        SELECT COUNT(*) as nb,
               ROUND(AVG(score), 1) as avg_score,
               SUM(CASE WHEN score >= 75 THEN 1 ELSE 0 END) as excellents,
               SUM(CASE WHEN score >= 50 AND score < 75 THEN 1 ELSE 0 END) as bons,
               SUM(CASE WHEN score < 50 THEN 1 ELSE 0 END) as faibles,
               COUNT(DISTINCT prospect_id) as nb_prospects,
               COUNT(DISTINCT bien_id) as nb_biens
        FROM matchings_snapshot WHERE snapshot_label = ?
    """, (label,)).fetchone()

    # ── Statistiques actuelles (après) ──
    actuel = conn.execute("""
        SELECT COUNT(*) as nb,
               ROUND(AVG(score), 1) as avg_score,
               SUM(CASE WHEN score >= 75 THEN 1 ELSE 0 END) as excellents,
               SUM(CASE WHEN score >= 50 AND score < 75 THEN 1 ELSE 0 END) as bons,
               SUM(CASE WHEN score < 50 THEN 1 ELSE 0 END) as faibles,
               COUNT(DISTINCT prospect_id) as nb_prospects,
               COUNT(DISTINCT bien_id) as nb_biens
        FROM matchings m
        JOIN prospects p ON m.prospect_id = p.id
        WHERE p.archive = 0 OR p.archive IS NULL
    """).fetchone()

    # ── Évolution par prospect : score avant vs après ──
    evol_prospects = conn.execute("""
        SELECT
            s.prospect_nom as nom,
            s.prospect_budget as budget,
            s.prospect_type as type_recherche,
            s.prospect_destination as destination,
            ROUND(AVG(s.score), 1) as score_avant,
            ROUND(AVG(m.score), 1) as score_apres,
            ROUND(AVG(m.score) - AVG(s.score), 1) as delta,
            COUNT(DISTINCT s.bien_id) as nb_avant,
            COUNT(DISTINCT m.bien_id) as nb_apres
        FROM matchings_snapshot s
        LEFT JOIN matchings m ON m.prospect_id = s.prospect_id
        LEFT JOIN prospects p ON p.id = s.prospect_id
        WHERE s.snapshot_label = ?
          AND (p.archive = 0 OR p.archive IS NULL)
        GROUP BY s.prospect_id
        ORDER BY delta ASC
    """, (label,)).fetchall()

    # ── Matchings disparus (prospects/biens qui n'ont plus de matching) ──
    disparus = conn.execute("""
        SELECT s.prospect_nom, s.bien_type, s.bien_ville, s.bien_prix,
               s.score as score_avant, s.prospect_type, s.prospect_budget
        FROM matchings_snapshot s
        LEFT JOIN matchings m ON m.prospect_id = s.prospect_id AND m.bien_id = s.bien_id
        WHERE s.snapshot_label = ? AND m.id IS NULL
        ORDER BY s.score DESC
    """, (label,)).fetchall()

    # ── Matchings apparus (nouveaux après re-run) ──
    apparus = conn.execute("""
        SELECT p.nom as prospect_nom, b.type as bien_type, b.ville as bien_ville,
               b.prix as bien_prix, m.score, p.bien as prospect_type, p.budget_max
        FROM matchings m
        JOIN prospects p ON m.prospect_id = p.id
        JOIN biens b ON m.bien_id = b.id
        LEFT JOIN matchings_snapshot s ON s.prospect_id = m.prospect_id
                                      AND s.bien_id = m.bien_id
                                      AND s.snapshot_label = ?
        WHERE s.id IS NULL AND (p.archive = 0 OR p.archive IS NULL)
        ORDER BY m.score DESC
    """, (label,)).fetchall()

    # ── Prospects récupérés (oubliés dans snapshot, présents maintenant) ──
    prospects_recuperes = conn.execute("""
        SELECT DISTINCT p.nom, p.bien, p.villes, p.budget_max,
               MAX(m.score) as meilleur_score, COUNT(m.id) as nb_matchings
        FROM matchings m
        JOIN prospects p ON m.prospect_id = p.id
        LEFT JOIN matchings_snapshot s ON s.prospect_id = p.id AND s.snapshot_label = ?
        WHERE s.prospect_id IS NULL AND (p.archive = 0 OR p.archive IS NULL)
        GROUP BY p.id
    """, (label,)).fetchall()

    # ── Snapshots disponibles ──
    snapshots_dispo = conn.execute("""
        SELECT snapshot_label, snapshot_date, COUNT(*) as nb_matchings
        FROM matchings_snapshot GROUP BY snapshot_label ORDER BY snapshot_date DESC
    """).fetchall()

    conn.close()

    def delta_str(v):
        if v is None: return "N/A"
        return f"+{v}" if v > 0 else str(v)

    return {
        "snapshot_compare": label,
        "snapshot_date": snapshot_date,
        "snapshots_disponibles": [dict(r) for r in snapshots_dispo],
        "avant": dict(snap) if snap else {},
        "apres": dict(actuel) if actuel else {},
        "resume": {
            "delta_score_moyen": delta_str(
                round(actuel["avg_score"] - snap["avg_score"], 1)
                if actuel["avg_score"] and snap["avg_score"] else None
            ),
            "delta_matchings": (actuel["nb"] or 0) - (snap["nb"] or 0),
            "delta_excellents": (actuel["excellents"] or 0) - (snap["excellents"] or 0),
            "delta_faibles": (actuel["faibles"] or 0) - (snap["faibles"] or 0),
            "matchings_disparus": len(disparus),
            "matchings_apparus": len(apparus),
            "prospects_recuperes": len(prospects_recuperes),
        },
        "evolution_par_prospect": [dict(r) for r in evol_prospects],
        "matchings_disparus": [dict(r) for r in disparus],
        "matchings_apparus": [dict(r) for r in apparus],
        "prospects_recuperes": [dict(r) for r in prospects_recuperes],
    }


@router.post("/snapshot")
def creer_snapshot(body: dict, _user=Depends(require_not_demo), current_user: dict = Depends(get_current_user)):
    """
    Crée un snapshot nommé des matchings actuels pour comparaison ultérieure.
    Body : { "label": "avant_refacto_v2" }
    """
    label = (body.get("label") or "").strip()
    if not label:
        return {"error": "Champ 'label' requis"}
    if len(label) > 80:
        return {"error": "Label trop long (max 80 caractères)"}

    db_path = get_db_path(current_user["agency_slug"])
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row

    # Créer la table si elle n'existe pas encore (multi-agence)
    conn.execute('''
        CREATE TABLE IF NOT EXISTS matchings_snapshot (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            snapshot_label TEXT NOT NULL,
            snapshot_date TEXT NOT NULL,
            original_matching_id INTEGER,
            prospect_id INTEGER,
            bien_id INTEGER,
            score INTEGER,
            points_forts TEXT,
            points_attention TEXT,
            recommandation TEXT,
            date_analyse TEXT,
            statut_prospect TEXT,
            prospect_nom TEXT,
            prospect_budget REAL,
            prospect_type TEXT,
            prospect_villes TEXT,
            prospect_destination TEXT,
            bien_type TEXT,
            bien_ville TEXT,
            bien_prix REAL,
            bien_surface REAL,
            bien_dpe TEXT
        )
    ''')

    existing = conn.execute(
        "SELECT COUNT(*) FROM matchings_snapshot WHERE snapshot_label = ?", (label,)
    ).fetchone()[0]
    if existing > 0:
        conn.close()
        return {"error": f"Un snapshot '{label}' existe déjà ({existing} matchings). Choisissez un autre nom."}

    conn.execute('''
        INSERT INTO matchings_snapshot
            (snapshot_label, snapshot_date,
             original_matching_id, prospect_id, bien_id, score,
             points_forts, points_attention, recommandation,
             date_analyse, statut_prospect,
             prospect_nom, prospect_budget, prospect_type, prospect_villes, prospect_destination,
             bien_type, bien_ville, bien_prix, bien_surface, bien_dpe)
        SELECT
            ?, datetime("now"),
            m.id, m.prospect_id, m.bien_id, m.score,
            m.points_forts, m.points_attention, m.recommandation,
            m.date_analyse, m.statut_prospect,
            p.nom, p.budget_max, p.bien, p.villes, p.destination,
            b.type, b.ville, b.prix, b.surface, b.dpe_lettre
        FROM matchings m
        JOIN prospects p ON m.prospect_id = p.id
        JOIN biens b ON m.bien_id = b.id
    ''', (label,))
    conn.commit()

    nb = conn.execute(
        "SELECT COUNT(*) FROM matchings_snapshot WHERE snapshot_label = ?", (label,)
    ).fetchone()[0]
    conn.close()

    return {
        "success": True,
        "label": label,
        "matchings_sauvegardes": nb,
        "message": f"Snapshot '{label}' créé avec {nb} matchings. Comparez après re-run via GET /stats/comparaison?label={label}"
    }


@router.get("/historique")
def get_historique(current_user: dict = Depends(get_current_user)):
    conn = sqlite3.connect(get_db_path(current_user["agency_slug"]))
    conn.row_factory = sqlite3.Row

    # Grouper les matchings par date d'analyse
    historique = conn.execute('''
        SELECT
            DATE(date_analyse) as date,
            TIME(date_analyse) as heure,
            COUNT(*) as nb_matchings,
            COUNT(DISTINCT prospect_id) as nb_prospects,
            COUNT(DISTINCT bien_id) as nb_biens,
            ROUND(AVG(score), 1) as score_moyen,
            MAX(score) as score_max,
            SUM(CASE WHEN score >= 75 THEN 1 ELSE 0 END) as excellents,
            SUM(CASE WHEN score >= 50 AND score < 75 THEN 1 ELSE 0 END) as corrects,
            SUM(CASE WHEN score < 50 THEN 1 ELSE 0 END) as faibles,
            MIN(date_analyse) as date_complete
        FROM matchings
        GROUP BY DATE(date_analyse), substr(TIME(date_analyse), 1, 5)
        ORDER BY date_analyse DESC
        LIMIT 50
    ''').fetchall()

    conn.close()
    return [dict(row) for row in historique]


@router.post("/matching/run/{prospect_id}")
def run_matching(prospect_id: int, _user=Depends(require_not_demo), current_user: dict = Depends(get_current_user)):
    usage = get_monthly_usage(current_user["agency_slug"])
    check_quota(current_user.get("agency_plan_id", "agence"), "max_matchings_mois", usage["matchings_count"])
    db_path = get_db_path(current_user["agency_slug"])
    settings = get_settings_values(db_path)
    max_biens = settings['max_biens_par_prospect']
    budget_min = settings['budget_tolerance_min']
    budget_max = settings['budget_tolerance_max']

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row

    prospect = conn.execute("SELECT * FROM prospects WHERE id = ?", (prospect_id,)).fetchone()
    if not prospect:
        conn.close()
        return {"error": "Prospect non trouvé"}

    prospect = dict(prospect)

    # Anti double-clic : refus si analyse < COOLDOWN_SECONDS
    last = conn.execute(
        "SELECT MAX(date_analyse) FROM matchings WHERE prospect_id = ?", (prospect_id,)
    ).fetchone()[0]
    if last:
        delta = (datetime.now() - datetime.fromisoformat(last)).total_seconds()
        if delta < COOLDOWN_SECONDS:
            conn.close()
            return {"error": f"Analyse déjà effectuée il y a {int(delta)}s, attendez {COOLDOWN_SECONDS - int(delta)}s"}

    biens = [dict(row) for row in conn.execute(
        "SELECT * FROM biens WHERE statut IS NULL OR statut = 'actif'"
    ).fetchall()]

    # Exclure les biens que le prospect a refusés
    refused_ids = {row[0] for row in conn.execute(
        "SELECT bien_id FROM matchings WHERE prospect_id = ? AND statut_prospect = 'refused'",
        (prospect_id,)
    ).fetchall()}
    conn.close()

    if refused_ids:
        biens = [b for b in biens if b['id'] not in refused_ids]

    if not biens:
        return {"error": "Aucun bien en base"}

    # Préfiltrage (budget, type, ville, contraintes observations)
    client_data = {
        "nom": prospect.get("nom"),
        "bien": prospect.get("bien"),
        "ville": prospect.get("villes"),
        "budget": prospect.get("budget_max"),
        "observation": prospect.get("observation"),
    }
    biens_filtres = prefiltre_biens(client_data, biens, budget_min, budget_max)

    if not biens_filtres:
        return {
            "error": "Aucun bien ne correspond aux critères de ce prospect",
            "matchings_count": 0
        }

    # Limiter au max configuré, triés par score objectif Python (budget+type+ville)
    biens_filtres = trier_biens_par_score_objectif(prospect, biens_filtres, max_biens)

    try:
        if not os.getenv("ANTHROPIC_API_KEY"):
            return {"error": "Clé API Anthropic non configurée"}

        # Scoring hybride (objectif Python + qualitatif Claude)
        resultats = scorer_biens_hybride(prospect, biens_filtres, model=settings['model'], agency_slug=current_user["agency_slug"])
        resultat_brut = formater_pour_affichage(resultats)

        conn = sqlite3.connect(db_path)
        refused_biens = {row[0] for row in conn.execute(
            "SELECT bien_id FROM matchings WHERE prospect_id = ? AND statut_prospect = 'refused'",
            (prospect_id,)
        ).fetchall()}

        # Dédoublonner par bien_id (garder le meilleur score)
        seen_biens = {}
        for r in resultats:
            bid = r["bien_id"]
            if bid not in seen_biens or r["score"] > seen_biens[bid]["score"]:
                seen_biens[bid] = r
        resultats = list(seen_biens.values())

        # Limiter le nombre de matchings par prospect (triés par score desc)
        score_minimum = int(settings.get('score_minimum', 0))
        max_matchings = int(settings.get('max_matchings_par_prospect', 5))
        resultats = sorted(
            [r for r in resultats if r["score"] >= score_minimum],
            key=lambda r: r["score"], reverse=True
        )[:max_matchings]

        # Transaction atomique : si une INSERT échoue, le DELETE est annulé
        biens_a_analyser_ids = [b["id"] for b in biens_filtres]
        placeholders = ",".join("?" * len(biens_a_analyser_ids))
        now_iso = datetime.now().isoformat()
        nb_matchings = 0
        try:
            conn.execute("BEGIN")
            conn.execute(
                f"DELETE FROM matchings WHERE prospect_id = ? AND bien_id IN ({placeholders})",
                [prospect_id] + biens_a_analyser_ids
            )
            for r in resultats:
                bien_match = next((b for b in biens_filtres if b["id"] == r["bien_id"]), None)
                if not bien_match:
                    continue
                conn.execute("""
                    INSERT INTO matchings (prospect_id, bien_id, score, points_forts, points_attention, recommandation, date_analyse, date_creation)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    prospect_id, r["bien_id"], r["score"],
                    "\n".join(f"- {p}" for p in r.get("points_forts", [])),
                    "\n".join(f"- {p}" for p in r.get("points_attention", [])),
                    r.get("recommandation", ""),
                    now_iso, now_iso
                ))
                nb_matchings += 1
            for bien_id in refused_biens:
                conn.execute(
                    "UPDATE matchings SET statut_prospect = 'refused' WHERE prospect_id = ? AND bien_id = ?",
                    (prospect_id, bien_id)
                )
            conn.commit()
        except Exception:
            conn.rollback()
            conn.close()
            raise

        # Notification si excellent match
        best_score = max((r["score"] for r in resultats), default=0)
        if best_score >= 80:
            conn.execute("""
                INSERT INTO notifications (type, title, message, link, created_at)
                VALUES (?, ?, ?, ?, ?)
            """, (
                "match",
                "Excellent match trouvé !",
                f"Score {best_score} pour {prospect.get('nom')}",
                "/matchings",
                datetime.now().isoformat()
            ))
            conn.commit()

        conn.close()

        increment_monthly_usage(current_user["agency_slug"], "matchings_count")
        return {
            "message": f"Analyse terminée, {nb_matchings} matching(s) trouvé(s)",
            "matchings_count": nb_matchings,
            "resultat": resultat_brut
        }

    except Exception as e:
        return {"error": "Une erreur interne est survenue"}


@router.post("/matching/run-all")
def run_all_matchings(_user=Depends(require_not_demo), current_user: dict = Depends(get_current_user)):
    usage = get_monthly_usage(current_user["agency_slug"])
    check_quota(current_user.get("agency_plan_id", "agence"), "max_matchings_mois", usage["matchings_count"])
    if not _analyse_all_lock.acquire(blocking=False):
        return {"error": "Une analyse est déjà en cours, veuillez patienter"}
    db_path = get_db_path(current_user["agency_slug"])
    settings = get_settings_values(db_path)
    max_biens = settings['max_biens_par_prospect']
    budget_min = settings['budget_tolerance_min']
    budget_max = settings['budget_tolerance_max']
    score_minimum = int(settings.get('score_minimum', 0))
    log.info(f"Score minimum configuré : {score_minimum}")

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    prospects = [dict(row) for row in conn.execute(
        "SELECT * FROM prospects WHERE archive = 0 OR archive IS NULL"
    ).fetchall()]
    biens = [dict(row) for row in conn.execute(
        "SELECT * FROM biens WHERE statut IS NULL OR statut = 'actif'"
    ).fetchall()]

    # Lire le score minimum depuis les settings
    row_score = conn.execute("SELECT value FROM settings WHERE key = 'score_minimum'").fetchone()
    score_minimum = int(row_score['value']) if row_score else 0
    log.info(f"Score minimum configuré : {score_minimum}")

    conn.close()

    if not prospects:
        return {"error": "Aucun prospect en base"}
    if not biens:
        return {"error": "Aucun bien en base"}
    if not os.getenv("ANTHROPIC_API_KEY"):
        return {"error": "Clé API Anthropic non configurée"}

    # Charger les refus une seule fois
    conn = sqlite3.connect(db_path)
    refused_map = {(row[0], row[1]) for row in conn.execute(
        "SELECT prospect_id, bien_id FROM matchings WHERE statut_prospect = 'refused'"
    ).fetchall()}
    conn.close()

    total_matchings = 0
    prospects_analyses = 0
    prospects_sans_biens = 0

    try:
        for prospect in prospects:
            client_data = {
                "nom": prospect.get("nom"),
                "bien": prospect.get("bien"),
                "ville": prospect.get("villes"),
                "budget": prospect.get("budget_max"),
                "observation": prospect.get("observation"),
            }

            refused_ids_p = {bid for (pid, bid) in refused_map if pid == prospect["id"]}
            biens_prospect = [b for b in biens if b["id"] not in refused_ids_p]
            biens_filtres = prefiltre_biens(client_data, biens_prospect, budget_min, budget_max)

            if not biens_filtres:
                prospects_sans_biens += 1
                log.debug(f"Pas de biens compatibles : {prospect.get('nom')}")
                continue

            # Limiter au max configuré, triés par score objectif Python (budget+type+ville)
            biens_filtres = trier_biens_par_score_objectif(prospect, biens_filtres, max_biens)

            try:
                resultats = scorer_biens_hybride(prospect, biens_filtres, model=settings['model'], agency_slug=current_user["agency_slug"])
            except Exception as e:
                log.error(f"Erreur Claude pour {prospect.get('nom')}: {e}")
                continue  # On garde les anciens matchings, on ne touche pas à la DB

            # Transaction par prospect : DELETE + INSERT atomiques
            biens_ids = [b["id"] for b in biens_filtres]
            placeholders = ",".join("?" * len(biens_ids))
            now_iso = datetime.now().isoformat()
            conn = sqlite3.connect(db_path)
            try:
                conn.execute("BEGIN")
                conn.execute(
                    f"DELETE FROM matchings WHERE prospect_id = ? AND bien_id IN ({placeholders})",
                    [prospect["id"]] + biens_ids
                )
                max_matchings = int(settings.get('max_matchings_par_prospect', 5))
                resultats_filtres = sorted(
                    [r for r in resultats if r["score"] >= score_minimum],
                    key=lambda r: r["score"], reverse=True
                )[:max_matchings]
                for r in resultats_filtres:
                    conn.execute("""
                        INSERT INTO matchings (prospect_id, bien_id, score, points_forts, points_attention, recommandation, date_analyse, date_creation)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        prospect["id"], r["bien_id"], r["score"],
                        "\n".join(f"- {p}" for p in r.get("points_forts", [])),
                        "\n".join(f"- {p}" for p in r.get("points_attention", [])),
                        r.get("recommandation", ""),
                        now_iso, now_iso
                    ))
                    total_matchings += 1
                for (pid, bid) in refused_map:
                    if pid == prospect["id"]:
                        conn.execute("UPDATE matchings SET statut_prospect = 'refused' WHERE prospect_id = ? AND bien_id = ?", (pid, bid))
                conn.commit()
            except Exception as e:
                conn.rollback()
                log.error(f"Erreur DB pour {prospect.get('nom')}: {e}")
            finally:
                conn.close()

            prospects_analyses += 1
            log.info(f"OK {prospect.get('nom')} - {len(resultats)} matchings")

    finally:
        _analyse_all_lock.release()

    increment_monthly_usage(current_user["agency_slug"], "matchings_count")
    return {
        "message": f"Analyse terminée ! {total_matchings} matchings trouvés",
        "details": {
            "prospects_analyses": prospects_analyses,
            "prospects_sans_biens": prospects_sans_biens,
            "total_matchings": total_matchings
        }
    }


@router.post("/matching/run-by-bien/{bien_id}")
def run_matching_by_bien(bien_id: int, _user: dict = Depends(require_not_demo), current_user: dict = Depends(get_current_user)):
    """Analyse un bien contre tous les prospects compatibles."""
    usage = get_monthly_usage(current_user["agency_slug"])
    check_quota(current_user.get("agency_plan_id", "agence"), "max_matchings_mois", usage["matchings_count"])
    result = _core_analyser_bien(bien_id, db_path=get_db_path(current_user["agency_slug"]))
    if "error" not in result:
        increment_monthly_usage(current_user["agency_slug"], "matchings_count")
    return result


@router.get("/debug/prefiltre/{prospect_id}")
def debug_prefiltre(prospect_id: int, current_user: dict = Depends(get_current_user)):
    """Debug : voir quels biens passent le préfiltre pour un prospect"""
    db_path = get_db_path(current_user["agency_slug"])
    settings = get_settings_values(db_path)
    budget_min = settings['budget_tolerance_min']
    budget_max = settings['budget_tolerance_max']

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row

    prospect = conn.execute("SELECT * FROM prospects WHERE id = ?", (prospect_id,)).fetchone()
    if not prospect:
        conn.close()
        return {"error": "Prospect non trouvé"}

    prospect = dict(prospect)
    biens = [dict(row) for row in conn.execute(
        "SELECT * FROM biens WHERE statut IS NULL OR statut = 'actif'"
    ).fetchall()]
    conn.close()

    client_data = {
        "nom": prospect.get('nom'),
        "bien": prospect.get('bien'),
        "ville": prospect.get('villes'),
        "budget": prospect.get('budget_max'),
        "observation": prospect.get('observation'),
    }

    biens_filtres = prefiltre_biens(client_data, biens, budget_min, budget_max)

    return {
        "prospect": {
            "id": prospect_id,
            "nom": prospect.get('nom'),
            "ville_recherchee": prospect.get('villes'),
            "budget": prospect.get('budget_max'),
            "type_bien": prospect.get('bien')
        },
        "settings": {
            "budget_min_tolerance": budget_min,
            "budget_max_tolerance": budget_max
        },
        "total_biens": len(biens),
        "biens_apres_filtre": len(biens_filtres),
        "biens_filtres": [
            {
                "id": b["id"],
                "reference": b.get("reference"),
                "ville": b.get("ville"),
                "prix": b.get("prix"),
                "type": b.get("type")
            }
            for b in biens_filtres
        ]
    }
