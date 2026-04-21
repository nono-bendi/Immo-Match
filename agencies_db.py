import os
import sqlite3
import bcrypt
from dotenv import load_dotenv

load_dotenv()

AGENCIES_DB_PATH = os.getenv("AGENCIES_DB_PATH", "agencies.db")
DATA_DIR = os.getenv("DATA_DIR", "data")


# ── Chemin vers la DB d'une agence ────────────────────────────────────────────

def get_db_path(agency_slug: str) -> str:
    return os.path.join(DATA_DIR, f"{agency_slug}.db")


# ── Initialisation de la DB centrale ──────────────────────────────────────────

def init_agencies_db():
    os.makedirs(DATA_DIR, exist_ok=True)
    conn = sqlite3.connect(AGENCIES_DB_PATH)

    conn.execute('''
        CREATE TABLE IF NOT EXISTS agencies (
            id                  INTEGER PRIMARY KEY AUTOINCREMENT,
            slug                TEXT UNIQUE NOT NULL,
            nom                 TEXT NOT NULL,
            nom_court           TEXT,
            nom_filtre          TEXT,
            adresse             TEXT,
            telephone           TEXT,
            email               TEXT,
            logo_url            TEXT,
            couleur_primaire    TEXT DEFAULT '#1E3A5F',
            smtp_user           TEXT,
            smtp_password       TEXT,
            smtp_from_name      TEXT,
            smtp_reply_to       TEXT
        )
    ''')

    conn.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            email           TEXT UNIQUE NOT NULL,
            password_hash   TEXT NOT NULL,
            nom             TEXT NOT NULL,
            role            TEXT DEFAULT 'agent',
            agency_id       INTEGER NOT NULL,
            created_at      TEXT,
            FOREIGN KEY (agency_id) REFERENCES agencies(id)
        )
    ''')

    conn.commit()

    conn.execute('''
        CREATE TABLE IF NOT EXISTS claude_usage (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            agency_slug     TEXT NOT NULL,
            year_month      TEXT NOT NULL,
            nb_appels       INTEGER DEFAULT 0,
            input_tokens    INTEGER DEFAULT 0,
            output_tokens   INTEGER DEFAULT 0,
            UNIQUE(agency_slug, year_month)
        )
    ''')
    conn.commit()

    # ── Migration : colonnes ajoutées après la création initiale ──────────────
    for col, definition in [
        ("logo_fond_colore", "INTEGER DEFAULT 0"),
        ("smtp_server", "TEXT DEFAULT 'smtp.gmail.com'"),
        ("smtp_port", "INTEGER DEFAULT 587"),
    ]:
        try:
            conn.execute(f"ALTER TABLE agencies ADD COLUMN {col} {definition}")
            conn.commit()
        except Exception:
            pass  # colonne déjà présente

    # ── Migration : colonnes trial sur users ──────────────────────────────────
    for col, definition in [
        ("is_trial", "INTEGER DEFAULT 0"),
        ("trial_expires_at", "TEXT"),
    ]:
        try:
            conn.execute(f"ALTER TABLE users ADD COLUMN {col} {definition}")
            conn.commit()
        except Exception:
            pass  # colonne déjà présente

    # ── Saint François (agence par défaut) ────────────────────────────────────
    if not conn.execute("SELECT id FROM agencies WHERE slug = 'saint_francois'").fetchone():
        conn.execute('''
            INSERT INTO agencies
                (slug, nom, nom_court, nom_filtre, adresse, telephone, email,
                 logo_url, couleur_primaire, smtp_user, smtp_password,
                 smtp_from_name, smtp_reply_to)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            'saint_francois',
            'Saint François Immobilier',
            'Saint François Immo',
            'SAINT FRANCOIS',
            '140 rue Saint François de Paule, 83600 Fréjus',
            '04 94 53 78 19',
            'contact@saintfrancoisimmobilier.com',
            'https://www.saintfrancoisimmobilier.fr/images/logoSite.png',
            '#1E3A5F',
            os.getenv('SMTP_USER', 'stfrancoisgestion@gmail.com'),
            os.getenv('SMTP_PASSWORD', ''),
            'Saint François Immobilier',
            'contact@saintfrancoisimmobilier.com',
        ))
        conn.commit()

    # ── Terracota Immobilier (agence de simulation) ────────────────────────────
    if not conn.execute("SELECT id FROM agencies WHERE slug = 'terracota'").fetchone():
        conn.execute('''
            INSERT INTO agencies
                (slug, nom, nom_court, nom_filtre, adresse, telephone, email,
                 logo_url, couleur_primaire, smtp_user, smtp_password,
                 smtp_from_name, smtp_reply_to)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            'terracota',
            'Terracota Immobilier',
            'Terracota Immo',
            'TERRACOTA',
            '12 avenue de la Mer, 06000 Nice',
            '04 93 12 34 56',
            'contact@terracota-immo.fr',
            '',
            '#8B4513',
            '',
            '',
            'Terracota Immobilier',
            'contact@terracota-immo.fr',
        ))
        conn.commit()

    # ── Agence Démo (compte démo public) ─────────────────────────────────────
    if not conn.execute("SELECT id FROM agencies WHERE slug = 'demo'").fetchone():
        # SMTP dédié démo — configurer DEMO_SMTP_USER/DEMO_SMTP_PASSWORD dans .env
        # Ne jamais copier les creds d'une vraie agence ici
        conn.execute('''
            INSERT INTO agencies
                (slug, nom, nom_court, nom_filtre, adresse, telephone, email,
                 logo_url, couleur_primaire, smtp_user, smtp_password,
                 smtp_from_name, smtp_reply_to, smtp_server, smtp_port)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            'demo',
            'Agence Démo Immobilier',
            'Démo Immo',
            'DEMO',
            'Var, France',
            '',
            'demo@immowatch.fr',
            '',
            '#2C5F8A',
            os.getenv('DEMO_SMTP_USER', ''),
            os.getenv('DEMO_SMTP_PASSWORD', ''),
            os.getenv('DEMO_SMTP_FROM_NAME', 'Agence Démo Immobilier'),
            os.getenv('DEMO_SMTP_REPLY_TO', os.getenv('DEMO_SMTP_USER', '')),
            os.getenv('DEMO_SMTP_SERVER', 'smtp.gmail.com'),
            int(os.getenv('DEMO_SMTP_PORT', '587')),
        ))
        conn.commit()

    # Créer le user démo si absent
    if not conn.execute("SELECT id FROM users WHERE email = 'demo@immowatch.fr'").fetchone():
        demo_agency = conn.execute("SELECT id FROM agencies WHERE slug = 'demo'").fetchone()
        if demo_agency:
            pw_hash = bcrypt.hashpw(b"demo", bcrypt.gensalt()).decode()
            conn.execute(
                "INSERT INTO users (email, password_hash, nom, role, agency_id) VALUES (?, ?, ?, ?, ?)",
                ("demo@immowatch.fr", pw_hash, "Compte Demo", "admin", demo_agency[0])
            )
            conn.commit()

    conn.close()


