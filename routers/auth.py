import sqlite3
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from jose import JWTError, jwt
import bcrypt

from config import (
    DB_PATH, AUTH_CONFIG, security, security_optional,
    UserRegister, UserLogin, UserResponse, TokenResponse
)

router = APIRouter()

# ============================================================
# FONCTIONS UTILITAIRES D'AUTHENTIFICATION
# ============================================================

def hash_password(password: str) -> str:
    """Hash un mot de passe avec bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Vérifie si le mot de passe correspond au hash"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def create_access_token(data: dict) -> str:
    """Crée un token JWT"""
    to_encode = data.copy()
    expire = datetime.now() + timedelta(hours=AUTH_CONFIG["access_token_expire_hours"])
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, AUTH_CONFIG["secret_key"], algorithm=AUTH_CONFIG["algorithm"])
    return encoded_jwt


def verify_token(token: str) -> dict:
    """Vérifie et décode un token JWT"""
    try:
        payload = jwt.decode(token, AUTH_CONFIG["secret_key"], algorithms=[AUTH_CONFIG["algorithm"]])
        return payload
    except JWTError:
        return None


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Middleware : récupère l'utilisateur depuis le token"""
    token = credentials.credentials
    payload = verify_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expiré",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Récupérer l'utilisateur depuis la BDD
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    user = conn.execute("SELECT id, email, nom, role FROM users WHERE id = ?", (payload.get("user_id"),)).fetchone()
    conn.close()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur non trouvé",
        )

    return dict(user)


def get_optional_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Middleware optionnel : retourne None si pas de token valide"""
    try:
        return get_current_user(credentials)
    except Exception:
        return None


def require_not_demo(current_user: dict = Depends(get_current_user)):
    """Bloque les actions sensibles pour le compte démo (lecture seule)."""
    if current_user.get("role") == "demo":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Action désactivée en mode démo"
        )
    return current_user


def require_not_demo_optional(credentials: HTTPAuthorizationCredentials = Depends(security_optional)):
    """Comme require_not_demo mais sans exiger d'être connecté (routes sans auth obligatoire)."""
    if credentials is None:
        return  # Pas de token = ok
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
    """Créer un nouveau compte"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Vérifier si l'email existe déjà
    existing = cursor.execute("SELECT id FROM users WHERE email = ?", (user_data.email.lower(),)).fetchone()
    if existing:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cet email est déjà utilisé"
        )

    # Valider le mot de passe
    if len(user_data.password) < 6:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le mot de passe doit contenir au moins 6 caractères"
        )

    # Créer l'utilisateur
    password_hash = hash_password(user_data.password)
    cursor.execute('''
        INSERT INTO users (email, password_hash, nom, role, created_at)
        VALUES (?, ?, ?, ?, ?)
    ''', (
        user_data.email.lower(),
        password_hash,
        user_data.nom,
        user_data.role,
        datetime.now().isoformat()
    ))

    user_id = cursor.lastrowid
    conn.commit()
    conn.close()

    # Créer le token
    access_token = create_access_token({"user_id": user_id, "email": user_data.email.lower()})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": user_data.email.lower(),
            "nom": user_data.nom,
            "role": user_data.role
        }
    }


@router.post("/auth/login", response_model=TokenResponse)
def login(user_data: UserLogin):
    """Connexion - retourne un token"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    # Chercher l'utilisateur
    user = conn.execute("SELECT * FROM users WHERE email = ?", (user_data.email.lower(),)).fetchone()
    conn.close()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect"
        )

    # Vérifier le mot de passe
    if not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect"
        )

    # Créer le token
    access_token = create_access_token({"user_id": user["id"], "email": user["email"]})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "nom": user["nom"],
            "role": user["role"]
        }
    }


@router.get("/auth/me", response_model=UserResponse)
def get_me(current_user: dict = Depends(get_current_user)):
    """Récupère les infos de l'utilisateur connecté"""
    return current_user


@router.post("/auth/change-password")
def change_password(data: dict, current_user: dict = Depends(get_current_user)):
    """Changer le mot de passe"""
    old_password = data.get("old_password")
    new_password = data.get("new_password")

    if not old_password or not new_password:
        raise HTTPException(status_code=400, detail="Mots de passe requis")

    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Le nouveau mot de passe doit contenir au moins 6 caractères")

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    user = conn.execute("SELECT password_hash FROM users WHERE id = ?", (current_user["id"],)).fetchone()

    if not verify_password(old_password, user["password_hash"]):
        conn.close()
        raise HTTPException(status_code=400, detail="Ancien mot de passe incorrect")

    new_hash = hash_password(new_password)
    conn.execute("UPDATE users SET password_hash = ? WHERE id = ?", (new_hash, current_user["id"]))
    conn.commit()
    conn.close()

    return {"success": True, "message": "Mot de passe modifié"}
