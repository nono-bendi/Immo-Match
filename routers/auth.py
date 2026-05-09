import os
import sqlite3
import time
import smtplib
import secrets as _secrets
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials
from jose import JWTError, jwt
import bcrypt

from config import AUTH_CONFIG, security, security_optional, UserRegister, UserLogin, UserResponse, TokenResponse
import agencies_db as adb

router = APIRouter()

# ── Rate limiting login ───────────────────────────────────────────────────────
_login_attempts: dict = {}   # { ip: [timestamp, ...] }
_LOGIN_MAX  = 5              # tentatives max
_LOGIN_WINDOW = 60           # fenêtre en secondes

# ── Rate limiting forgot-password ─────────────────────────────────────────────
_forgot_attempts: dict = {}  # { ip: [timestamp, ...] }
_FORGOT_MAX    = 3
_FORGOT_WINDOW = 3600        # 1 heure


# ============================================================
# FONCTIONS UTILITAIRES D'AUTHENTIFICATION
# ============================================================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now() + timedelta(hours=AUTH_CONFIG["access_token_expire_hours"])
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, AUTH_CONFIG["secret_key"], algorithm=AUTH_CONFIG["algorithm"])


def verify_token(token: str) -> dict:
    try:
        return jwt.decode(token, AUTH_CONFIG["secret_key"], algorithms=[AUTH_CONFIG["algorithm"]])
    except JWTError:
        return None


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Récupère l'utilisateur + config agence depuis le token JWT."""
    token = credentials.credentials
    payload = verify_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expiré",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = adb.get_user_by_id(payload.get("user_id"))

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur non trouvé",
        )

    # Vérifier l'expiration du compte trial
    if user.get("is_trial") and user.get("trial_expires_at"):
        try:
            expires = datetime.fromisoformat(user["trial_expires_at"])
            if datetime.now() > expires:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Votre période d'essai est terminée.",
                )
        except ValueError:
            pass

    return user


def get_optional_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        return get_current_user(credentials)
    except Exception:
        return None


def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs"
        )
    return current_user


def require_not_demo(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") == "demo":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Action désactivée en mode démo"
        )
    return current_user


def require_not_demo_optional(credentials: HTTPAuthorizationCredentials = Depends(security_optional)):
    if credentials is None:
        return
    try:
        user = get_current_user(credentials)
        if user.get("role") == "demo":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Action désactivée en mode démo"
            )
    except HTTPException:
        raise
    except Exception:
        pass


# ============================================================
# ROUTES AUTHENTIFICATION
# ============================================================

@router.post("/auth/register", response_model=TokenResponse)
def register(user_data: UserRegister):
    """Inscription publique désactivée — les comptes sont créés par les admins."""
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="L'inscription publique est désactivée. Contactez votre administrateur."
    )


@router.post("/auth/login", response_model=TokenResponse)
def login(request: Request, user_data: UserLogin):
    ip = request.client.host if request.client else "unknown"
    now = time.time()

    # Nettoyer les anciennes tentatives hors fenêtre
    attempts = [t for t in _login_attempts.get(ip, []) if now - t < _LOGIN_WINDOW]
    if len(attempts) >= _LOGIN_MAX:
        retry_in = int(_LOGIN_WINDOW - (now - attempts[0]))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Trop de tentatives. Réessayez dans {retry_in}s."
        )

    user = adb.get_user_with_agency(user_data.email.lower())

    if not user or not verify_password(user_data.password, user["password_hash"]):
        attempts.append(now)
        _login_attempts[ip] = attempts
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email ou mot de passe incorrect")

    _login_attempts.pop(ip, None)  # Reset après succès
    access_token = create_access_token({"user_id": user["id"], "email": user["email"]})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "nom": user["nom"],
            "role": user["role"],
        }
    }


@router.get("/auth/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "nom": current_user["nom"],
        "role": current_user["role"],
        "is_trial": bool(current_user.get("is_trial")),
        "trial_expires_at": current_user.get("trial_expires_at"),
        "agency_plan_id": current_user.get("agency_plan_id", "agence"),
    }


@router.get("/auth/agency")
def get_my_agency(current_user: dict = Depends(get_current_user)):
    """Retourne la config de l'agence de l'utilisateur connecté."""
    return {
        "slug":             current_user["agency_slug"],
        "nom":              current_user["agency_nom"],
        "nom_court":        current_user["agency_nom_court"],
        "nom_filtre":       current_user["agency_nom_filtre"],
        "adresse":          current_user["agency_adresse"],
        "telephone":        current_user["agency_telephone"],
        "email":            current_user["agency_email"],
        "logo_url":         current_user["agency_logo_url"],
        "couleur_primaire": current_user["agency_couleur"],
        "smtp_configured":  bool(
            (current_user.get("smtp_user") or "").strip() and
            (current_user.get("smtp_password") or "").strip()
        ),
    }


@router.post("/auth/change-password")
def change_password(data: dict, current_user: dict = Depends(get_current_user)):
    old_password = data.get("old_password")
    new_password = data.get("new_password")

    if not old_password or not new_password:
        raise HTTPException(status_code=400, detail="Mots de passe requis")

    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Le nouveau mot de passe doit contenir au moins 6 caractères")

    if not verify_password(old_password, current_user["password_hash"]):
        raise HTTPException(status_code=400, detail="Ancien mot de passe incorrect")

    new_hash = hash_password(new_password)
    adb.update_user_password(current_user["id"], new_hash)

    return {"success": True, "message": "Mot de passe modifié"}


# ============================================================
# MOT DE PASSE OUBLIÉ
# ============================================================

