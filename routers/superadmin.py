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
from fastapi import APIRouter, Request, Form, Response, UploadFile, File
from fastapi.responses import HTMLResponse, RedirectResponse

import agencies_db as adb
from database import init_db

router = APIRouter()

_SECRET   = os.getenv("SUPERADMIN_SECRET", "immoflash-superadmin-2026")
_COOKIE   = "sa_session"
_PASSWORD = os.getenv("SUPERADMIN_PASSWORD", "NowaAdmin2026!")

ALLOWED_LOGO_TYPES = {"image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"}


def _sign(value: str) -> str:
    return hmac.new(_SECRET.encode(), value.encode(), hashlib.sha256).hexdigest()

def _is_auth(request: Request) -> bool:
    token = request.cookies.get(_COOKIE, "")
    if ":" not in token:
        return False
    val, sig = token.rsplit(":", 1)
    return val == "ok" and hmac.compare_digest(sig, _sign("ok"))

def _cookie_value() -> str:
    return f"ok:{_sign('ok')}"

def _q(s):
    """Escape HTML entities for safe output."""
    return (s or "").replace("&","&amp;").replace("<","&lt;").replace(">","&gt;").replace('"',"&quot;")


# ── CSS & layout ──────────────────────────────────────────────────────────────

_CSS = """
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,-apple-system,sans-serif;background:#f0f4f8;min-height:100vh;color:#1e293b}
a{color:#1E3A5F;text-decoration:none}
a:hover{text-decoration:underline}
.top{background:#1E3A5F;color:white;padding:14px 32px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
.top-left{display:flex;align-items:center;gap:14px}
.top h1{font-size:18px;font-weight:900;letter-spacing:-0.03em}
.top nav{display:flex;gap:6px}
.top nav a{color:rgba(255,255,255,.6);font-size:13px;padding:5px 12px;border-radius:8px;transition:.15s}
.top nav a:hover{background:rgba(255,255,255,.12);color:white;text-decoration:none}
.top nav a.active{background:rgba(255,255,255,.18);color:white}
.badge{background:rgba(255,255,255,.15);padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700}
.wrap{max-width:980px;margin:0 auto;padding:28px 20px 60px}
.card{background:white;border-radius:16px;box-shadow:0 2px 16px rgba(0,0,0,.06);padding:24px 28px;margin-bottom:22px}
.card-title{font-size:15px;font-weight:700;color:#1E3A5F;margin-bottom:18px;display:flex;align-items:center;gap:8px;border-bottom:1px solid #f1f5f9;padding-bottom:14px}
.section-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;padding:16px 0 10px;grid-column:1/-1;border-top:1px solid #f1f5f9;margin-top:4px}
.section-label:first-child{border-top:none;padding-top:0}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.grid.g3{grid-template-columns:1fr 1fr 1fr}
.full{grid-column:1/-1}
@media(max-width:620px){.grid,.grid.g3{grid-template-columns:1fr}}
.field label{display:block;font-size:12px;font-weight:600;color:#64748b;margin-bottom:5px;text-transform:uppercase;letter-spacing:.04em}
.field .hint{font-size:11px;color:#94a3b8;margin-top:4px}
input[type=text],input[type=email],input[type=password],input[type=url],input[type=number],select,textarea{
  width:100%;padding:10px 13px;border:1px solid #e2e8f0;border-radius:9px;font-size:14px;
  font-family:inherit;outline:none;transition:border .15s,box-shadow .15s;background:white;color:#1e293b}
input:focus,select:focus,textarea:focus{border-color:#1E3A5F;box-shadow:0 0 0 3px rgba(30,58,95,.08)}
input[type=color]{padding:3px 5px;height:38px;cursor:pointer;border-radius:9px}
input[type=file]{padding:8px 10px;cursor:pointer;font-size:13px}
.logo-preview{width:64px;height:64px;border-radius:10px;object-fit:contain;border:1px solid #e2e8f0;background:#f8fafc;padding:4px}
.logo-row{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
table{width:100%;border-collapse:collapse;font-size:13px}
th{text-align:left;padding:8px 10px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;border-bottom:2px solid #f1f5f9}
td{padding:10px 10px;border-bottom:1px solid #f8fafc;vertical-align:middle}
tr:last-child td{border:none}
tr:hover td{background:#fafbfc}
.bp{display:inline-block;padding:2px 9px;border-radius:999px;font-size:11px;font-weight:700}
.bp-agence{background:#eff6ff;color:#1d4ed8}
.bp-reseau{background:#f5f3ff;color:#6d28d9}
.color-dot{width:14px;height:14px;border-radius:50%;display:inline-block;border:1px solid rgba(0,0,0,.1);vertical-align:middle;margin-right:5px}
.btn{display:inline-flex;align-items:center;gap:6px;padding:10px 20px;border:none;border-radius:9px;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;transition:all .15s;text-decoration:none}
.btn-sm{padding:6px 14px;font-size:12px}
.btn-primary{background:#1E3A5F;color:white}
.btn-primary:hover{background:#2D5A8A;text-decoration:none;color:white}
.btn-green{background:#059669;color:white}
.btn-green:hover{background:#047857;text-decoration:none;color:white}
.btn-ghost{background:transparent;color:#64748b;border:1px solid #e2e8f0}
.btn-ghost:hover{background:#f8fafc;text-decoration:none}
.btn-row{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px;padding-top:16px;border-top:1px solid #f1f5f9}
.alert{padding:11px 15px;border-radius:9px;font-size:13px;font-weight:500;margin-bottom:18px}
.alert-ok{background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0}
.alert-err{background:#fef2f2;color:#991b1b;border:1px solid #fecaca}
.login-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#0f1e30,#1E3A5F)}
.login-card{background:white;border-radius:20px;padding:40px 36px;width:100%;max-width:360px;box-shadow:0 24px 60px rgba(0,0,0,.35)}
.login-logo{font-size:28px;font-weight:900;letter-spacing:-0.04em;color:#1E3A5F;margin-bottom:4px}
.login-sub{font-size:13px;color:#94a3b8;margin-bottom:28px}
.edit-link{color:#1E3A5F;font-weight:600;font-size:12px;padding:5px 10px;border-radius:7px;background:#f0f4ff;border:1px solid #c7d2fe;white-space:nowrap}
.edit-link:hover{background:#e0e7ff;text-decoration:none}
td:last-child,th:last-child{padding-right:24px;white-space:nowrap}
.mono{font-family:monospace;font-size:12px;color:#64748b}
.check-row{display:flex;align-items:center;gap:8px;padding:10px 0}
.check-row input[type=checkbox]{width:16px;height:16px;cursor:pointer}
.check-row label{font-size:13px;color:#475569;font-weight:500;text-transform:none;letter-spacing:0}
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

def _layout(content: str, active: str = "agencies") -> str:
    nav = ""
    for href, label, key in [("/superadmin/panel","Agences","agencies"), ("/superadmin/new","+ Nouvelle agence","new")]:
        cls = " active" if active == key else ""
        nav += f'<a href="{href}" class="{cls.strip()}">{label}</a>'
    return _page(f"""
