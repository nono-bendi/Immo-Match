# ════════════════════════════════════════════════════════════════════════════
# ONBOARDING — Provisionnement automatique d'un compte trial
#
# POST /api/onboard  — multipart : demo | csv | hektor_ftp
#   → crée agence isolée + DB + user trial + retourne JWT 6 jours
#
# POST /api/start-demo — JSON legacy (conservé)
# ════════════════════════════════════════════════════════════════════════════

import os
import json
import shutil
import secrets
import string
import sqlite3
import threading
from datetime import datetime, timedelta
from typing import Optional
from io import BytesIO

import bcrypt
import pandas as pd
from fastapi import APIRouter, HTTPException, Request, Form, File, UploadFile
from pydantic import BaseModel

import agencies_db as adb
from database import init_db
from routers.auth import create_access_token
from routers.biens import parse_hektor_cols
from demo_data import DEMO_DB_PATH, init_demo_db

router = APIRouter()

# ── Rate limiting : 5 onboardings par IP par heure ───────────────────────────
_rate_limit: dict = {}


# ── Helpers communs ───────────────────────────────────────────────────────────

def _random_password(n: int = 10) -> str:
    chars = string.ascii_letters + string.digits
    return ''.join(secrets.choice(chars) for _ in range(n))


def _check_rate_limit(ip: str):
    now = datetime.now()
    window = [t for t in _rate_limit.get(ip, []) if (now - t).total_seconds() < 3600]
    if len(window) >= 5:
        raise HTTPException(status_code=429, detail="Trop de demandes. Réessayez dans 1 heure.")
    _rate_limit[ip] = window + [now]


def _validate(email: str, nom: str, agence_nom: str):
    if not email or "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(status_code=400, detail="Email invalide.")
    if not nom.strip():
        raise HTTPException(status_code=400, detail="Nom requis.")
    if not agence_nom.strip():
        raise HTTPException(status_code=400, detail="Nom d'agence requis.")
    if adb.email_exists(email):
        raise HTTPException(status_code=400, detail="Un compte existe déjà avec cet email.")


def _create_account(email: str, nom: str, agence_nom: str, telephone: str = "") -> tuple:
    """Crée agence + user trial. Retourne (agency_id, user_id, slug, expires_iso)."""
    slug = f"trial_{int(datetime.now().timestamp())}_{secrets.token_hex(3)}"

    conn = sqlite3.connect(adb.AGENCIES_DB_PATH)
    conn.execute(
        "INSERT INTO agencies (slug, nom, nom_court, telephone, email, couleur_primaire) VALUES (?,?,?,?,?,?)",
        (slug, agence_nom, agence_nom[:20], telephone or "", email, "#1E3A5F")
    )
    conn.commit()
    agency_id = conn.execute("SELECT id FROM agencies WHERE slug=?", (slug,)).fetchone()[0]

    pw_hash = bcrypt.hashpw(_random_password().encode(), bcrypt.gensalt()).decode()
    expires_iso = (datetime.now() + timedelta(days=6)).isoformat()

    cur = conn.cursor()
    cur.execute(
        "INSERT INTO users (email,password_hash,nom,role,agency_id,created_at,is_trial,trial_expires_at) VALUES (?,?,?,?,?,?,?,?)",
        (email, pw_hash, nom, "admin", agency_id, datetime.now().isoformat(), 1, expires_iso)
    )
    user_id = cur.lastrowid
    conn.commit()
    conn.close()
    return agency_id, user_id, slug, expires_iso


def _jwt(user_id: int, expires_iso: str) -> str:
    return create_access_token({"user_id": user_id, "is_trial": True, "trial_expires_at": expires_iso})


# ── Import Hektor CSV ─────────────────────────────────────────────────────────

