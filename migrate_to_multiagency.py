"""
Script de migration one-shot : mono-agence → multi-agence
----------------------------------------------------------
À lancer UNE SEULE FOIS depuis la racine du projet :
    python migrate_to_multiagency.py

Ce que ça fait :
1. Crée le dossier data/
2. Initialise agencies.db avec Saint François + Terracota
3. Copie immomatch.db → data/saint_francois.db
4. Migre les users de immomatch.db vers agencies.db (agency_id = saint_francois)
5. Crée une DB vide data/terracota.db
6. Crée un compte démo pour Terracota (email: demo@terracota-immo.fr / mdp: demo123)
"""

import os
import shutil
import sqlite3
from datetime import datetime

import bcrypt

from agencies_db import init_agencies_db, AGENCIES_DB_PATH, DATA_DIR, get_db_path
from database import init_db

OLD_DB = "immomatch.db"


def migrate():
    print("── Migration multi-agences ──────────────────────────────")

    # ── 1. Init agencies.db ────────────────────────────────────────────────────
    print("1. Initialisation de agencies.db...")
    init_agencies_db()
    print("   OK")

    # ── 2. Copier immomatch.db → data/saint_francois.db ───────────────────────
    sf_db = get_db_path("saint_francois")
    if not os.path.exists(OLD_DB):
        print(f"   ATTENTION : {OLD_DB} introuvable, création d'une DB vide pour Saint François")
        init_db(sf_db)
    elif os.path.exists(sf_db):
        print(f"   data/saint_francois.db existe déjà, on ne le réécrase pas")
    else:
        print(f"2. Copie {OLD_DB} → {sf_db}...")
        shutil.copy2(OLD_DB, sf_db)
        print("   OK")

    # ── 3. Migrer les users depuis immomatch.db vers agencies.db ──────────────
    agencies_conn = sqlite3.connect(AGENCIES_DB_PATH)
    agencies_conn.row_factory = sqlite3.Row

    # Récupérer l'id de Saint François
    sf_agency = agencies_conn.execute(
        "SELECT id FROM agencies WHERE slug = 'saint_francois'"
    ).fetchone()
    sf_agency_id = sf_agency["id"]

    if os.path.exists(OLD_DB):
        print("3. Migration des users vers agencies.db...")
        old_conn = sqlite3.connect(OLD_DB)
        old_conn.row_factory = sqlite3.Row
        old_users = old_conn.execute("SELECT * FROM users").fetchall()
        old_conn.close()

        migrated = 0
        for u in old_users:
            existing = agencies_conn.execute(
                "SELECT id FROM users WHERE email = ?", (u["email"],)
            ).fetchone()
            if not existing:
                agencies_conn.execute('''
                    INSERT INTO users (email, password_hash, nom, role, agency_id, created_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (
                    u["email"],
                    u["password_hash"],
                    u["nom"],
                    u["role"],
                    sf_agency_id,
                    u["created_at"],
                ))
                migrated += 1
        agencies_conn.commit()
        print(f"   {migrated} user(s) migré(s)")
    else:
        print("3. Aucun ancien DB trouvé, étape sautée")

    # ── 4. Créer DB vide pour Terracota ───────────────────────────────────────
    print("4. Création de data/terracota.db...")
    terra_db = get_db_path("terracota")
    if not os.path.exists(terra_db):
        init_db(terra_db)
        print("   OK")
    else:
        print("   Déjà existant, on ne le réécrase pas")

    # ── 5. Créer un compte démo pour Terracota ────────────────────────────────
    print("5. Création du compte démo Terracota...")
    terra_agency = agencies_conn.execute(
        "SELECT id FROM agencies WHERE slug = 'terracota'"
    ).fetchone()
    terra_agency_id = terra_agency["id"]

    demo_email = "demo@terracota-immo.fr"
    existing_demo = agencies_conn.execute(
        "SELECT id FROM users WHERE email = ?", (demo_email,)
    ).fetchone()

    if not existing_demo:
        pw_hash = bcrypt.hashpw(b"demo123", bcrypt.gensalt()).decode("utf-8")
        agencies_conn.execute('''
            INSERT INTO users (email, password_hash, nom, role, agency_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            demo_email,
            pw_hash,
            "Jean Dupont",
            "agent",
            terra_agency_id,
            datetime.now().isoformat(),
        ))
        agencies_conn.commit()
        print("   Compte créé : demo@terracota-immo.fr / demo123")
    else:
        print("   Compte déjà existant")

    agencies_conn.close()

    # ── 6. Seed données démo dans terracota.db ────────────────────────────────
    print("6. Injection de données démo dans Terracota...")
    _seed_terracota(terra_db)

    print()
    print("✓ Migration terminée !")
    print()
    print("  Saint François  → data/saint_francois.db")
    print("  Terracota       → data/terracota.db (avec données démo)")
    print()
    print("  Compte test Terracota : demo@terracota-immo.fr / demo123")
    print()
    print("  Tu peux maintenant lancer : python -m uvicorn backend:app --reload")


