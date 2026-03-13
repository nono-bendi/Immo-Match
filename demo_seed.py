"""
demo_seed.py — Crée immomatch_demo.db avec :
  - Les biens du groupement copiés depuis immomatch.db
  - 8 prospects fictifs réalistes
  - Des matchings pré-calculés (sans appel Claude)
  - Un compte demo

Usage :
    python demo_seed.py
    DB_PATH=immomatch_demo.db uvicorn backend:app --port 8001
"""

import sqlite3
import bcrypt
import json
import random
from datetime import datetime, timedelta

SOURCE_DB = "immomatch.db"
DEMO_DB   = "immomatch_demo.db"

DEMO_EMAIL    = "demo@immomatch.fr"
DEMO_PASSWORD = "Demo2024!"
DEMO_NOM      = "Compte Démo"

# ── Schéma complet (copié de init_db) ──────────────────────────────────────

SCHEMA = """
CREATE TABLE IF NOT EXISTS prospects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT, nom TEXT, mail TEXT, telephone TEXT,
    domicile TEXT, bien TEXT, villes TEXT, quartiers TEXT,
    budget_max REAL, criteres TEXT, etat TEXT, expo TEXT,
    stationnement TEXT, copro TEXT, exterieur TEXT, etage TEXT,
    destination TEXT, observation TEXT
);

CREATE TABLE IF NOT EXISTS biens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reference TEXT, type TEXT, ville TEXT, quartier TEXT,
    prix REAL, surface REAL, pieces INTEGER, chambres INTEGER,
    etat TEXT, exposition TEXT, stationnement TEXT, copropriete TEXT,
    exterieur TEXT, etage TEXT, description TEXT, defauts TEXT,
    date_ajout TEXT, nom_agence TEXT DEFAULT 'GROUPEMENT',
    photos TEXT, lien_annonce TEXT, vendeur TEXT,
    etage_bien INTEGER, nb_etages_immeuble INTEGER, ascenseur INTEGER,
    cave INTEGER, nb_parkings INTEGER, nb_boxes INTEGER,
    terrasse INTEGER, nb_balcons INTEGER,
    orientation_sud INTEGER, orientation_est INTEGER,
    orientation_ouest INTEGER, orientation_nord INTEGER,
    charges_mensuelles REAL,
    dpe_lettre TEXT, dpe_kwh INTEGER, ges_lettre TEXT, ges_co2 INTEGER,
    latitude REAL, longitude REAL
);

CREATE TABLE IF NOT EXISTS matchings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prospect_id INTEGER, bien_id INTEGER,
    score INTEGER, points_forts TEXT, points_attention TEXT,
    recommandation TEXT, date_analyse TEXT,
    date_email_envoye TEXT, statut_prospect TEXT,
    FOREIGN KEY (prospect_id) REFERENCES prospects(id),
    FOREIGN KEY (bien_id) REFERENCES biens(id)
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY, value TEXT
);

CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT, title TEXT, message TEXT, link TEXT,
    is_read INTEGER DEFAULT 0, created_at TEXT
);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nom TEXT NOT NULL,
    role TEXT DEFAULT 'agent',
    created_at TEXT
);

CREATE TABLE IF NOT EXISTS calibration_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    matching_id INTEGER, pertinent INTEGER,
    score_avis TEXT, commentaire TEXT, created_at TEXT
);
"""

# ── Prospects fictifs ───────────────────────────────────────────────────────

