import sqlite3
from datetime import datetime
from config import DB_PATH


def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute('''
        CREATE TABLE IF NOT EXISTS prospects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT,
            nom TEXT,
            mail TEXT,
            telephone TEXT,
            domicile TEXT,
            bien TEXT,
            villes TEXT,
            quartiers TEXT,
            budget_max REAL,
            criteres TEXT,
            etat TEXT,
            expo TEXT,
            stationnement TEXT,
            copro TEXT,
            exterieur TEXT,
            etage TEXT,
            destination TEXT,
            observation TEXT
        )
    ''')

    # Migration : ajouter nom_agence si absent
    try:
        conn.execute("ALTER TABLE biens ADD COLUMN nom_agence TEXT DEFAULT 'SAINT FRANCOIS IMMOBILIER'")
        conn.commit()
    except Exception:
        pass  # Colonne déjà existante

    # Migration : ajouter defauts si absent
    try:
        conn.execute("ALTER TABLE biens ADD COLUMN defauts TEXT")
        conn.commit()
    except Exception:
        pass  # Colonne deja existante

    conn.execute('''
        CREATE TABLE IF NOT EXISTS biens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            reference TEXT,
            type TEXT,
            ville TEXT,
            quartier TEXT,
            prix REAL,
            surface REAL,
            pieces INTEGER,
            chambres INTEGER,
            etat TEXT,
            exposition TEXT,
            stationnement TEXT,
            copropriete TEXT,
            exterieur TEXT,
            etage TEXT,
            description TEXT,
            defauts TEXT,
            date_ajout TEXT,
            nom_agence TEXT DEFAULT 'SAINT FRANCOIS IMMOBILIER'
        )
    ''')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS matchings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            prospect_id INTEGER,
            bien_id INTEGER,
            score INTEGER,
            points_forts TEXT,
            points_attention TEXT,
            recommandation TEXT,
            date_analyse TEXT,
            FOREIGN KEY (prospect_id) REFERENCES prospects(id),
            FOREIGN KEY (bien_id) REFERENCES biens(id)
        )
    ''')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    ''')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT,
            title TEXT,
            message TEXT,
            link TEXT,
            is_read INTEGER DEFAULT 0,
            created_at TEXT
        )
    ''')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            nom TEXT NOT NULL,
            role TEXT DEFAULT 'agent',
            created_at TEXT
        )
    ''')
    conn.commit()

    # Settings FTP par défaut
    cursor = conn.cursor()
    default_ftp = [
        ('ftp_host', ''),
        ('ftp_user', ''),
        ('ftp_pass', ''),
        ('ftp_port', '21'),
        ('ftp_path', ''),
        ('sync_interval_hours', '6'),
    ]
    for key, value in default_ftp:
        cursor.execute('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', (key, value))
    conn.commit()

    # Ajouter la colonne photos si elle n'existe pas
    try:
        conn.execute('ALTER TABLE biens ADD COLUMN photos TEXT')
        conn.commit()
    except Exception:
        pass

    # Ajouter colonnes lien et vendeur
    try:
        conn.execute('ALTER TABLE biens ADD COLUMN lien_annonce TEXT')
        conn.commit()
    except Exception:
        pass

    try:
        conn.execute('ALTER TABLE biens ADD COLUMN vendeur TEXT')
        conn.commit()
    except Exception:
        pass

    try:
        conn.execute('ALTER TABLE biens ADD COLUMN vendeur TEXT')
        conn.commit()
    except Exception:
        pass

    # Migration : ajouter colonne date_email_envoye
    try:
        conn.execute('ALTER TABLE matchings ADD COLUMN date_email_envoye TEXT')
        conn.commit()
    except Exception:
        pass

    # Migration : ajouter statut_prospect si absent
    try:
        conn.execute('ALTER TABLE matchings ADD COLUMN statut_prospect TEXT DEFAULT NULL')
        conn.commit()
    except Exception:
        pass

    # Table calibration_feedback
    conn.execute('CREATE TABLE IF NOT EXISTS calibration_feedback (id INTEGER PRIMARY KEY AUTOINCREMENT, matching_id INTEGER, pertinent INTEGER, score_avis TEXT, commentaire TEXT, created_at TEXT)')
    conn.commit()

    # Migration : nouvelles colonnes biens (détails Hektor)
    nouvelles_colonnes = [
        ('etage_bien',          'INTEGER'),
        ('nb_etages_immeuble',  'INTEGER'),
        ('ascenseur',           'INTEGER'),
        ('cave',                'INTEGER'),
        ('nb_parkings',         'INTEGER'),
        ('nb_boxes',            'INTEGER'),
        ('terrasse',            'INTEGER'),
        ('nb_balcons',          'INTEGER'),
        ('orientation_sud',     'INTEGER'),
        ('orientation_est',     'INTEGER'),
        ('orientation_ouest',   'INTEGER'),
        ('orientation_nord',    'INTEGER'),
        ('charges_mensuelles',  'REAL'),
        ('dpe_lettre',          'TEXT'),
        ('dpe_kwh',             'INTEGER'),
        ('ges_lettre',          'TEXT'),
        ('ges_co2',             'INTEGER'),
        ('latitude',            'REAL'),
        ('longitude',           'REAL'),
    ]
    for col_name, col_type in nouvelles_colonnes:
        try:
            conn.execute(f'ALTER TABLE biens ADD COLUMN {col_name} {col_type}')
            conn.commit()
        except Exception:
            pass  # La colonne existe déjà, on ignore

    # Migration : statut bien (actif / vendu)
    try:
        conn.execute("ALTER TABLE biens ADD COLUMN statut TEXT DEFAULT 'actif'")
        conn.commit()
    except Exception:
        pass

    # Migration : source (ftp / manual) et date_vendu
    try:
        conn.execute("ALTER TABLE biens ADD COLUMN source TEXT DEFAULT 'manual'")
        conn.commit()
    except Exception:
        pass
    try:
        conn.execute("ALTER TABLE biens ADD COLUMN date_vendu TEXT")
        conn.commit()
    except Exception:
        pass
    # Initialiser date_vendu pour les biens déjà marqués vendus (seront supprimés dans 2 jours)
    conn.execute(
        "UPDATE biens SET date_vendu = ? WHERE statut = 'vendu' AND date_vendu IS NULL",
        (datetime.now().isoformat(),)
    )
    conn.commit()

    # Migration : archivage des prospects
    try:
        conn.execute("ALTER TABLE prospects ADD COLUMN archive INTEGER DEFAULT 0")
        conn.commit()
    except Exception:
        pass

    # Migration : date_creation matchings (date du premier calcul, jamais modifiée)
    try:
        conn.execute("ALTER TABLE matchings ADD COLUMN date_creation TEXT")
        conn.commit()
    except Exception:
        pass
    # Initialiser date_creation depuis date_analyse pour les matchings existants
    conn.execute("UPDATE matchings SET date_creation = date_analyse WHERE date_creation IS NULL")
    conn.commit()

    conn.close()
