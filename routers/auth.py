import sqlite3
import time
from datetime import datetime, timedelta
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
    """Créer un nouveau compte (rattaché à saint_francois par défaut)."""
    if adb.email_exists(user_data.email.lower()):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cet email est déjà utilisé")

    if len(user_data.password) < 6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Le mot de passe doit contenir au moins 6 caractères")

    # Par défaut, rattachement à saint_francois
    conn = sqlite3.connect(adb.AGENCIES_DB_PATH)
    conn.row_factory = sqlite3.Row
    agency = conn.execute("SELECT id FROM agencies WHERE slug = 'saint_francois'").fetchone()
    conn.close()

    if not agency:
        raise HTTPException(status_code=500, detail="Agence par défaut introuvable")

    password_hash = hash_password(user_data.password)
    user_id = adb.create_user(
        email=user_data.email.lower(),
        password_hash=password_hash,
        nom=user_data.nom,
        role=user_data.role or "agent",
        agency_id=agency["id"],
        created_at=datetime.now().isoformat(),
    )

    access_token = create_access_token({"user_id": user_id, "email": user_data.email.lower()})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": user_data.email.lower(),
            "nom": user_data.nom,
            "role": user_data.role or "agent",
        }
    }


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
