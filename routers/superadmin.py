"""
Mini-panel superadmin — page HTML standalone, sans React, sans JWT.
Accessible sur /superadmin (protégé par mot de passe via cookie HMAC).
"""
import os
import hmac
import hashlib
import sqlite3
import bcrypt
import re
from datetime import datetime
from fastapi import APIRouter, Request, Form, Response
from fastapi.responses import HTMLResponse, RedirectResponse

import agencies_db as adb
from database import init_db

router = APIRouter()

_SECRET   = os.getenv("SUPERADMIN_SECRET", "immoflash-superadmin-2026")
_COOKIE   = "sa_session"
_PASSWORD = os.getenv("SUPERADMIN_PASSWORD", "NowaAdmin2026!")


def _sign(value: str) -> str:
    return hmac.new(_SECRET.encode(), value.encode(), hashlib.sha256).hexdigest()


def _is_auth(request: Request) -> bool:
    token = request.cookies.get(_COOKIE, "")
    if ":" not in token:
        return False
    val, sig = token.rsplit(":", 1)
    return val == "ok" and hmac.compare_digest(sig, _sign("ok"))


def _cookie_value() -> str:
    sig = _sign("ok")
    return f"ok:{sig}"


# ── Templates ─────────────────────────────────────────────────────────────────

_CSS = """
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: system-ui, -apple-system, sans-serif; background: #f0f4f8; min-height: 100vh; color: #1e293b; }
.top { background: #1E3A5F; color: white; padding: 16px 32px; display: flex; align-items: center; justify-content: space-between; }
.top h1 { font-size: 20px; font-weight: 800; letter-spacing: -0.03em; }
.top .badge { background: rgba(255,255,255,0.15); padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; }
.wrap { max-width: 960px; margin: 0 auto; padding: 32px 24px; }
.card { background: white; border-radius: 16px; box-shadow: 0 2px 16px rgba(0,0,0,0.06); padding: 28px 32px; margin-bottom: 24px; }
h2 { font-size: 16px; font-weight: 700; color: #1E3A5F; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
table { width: 100%; border-collapse: collapse; font-size: 14px; }
th { text-align: left; padding: 8px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #94a3b8; border-bottom: 2px solid #f1f5f9; }
td { padding: 10px 12px; border-bottom: 1px solid #f8fafc; }
tr:last-child td { border: none; }
tr:hover td { background: #f8fafc; }
.badge-plan { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; }
.plan-agence { background: #eff6ff; color: #1d4ed8; }
.plan-reseau { background: #f5f3ff; color: #6d28d9; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media(max-width:600px) { .grid { grid-template-columns: 1fr; } }
label { display: block; font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 5px; text-transform: uppercase; letter-spacing: .04em; }
input, select { width: 100%; padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; font-family: inherit; outline: none; transition: border .15s; }
input:focus, select:focus { border-color: #1E3A5F; box-shadow: 0 0 0 3px rgba(30,58,95,.08); }
.sep { grid-column: 1/-1; border: none; border-top: 1px solid #f1f5f9; margin: 4px 0; }
.sec-label { grid-column: 1/-1; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: .06em; padding-top: 4px; }
.btn { display: inline-flex; align-items: center; gap: 7px; padding: 11px 24px; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; font-family: inherit; cursor: pointer; transition: all .15s; }
.btn-primary { background: #1E3A5F; color: white; }
.btn-primary:hover { background: #2D5A8A; }
.btn-ghost { background: transparent; color: #64748b; }
.btn-ghost:hover { background: #f1f5f9; }
.actions { display: flex; gap: 10px; margin-top: 8px; }
.alert { padding: 12px 16px; border-radius: 10px; font-size: 14px; font-weight: 500; margin-bottom: 20px; }
.alert-ok  { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
.alert-err { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
.login-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg,#0f1e30,#1E3A5F); }
.login-card { background: white; border-radius: 20px; padding: 40px 36px; width: 100%; max-width: 360px; box-shadow: 0 24px 60px rgba(0,0,0,0.35); }
.login-logo { font-size: 28px; font-weight: 900; letter-spacing: -0.04em; color: #1E3A5F; margin-bottom: 4px; }
.login-sub { font-size: 13px; color: #94a3b8; margin-bottom: 28px; }
.login-label { font-size: 12px; font-weight: 600; color: #64748b; display: block; margin-bottom: 5px; text-transform: uppercase; letter-spacing: .04em; }
.login-input { width: 100%; padding: 11px 14px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; font-family: inherit; outline: none; margin-bottom: 16px; }
.login-btn { width: 100%; padding: 12px; border: none; border-radius: 10px; background: #1E3A5F; color: white; font-size: 14px; font-weight: 700; font-family: inherit; cursor: pointer; }
.login-btn:hover { background: #2D5A8A; }
.mono { font-family: monospace; font-size: 12px; color: #64748b; }
"""