def _import_hektor_bytes(raw: bytes, db_path: str) -> int:
    lines = raw.decode("latin-1").strip().split("\n")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    n = 0
    for line in lines:
        cols = [c.strip().strip('"') for c in line.split("!#")]
        if len(cols) < 25:
            continue
        d = parse_hektor_cols(cols)
        if d["transaction"].lower() != "vente":
            continue
        try:
            cur.execute("""
                INSERT OR IGNORE INTO biens (
                    reference,type,ville,quartier,prix,surface,pieces,chambres,
                    description,photos,vendeur,lien_annonce,
                    etage_bien,nb_etages_immeuble,ascenseur,cave,
                    nb_parkings,nb_boxes,terrasse,nb_balcons,
                    orientation_sud,orientation_est,orientation_ouest,orientation_nord,
                    dpe_lettre,dpe_kwh,ges_lettre,ges_co2,latitude,longitude,video_url,
                    nb_salles_bain,nb_salles_eau,nb_wc,surface_cave,prix_hn,honoraires_pct,
                    date_ajout,nom_agence,statut,source,date_creation
                ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """, (
                d["reference"], d["type_bien"], d["ville"], d["adresse"],
                d["prix"], d["surface"], d["pieces"], d["chambres"],
                d["description"], d["photos_str"], d["vendeur"], "",
                d["etage_bien"], d["nb_etages_immeuble"], d["ascenseur"], d["cave"],
                d["nb_parkings"], d["nb_boxes"], d["terrasse"], d["nb_balcons"],
                d["orientation_sud"], d["orientation_est"], d["orientation_ouest"], d["orientation_nord"],
                d["dpe_lettre"], d["dpe_kwh"], d["ges_lettre"], d["ges_co2"],
                d["latitude"], d["longitude"], d["video_url"],
                d["nb_salles_bain"], d["nb_salles_eau"], d["nb_wc"],
                d["surface_cave"], d["prix_hn"], d["honoraires_pct"],
                datetime.now().isoformat(), d["nom_agence"], "actif", "hektor",
                datetime.now().isoformat(),
            ))
            n += 1
        except Exception:
            pass
    conn.commit()
    conn.close()
    return n


# ── Import CSV/Excel standard ─────────────────────────────────────────────────

def _import_csv_bytes(raw: bytes, filename: str, db_path: str) -> int:
    try:
        df = pd.read_csv(BytesIO(raw)) if (filename or "").lower().endswith(".csv") else pd.read_excel(BytesIO(raw))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Fichier illisible : {e}")
    df.columns = df.columns.str.strip()
    conn = sqlite3.connect(db_path)
    n = 0
    for _, row in df.iterrows():
        def v(c): return row.get(c) if pd.notna(row.get(c)) else None
        try:
            conn.execute("""
                INSERT INTO biens (reference,type,ville,quartier,prix,surface,pieces,chambres,
                    etat,exposition,stationnement,copropriete,exterieur,etage,description,
                    date_ajout,statut,source,date_creation)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """, (
                v("Reference"), v("Type"), v("Ville"), v("Quartier"),
                v("Prix"), v("Surface"), v("Pieces"), v("Chambres"),
                v("Etat"), v("Exposition"), v("Stationnement"), v("Copropriete"),
                v("Exterieur"), v("Etage"), v("Description"),
                str(v("Date")) if v("Date") else datetime.now().isoformat(),
                "actif", "csv", datetime.now().isoformat(),
            ))
            n += 1
        except Exception:
            pass
    conn.commit()
    conn.close()
    return n


# ── Sync Hektor FTP en arrière-plan ──────────────────────────────────────────

def _save_ftp_settings(db_path: str, ftp_host: str, ftp_user: str, ftp_pass: str, ftp_path: str):
    conn = sqlite3.connect(db_path)
    for key, val in [("ftp_host", ftp_host), ("ftp_user", ftp_user),
                     ("ftp_pass", ftp_pass), ("ftp_path", ftp_path), ("ftp_port", "21")]:
        conn.execute("INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)", (key, val))
    conn.commit()
    conn.close()


