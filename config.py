from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
import os
import secrets
import threading
from dotenv import load_dotenv

load_dotenv()

# ── URL publique du serveur (pour les logos dans les emails) ──────────────────
APP_BASE_URL = os.getenv("APP_BASE_URL", "http://localhost:8000")

# ── Configuration SMTP de base (surchargée par agence au runtime) ─────────────
SMTP_BASE = {
    "server": "smtp.gmail.com",
    "port": 587,
}

# ── Configuration Auth ────────────────────────────────────────────────────────
AUTH_CONFIG = {
    "secret_key": os.getenv("JWT_SECRET_KEY") or secrets.token_hex(32),
    "algorithm": "HS256",
    "access_token_expire_hours": 24
}

# ── Schémas de sécurité ───────────────────────────────────────────────────────
security = HTTPBearer()
security_optional = HTTPBearer(auto_error=False)

# ── Locks et rate limiting ────────────────────────────────────────────────────
_analyse_all_lock = threading.Lock()   # Empêche les run-all simultanés
COOLDOWN_SECONDS = 30                  # Anti double-clic prospect individuel
_email_rate: dict = {}                 # { user_id: [timestamp, ...] } — rate limiting emails

# ── Modèles Pydantic ──────────────────────────────────────────────────────────

class EmailRequest(BaseModel):
    to_email: str
    to_name: Optional[str] = None
    subject: str
    bien_type: str
    bien_ville: str
    bien_prix: str
    bien_surface: Optional[str] = None
    bien_pieces: Optional[str] = None
    points_forts: Optional[str] = None
    points_attention: Optional[str] = None
    recommandation: Optional[str] = None
    lien_annonce: Optional[str] = None
    bien_image_url: Optional[str] = None
    custom_intro: Optional[str] = None
    custom_conclusion: Optional[str] = None

class UserRegister(BaseModel):
    email: str
    password: str
    nom: str
    role: Optional[str] = "agent"

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    nom: str
    role: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


# ── Application FastAPI ───────────────────────────────────────────────────────
app = FastAPI()

_cors_default = "http://localhost:5173,http://localhost:5174"
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", _cors_default).split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)