def _page(body: str, title: str = "SuperAdmin") -> str:
    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>ImmoFlash — {title}</title>
  <style>{_CSS}</style>
</head>
<body>{body}</body>
</html>"""


def _layout(content: str, msg: str = "", msg_ok: bool = True) -> str:
    alert = f'<div class="alert {"alert-ok" if msg_ok else "alert-err"}">{msg}</div>' if msg else ""
    return _page(f"""
<div class="top">
  <h1>ImmoFlash</h1>
  <span class="badge">Super-Admin</span>
</div>
<div class="wrap">
  {alert}
  {content}
</div>""", "Super-Admin")


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/superadmin", response_class=HTMLResponse)
def sa_login_page(request: Request, msg: str = ""):
    if _is_auth(request):
        return RedirectResponse("/superadmin/panel", 302)
    alert = f'<div class="alert alert-err">{msg}</div>' if msg else ""
    return _page(f"""
<div class="login-wrap">
  <div class="login-card">
    <div class="login-logo">ImmoFlash</div>
    <div class="login-sub">Panneau propriétaire</div>
    {alert}
    <form method="post" action="/superadmin/login">
      <label class="login-label">Mot de passe</label>
      <input class="login-input" type="password" name="password" autofocus placeholder="••••••••" required>
      <button class="login-btn" type="submit">Accéder →</button>
    </form>
  </div>
