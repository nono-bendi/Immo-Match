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

# ── Chemin vers la base de données ────────────────────────────────────────────
DB_PATH = os.getenv("DB_PATH", "immomatch.db")

# ── Configuration SMTP ────────────────────────────────────────────────────────
SMTP_CONFIG = {
    "server": "smtp.gmail.com",
    "port": 587,
    "user": os.getenv("SMTP_USER", "stfrancoisgestion@gmail.com"),
    "password": os.getenv("SMTP_PASSWORD", ""),
    "from_name": "Saint François Immobilier",
    "reply_to": "contact@saintfrancoisimmobilier.com"
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

# ── URL logo email ────────────────────────────────────────────────────────────
os.environ["EMAIL_LOGO_URL"] = "https://www.saintfrancoisimmobilier.fr/images/logoSite.png"

# ── Application FastAPI ───────────────────────────────────────────────────────
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_methods=["*"],
    allow_headers=["*"],
)