def _sync_in_background(db_path: str):
    """Lance une sync Hektor dans un thread séparé (non bloquant)."""
    from routers.sync import sync_hektor_ftp
    def run():
        try:
            sync_hektor_ftp(db_path=db_path)
        except Exception:
            pass
    threading.Thread(target=run, daemon=True).start()


# ════════════════════════════════════════════════════════════════════════════
# POST /api/onboard
# ════════════════════════════════════════════════════════════════════════════

@router.post("/api/onboard")
async def onboard(
    request: Request,
    nom:        str  = Form(...),
    email:      str  = Form(...),
    agence_nom: str  = Form(...),
    telephone:  str  = Form(None),
    mode:       str  = Form("demo"),   # demo | csv | hektor_ftp
    # Champs FTP (mode hektor_ftp)
    ftp_host:   str  = Form(None),
    ftp_user:   str  = Form(None),
    ftp_pass:   str  = Form(None),
    ftp_path:   str  = Form(None),
    # Fichier (mode csv)
    file: Optional[UploadFile] = File(None),
):
    ip = getattr(request.client, "host", "unknown")
    _check_rate_limit(ip)

    email = email.strip().lower()
    nom = nom.strip()
    agence_nom = agence_nom.strip()
    _validate(email, nom, agence_nom)

    agency_id, user_id, slug, expires_iso = _create_account(email, nom, agence_nom, telephone or "")
    os.makedirs(adb.DATA_DIR, exist_ok=True)
    trial_db = adb.get_db_path(slug)
    nb_biens = 0
    syncing = False

    if mode == "demo":
        init_demo_db()
        src = DEMO_DB_PATH
        if os.path.exists(src):
            shutil.copy2(src, trial_db)
        else:
            init_db(trial_db)
        nb_biens = sqlite3.connect(trial_db).execute("SELECT COUNT(*) FROM biens").fetchone()[0]

    elif mode == "csv":
        if not file:
            raise HTTPException(status_code=400, detail="Fichier requis pour l'import CSV/Excel.")
        init_db(trial_db)
        nb_biens = _import_csv_bytes(await file.read(), file.filename or "", trial_db)

    elif mode == "hektor_ftp":
        if not all([ftp_host, ftp_user, ftp_pass, ftp_path]):
            raise HTTPException(status_code=400, detail="Tous les champs FTP sont requis.")
        init_db(trial_db)
        _save_ftp_settings(trial_db, ftp_host.strip(), ftp_user.strip(), ftp_pass.strip(), ftp_path.strip())
        _sync_in_background(trial_db)
        syncing = True

    else:
        init_db(trial_db)

    token = _jwt(user_id, expires_iso)
    return {
        "access_token": token,
        "token_type": "bearer",
        "nb_biens": nb_biens,
        "mode": mode,
        "syncing": syncing,
        "is_trial": True,
        "trial_expires_at": expires_iso,
    }


# ════════════════════════════════════════════════════════════════════════════
# POST /api/start-demo — legacy JSON
# ════════════════════════════════════════════════════════════════════════════

class DemoRequest(BaseModel):
    nom: str
    email: str
    agence_nom: str
    telephone: Optional[str] = None


@router.post("/api/start-demo")
def start_demo(data: DemoRequest, request: Request):
    ip = getattr(request.client, "host", "unknown")
    _check_rate_limit(ip)
    email = (data.email or "").strip().lower()
    nom = (data.nom or "").strip()
    agence_nom = (data.agence_nom or "").strip()
    _validate(email, nom, agence_nom)
    agency_id, user_id, slug, expires_iso = _create_account(email, nom, agence_nom, data.telephone or "")
    os.makedirs(adb.DATA_DIR, exist_ok=True)
    trial_db = adb.get_db_path(slug)
    init_demo_db()
    if os.path.exists(DEMO_DB_PATH):
        shutil.copy2(DEMO_DB_PATH, trial_db)
    else:
        init_db(trial_db)
    return {"access_token": _jwt(user_id, expires_iso), "token_type": "bearer", "is_trial": True}