</div>""", "Connexion")


@router.post("/superadmin/login")
def sa_login(response: Response, password: str = Form(...)):
    if not hmac.compare_digest(password, _PASSWORD):
        return RedirectResponse("/superadmin?msg=Mot+de+passe+incorrect", 303)
    resp = RedirectResponse("/superadmin/panel", 303)
    resp.set_cookie(_COOKIE, _cookie_value(), httponly=True, samesite="lax", max_age=86400 * 7)
    return resp


@router.get("/superadmin/logout")
def sa_logout():
    resp = RedirectResponse("/superadmin", 303)
    resp.delete_cookie(_COOKIE)
    return resp


@router.get("/superadmin/panel", response_class=HTMLResponse)
def sa_panel(request: Request, msg: str = "", ok: str = "1"):
    if not _is_auth(request):
        return RedirectResponse("/superadmin", 302)

    conn = sqlite3.connect(adb.AGENCIES_DB_PATH)
    conn.row_factory = sqlite3.Row
    agencies = conn.execute(
        "SELECT a.id, a.slug, a.nom, a.nom_court, a.plan_id, a.email, COUNT(u.id) as nb_users "
        "FROM agencies a LEFT JOIN users u ON u.agency_id = a.id "
        "GROUP BY a.id ORDER BY a.id"
    ).fetchall()
    conn.close()

    rows = "".join(f"""
    <tr>
      <td><strong>{a['nom']}</strong></td>
      <td class="mono">{a['slug']}</td>
      <td><span class="badge-plan plan-{a['plan_id']}">{a['plan_id']}</span></td>
      <td>{a['email'] or '—'}</td>
      <td>{a['nb_users']}</td>
    </tr>""" for a in agencies)

    table = f"""
    <table>
      <thead><tr>
        <th>Agence</th><th>Slug</th><th>Plan</th><th>Email</th><th>Users</th>
      </tr></thead>
      <tbody>{rows}</tbody>
    </table>"""

    form = """
    <form method="post" action="/superadmin/create-agency">
      <div class="grid">
        <div><label>Nom complet</label><input name="nom" placeholder="Saint François Immobilier" required></div>
        <div><label>Nom court</label><input name="nom_court" placeholder="Saint François" required></div>
        <div><label>Slug</label><input name="slug" placeholder="saint_francois" class="mono" required></div>
        <div><label>Plan</label>
          <select name="plan_id">
            <option value="agence">Agence</option>
            <option value="reseau">Réseau</option>
          </select>
        </div>
        <div><label>Email agence</label><input type="email" name="email" placeholder="contact@agence.fr"></div>
        <div><label>Téléphone</label><input name="telephone" placeholder="05 00 00 00 00"></div>
        <hr class="sep">
        <div class="sec-label">Compte administrateur</div>
        <div><label>Nom admin</label><input name="admin_nom" placeholder="Prénom Nom" required></div>
        <div><label>Email admin</label><input type="email" name="admin_email" placeholder="admin@agence.fr" required></div>
        <div><label>Mot de passe (min 6 car.)</label><input type="password" name="admin_password" minlength="6" required></div>
      </div>
      <div class="actions">
        <button class="btn btn-primary" type="submit">✦ Créer l'agence</button>
        <a class="btn btn-ghost" href="/superadmin/logout">Déconnexion</a>
      </div>
    </form>"""

    alert_msg = f'<div class="alert {"alert-ok" if ok == "1" else "alert-err"}">{msg}</div>' if msg else ""

    content = f"""
    <div class="card">
      <h2>📋 Agences ({len(agencies)})</h2>
      {table}
    </div>
    <div class="card">
      <h2>✦ Créer une agence</h2>
      {alert_msg}
      {form}
    </div>"""

    return _layout(content)


@router.post("/superadmin/create-agency")
def sa_create_agency(
    request: Request,
    nom: str           = Form(...),
    nom_court: str     = Form(...),
    slug: str          = Form(...),
    plan_id: str       = Form("agence"),
    email: str         = Form(""),
    telephone: str     = Form(""),
    admin_nom: str     = Form(...),
    admin_email: str   = Form(...),
    admin_password: str = Form(...),
):
    if not _is_auth(request):
        return RedirectResponse("/superadmin", 302)

    slug = slug.strip().lower()
    if not re.match(r'^[a-z0-9_]+$', slug):
        return RedirectResponse(f"/superadmin/panel?msg=Slug+invalide+(lettres,+chiffres,+underscores)&ok=0", 303)
    if len(admin_password) < 6:
        return RedirectResponse(f"/superadmin/panel?msg=Mot+de+passe+trop+court+(min+6)&ok=0", 303)

    conn = sqlite3.connect(adb.AGENCIES_DB_PATH)
    conn.row_factory = sqlite3.Row

    if conn.execute("SELECT id FROM agencies WHERE slug = ?", (slug,)).fetchone():
        conn.close()
        return RedirectResponse(f"/superadmin/panel?msg=Slug+%22{slug}%22+deja+utilise&ok=0", 303)
    if conn.execute("SELECT id FROM users WHERE email = ?", (admin_email.lower(),)).fetchone():
        conn.close()
        return RedirectResponse(f"/superadmin/panel?msg=Email+admin+deja+utilise&ok=0", 303)

    cursor = conn.execute(
        "INSERT INTO agencies (slug, nom, nom_court, nom_filtre, plan_id, email, telephone) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (slug, nom, nom_court, nom_court, plan_id, email, telephone)
    )
    agency_id = cursor.lastrowid

    pw_hash = bcrypt.hashpw(admin_password.encode(), bcrypt.gensalt()).decode()
    conn.execute(
        "INSERT INTO users (email, password_hash, nom, role, agency_id, created_at) VALUES (?, ?, ?, 'admin', ?, ?)",
        (admin_email.lower(), pw_hash, admin_nom, agency_id, datetime.now().isoformat())
    )
    conn.commit()
    conn.close()

    init_db(adb.get_db_path(slug))

    msg = f"Agence+%22{nom}%22+cree+avec+succes+%E2%9C%93"
    return RedirectResponse(f"/superadmin/panel?msg={msg}&ok=1", 303)
