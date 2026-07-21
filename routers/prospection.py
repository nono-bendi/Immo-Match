import sqlite3
import os
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException

from agencies_db import AGENCIES_DB_PATH
from routers.auth import get_current_user

router = APIRouter()

_OWNER_EMAIL = os.getenv("OWNER_EMAIL", "noabendiaf@gmail.com")


def _check_owner(current_user: dict):
    if current_user["email"] != _OWNER_EMAIL:
        raise HTTPException(status_code=403, detail="Accès réservé")


def _conn():
    """Connexion agencies.db — la colonne date_relance est ajoutée à la volée
    si elle n'existe pas encore (la table 'prospection' existe déjà, créée par
    le panel superadmin, sans cette colonne)."""
    conn = sqlite3.connect(AGENCIES_DB_PATH)
    conn.row_factory = sqlite3.Row
    cols = [r[1] for r in conn.execute("PRAGMA table_info(prospection)").fetchall()]
    if "date_relance" not in cols:
        conn.execute("ALTER TABLE prospection ADD COLUMN date_relance TEXT DEFAULT ''")
        conn.commit()
    return conn


@router.get("/prospection")
def list_leads(current_user: dict = Depends(get_current_user)):
    _check_owner(current_user)
    conn = _conn()
    rows = conn.execute("SELECT * FROM prospection ORDER BY created_at DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


@router.post("/prospection")
def create_lead(data: dict, current_user: dict = Depends(get_current_user)):
    _check_owner(current_user)
    conn = _conn()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO prospection
            (nom, ville, contact, telephone, email, statut, date_visite, date_relance, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data.get("nom", ""),
        data.get("ville"),
        data.get("contact"),
        data.get("telephone"),
        data.get("email"),
        data.get("statut", "visite"),
        data.get("date_visite"),
        data.get("date_relance"),
        data.get("notes"),
        datetime.now(timezone.utc).isoformat()
    ))
    lead_id = cursor.lastrowid
    conn.commit()
    row = conn.execute("SELECT * FROM prospection WHERE id = ?", (lead_id,)).fetchone()
    conn.close()
    return dict(row)


@router.put("/prospection/{lead_id}")
def update_lead(lead_id: int, data: dict, current_user: dict = Depends(get_current_user)):
    _check_owner(current_user)
    conn = _conn()
    existing = conn.execute("SELECT id FROM prospection WHERE id = ?", (lead_id,)).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Lead non trouvé")

    allowed = {"nom", "ville", "contact", "telephone", "email", "statut", "date_visite", "date_relance", "notes"}
    fields = {k: v for k, v in data.items() if k in allowed}
    if not fields:
        row = conn.execute("SELECT * FROM prospection WHERE id = ?", (lead_id,)).fetchone()
        conn.close()
        return dict(row)

    set_clause = ", ".join(f"{k} = ?" for k in fields)
    values = list(fields.values()) + [lead_id]
    conn.execute(f"UPDATE prospection SET {set_clause} WHERE id = ?", values)
    conn.commit()
    row = conn.execute("SELECT * FROM prospection WHERE id = ?", (lead_id,)).fetchone()
    conn.close()
    return dict(row)


@router.delete("/prospection/{lead_id}")
def delete_lead(lead_id: int, current_user: dict = Depends(get_current_user)):
    _check_owner(current_user)
    conn = _conn()
    existing = conn.execute("SELECT id FROM prospection WHERE id = ?", (lead_id,)).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Lead non trouvé")
    conn.execute("DELETE FROM prospection WHERE id = ?", (lead_id,))
    conn.commit()
    conn.close()
    return {"success": True}
