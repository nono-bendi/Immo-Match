import sqlite3
from logger import get_logger
log = get_logger('matchings')
import os
import json
from datetime import datetime
from fastapi import APIRouter, Depends

from config import DB_PATH, _analyse_all_lock, COOLDOWN_SECONDS
from routers.auth import get_current_user, require_not_demo
from scoring import scorer_biens as scorer_biens_hybride, formater_pour_affichage

router = APIRouter()


# ============================================================
# FONCTIONS PARTAGÉES
# ============================================================

def get_settings_values():
    """Charge les settings depuis la base de données"""
    conn = sqlite3.connect(DB_PATH)
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


def prefiltre_biens(client, biens, budget_min_tolerance=50, budget_max_tolerance=130):
    """
    Préfiltre les biens pour ne garder que les candidats potentiels.
    - Exclut les biens de zones géographiques trop éloignées
    - Ajoute un flag 'hors_secteur' pour les biens dans des villes proches mais différentes
    """
    candidats = []

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

        # Filtre budget (très souple)
        if client.get("budget") and bien.get("prix"):
            budget_max_tolere = client["budget"] * (budget_max_tolerance / 100)
            if bien["prix"] > budget_max_tolere:
                exclu = True

        # Filtre géographique
        if villes_client and bien.get("ville") and not exclu:
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


def _core_analyser_bien(bien_id: int) -> dict:
    """
    Logique pure d'analyse d'un bien contre tous les prospects compatibles.
    Appelable depuis une route FastAPI ou un thread background.
    """
    settings = get_settings_values()
    budget_min = settings["budget_tolerance_min"]
    budget_max = settings["budget_tolerance_max"]
    score_minimum = int(settings.get("score_minimum", 0))

    conn = sqlite3.connect(DB_PATH)
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
            conn = sqlite3.connect(DB_PATH)
            existing = conn.execute(
                "SELECT id FROM matchings WHERE prospect_id = ? AND bien_id = ?",
                (prospect["id"], bien_id)
            ).fetchone()
            conn.close()
            if existing:
                continue

            try:
                resultats = scorer_biens_hybride(prospect, [bien], model=settings["model"])
            except Exception as e:
                log.error(f"Erreur Claude prospect #{prospect.get('id')}: {e}")
                continue

            if not resultats:
                continue

            r = resultats[0]
            if r["score"] < score_minimum:
                continue

            conn = sqlite3.connect(DB_PATH)
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