PROSPECTS = [
    {
        "nom": "Sophie et Marc Renard",
        "mail": "sophie.renard@example.fr",
        "telephone": "06 12 34 56 78",
        "domicile": "Lyon",
        "bien": "Appartement ou Maison",
        "villes": "Fréjus, Saint-Raphaël",
        "quartiers": "Centre, Résidentiel",
        "budget_max": 320000,
        "criteres": "3-4 pièces minimum, lumineux, proche écoles",
        "etat": "Bon état ou Neuf",
        "expo": "Sud",
        "stationnement": "Oui",
        "copro": "Acceptée",
        "exterieur": "Oui (terrasse ou jardin)",
        "etage": "Sans préférence",
        "destination": "Résidence principale",
        "observation": "Mutation professionnelle, cherche à s'installer rapidement. Deux enfants en bas âge.",
        "date": (datetime.now() - timedelta(days=12)).strftime("%Y-%m-%d"),
    },
    {
        "nom": "Marc Leblanc",
        "mail": "m.leblanc@example.fr",
        "telephone": "06 98 76 54 32",
        "domicile": "Paris 15e",
        "bien": "Appartement",
        "villes": "Fréjus",
        "quartiers": "Centre-ville, Port",
        "budget_max": 155000,
        "criteres": "Studio ou T2, facile à louer, proche transports",
        "etat": "Tous états acceptés",
        "expo": "Sans préférence",
        "stationnement": "Non nécessaire",
        "copro": "Acceptée",
        "exterieur": "Balcon apprécié",
        "etage": "Peu importe",
        "destination": "Investissement locatif",
        "observation": "Objectif rendement locatif 5%+. Préfère DPE C ou mieux. Déjà propriétaire à Paris.",
        "date": (datetime.now() - timedelta(days=8)).strftime("%Y-%m-%d"),
    },
    {
        "nom": "Isabelle et Thomas Moreau",
        "mail": "famille.moreau@example.fr",
        "telephone": "06 55 44 33 22",
        "domicile": "Grenoble",
        "bien": "Maison",
        "villes": "Saint-Raphaël, Fréjus",
        "quartiers": "Calme, résidentiel, périphérie",
        "budget_max": 420000,
        "criteres": "4-5 pièces, jardin indispensable, garage, calme",
        "etat": "Bon état",
        "expo": "Sud ou Ouest",
        "stationnement": "Garage souhaité",
        "copro": "Non, préfère individuel",
        "exterieur": "Jardin indispensable",
        "etage": "Plain-pied préféré",
        "destination": "Résidence principale",
        "observation": "3 enfants, télétravail total pour Thomas. Cherchent espace et calme, pas pressés.",
        "date": (datetime.now() - timedelta(days=20)).strftime("%Y-%m-%d"),
    },
    {
        "nom": "Jean-Pierre Blanc",
        "mail": "jp.blanc@example.fr",
        "telephone": "06 11 22 33 44",
        "domicile": "Toulon",
        "bien": "Appartement",
        "villes": "Fréjus, Saint-Raphaël, Saint-Aygulf",
        "quartiers": "Proche mer, Centre",
        "budget_max": 260000,
        "criteres": "T3, rez-de-chaussée ou ascenseur, vue dégagée appréciée",
        "etat": "Bon état ou récent",
        "expo": "Sud ou Est",
        "stationnement": "Parking couvert souhaité",
        "copro": "Acceptée si charges raisonnables",
        "exterieur": "Terrasse ou balcon",
        "etage": "RDC ou ascenseur obligatoire",
        "destination": "Résidence principale",
        "observation": "Retraité, mobilité réduite (genoux). Ascenseur ou RDC non négociable. Budget fixe.",
        "date": (datetime.now() - timedelta(days=5)).strftime("%Y-%m-%d"),
    },
    {
        "nom": "Lucie Fontaine",
        "mail": "lucie.fontaine@example.fr",
        "telephone": "06 77 88 99 00",
        "domicile": "Marseille",
        "bien": "Appartement",
        "villes": "Fréjus",
        "quartiers": "Centre-ville",
        "budget_max": 185000,
        "criteres": "T2-T3, proche commerces et transports, lumineux",
        "etat": "Bon état",
        "expo": "Sans préférence",
        "stationnement": "Souhaité mais pas obligatoire",
        "copro": "Acceptée",
        "exterieur": "Balcon apprécié",
        "etage": "Pas rez-de-chaussée",
        "destination": "Résidence principale",
        "observation": "Jeune professionnelle célibataire, premier achat. Veut être à pied des commerces.",
        "date": (datetime.now() - timedelta(days=3)).strftime("%Y-%m-%d"),
    },
    {
        "nom": "Nicolas et Emma Petit",
        "mail": "n.e.petit@example.fr",
        "telephone": "06 33 44 55 66",
        "domicile": "Bordeaux",
        "bien": "Appartement ou Maison",
        "villes": "Fréjus, Saint-Raphaël",
        "quartiers": "Sans préférence",
        "budget_max": 295000,
        "criteres": "3 pièces, coin repas, parking, projet bébé en cours",
        "etat": "Bon état ou légèrement à rénover",
        "expo": "Lumière naturelle importante",
        "stationnement": "Oui",
        "copro": "Acceptée",
        "exterieur": "Souhaité",
        "etage": "Sans préférence",
        "destination": "Résidence principale",
        "observation": "Premier achat ensemble. Emma enceinte de 4 mois. Souhaitent emménager avant la naissance.",
        "date": (datetime.now() - timedelta(days=15)).strftime("%Y-%m-%d"),
    },
    {
        "nom": "Alain Garnier",
        "mail": "a.garnier@example.fr",
        "telephone": "06 00 11 22 33",
        "domicile": "Paris 8e",
        "bien": "Appartement",
        "villes": "Fréjus, Saint-Raphaël",
        "quartiers": "Centre, Port",
        "budget_max": 195000,
        "criteres": "T1 ou T2, DPE A ou B obligatoire, bonne rentabilité",
        "etat": "Bon état ou récent",
        "expo": "Sans préférence",
        "stationnement": "Non nécessaire",
        "copro": "Acceptée si charges < 150€/mois",
        "exterieur": "Non nécessaire",
        "etage": "Peu importe",
        "destination": "Investissement locatif",
        "observation": "Troisième investissement locatif. Très attentif au DPE (contrainte légale). Veut du clé-en-main.",
        "date": (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d"),
    },
    {
        "nom": "Caroline Mercier",
        "mail": "c.mercier@example.fr",
        "telephone": "06 66 77 88 99",
        "domicile": "Nantes",
        "bien": "Maison ou Appartement",
        "villes": "Fréjus, Saint-Raphaël, Roquebrune-sur-Argens",
        "quartiers": "Sans contrainte",
        "budget_max": 230000,
        "criteres": "Potentiel de rénovation, surface généreuse, cachet",
        "etat": "À rénover accepté",
        "expo": "Sans préférence",
        "stationnement": "Souhaité",
        "copro": "Individuel préféré",
        "exterieur": "Jardin ou terrain apprécié",
        "etage": "Sans préférence",
        "destination": "Rénovation / projet",
        "observation": "Architecte d'intérieur, à l'aise avec les travaux. Cherche un bien avec âme et potentiel.",
        "date": (datetime.now() - timedelta(days=18)).strftime("%Y-%m-%d"),
    },
]

# ── Textes de matchings réalistes ──────────────────────────────────────────

MATCHING_TEMPLATES = {
    "excellent": {
        "score_range": (82, 92),
        "points_forts_pool": [
            "Localisation idéale au cœur du secteur recherché",
            "Surface et nombre de pièces parfaitement adaptés au profil",
            "Exposition sud très lumineuse, conform aux attentes",
            "Stationnement privatif inclus",
            "Bien en excellent état, emménagement immédiat possible",
            "DPE performant (B), économies d'énergie garanties",
            "Extérieur généreux (terrasse 20m²), rare dans ce secteur",
            "Charges de copropriété très raisonnables (95€/mois)",
            "Quartier calme et résidentiel, écoles proches",
            "Prix en dessous du marché pour cette qualité",
        ],
        "points_attention_pool": [
            "Vis-à-vis partiel depuis la chambre principale",
            "Cuisine ouverte sur le séjour (pas de cuisine fermée)",
            "Légère rénovation de la salle de bain souhaitée",
        ],
        "recommandations": [
            "Bien hautement recommandé — correspond au profil dans quasiment tous les critères. À visiter en priorité.",
            "Excellente adéquation avec le projet. Rare opportunité dans ce secteur. Visite à organiser rapidement.",
            "Match de premier ordre. Le bien coche l'ensemble des critères prioritaires. Très forte recommandation.",
        ],
    },
    "bon": {
        "score_range": (65, 81),
        "points_forts_pool": [
            "Secteur correspondant aux zones souhaitées",
            "Budget bien positionné par rapport au marché",
            "Luminosité correcte, exposition est-sud",
            "Parking en sous-sol inclus",
            "État général satisfaisant, peu de travaux à prévoir",
            "Balcon avec vue dégagée",
            "Copropriété bien entretenue",
            "Proche des transports et commerces",
            "Surface habitable conforme aux attentes",
        ],
        "points_attention_pool": [
            "DPE D — quelques travaux d'isolation pourraient améliorer le confort",
            "Étage sans ascenseur — à confirmer selon contraintes de mobilité",
            "Charges de copropriété légèrement élevées (185€/mois)",
            "Cuisine séparée de petite taille",
            "Bruit urbain en journée depuis les chambres sur rue",
            "Absence d'espace extérieur privatif",
        ],
        "recommandations": [
            "Bien pertinent avec quelques points à discuter lors de la visite. Recommandé.",
            "Bonne adéquation globale. Les points d'attention sont mineurs et méritent une visite.",
            "Profil compatible. À proposer avec une discussion sur les points de vigilance.",
        ],
    },
    "moyen": {
        "score_range": (45, 64),
        "points_forts_pool": [
            "Prix attractif pour la surface",
            "Secteur dans les zones recherchées",
            "Logement fonctionnel",
            "Disponibilité immédiate",
        ],
        "points_attention_pool": [
            "DPE E/F — risque de travaux obligatoires à moyen terme",
            "Localisation en limite de secteur souhaité",
            "Surface légèrement en dessous des attentes",
            "Pas de stationnement privatif — zone à stationnement difficile",
            "État dégradé nécessitant un budget travaux conséquent",
            "Exposition nord-est peu lumineuse",
            "Charges élevées réduisant la rentabilité potentielle",
        ],
        "recommandations": [
            "À proposer si les priorités du prospect sont flexibles. Points d'attention à aborder en visite.",
            "Adéquation partielle — à présenter comme une option de repli si les biens prioritaires ne conviennent pas.",
            "Profil partiellement compatible. Une visite permettrait de valider les points bloquants.",
        ],
    },
}

def pick(pool, n):
    return "\n".join(random.sample(pool, min(n, len(pool))))

def generate_matching(prospect_id, bien_id, quality, date_str):
    tpl = MATCHING_TEMPLATES[quality]
    score = random.randint(*tpl["score_range"])
    return {
        "prospect_id": prospect_id,
        "bien_id": bien_id,
        "score": score,
        "points_forts": pick(tpl["points_forts_pool"], random.randint(3, 5)),
        "points_attention": pick(tpl["points_attention_pool"], random.randint(1, 3)),
        "recommandation": random.choice(tpl["recommandations"]),
        "date_analyse": date_str,
    }

# ── Main ────────────────────────────────────────────────────────────────────

def main():
    # 1. Vérifier que la source existe
    import os
    if not os.path.exists(SOURCE_DB):
        print(f"[ERREUR] {SOURCE_DB} introuvable. Lance le backend au moins une fois d'abord.")
        return

    # 2. Créer la démo DB
    print(f"Création de {DEMO_DB}...")
    demo = sqlite3.connect(DEMO_DB)
    demo.executescript(SCHEMA)
    demo.commit()

    # 3. Copier les biens du groupement (nom_agence != Saint François)
    src = sqlite3.connect(SOURCE_DB)
    src.row_factory = sqlite3.Row

    biens_groupement = src.execute("""
        SELECT * FROM biens
        WHERE nom_agence IS NOT NULL
          AND UPPER(nom_agence) NOT LIKE '%SAINT FRANCOIS%'
          AND UPPER(nom_agence) NOT LIKE '%SAINT-FRANCOIS%'
        ORDER BY RANDOM()
        LIMIT 60
    """).fetchall()

    if not biens_groupement:
        print("[AVERTISSEMENT] Aucun bien du groupement trouvé — copie de tous les biens disponibles.")
        biens_groupement = src.execute("SELECT * FROM biens ORDER BY RANDOM() LIMIT 40").fetchall()

    src.close()

    # Insérer les biens dans la démo DB
    cols_biens = [
        "reference", "type", "ville", "quartier", "prix", "surface", "pieces", "chambres",
        "etat", "exposition", "stationnement", "copropriete", "exterieur", "etage",
        "description", "defauts", "date_ajout", "nom_agence", "photos", "lien_annonce",
        "vendeur", "etage_bien", "nb_etages_immeuble", "ascenseur", "cave",
        "nb_parkings", "nb_boxes", "terrasse", "nb_balcons",
        "orientation_sud", "orientation_est", "orientation_ouest", "orientation_nord",
        "charges_mensuelles", "dpe_lettre", "dpe_kwh", "ges_lettre", "ges_co2",
        "latitude", "longitude"
    ]

    bien_ids_demo = []
    for b in biens_groupement:
        b_dict = dict(b)
        vals = [b_dict.get(c) for c in cols_biens]
        placeholders = ", ".join(["?"] * len(cols_biens))
        cursor = demo.execute(
            f"INSERT INTO biens ({', '.join(cols_biens)}) VALUES ({placeholders})",
            vals
        )
        bien_ids_demo.append(cursor.lastrowid)

    demo.commit()
    print(f"  {len(bien_ids_demo)} biens du groupement copiés.")

    # 4. Insérer les prospects fictifs
    cols_prospects = [
        "date", "nom", "mail", "telephone", "domicile", "bien", "villes", "quartiers",
        "budget_max", "criteres", "etat", "expo", "stationnement", "copro",
        "exterieur", "etage", "destination", "observation"
    ]
    prospect_ids = []
    for p in PROSPECTS:
        vals = [p.get(c) for c in cols_prospects]
        placeholders = ", ".join(["?"] * len(cols_prospects))
        cursor = demo.execute(
            f"INSERT INTO prospects ({', '.join(cols_prospects)}) VALUES ({placeholders})",
            vals
        )
        prospect_ids.append(cursor.lastrowid)

    demo.commit()
    print(f"  {len(prospect_ids)} prospects fictifs insérés.")

    # 5. Générer les matchings pré-calculés
    # Distribution : 1 excellent, 2 bons, 1 moyen par prospect (avec variation)
    random.seed(42)
    total_matchings = 0
    analyse_base = datetime.now() - timedelta(days=1)

    for i, prospect_id in enumerate(prospect_ids):
        prospect_date = analyse_base - timedelta(hours=i * 3)
        date_str = prospect_date.strftime("%Y-%m-%dT%H:%M:%S")

        # Choisir des biens distincts pour ce prospect
        available = bien_ids_demo.copy()
        random.shuffle(available)
        selected = available[:5]  # 5 biens par prospect

        qualities = ["excellent", "bon", "bon", "moyen", "moyen"]
        random.shuffle(qualities)

        for bien_id, quality in zip(selected, qualities):
            m = generate_matching(prospect_id, bien_id, quality, date_str)
            demo.execute("""
                INSERT INTO matchings
                    (prospect_id, bien_id, score, points_forts, points_attention, recommandation, date_analyse)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, [
                m["prospect_id"], m["bien_id"], m["score"],
                m["points_forts"], m["points_attention"],
                m["recommandation"], m["date_analyse"]
            ])
            total_matchings += 1

    demo.commit()
    print(f"  {total_matchings} matchings pré-calculés générés.")

    # 6. Créer le compte demo
    pw_hash = bcrypt.hashpw(DEMO_PASSWORD.encode(), bcrypt.gensalt()).decode()
    demo.execute("""
        INSERT OR REPLACE INTO users (email, password_hash, nom, role, created_at)
        VALUES (?, ?, ?, 'demo', ?)
    """, [DEMO_EMAIL, pw_hash, DEMO_NOM, datetime.now().strftime("%Y-%m-%dT%H:%M:%S")])

    # 7. Settings par défaut (FTP vide)
    for key, val in [("ftp_host",""),("ftp_user",""),("ftp_pass",""),("ftp_port","21"),("ftp_path",""),("sync_interval_hours","6")]:
        demo.execute("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", (key, val))

    demo.commit()
    demo.close()

    print()
    print("=" * 55)
    print(f"  Demo DB créée : {DEMO_DB}")
    print(f"  Compte        : {DEMO_EMAIL}")
    print(f"  Mot de passe  : {DEMO_PASSWORD}")
    print()
    print("  Démarrer le backend démo :")
    print(f"  DB_PATH={DEMO_DB} uvicorn backend:app --port 8001 --reload")
    print("=" * 55)

if __name__ == "__main__":
    main()