def _seed_terracota(db_path: str):
    """Injecte des prospects, biens et matchings de démo dans la DB Terracota."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row

    # Vider si déjà seedé
    if conn.execute("SELECT COUNT(*) FROM prospects").fetchone()[0] > 0:
        print("   Données déjà présentes, on ne réinjecte pas")
        conn.close()
        return

    today = datetime.now().strftime("%Y-%m-%d")
    now = datetime.now().isoformat()

    # ── Prospects ────────────────────────────────────────────────────────────
    prospects = [
        ("Marie Fontaine",  "marie.fontaine@email.fr",  "06 11 22 33 44", "Nice",       "Appartement", "Nice, Antibes",     350000, "T3 lumineux, parking souhaité"),
        ("Lucas Bernard",   "lucas.bernard@email.fr",   "06 55 66 77 88", "Cannes",      "Appartement", "Cannes",            280000, "Vue mer si possible"),
        ("Sophie Martin",   "sophie.martin@email.fr",   "06 99 00 11 22", "Monaco",      "Villa",       "Nice, Villefranche", 650000, "Jardin indispensable, 4 chambres min"),
        ("Pierre Leroy",    "pierre.leroy@email.fr",    "06 33 44 55 66", "Menton",      "Appartement", "Menton, Roquebrune", 220000, "Proche mer, ascenseur"),
        ("Isabelle Noir",   "isabelle.noir@email.fr",   "06 77 88 99 00", "Nice",        "Maison",      "Nice",              480000, "Plain-pied, grand terrain"),
    ]

    prospect_ids = []
    for nom, mail, tel, domicile, bien, villes, budget, obs in prospects:
        cur = conn.execute('''
            INSERT INTO prospects (date, nom, mail, telephone, domicile, bien, villes, budget_max, observation, archive)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        ''', (today, nom, mail, tel, domicile, bien, villes, budget, obs))
        prospect_ids.append(cur.lastrowid)

    # ── Biens ────────────────────────────────────────────────────────────────
    biens = [
        ("TCT-001", "Appartement", "Nice",       "Vieux-Nice",    320000, 68,  3, 2, "TERRACOTA IMMOBILIER"),
        ("TCT-002", "Appartement", "Cannes",     "Croisette",     265000, 55,  2, 1, "TERRACOTA IMMOBILIER"),
        ("TCT-003", "Villa",       "Nice",       "Cimiez",        620000, 180, 6, 4, "TERRACOTA IMMOBILIER"),
        ("TCT-004", "Appartement", "Antibes",    "Centre",        295000, 72,  3, 2, "TERRACOTA IMMOBILIER"),
        ("TCT-005", "Maison",      "Nice",       "Fabron",        455000, 130, 5, 3, "TERRACOTA IMMOBILIER"),
        ("TCT-006", "Appartement", "Menton",     "Bord de mer",   210000, 48,  2, 1, "PARTENAIRE AZUR IMMO"),
        ("TCT-007", "Appartement", "Nice",       "Promenade",     380000, 85,  3, 2, "PARTENAIRE AZUR IMMO"),
    ]

    bien_ids = []
    for ref, typ, ville, quartier, prix, surface, pieces, chambres, agence in biens:
        cur = conn.execute('''
            INSERT INTO biens (reference, type, ville, quartier, prix, surface, pieces, chambres,
                               date_ajout, nom_agence, statut, source)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'actif', 'manual')
        ''', (ref, typ, ville, quartier, prix, surface, pieces, chambres, now, agence))
        bien_ids.append(cur.lastrowid)

    # ── Matchings (quelques-uns entre les premiers prospects et biens) ────────
    matchings = [
        (prospect_ids[0], bien_ids[0], 82, "Appartement T3 dans la ville recherchée\nBudget compatible\nQuartier animé", "Étage non précisé", "Très bon match, visite recommandée"),
        (prospect_ids[0], bien_ids[3], 74, "T3 correspondant\nAntibes dans les villes cibles\nBon rapport qualité/prix", "Légèrement excentré", "Compatible, à proposer"),
        (prospect_ids[1], bien_ids[1], 88, "Appartement à Cannes, ville cible\nBudget parfait\nEmplacement idéal", "Surface modeste", "Excellent match — contacter en priorité"),
        (prospect_ids[2], bien_ids[2], 91, "Villa 6 pièces avec jardin\nBudget OK\nNice, ville demandée", "Aucun point négatif majeur", "Match exceptionnel"),
        (prospect_ids[3], bien_ids[5], 79, "Appartement Menton bord de mer\nBudget compatible\nAscenseur à vérifier", "Ascenseur non confirmé", "Bon match, vérifier équipements"),
        (prospect_ids[4], bien_ids[4], 85, "Maison plain-pied à Nice\nGrand terrain\n5 pièces", "Terrain à confirmer", "Très bon match pour Sophie"),
    ]

    for pid, bid, score, forts, att, recomm in matchings:
        conn.execute('''
            INSERT INTO matchings (prospect_id, bien_id, score, points_forts, points_attention,
                                   recommandation, date_analyse, date_creation)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (pid, bid, score, forts, att, recomm, now, now))

    # ── Notifications ────────────────────────────────────────────────────────
    conn.execute('''
        INSERT INTO notifications (type, title, message, link, is_read, created_at)
        VALUES ('success', 'Bienvenue sur ImmoMatch !',
                'Votre espace Terracota Immobilier est prêt. Explorez vos premiers matchings.',
                '/matchings', 0, ?)
    ''', (now,))

    conn.commit()
    conn.close()
    print(f"   {len(prospects)} prospects, {len(biens)} biens, {len(matchings)} matchings injectés")


if __name__ == "__main__":
    migrate()
