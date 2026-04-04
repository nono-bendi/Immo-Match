import os
import sqlite3
import bcrypt
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Optional

from agencies_db import AGENCIES_DB_PATH
from routers.auth import require_admin, get_current_user

router = APIRouter()

ALLOWED_LOGO_TYPES = {"image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"}
LOGO_MAX_BYTES = 2 * 1024 * 1024  # 2 Mo


# ══════════════════════════════════════════════════════════════
# CONFIG AGENCE
# ══════════════════════════════════════════════════════════════

@router.get("/admin/agency")
def get_agency_config(current_user: dict = Depends(require_admin)):
    conn = sqlite3.connect(AGENCIES_DB_PATH)
    conn.row_factory = sqlite3.Row
    row = conn.execute("SELECT * FROM agencies WHERE id = ?", (current_user["agency_id"],)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Agence introuvable")
    return dict(row)


@router.patch("/admin/agency")
def update_agency_config(data: dict, current_user: dict = Depends(require_admin)):
    allowed = {
        "nom", "nom_court", "nom_filtre", "adresse", "telephone", "email",
        "logo_url", "couleur_primaire", "logo_fond_colore",
        "smtp_user", "smtp_password", "smtp_from_name", "smtp_reply_to",
        "smtp_server", "smtp_port"
    }
    fields = {k: v for k, v in data.items() if k in allowed}
    if not fields:
        return {"message": "Rien à mettre à jour"}

    set_clause = ", ".join(f"{k} = ?" for k in fields)
    values = list(fields.values()) + [current_user["agency_id"]]

    conn = sqlite3.connect(AGENCIES_DB_PATH)
    conn.execute(f"UPDATE agencies SET {set_clause} WHERE id = ?", values)
    conn.commit()
    conn.close()
    return {"message": "Agence mise à jour"}


@router.post("/admin/agency/logo")
async def upload_logo(file: UploadFile = File(...), current_user: dict = Depends(require_admin)):
    if file.content_type not in ALLOWED_LOGO_TYPES:
        raise HTTPException(status_code=400, detail="Format non supporté (PNG, JPG, GIF, WebP, SVG)")

    content = await file.read()
    if len(content) > LOGO_MAX_BYTES:
        raise HTTPException(status_code=400, detail="Fichier trop grand (max 2 Mo)")

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in (file.filename or "") else "png"
    slug = current_user["agency_slug"]

    os.makedirs("static/logos", exist_ok=True)
    filepath = f"static/logos/{slug}.{ext}"
    with open(filepath, "wb") as f:
        f.write(content)

    logo_url = f"/static/logos/{slug}.{ext}"
    conn = sqlite3.connect(AGENCIES_DB_PATH)
    conn.execute("UPDATE agencies SET logo_url = ? WHERE id = ?", (logo_url, current_user["agency_id"]))
    conn.commit()
    conn.close()

    return {"message": "Logo uploadé", "logo_url": logo_url}


# ══════════════════════════════════════════════════════════════
# GESTION DES AGENTS
# ══════════════════════════════════════════════════════════════

@router.get("/admin/agents")
def get_agents(current_user: dict = Depends(require_admin)):
    conn = sqlite3.connect(AGENCIES_DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT id, email, nom, role, created_at FROM users WHERE agency_id = ? ORDER BY created_at",
        (current_user["agency_id"],)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


class NewAgent(BaseModel):
    email: str
    nom: str
    password: str
    role: str = "agent"


@router.post("/admin/agents")
def create_agent(data: NewAgent, current_user: dict = Depends(require_admin)):
    if data.role not in ("agent", "admin", "demo"):
        raise HTTPException(status_code=400, detail="Rôle invalide")
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Mot de passe trop court (min 6 caractères)")

    conn = sqlite3.connect(AGENCIES_DB_PATH)
    conn.row_factory = sqlite3.Row
    if conn.execute("SELECT id FROM users WHERE email = ?", (data.email,)).fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Un compte avec cet email existe déjà")

    pw_hash = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt()).decode()
    conn.execute(
        "INSERT INTO users (email, password_hash, nom, role, agency_id, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        (data.email, pw_hash, data.nom, data.role, current_user["agency_id"], datetime.now().isoformat())
    )
    conn.commit()
    conn.close()
    return {"message": f"Compte créé pour {data.nom}"}


class UpdateAgent(BaseModel):
    nom: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None


@router.patch("/admin/agents/{agent_id}")
def update_agent(agent_id: int, data: UpdateAgent, current_user: dict = Depends(require_admin)):
    conn = sqlite3.connect(AGENCIES_DB_PATH)
    conn.row_factory = sqlite3.Row
    agent = conn.execute(
        "SELECT id FROM users WHERE id = ? AND agency_id = ?",
        (agent_id, current_user["agency_id"])
    ).fetchone()
    if not agent:
        conn.close()
        raise HTTPException(status_code=404, detail="Agent introuvable")

    if data.nom:
        conn.execute("UPDATE users SET nom = ? WHERE id = ?", (data.nom, agent_id))
    if data.role and data.role in ("agent", "admin", "demo"):
        conn.execute("UPDATE users SET role = ? WHERE id = ?", (data.role, agent_id))
    if data.password:
        if len(data.password) < 6:
            conn.close()
            raise HTTPException(status_code=400, detail="Mot de passe trop court (min 6 caractères)")
        pw_hash = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt()).decode()
        conn.execute("UPDATE users SET password_hash = ? WHERE id = ?", (pw_hash, agent_id))

    conn.commit()
    conn.close()
    return {"message": "Agent mis à jour"}


@router.get("/admin/claude-usage")
def get_claude_usage(current_user: dict = Depends(get_current_user)):
    """Retourne l'usage Claude du mois courant pour l'agence connectée."""
    from agencies_db import get_claude_usage
    return get_claude_usage(current_user["agency_slug"])


@router.delete("/admin/agents/{agent_id}")
def delete_agent(agent_id: int, current_user: dict = Depends(require_admin)):
    if agent_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas supprimer votre propre compte")

    conn = sqlite3.connect(AGENCIES_DB_PATH)
    conn.row_factory = sqlite3.Row
    agent = conn.execute(
        "SELECT id FROM users WHERE id = ? AND agency_id = ?",
        (agent_id, current_user["agency_id"])
    ).fetchone()
    if not agent:
        conn.close()
        raise HTTPException(status_code=404, detail="Agent introuvable")

    conn.execute("DELETE FROM users WHERE id = ?", (agent_id,))
    conn.commit()
    conn.close()
    return {"message": "Agent supprimé"}