_SYSTEM_SMTP = {
    "server":    os.getenv("DEMO_SMTP_SERVER",   "smtp.mail.ovh.net"),
    "port":      int(os.getenv("DEMO_SMTP_PORT", "587")),
    "user":      os.getenv("DEMO_SMTP_USER",      "contact@immoflash.app"),
    "password":  os.getenv("DEMO_SMTP_PASSWORD", ""),
    "from_name": "ImmoFlash",
}
_DASHBOARD_URL = os.getenv("APP_BASE_URL", "https://immoflash.app") + "/dashboard"


@router.post("/auth/forgot-password")
def forgot_password(request: Request, data: dict):
    email = (data.get("email") or "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email requis")

    # Rate limiting : 3 demandes max par IP par heure (réponse silencieuse pour ne pas révéler)
    ip = request.client.host if request.client else "unknown"
    now = time.time()
    attempts = [t for t in _forgot_attempts.get(ip, []) if now - t < _FORGOT_WINDOW]
    if len(attempts) >= _FORGOT_MAX:
        return {"success": True}
    _forgot_attempts[ip] = attempts + [now]

    user = adb.get_user_with_agency(email)
    if not user:
        return {"success": True}  # Ne pas révéler si l'email existe

    token   = _secrets.token_urlsafe(32)
    expires = (datetime.now() + timedelta(hours=1)).isoformat()
    adb.create_reset_token(token, user["id"], expires)

    reset_url = f"{_DASHBOARD_URL}/reset-password?token={token}"
    prenom    = (user.get("nom") or "").split()[0] or "vous"

    html = f"""<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:system-ui,-apple-system,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">

        <!-- Logo -->
        <tr><td align="center" style="padding-bottom:28px">
          <span style="font-size:38px;font-weight:900;letter-spacing:-0.04em;background:linear-gradient(135deg,#1E3A5F 0%,#0ea5e9 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">ImmoFlash</span>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#ffffff;border-radius:20px;box-shadow:0 4px 32px rgba(0,0,0,0.08);overflow:hidden">

          <!-- Bandeau top -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="background:linear-gradient(135deg,#1E3A5F 0%,#1a6fa8 100%);padding:36px 40px 32px;text-align:center">
              <div style="width:64px;height:64px;background:rgba(255,255,255,0.15);border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:30px;line-height:64px">🔐</div>
              <h1 style="margin:0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.02em">Réinitialisation de<br>votre mot de passe</h1>
            </td></tr>

            <!-- Corps -->
            <tr><td style="padding:36px 40px">
              <p style="margin:0 0 8px;font-size:17px;font-weight:700;color:#1e293b">Bonjour {prenom} 👋</p>
              <p style="margin:0 0 28px;font-size:15px;color:#64748b;line-height:1.7">
                Vous avez demandé la réinitialisation de votre mot de passe ImmoFlash.<br>
                Cliquez sur le bouton ci-dessous pour en choisir un nouveau.
              </p>

              <!-- Bouton CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
                <tr><td align="center">
                  <a href="{reset_url}" style="display:inline-block;padding:15px 40px;background:linear-gradient(135deg,#1E3A5F 0%,#1a6fa8 100%);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:12px;letter-spacing:0.01em;box-shadow:0 4px 16px rgba(30,58,95,0.35)">
                    Réinitialiser mon mot de passe →
                  </a>
                </td></tr>
              </table>

              <!-- Infos expiration -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
                <tr>
                  <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 18px">
                    <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6">
                      ⏱&nbsp; Ce lien est valable <strong style="color:#1e293b">1 heure</strong> et ne peut être utilisé qu'une seule fois.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Lien brut -->
              <p style="margin:0 0 4px;font-size:12px;color:#94a3b8">Ou copiez ce lien dans votre navigateur :</p>
              <p style="margin:0 0 28px;font-size:11px;color:#0ea5e9;word-break:break-all;line-height:1.5">{reset_url}</p>

              <!-- Séparateur -->
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 20px">

              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6">
                Vous n'avez pas fait cette demande ? Ignorez simplement cet email — votre mot de passe actuel reste inchangé.
              </p>
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding:24px 0 8px">
          <p style="margin:0;font-size:12px;color:#94a3b8">
            © 2026 ImmoFlash · Développé par <strong style="color:#64748b">NOWA</strong>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Reinitialisation de votre mot de passe ImmoFlash"
        msg["From"]    = f"{_SYSTEM_SMTP['from_name']} <{_SYSTEM_SMTP['user']}>"
        msg["To"]      = email
        msg.attach(MIMEText(html, "html", "utf-8"))
        with smtplib.SMTP(_SYSTEM_SMTP["server"], _SYSTEM_SMTP["port"]) as s:
            s.ehlo(); s.starttls(); s.ehlo()
            s.login(_SYSTEM_SMTP["user"], _SYSTEM_SMTP["password"])
            s.sendmail(_SYSTEM_SMTP["user"], [email], msg.as_string())
    except Exception as e:
        print(f"[reset-password] Erreur envoi email: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de l'envoi de l'email")

    return {"success": True}


@router.post("/auth/reset-password")
def reset_password(data: dict):
    token    = (data.get("token") or "").strip()
    password = (data.get("password") or "").strip()

    if not token or not password:
        raise HTTPException(status_code=400, detail="Token et mot de passe requis")
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Le mot de passe doit contenir au moins 6 caracteres")

    row = adb.get_reset_token(token)
    if not row:
        raise HTTPException(status_code=400, detail="Lien invalide ou deja utilise")
    if datetime.now() > datetime.fromisoformat(row["expires_at"]):
        adb.delete_reset_token(token)
        raise HTTPException(status_code=400, detail="Lien expire — faites une nouvelle demande")

    new_hash = hash_password(password)
    adb.update_user_password(row["user_id"], new_hash)
    adb.delete_reset_token(token)

    return {"success": True}