<div class="top">
  <div class="top-left">
    <h1>ImmoFlash</h1>
    <span class="badge">Super-Admin</span>
    <nav>{nav}</nav>
  </div>
  <a href="/superadmin/logout" class="btn btn-ghost btn-sm" style="color:rgba(255,255,255,.6);border-color:rgba(255,255,255,.2)">Déconnexion</a>
</div>
<div class="wrap">{content}</div>""")

def _alert(msg: str, ok: bool) -> str:
    if not msg:
        return ""
    cls = "alert-ok" if ok else "alert-err"
    return f'<div class="alert {cls}">{_q(msg)}</div>'

def _field(label: str, inp: str, hint: str = "") -> str:
    h = f'<div class="hint">{hint}</div>' if hint else ""
    return f'<div class="field"><label>{label}</label>{inp}{h}</div>'

def _inp(name, value="", type="text", placeholder="", extra=""):
    return f'<input type="{type}" name="{name}" value="{_q(value)}" placeholder="{_q(placeholder)}" {extra}>'

def _get_agency(slug: str) -> dict | None:
    conn = sqlite3.connect(adb.AGENCIES_DB_PATH)
    conn.row_factory = sqlite3.Row
    row = conn.execute("SELECT * FROM agencies WHERE slug = ?", (slug,)).fetchone()
    conn.close()
    return dict(row) if row else None

def _get_users(agency_id: int) -> list:
    conn = sqlite3.connect(adb.AGENCIES_DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT id, email, nom, role, created_at FROM users WHERE agency_id = ? ORDER BY id",
        (agency_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ── Login ─────────────────────────────────────────────────────────────────────

@router.get("/superadmin", response_class=HTMLResponse)
def sa_login_page(request: Request, msg: str = ""):
    if _is_auth(request):
        return RedirectResponse("/superadmin/panel", 302)
    alert = _alert(msg, False) if msg else ""
    return _page(f"""
