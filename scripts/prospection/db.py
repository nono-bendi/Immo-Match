"""
Base SQLite de l'outil de prospection cold email — table `agences`.

Connexion unique partagée (piège rencontré en juillet 2026 : ouvrir une
connexion par requête pendant la collecte, avec le mode WAL réactivé à
chaque fois, corrompait la base — "disk I/O error"). Ne pas revenir à
une connexion par appel.
"""
import os
import sqlite3
import threading

DB_PATH = os.path.join(os.path.dirname(__file__), "prospection.db")

_shared = None
_lock = threading.Lock()

STATUTS = ["nouveau", "sans_site", "sans_email", "a_envoyer", "envoye", "repondu", "desinscrit", "erreur"]


def get_conn():
    global _shared
    if _shared is None:
        with _lock:
            if _shared is None:
                _shared = sqlite3.connect(DB_PATH, check_same_thread=False)
                _shared.row_factory = sqlite3.Row
                _shared.execute("PRAGMA journal_mode=WAL")
                _init_schema(_shared)
    return _shared


def _init_schema(conn):
    conn.execute("""
        CREATE TABLE IF NOT EXISTS agences (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nom TEXT NOT NULL,
            ville TEXT,
            adresse TEXT,
            site_web TEXT,
            email TEXT,
            telephone TEXT,
            place_id TEXT UNIQUE,
            statut TEXT DEFAULT 'nouveau',
            date_collecte TEXT,
            date_envoi TEXT,
            date_reponse TEXT,
            erreur TEXT
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_agences_statut ON agences(statut)")
    conn.commit()


def stats():
    conn = get_conn()
    rows = conn.execute("SELECT statut, COUNT(*) as n FROM agences GROUP BY statut").fetchall()
    counts = {r["statut"]: r["n"] for r in rows}
    counts["total"] = sum(counts.values())
    return counts


def close():
    global _shared
    if _shared is not None:
        _shared.close()
        _shared = None