# ── Lecture agence ─────────────────────────────────────────────────────────────

def get_agency(agency_id: int) -> dict | None:
    conn = sqlite3.connect(AGENCIES_DB_PATH)
    conn.row_factory = sqlite3.Row
    row = conn.execute("SELECT * FROM agencies WHERE id = ?", (agency_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def all_agencies() -> list:
    conn = sqlite3.connect(AGENCIES_DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute("SELECT * FROM agencies").fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ── Lecture user ───────────────────────────────────────────────────────────────

def get_user_with_agency(email: str) -> dict | None:
    """Retourne le user + toute la config de son agence."""
    conn = sqlite3.connect(AGENCIES_DB_PATH)
    conn.row_factory = sqlite3.Row
    row = conn.execute('''
        SELECT
            u.id, u.email, u.password_hash, u.nom, u.role, u.agency_id, u.created_at,
            u.is_trial, u.trial_expires_at,
            a.slug          AS agency_slug,
            a.nom           AS agency_nom,
            a.nom_court     AS agency_nom_court,
            a.nom_filtre    AS agency_nom_filtre,
            a.adresse       AS agency_adresse,
            a.telephone     AS agency_telephone,
            a.email         AS agency_email,
            a.logo_url           AS agency_logo_url,
            a.couleur_primaire   AS agency_couleur,
            a.logo_fond_colore   AS agency_logo_fond_colore,
            a.smtp_user, a.smtp_password, a.smtp_from_name, a.smtp_reply_to,
            a.smtp_server, a.smtp_port
        FROM users u
        JOIN agencies a ON u.agency_id = a.id
        WHERE u.email = ?
    ''', (email,)).fetchone()
    conn.close()
    return dict(row) if row else None


def get_user_by_id(user_id: int) -> dict | None:
    """Retourne le user + config agence par son id."""
    conn = sqlite3.connect(AGENCIES_DB_PATH)
    conn.row_factory = sqlite3.Row
    row = conn.execute('''
        SELECT
            u.id, u.email, u.password_hash, u.nom, u.role, u.agency_id, u.created_at,
            u.is_trial, u.trial_expires_at,
            a.slug          AS agency_slug,
            a.nom           AS agency_nom,
            a.nom_court     AS agency_nom_court,
            a.nom_filtre    AS agency_nom_filtre,
            a.adresse       AS agency_adresse,
            a.telephone     AS agency_telephone,
            a.email         AS agency_email,
            a.logo_url           AS agency_logo_url,
            a.couleur_primaire   AS agency_couleur,
            a.logo_fond_colore   AS agency_logo_fond_colore,
            a.smtp_user, a.smtp_password, a.smtp_from_name, a.smtp_reply_to,
            a.smtp_server, a.smtp_port
        FROM users u
        JOIN agencies a ON u.agency_id = a.id
        WHERE u.id = ?
    ''', (user_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


# ── Écriture user ──────────────────────────────────────────────────────────────

def create_user(email: str, password_hash: str, nom: str, role: str, agency_id: int, created_at: str) -> int:
    conn = sqlite3.connect(AGENCIES_DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO users (email, password_hash, nom, role, agency_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (email, password_hash, nom, role, agency_id, created_at))
    user_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return user_id


def update_user_password(user_id: int, new_hash: str):
    conn = sqlite3.connect(AGENCIES_DB_PATH)
    conn.execute("UPDATE users SET password_hash = ? WHERE id = ?", (new_hash, user_id))
    conn.commit()
    conn.close()


def email_exists(email: str) -> bool:
    conn = sqlite3.connect(AGENCIES_DB_PATH)
    row = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()
    return row is not None


def track_claude_usage(agency_slug: str, input_tokens: int, output_tokens: int):
    """Incrémente le compteur d'usage Claude pour l'agence ce mois-ci."""
    from datetime import datetime
    ym = datetime.now().strftime("%Y-%m")
    conn = sqlite3.connect(AGENCIES_DB_PATH)
    conn.execute("""
        INSERT INTO claude_usage (agency_slug, year_month, nb_appels, input_tokens, output_tokens)
        VALUES (?, ?, 1, ?, ?)
        ON CONFLICT(agency_slug, year_month) DO UPDATE SET
            nb_appels     = nb_appels + 1,
            input_tokens  = input_tokens + excluded.input_tokens,
            output_tokens = output_tokens + excluded.output_tokens
    """, (agency_slug, ym, input_tokens, output_tokens))
    conn.commit()
    conn.close()


def get_claude_usage(agency_slug: str, year_month: str = None) -> dict:
    """Retourne l'usage Claude pour un mois donné (défaut : mois courant)."""
    from datetime import datetime
    ym = year_month or datetime.now().strftime("%Y-%m")
    conn = sqlite3.connect(AGENCIES_DB_PATH)
    row = conn.execute(
        "SELECT nb_appels, input_tokens, output_tokens FROM claude_usage WHERE agency_slug=? AND year_month=?",
        (agency_slug, ym)
    ).fetchone()
    conn.close()
    if not row:
        return {"nb_appels": 0, "input_tokens": 0, "output_tokens": 0, "year_month": ym}
    return {"nb_appels": row[0], "input_tokens": row[1], "output_tokens": row[2], "year_month": ym}