@router.get("/matchings")
def get_matchings():
    settings = get_settings_values()
    score_minimum = int(settings.get('score_minimum', 0))
    max_matchings = int(settings.get('max_matchings_par_prospect', 5))

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.execute('''
        SELECT m.*, p.nom as prospect_nom, p.budget_max as prospect_budget,
               p.mail as prospect_mail, p.telephone as prospect_tel,
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

    # Limiter à max_matchings par prospect (déjà triés score DESC)
    seen = {}
    result = []
    for m in all_matchings:
        pid = m['prospect_id']
        if seen.get(pid, 0) < max_matchings:
            result.append(m)
            seen[pid] = seen.get(pid, 0) + 1

    result.sort(key=lambda m: m['score'], reverse=True)
    return result


@router.get("/matchings/by-bien/{bien_id}")
def get_matchings_by_bien(bien_id: int):
    conn = sqlite3.connect(DB_PATH)
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
def get_matchings_by_date(date_analyse: str):
    """Récupère les matchings d'une analyse spécifique (par minute)"""
    conn = sqlite3.connect(DB_PATH)
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
def get_stats():
    conn = sqlite3.connect(DB_PATH)
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
    }


@router.get("/historique")
def get_historique():
    conn = sqlite3.connect(DB_PATH)
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
def run_matching(prospect_id: int, _user=Depends(require_not_demo)):
    settings = get_settings_values()
    max_biens = settings['max_biens_par_prospect']
    budget_min = settings['budget_tolerance_min']
    budget_max = settings['budget_tolerance_max']

    conn = sqlite3.connect(DB_PATH)
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

    # Préfiltrage (budget, type, ville)
    client_data = {
        "nom": prospect.get("nom"),
        "bien": prospect.get("bien"),
        "ville": prospect.get("villes"),
        "budget": prospect.get("budget_max"),
    }
    biens_filtres = prefiltre_biens(client_data, biens, budget_min, budget_max)

    if not biens_filtres:
        return {
            "error": "Aucun bien ne correspond aux critères de ce prospect",
            "matchings_count": 0
        }

    # Limiter au max configuré, triés par proximité prix
    budget_client = prospect.get("budget_max") or 200000
    biens_filtres = sorted(biens_filtres, key=lambda b: abs((b.get("prix") or 0) - budget_client))[:max_biens]

    try:
        if not os.getenv("ANTHROPIC_API_KEY"):
            return {"error": "Clé API Anthropic non configurée"}

        # Scoring hybride (objectif Python + qualitatif Claude)
        resultats = scorer_biens_hybride(prospect, biens_filtres, model=settings['model'])
        resultat_brut = formater_pour_affichage(resultats)

        conn = sqlite3.connect(DB_PATH)
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

        return {
            "message": f"Analyse terminée, {nb_matchings} matching(s) trouvé(s)",
            "matchings_count": nb_matchings,
            "resultat": resultat_brut
        }

    except Exception as e:
        return {"error": "Une erreur interne est survenue"}


@router.post("/matching/run-all")
def run_all_matchings(_user=Depends(require_not_demo)):
    if not _analyse_all_lock.acquire(blocking=False):
        return {"error": "Une analyse est déjà en cours, veuillez patienter"}
    settings = get_settings_values()
    max_biens = settings['max_biens_par_prospect']
    budget_min = settings['budget_tolerance_min']
    budget_max = settings['budget_tolerance_max']
    score_minimum = int(settings.get('score_minimum', 0))
    log.info(f"Score minimum configuré : {score_minimum}")

    conn = sqlite3.connect(DB_PATH)
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
    conn = sqlite3.connect(DB_PATH)
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
            }

            refused_ids_p = {bid for (pid, bid) in refused_map if pid == prospect["id"]}
            biens_prospect = [b for b in biens if b["id"] not in refused_ids_p]
            biens_filtres = prefiltre_biens(client_data, biens_prospect, budget_min, budget_max)

            if not biens_filtres:
                prospects_sans_biens += 1
                log.debug(f"Pas de biens compatibles : {prospect.get('nom')}")
                continue

            budget_client = prospect.get("budget_max") or 200000
            biens_filtres = sorted(biens_filtres, key=lambda b: abs((b.get("prix") or 0) - budget_client))[:max_biens]

            try:
                resultats = scorer_biens_hybride(prospect, biens_filtres, model=settings['model'])
            except Exception as e:
                log.error(f"Erreur Claude pour {prospect.get('nom')}: {e}")
                continue  # On garde les anciens matchings, on ne touche pas à la DB

            # Transaction par prospect : DELETE + INSERT atomiques
            biens_ids = [b["id"] for b in biens_filtres]
            placeholders = ",".join("?" * len(biens_ids))
            now_iso = datetime.now().isoformat()
            conn = sqlite3.connect(DB_PATH)
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

    return {
        "message": f"Analyse terminée ! {total_matchings} matchings trouvés",
        "details": {
            "prospects_analyses": prospects_analyses,
            "prospects_sans_biens": prospects_sans_biens,
            "total_matchings": total_matchings
        }
    }


@router.post("/matching/run-by-bien/{bien_id}")
def run_matching_by_bien(bien_id: int, _user: dict = Depends(require_not_demo)):
    """Analyse un bien contre tous les prospects compatibles."""
    return _core_analyser_bien(bien_id)


@router.get("/debug/prefiltre/{prospect_id}")
def debug_prefiltre(prospect_id: int):
    """Debug : voir quels biens passent le préfiltre pour un prospect"""
    settings = get_settings_values()
    budget_min = settings['budget_tolerance_min']
    budget_max = settings['budget_tolerance_max']

    conn = sqlite3.connect(DB_PATH)
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