<div class="login-wrap">
  <div class="login-card">
    <div class="login-logo">ImmoFlash</div>
    <div class="login-sub">Panneau propriétaire</div>
    {alert}
    <form method="post" action="/superadmin/login">
      <div class="field" style="margin-bottom:16px">
        <label class="login-sub" style="font-weight:600;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:.04em">Mot de passe</label>
        <input type="password" name="password" autofocus placeholder="••••••••" required style="margin-top:5px">
      </div>
      <button class="btn btn-primary" type="submit" style="width:100%;justify-content:center;padding:12px">Accéder →</button>
    </form>
  </div>
</div>""", "Connexion")


@router.post("/superadmin/login")
def sa_login(password: str = Form(...)):
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


# ── Liste des agences ─────────────────────────────────────────────────────────

@router.get("/superadmin/panel", response_class=HTMLResponse)
def sa_panel(request: Request, msg: str = "", ok: str = "1"):
    if not _is_auth(request):
        return RedirectResponse("/superadmin", 302)

    conn = sqlite3.connect(adb.AGENCIES_DB_PATH)
    conn.row_factory = sqlite3.Row
    agencies = conn.execute(
        "SELECT a.id, a.slug, a.nom, a.nom_court, a.plan_id, a.email, a.couleur_primaire, a.logo_url, "
        "COUNT(u.id) as nb_users "
        "FROM agencies a LEFT JOIN users u ON u.agency_id = a.id "
        "GROUP BY a.id ORDER BY a.id"
    ).fetchall()
    conn.close()

    rows = ""
    for a in agencies:
        color = a["couleur_primaire"] or "#1E3A5F"
        logo = ""
        if a["logo_url"]:
            src = a["logo_url"] if a["logo_url"].startswith("http") else f"/api{a['logo_url']}"
            logo = f'<img src="{src}" style="height:28px;max-width:60px;object-fit:contain;border-radius:4px;vertical-align:middle;margin-right:6px">'
        rows += f"""
        <tr>
          <td>{logo}<strong>{_q(a['nom'])}</strong></td>
          <td class="mono">{_q(a['slug'])}</td>
          <td><span class="bp bp-{a['plan_id']}">{a['plan_id']}</span></td>
          <td>{_q(a['email'] or '—')}</td>
          <td><span class="color-dot" style="background:{color}"></span>{color}</td>
          <td>{a['nb_users']}</td>
          <td><a href="/superadmin/agency/{_q(a['slug'])}" class="edit-link">Configurer →</a></td>
        </tr>"""

    content = f"""
    {_alert(msg, ok == "1")}
    <div class="card">
      <div class="card-title">📋 Agences ({len(agencies)})</div>
      <div style="overflow-x:auto">
        <table>
          <thead><tr>
            <th>Agence</th><th>Slug</th><th>Plan</th><th>Email</th><th>Couleur</th><th>Users</th><th></th>
          </tr></thead>
          <tbody>{rows}</tbody>
        </table>
      </div>
    </div>"""
    return _layout(content, "agencies")


# ── Créer une agence ──────────────────────────────────────────────────────────

@router.get("/superadmin/new", response_class=HTMLResponse)
def sa_new_page(request: Request, msg: str = "", ok: str = "1"):
    if not _is_auth(request):
        return RedirectResponse("/superadmin", 302)
    form = f"""
    {_alert(msg, ok == "1")}
    <div class="card">
      <div class="card-title">✦ Nouvelle agence</div>
      <form method="post" action="/superadmin/create-agency">
        <div class="grid">
          <div class="section-label">Informations agence</div>
          {_field("Nom complet", _inp("nom", placeholder="Saint François Immobilier"), "Nom affiché partout dans l'app")}
          {_field("Nom court", _inp("nom_court", placeholder="Saint François"), "Affiché dans la sidebar")}
          {_field("Nom filtre", _inp("nom_filtre", placeholder="SAINT FRANCOIS"), "Utilisé pour filtrer les biens importés")}
          <div class="field full">
            <label>Plan</label>
            <select name="plan_id">
              <option value="agence">Agence</option>
              <option value="reseau">Réseau</option>
            </select>
          </div>
          {_field("Slug", _inp("slug", placeholder="saint_francois", extra='class="mono"'), "Identifiant unique, lettres minuscules + underscores")}
          {_field("Adresse", _inp("adresse", placeholder="12 rue de la Mer, 06000 Nice"))}
          {_field("Téléphone", _inp("telephone", placeholder="04 93 00 00 00"))}
          {_field("Email agence", _inp("email", placeholder="contact@agence.fr", type="email"))}
          {_field("Couleur primaire", '<input type="color" name="couleur_primaire" value="#1E3A5F">')}
          {_field("URL du logo", _inp("logo_url", placeholder="https://agence.fr/logo.png", type="url"), "URL externe (optionnel, modifiable après)")}

          <div class="section-label">Compte administrateur</div>
          {_field("Nom de l'admin", _inp("admin_nom", placeholder="Prénom Nom"))}
          {_field("Email de l'admin", _inp("admin_email", placeholder="admin@agence.fr", type="email"))}
          {_field("Mot de passe (min 6 car.)", _inp("admin_password", type="password"))}

          <div class="section-label">Configuration SMTP (optionnel)</div>
          {_field("Serveur SMTP", _inp("smtp_server", placeholder="smtp.gmail.com"))}
          {_field("Port", _inp("smtp_port", value="587", type="number", placeholder="587"))}
          {_field("Utilisateur SMTP (email d'envoi)", _inp("smtp_user", placeholder="contact@agence.fr", type="email"))}
          {_field("Mot de passe / App password", _inp("smtp_password", type="password"))}
          {_field("Nom expéditeur", _inp("smtp_from_name", placeholder="Agence XYZ"))}
          {_field("Email de réponse (reply-to)", _inp("smtp_reply_to", placeholder="contact@agence.fr", type="email"))}
          <div class="full" style="background:#f8fafc;border-radius:9px;padding:10px 14px;font-size:12px;color:#64748b">
            💡 <strong>Gmail</strong> : activer « Mots de passe d'application » dans votre compte Google (code 16 car.).<br>
            💡 <strong>OVH</strong> : smtp.mail.ovh.net · port 587 · identifiants OVH.
          </div>
        </div>
        <div class="btn-row">
          <button class="btn btn-primary" type="submit">✦ Créer l'agence</button>
          <a href="/superadmin/panel" class="btn btn-ghost">Annuler</a>
        </div>
      </form>
    </div>"""
    return _layout(form, "new")


@router.post("/superadmin/create-agency")
def sa_create_agency(
    request: Request,
    nom: str            = Form(...),
    nom_court: str      = Form(...),
    nom_filtre: str     = Form(""),
    slug: str           = Form(...),
    plan_id: str        = Form("agence"),
    email: str          = Form(""),
    telephone: str      = Form(""),
    adresse: str        = Form(""),
    couleur_primaire: str = Form("#1E3A5F"),
    logo_url: str       = Form(""),
    admin_nom: str      = Form(...),
    admin_email: str    = Form(...),
    admin_password: str = Form(...),
    smtp_server: str    = Form(""),
    smtp_port: int      = Form(587),
    smtp_user: str      = Form(""),
    smtp_password: str  = Form(""),
    smtp_from_name: str = Form(""),
    smtp_reply_to: str  = Form(""),
):
    if not _is_auth(request):
        return RedirectResponse("/superadmin", 302)

    slug = slug.strip().lower()
    if not re.match(r'^[a-z0-9_]+$', slug):
        return RedirectResponse("/superadmin/new?msg=Slug+invalide+(lettres,+chiffres,+underscores)&ok=0", 303)
    if len(admin_password) < 6:
        return RedirectResponse("/superadmin/new?msg=Mot+de+passe+trop+court+(min+6)&ok=0", 303)

    conn = sqlite3.connect(adb.AGENCIES_DB_PATH)
    conn.row_factory = sqlite3.Row

    if conn.execute("SELECT id FROM agencies WHERE slug = ?", (slug,)).fetchone():
        conn.close()
        return RedirectResponse(f"/superadmin/new?msg=Slug+%22{slug}%22+déjà+utilisé&ok=0", 303)
    if conn.execute("SELECT id FROM users WHERE email = ?", (admin_email.lower(),)).fetchone():
        conn.close()
        return RedirectResponse("/superadmin/new?msg=Email+admin+déjà+utilisé&ok=0", 303)

    cursor = conn.execute(
        "INSERT INTO agencies (slug, nom, nom_court, nom_filtre, plan_id, email, telephone, adresse, couleur_primaire, logo_url, "
        "smtp_server, smtp_port, smtp_user, smtp_password, smtp_from_name, smtp_reply_to) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (slug, nom, nom_court, nom_filtre or nom_court.upper(), plan_id, email, telephone, adresse, couleur_primaire, logo_url,
         smtp_server, smtp_port, smtp_user, smtp_password, smtp_from_name, smtp_reply_to)
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

    return RedirectResponse(f"/superadmin/agency/{slug}?msg=Agence+créée+avec+succès+✓&ok=1", 303)


# ── Configurer une agence ─────────────────────────────────────────────────────

@router.get("/superadmin/agency/{slug}", response_class=HTMLResponse)
def sa_agency_edit(request: Request, slug: str, msg: str = "", ok: str = "1"):
    if not _is_auth(request):
        return RedirectResponse("/superadmin", 302)
    a = _get_agency(slug)
    if not a:
        return RedirectResponse("/superadmin/panel?msg=Agence+introuvable&ok=0", 302)
    users = _get_users(a["id"])

    logo_preview = ""
    if a.get("logo_url"):
        src = a["logo_url"] if a["logo_url"].startswith("http") else f"/api{a['logo_url']}"
        logo_preview = f'<img src="{src}" class="logo-preview" onerror="this.style.display=\'none\'">'

    fond_checked = "checked" if a.get("logo_fond_colore") else ""

    # Table utilisateurs
    user_rows = ""
    for u in users:
        role_badge = {"admin":"🔑 Admin","agent":"Agent","demo":"Demo"}.get(u["role"], u["role"])
        user_rows += f"""
        <tr>
          <td><strong>{_q(u['nom'])}</strong></td>
          <td class="mono">{_q(u['email'])}</td>
          <td>{role_badge}</td>
          <td>
            <form method="post" action="/superadmin/agency/{slug}/reset-password" style="display:flex;gap:6px;align-items:center">
              <input type="hidden" name="user_id" value="{u['id']}">
              <input type="password" name="new_password" placeholder="Nouveau mdp" minlength="6" required style="width:160px;padding:6px 10px;font-size:12px">
              <button class="btn btn-ghost btn-sm" type="submit">Changer</button>
            </form>
          </td>
        </tr>"""

    # Formulaire ajout utilisateur
    add_user_form = f"""
    <form method="post" action="/superadmin/agency/{slug}/add-user" style="margin-top:16px;padding-top:16px;border-top:1px solid #f1f5f9">
      <div style="font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px">Ajouter un utilisateur</div>
      <div class="grid">
        <div class="field"><label>Nom</label><input type="text" name="nom" placeholder="Prénom Nom" required></div>
        <div class="field"><label>Email</label><input type="email" name="email" placeholder="agent@agence.fr" required></div>
        <div class="field"><label>Mot de passe</label><input type="password" name="password" minlength="6" required></div>
        <div class="field"><label>Rôle</label>
          <select name="role"><option value="agent">Agent</option><option value="admin">Admin</option></select>
        </div>
      </div>
      <div class="btn-row" style="margin-top:12px;padding-top:12px">
        <button class="btn btn-green btn-sm" type="submit">+ Ajouter</button>
      </div>
    </form>"""

    content = f"""
    {_alert(msg, ok == "1")}
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
      <a href="/superadmin/panel" style="color:#94a3b8;font-size:13px">← Toutes les agences</a>
      <span style="color:#e2e8f0">/</span>
      <span style="font-size:15px;font-weight:700;color:#1E3A5F">{_q(a['nom'])}</span>
      <span class="bp bp-{a.get('plan_id','agence')}">{a.get('plan_id','agence')}</span>
    </div>

    <!-- ─ Informations & branding ─ -->
    <div class="card">
      <div class="card-title">🏢 Informations &amp; Branding</div>
      <form method="post" action="/superadmin/agency/{slug}/save">
        <div class="grid">
          <div class="section-label">Identité</div>
          {_field("Nom complet", _inp("nom", a.get('nom','')))}
          {_field("Nom court (sidebar)", _inp("nom_court", a.get('nom_court','')))}
          {_field("Nom filtre (import)", _inp("nom_filtre", a.get('nom_filtre','')), "Texte comparé aux données FTP pour filtrer les biens de l'agence")}
          {_field("Plan", f'''<select name="plan_id"><option value="agence" {"selected" if a.get("plan_id")=="agence" else ""}>Agence</option><option value="reseau" {"selected" if a.get("plan_id")=="reseau" else ""}>Réseau</option></select>''')}

          <div class="section-label">Coordonnées</div>
          {_field("Adresse", _inp("adresse", a.get('adresse','')))}
          {_field("Téléphone", _inp("telephone", a.get('telephone','')))}
          {_field("Email public", _inp("email", a.get('email',''), type="email"))}

          <div class="section-label">Branding</div>
          <div class="field">
            <label>Couleur primaire</label>
            <div style="display:flex;align-items:center;gap:10px">
              <input type="color" name="couleur_primaire" value="{_q(a.get('couleur_primaire','#1E3A5F'))}" style="width:60px">
              <span style="font-size:13px;color:#64748b">{_q(a.get('couleur_primaire','#1E3A5F'))}</span>
            </div>
          </div>
          <div class="field">
            <label>Logo sur fond coloré ?</label>
            <div class="check-row">
              <input type="checkbox" name="logo_fond_colore" value="1" id="lfc_{slug}" {fond_checked}>
              <label for="lfc_{slug}">Fond de la couleur primaire derrière le logo</label>
            </div>
          </div>
        </div>
        <div class="btn-row">
          <button class="btn btn-primary" type="submit">💾 Enregistrer</button>
        </div>
      </form>
    </div>

    <!-- ─ Logo ─ -->
    <div class="card">
      <div class="card-title">🖼 Logo</div>
      <div class="logo-row" style="margin-bottom:16px">
        {logo_preview}
        <div>
          <div style="font-size:13px;color:#64748b;margin-bottom:6px">Logo actuel : <code style="font-size:11px">{_q(a.get('logo_url') or '(aucun)')}</code></div>
        </div>
      </div>
      <form method="post" action="/superadmin/agency/{slug}/logo-url">
        <div class="grid">
          {_field("URL externe du logo", _inp("logo_url", a.get('logo_url',''), type="url", placeholder="https://agence.fr/logo.png"), "Priorité sur le fichier uploadé")}
        </div>
        <div class="btn-row">
          <button class="btn btn-primary btn-sm" type="submit">Enregistrer l'URL</button>
        </div>
      </form>
      <hr style="border:none;border-top:1px solid #f1f5f9;margin:18px 0">
      <form method="post" action="/superadmin/agency/{slug}/logo-upload" enctype="multipart/form-data">
        <div class="field">
          <label>Uploader un fichier logo</label>
          <input type="file" name="file" accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml">
          <div class="hint">PNG, JPG, SVG, WebP — max 2 Mo</div>
        </div>
        <div class="btn-row">
          <button class="btn btn-green btn-sm" type="submit">⬆ Uploader</button>
        </div>
      </form>
    </div>

    <!-- ─ SMTP ─ -->
    <div class="card">
      <div class="card-title">📧 Configuration email (SMTP)</div>
      <form method="post" action="/superadmin/agency/{slug}/save-smtp">
        <div class="grid">
          {_field("Serveur SMTP", _inp("smtp_server", a.get('smtp_server','smtp.gmail.com'), placeholder="smtp.gmail.com"))}
          {_field("Port", _inp("smtp_port", str(a.get('smtp_port',587) or 587), type="number", placeholder="587"))}
          {_field("Utilisateur SMTP (email d'envoi)", _inp("smtp_user", a.get('smtp_user',''), type="email", placeholder="contact@agence.fr"))}
          {_field("Mot de passe / App password", _inp("smtp_password", a.get('smtp_password',''), type="password"))}
          {_field("Nom expéditeur", _inp("smtp_from_name", a.get('smtp_from_name',''), placeholder="Agence XYZ"))}
          {_field("Email de réponse (reply-to)", _inp("smtp_reply_to", a.get('smtp_reply_to',''), type="email", placeholder="contact@agence.fr"))}
        </div>
        <div style="background:#f8fafc;border-radius:9px;padding:12px 14px;margin-top:4px;font-size:12px;color:#64748b">
          💡 <strong>Gmail</strong> : activer « Mots de passe d'application » dans votre compte Google et coller le code 16 caractères ici.<br>
          💡 <strong>OVH</strong> : smtp.mail.ovh.net port 587 avec vos identifiants OVH.
        </div>
        <div class="btn-row">
          <button class="btn btn-primary" type="submit">💾 Enregistrer SMTP</button>
        </div>
      </form>
    </div>

    <!-- ─ Utilisateurs ─ -->
    <div class="card">
      <div class="card-title">👥 Utilisateurs ({len(users)})</div>
      <div style="overflow-x:auto">
        <table>
          <thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Mot de passe</th></tr></thead>
          <tbody>{user_rows if user_rows else '<tr><td colspan="4" style="color:#94a3b8;text-align:center;padding:20px">Aucun utilisateur</td></tr>'}</tbody>
        </table>
      </div>
      {add_user_form}
    </div>"""

    return _layout(content, "agencies")


# ── POST : save infos + branding ──────────────────────────────────────────────

@router.post("/superadmin/agency/{slug}/save")
def sa_save(
    request: Request, slug: str,
    nom: str              = Form(...),
    nom_court: str        = Form(...),
    nom_filtre: str       = Form(""),
    plan_id: str          = Form("agence"),
    adresse: str          = Form(""),
    telephone: str        = Form(""),
    email: str            = Form(""),
    couleur_primaire: str = Form("#1E3A5F"),
    logo_fond_colore: str = Form("0"),
):
    if not _is_auth(request):
        return RedirectResponse("/superadmin", 302)
    conn = sqlite3.connect(adb.AGENCIES_DB_PATH)
    conn.execute(
        "UPDATE agencies SET nom=?, nom_court=?, nom_filtre=?, plan_id=?, adresse=?, telephone=?, email=?, couleur_primaire=?, logo_fond_colore=? WHERE slug=?",
        (nom, nom_court, nom_filtre or nom_court.upper(), plan_id, adresse, telephone, email, couleur_primaire, 1 if logo_fond_colore == "1" else 0, slug)
    )
    conn.commit(); conn.close()
    return RedirectResponse(f"/superadmin/agency/{slug}?msg=Informations+enregistrées+✓&ok=1", 303)


# ── POST : URL logo ───────────────────────────────────────────────────────────

@router.post("/superadmin/agency/{slug}/logo-url")
def sa_logo_url(request: Request, slug: str, logo_url: str = Form("")):
    if not _is_auth(request):
        return RedirectResponse("/superadmin", 302)
    conn = sqlite3.connect(adb.AGENCIES_DB_PATH)
    conn.execute("UPDATE agencies SET logo_url=? WHERE slug=?", (logo_url, slug))
    conn.commit(); conn.close()
    return RedirectResponse(f"/superadmin/agency/{slug}?msg=URL+logo+enregistrée+✓&ok=1", 303)


# ── POST : upload logo ────────────────────────────────────────────────────────

@router.post("/superadmin/agency/{slug}/logo-upload")
async def sa_logo_upload(request: Request, slug: str, file: UploadFile = File(...)):
    if not _is_auth(request):
        return RedirectResponse("/superadmin", 302)
    if file.content_type not in ALLOWED_LOGO_TYPES:
        return RedirectResponse(f"/superadmin/agency/{slug}?msg=Format+non+supporté+(PNG,+JPG,+SVG,+WebP)&ok=0", 303)
    content = await file.read()
    if len(content) > 2 * 1024 * 1024:
        return RedirectResponse(f"/superadmin/agency/{slug}?msg=Fichier+trop+grand+(max+2+Mo)&ok=0", 303)
    ext = (file.filename or "logo").rsplit(".", 1)[-1].lower()
    os.makedirs("static/logos", exist_ok=True)
    path = f"static/logos/{slug}.{ext}"
    with open(path, "wb") as f:
        f.write(content)
    logo_url = f"/static/logos/{slug}.{ext}"
    conn = sqlite3.connect(adb.AGENCIES_DB_PATH)
    conn.execute("UPDATE agencies SET logo_url=? WHERE slug=?", (logo_url, slug))
    conn.commit(); conn.close()
    return RedirectResponse(f"/superadmin/agency/{slug}?msg=Logo+uploadé+✓&ok=1", 303)


# ── POST : save SMTP ──────────────────────────────────────────────────────────

@router.post("/superadmin/agency/{slug}/save-smtp")
def sa_save_smtp(
    request: Request, slug: str,
    smtp_server: str   = Form(""),
    smtp_port: int     = Form(587),
    smtp_user: str     = Form(""),
    smtp_password: str = Form(""),
    smtp_from_name: str = Form(""),
    smtp_reply_to: str = Form(""),
):
    if not _is_auth(request):
        return RedirectResponse("/superadmin", 302)
    conn = sqlite3.connect(adb.AGENCIES_DB_PATH)
    conn.execute(
        "UPDATE agencies SET smtp_server=?, smtp_port=?, smtp_user=?, smtp_password=?, smtp_from_name=?, smtp_reply_to=? WHERE slug=?",
        (smtp_server, smtp_port, smtp_user, smtp_password, smtp_from_name, smtp_reply_to, slug)
    )
    conn.commit(); conn.close()
    return RedirectResponse(f"/superadmin/agency/{slug}?msg=Configuration+SMTP+enregistrée+✓&ok=1", 303)


# ── POST : reset mot de passe utilisateur ─────────────────────────────────────

@router.post("/superadmin/agency/{slug}/reset-password")
def sa_reset_pw(request: Request, slug: str, user_id: int = Form(...), new_password: str = Form(...)):
    if not _is_auth(request):
        return RedirectResponse("/superadmin", 302)
    if len(new_password) < 6:
        return RedirectResponse(f"/superadmin/agency/{slug}?msg=Mot+de+passe+trop+court&ok=0", 303)
    pw_hash = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
    a = _get_agency(slug)
    conn = sqlite3.connect(adb.AGENCIES_DB_PATH)
    conn.execute("UPDATE users SET password_hash=? WHERE id=? AND agency_id=?", (pw_hash, user_id, a["id"]))
    conn.commit(); conn.close()
    return RedirectResponse(f"/superadmin/agency/{slug}?msg=Mot+de+passe+réinitialisé+✓&ok=1", 303)


# ── POST : ajouter utilisateur ────────────────────────────────────────────────

@router.post("/superadmin/agency/{slug}/add-user")
def sa_add_user(
    request: Request, slug: str,
    nom: str      = Form(...),
    email: str    = Form(...),
    password: str = Form(...),
    role: str     = Form("agent"),
):
    if not _is_auth(request):
        return RedirectResponse("/superadmin", 302)
    if len(password) < 6:
        return RedirectResponse(f"/superadmin/agency/{slug}?msg=Mot+de+passe+trop+court&ok=0", 303)
    a = _get_agency(slug)
    conn = sqlite3.connect(adb.AGENCIES_DB_PATH)
    conn.row_factory = sqlite3.Row
    if conn.execute("SELECT id FROM users WHERE email=?", (email.lower(),)).fetchone():
        conn.close()
        return RedirectResponse(f"/superadmin/agency/{slug}?msg=Email+déjà+utilisé&ok=0", 303)
    pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    conn.execute(
        "INSERT INTO users (email, password_hash, nom, role, agency_id, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        (email.lower(), pw_hash, nom, role, a["id"], datetime.now().isoformat())
    )
    conn.commit(); conn.close()
    return RedirectResponse(f"/superadmin/agency/{slug}?msg=Utilisateur+ajouté+✓&ok=1", 303)
