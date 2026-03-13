from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import pandas as pd
import sqlite3
from io import BytesIO
import anthropic
import json
from dotenv import load_dotenv
import os
import re
from datetime import datetime, timedelta
import ftplib
from jose import JWTError, jwt
import bcrypt
import secrets
from apscheduler.schedulers.background import BackgroundScheduler
import zipfile
import smtplib
from scoring import scorer_biens as scorer_biens_hybride, formater_pour_affichage
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pydantic import BaseModel
from typing import Optional

load_dotenv()

# Configuration SMTP — secrets depuis .env
SMTP_CONFIG = {
    "server": "smtp.gmail.com",
    "port": 587,
    "user": os.getenv("SMTP_USER", "stfrancoisgestion@gmail.com"),
    "password": os.getenv("SMTP_PASSWORD", ""),
    "from_name": "Saint François Immobilier",
    "reply_to": "contact@saintfrancoisimmobilier.com"
}

# Configuration Auth — secret fixe depuis .env (sinon sessions perdues au redémarrage)
AUTH_CONFIG = {
    "secret_key": os.getenv("JWT_SECRET_KEY") or secrets.token_hex(32),
    "algorithm": "HS256",
    "access_token_expire_hours": 24
}

# Contexte pour hasher les mots de passe

# Schéma de sécurité pour extraire le token
security = HTTPBearer()


# 3. AJOUTE CE MODÈLE PYDANTIC (après la config SMTP)
# ------------------------------------------------------------
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

# URL du logo pour les emails
os.environ["EMAIL_LOGO_URL"] = "https://www.saintfrancoisimmobilier.fr/images/logoSite.png"


# 4. AJOUTE CETTE FONCTION TEMPLATE HTML (avant les routes)
# ------------------------------------------------------------
from html import escape
import re

def fix_mojibake(text):
    """Corrige les séquences mojibake courantes (ex: 'ÃƒÂ©' -> 'é')."""
    if text is None:
        return None
    value = str(text)
    if any(marker in value for marker in ("Ãƒ", "Ã‚", "â€â„¢", "â€Å“", "â€", "â€â€œ", "â€â€", "â€Â¢")):
        try:
            return value.encode("latin-1").decode("utf-8")
        except (UnicodeEncodeError, UnicodeDecodeError):
            return value
    return value

def safe_html_text(value, default=""):
    """Échappe le texte pour HTML et retourne une valeur par défaut si vide"""
    if not value:
        return default
    return escape(fix_mojibake(str(value)))

def is_valid_http_url(url):
    """Vérifie si l'URL est valide (http ou https)"""
    if not url or not isinstance(url, str):
        return False
    return url.strip().lower().startswith(('http://', 'https://'))

def clean_ai_content(text):
    """Nettoie le contenu généré par l'IA pour l'email client"""
    if not text:
        return ""
    
    cleaned = fix_mojibake(str(text))
    
    # Supprimer les références de type #21, #bien_23, etc.
    cleaned = re.sub(r'#\d+', '', cleaned)
    cleaned = re.sub(r'#bien_\d+', '', cleaned)
    cleaned = re.sub(r'bien #\d+', 'ce bien', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'le #\d+', 'celui-ci', cleaned, flags=re.IGNORECASE)
    
    # Supprimer le markdown **texte** et le remplacer par le texte simple
    cleaned = re.sub(r'\*\*([^*]+)\*\*', r'\1', cleaned)
    
    # Supprimer les _texte_ italique markdown
    cleaned = re.sub(r'_([^_]+)_', r'\1', cleaned)
    
    # Nettoyer les mentions COUP DE CÅ’UR en majuscules agressives
    cleaned = re.sub(r'COUP DE C[OÅ’]UR\s*(POTENTIEL)?', 'Coup de cÅ“ur', cleaned, flags=re.IGNORECASE)
    
    # Supprimer les tirets multiples ou décoratifs
    cleaned = re.sub(r'\s*-{2,}\s*', ' - ', cleaned)
    
    # Nettoyer les espaces multiples
    cleaned = re.sub(r'\s+', ' ', cleaned)
    
    # Nettoyer les espaces en début/fin
    cleaned = cleaned.strip()
    
    # Supprimer les phrases qui font référence à d'autres biens
    cleaned = re.sub(r'[Mm]ême secteur (privilégié )?que.*?,', '', cleaned)
    cleaned = re.sub(r'[Cc]omme (le|ce) bien précédent.*?,', '', cleaned)
    cleaned = re.sub(r'[Ss]imilaire (au|à).*?,', '', cleaned)
    
    return cleaned.strip()

def normalize_points(text):
    """Normalise les points en liste et nettoie le contenu IA"""
    if not text:
        return []
    # Nettoyer d'abord le contenu
    cleaned_text = clean_ai_content(text)
    # Séparer en points
    points = [p.strip().lstrip('- â€¢') for p in cleaned_text.split('\n') if p.strip()]
    # Nettoyer chaque point individuellement
    points = [clean_ai_content(p) for p in points if p.strip()]
    # Filtrer les points vides après nettoyage
    points = [p for p in points if len(p) > 3]
    return points

def format_salutation(full_name):
    """Formate la salutation : Bonjour M./Mme Nom"""
    if not full_name or not full_name.strip():
        return "Madame, Monsieur"
    
    name_parts = full_name.strip().split()
    
    if len(name_parts) == 0:
        return "Madame, Monsieur"
    
    # Si on a un nom composé, prendre le dernier mot comme nom de famille
    if len(name_parts) == 1:
        # Un seul mot : on l'utilise tel quel
        return f"M./Mme {name_parts[0].title()}"
    else:
        # Plusieurs mots : prénom(s) + nom
        # On prend le dernier comme nom de famille
        nom_famille = name_parts[-1].upper()
        return f"M./Mme {nom_famille}"

def generate_email_html(data: EmailRequest) -> str:
    """Génère un email HTML professionnel et personnalisé."""

    raw_name = (data.to_name or "").strip()
    salutation = format_salutation(raw_name)
    bien_type = safe_html_text(data.bien_type, "Bien immobilier")
    bien_ville = safe_html_text(data.bien_ville, "Non précisé")
    bien_prix = safe_html_text(data.bien_prix, "Non précisé")
    bien_surface = safe_html_text(data.bien_surface, "Non précisée")
    bien_pieces = safe_html_text(data.bien_pieces, "")

    logo_url = os.getenv("EMAIL_LOGO_URL", "").strip()
    has_logo = is_valid_http_url(logo_url)
    safe_logo_url = escape(logo_url) if has_logo else ""

    image_url = (data.bien_image_url or "").strip()
    has_image = is_valid_http_url(image_url)
    safe_image_url = escape(image_url) if has_image else ""

    annonce_url = (data.lien_annonce or "").strip()
    has_annonce = is_valid_http_url(annonce_url)
    safe_annonce_url = escape(annonce_url) if has_annonce else ""

    default_intro = "Suite à notre échange, j'ai identifié un bien qui pourrait vous intéresser. Voici pourquoi je pense qu'il mérite votre attention."
    intro_text = fix_mojibake((data.custom_intro or "").strip()) or default_intro

    default_conclusion = "Ce bien vous intéresse ? N'hésitez pas à me contacter pour organiser une visite ou obtenir plus d'informations."
    conclusion_text = fix_mojibake((data.custom_conclusion or "").strip()) or default_conclusion

    # Points forts avec puces vertes (nettoyés)
    points_forts = normalize_points(data.points_forts)
    if points_forts:
        items = "".join(f'''<tr>
          <td style="padding:5px 0;vertical-align:top;width:20px;"><span style="color:#10B981;font-size:10px;">●</span></td>
          <td style="padding:5px 0 5px 8px;color:#374151;font-size:14px;line-height:1.5;">{safe_html_text(point)}</td>
        </tr>''' for point in points_forts)
        points_forts_block = f"""
        <div style="margin-bottom:16px;">
          <p style="margin:0 0 8px 0;font-size:13px;font-weight:600;color:#059669;">Ce qui correspond à votre recherche</p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">{items}</table>
        </div>
        """
    else:
        points_forts_block = ""

    # Points d'attention avec puces orange (nettoyés)
    points_attention = normalize_points(data.points_attention)
    points_attention_block = ""
    recommandation_block = ""
    # Section analyse personnalisée (si au moins un élément)
    if points_forts_block:
        analyse_block = f"""
        <tr>
          <td style="padding:0 40px 24px 40px;">
            <div style="background:#FAFAFA;border-radius:12px;padding:20px;border:1px solid #E5E7EB;">
              <p style="margin:0 0 16px 0;font-size:15px;font-weight:700;color:#1E3A5F;">Pourquoi ce bien pour vous ?</p>
              {points_forts_block}


            </div>
          </td>
        </tr>
        """
    else:
        analyse_block = ""

    # Logo block
    if has_logo:
        logo_block = f"""
        <tr>
          <td style="padding:28px 40px;background:#FFFFFF;border-bottom:1px solid #E5E7EB;">
            <img src="{safe_logo_url}" alt="Saint François Immobilier" height="45"
                 style="display:block;border:0;height:45px;width:auto;" />
          </td>
        </tr>
        """
    else:
        logo_block = """
        <tr>
          <td style="padding:28px 40px;background:#FFFFFF;border-bottom:1px solid #E5E7EB;">
            <p style="margin:0;font-size:20px;font-weight:700;color:#1E3A5F;">Saint François Immobilier</p>
          </td>
        </tr>
        """

    # Image block
    if has_image:
        image_block = f"""
        <tr>
          <td style="padding:0 40px 24px 40px;">
            <img src="{safe_image_url}" alt="{bien_type} à {bien_ville}" width="520"
                 style="display:block;width:100%;max-width:520px;height:auto;border:0;border-radius:12px;" />
          </td>
        </tr>
        """
    else:
        image_block = ""

    # CTA block
    if has_annonce:
        cta_block = f"""
        <tr>
          <td align="center" style="padding:8px 40px 32px 40px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background:#1E3A5F;border-radius:8px;">
                  <a href="{safe_annonce_url}" target="_blank" rel="noopener noreferrer"
                     style="display:inline-block;padding:14px 36px;color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:600;">
                    Découvrir ce bien
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        """
    else:
        cta_block = ""

    # Pièces row
    pieces_row = ""
    if bien_pieces:
        pieces_row = f"""
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #F3F4F6;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="color:#6B7280;font-size:14px;">Pièces</td>
                <td align="right" style="color:#111827;font-size:14px;font-weight:600;">{bien_pieces}</td>
              </tr>
            </table>
          </td>
        </tr>
        """

    html = f"""<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>Proposition immobilière</title>
</head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F3F4F6;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
               style="width:100%;max-width:600px;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          
          {logo_block}
          
          <!-- Header Band -->
          <tr>
            <td style="background:linear-gradient(135deg,#1E3A5F 0%,#2D5A8A 100%);padding:22px 40px;">
              <p style="margin:0;color:#FFFFFF;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;">
                Sélectionné pour vous
              </p>
            </td>
          </tr>
          
          <!-- Intro -->
          <tr>
            <td style="padding:32px 40px 24px 40px;">
              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#374151;">
                Bonjour {safe_html_text(salutation)},
              </p>
              <p style="margin:0;font-size:15px;line-height:1.6;color:#374151;">
                {safe_html_text(intro_text)}
              </p>
            </td>
          </tr>
          
          <!-- Property Card -->
          <tr>
            <td style="padding:0 40px 24px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="background:#1E3A5F;padding:18px 24px;">
                    <p style="margin:0;color:#FFFFFF;font-size:18px;font-weight:600;">
                      {bien_type} à {bien_ville}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding:12px 0;border-bottom:1px solid #F3F4F6;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="color:#6B7280;font-size:14px;">Prix</td>
                              <td align="right" style="color:#1E3A5F;font-size:20px;font-weight:700;">{bien_prix}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;border-bottom:1px solid #F3F4F6;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="color:#6B7280;font-size:14px;">Surface</td>
                              <td align="right" style="color:#111827;font-size:14px;font-weight:600;">{bien_surface}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      {pieces_row}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          {image_block}
          
          {analyse_block}
          
          {cta_block}
          
          <!-- Closing -->
          <tr>
            <td style="padding:0 40px 32px 40px;">
              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#374151;">
                {safe_html_text(conclusion_text)}
              </p>
              <p style="margin:0;font-size:15px;line-height:1.6;color:#374151;">
                À très bientôt,
              </p>
            </td>
          </tr>
          
          <!-- Signature -->
          <tr>
            <td style="padding:0 40px 32px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-left:3px solid #1E3A5F;padding-left:16px;">
                    <p style="margin:0 0 4px 0;font-size:15px;font-weight:600;color:#111827;">Patricia Philippot</p>
                    <p style="margin:0 0 12px 0;font-size:13px;color:#6B7280;">Conseillère immobilier</p>
                    <p style="margin:0;font-size:13px;line-height:1.8;color:#374151;">
                      140 rue Saint François de Paule, 83600 Fréjus<br />
                      Tél. <a href="tel:0494537819" style="color:#1E3A5F;text-decoration:none;font-weight:500;">04 94 53 78 19</a><br />
                      <a href="mailto:contact@saintfrancoisimmobilier.com" style="color:#1E3A5F;text-decoration:none;">contact@saintfrancoisimmobilier.com</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background:#F9FAFB;padding:20px 40px;border-top:1px solid #E5E7EB;">
              <p style="margin:0;font-size:11px;line-height:1.6;color:#9CA3AF;text-align:center;">
                Vous recevez cet email car vous avez effectué une recherche immobilière auprès de notre agence.<br />
                Pour ne plus recevoir nos propositions, répondez STOP à cet email.
              </p>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>"""
    return fix_mojibake(html)


def generate_email_text(data: EmailRequest) -> str:
    """Génère la version texte de l'email (fallback)"""
    
    salutation = format_salutation(data.to_name)
    default_intro = "Suite à notre échange concernant votre projet immobilier, j'ai le plaisir de vous présenter un bien susceptible de correspondre à vos critères de recherche."
    intro_text = fix_mojibake((data.custom_intro or "").strip()) or default_intro
    default_conclusion = "Ce bien vous intéresse ? N'hésitez pas à me contacter pour organiser une visite ou obtenir plus d'informations."
    conclusion_text = fix_mojibake((data.custom_conclusion or "").strip()) or default_conclusion
    
    # Nettoyer le contenu IA
    points_forts_clean = clean_ai_content(data.points_forts) if data.points_forts else ""
    points_attention_clean = clean_ai_content(data.points_attention) if data.points_attention else ""
    recommandation_clean = clean_ai_content(data.recommandation) if data.recommandation else ""
    
    text = f"""Bonjour {salutation},

{intro_text}

══════════════════════════════════════════════════════
BIEN PROPOSÉ : {data.bien_type} à {data.bien_ville}
══════════════════════════════════════════════════════

Prix : {data.bien_prix}
Surface : {data.bien_surface or 'Non précisée'}
{f"Pièces : {data.bien_pieces}" if data.bien_pieces else ""}

{f"Ce qui correspond à votre recherche :{chr(10)}{points_forts_clean}" if points_forts_clean else ""}





{f"Voir l'annonce : {data.lien_annonce}" if data.lien_annonce else ""}

══════════════════════════════════════════════════════

{conclusion_text}

À très bientôt,

Patricia Philippot
Conseillère immobilier

SAINT FRANÇOIS IMMOBILIER
140 rue Saint François de Paule, 83600 Fréjus
Tél. 04 94 53 78 19
contact@saintfrancoisimmobilier.com

â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Vous recevez cet email car vous avez effectué une recherche immobilière auprès de notre agence.
Pour ne plus recevoir nos propositions : répondez "STOP" à cet email.
"""
    return fix_mojibake(text)


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
    conn = sqlite3.connect("immomatch.db")
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
    except:
        return None


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def init_db():
    conn = sqlite3.connect("immomatch.db")
    conn.execute('''
        CREATE TABLE IF NOT EXISTS prospects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT,
            nom TEXT,
            mail TEXT,
            telephone TEXT,
            domicile TEXT,
            bien TEXT,
            villes TEXT,
            quartiers TEXT,
            budget_max REAL,
            criteres TEXT,
            etat TEXT,
            expo TEXT,
            stationnement TEXT,
            copro TEXT,
            exterieur TEXT,
            etage TEXT,
            destination TEXT,
            observation TEXT
        )
    ''')


    # Migration : ajouter nom_agence si absent
    try:
        conn.execute("ALTER TABLE biens ADD COLUMN nom_agence TEXT DEFAULT 'SAINT FRANCOIS IMMOBILIER'")
        conn.commit()
    except Exception:
        pass  # Colonne déjà existante

    # Migration : ajouter defauts si absent
    try:
        conn.execute("ALTER TABLE biens ADD COLUMN defauts TEXT")
        conn.commit()
    except Exception:
        pass  # Colonne deja existante

    conn.execute('''
        CREATE TABLE IF NOT EXISTS biens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            reference TEXT,
            type TEXT,
            ville TEXT,
            quartier TEXT,
            prix REAL,
            surface REAL,
            pieces INTEGER,
            chambres INTEGER,
            etat TEXT,
            exposition TEXT,
            stationnement TEXT,
            copropriete TEXT,
            exterieur TEXT,
            etage TEXT,
            description TEXT,
            defauts TEXT,
            date_ajout TEXT,
            nom_agence TEXT DEFAULT 'SAINT FRANCOIS IMMOBILIER'
        )
    ''')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS matchings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            prospect_id INTEGER,
            bien_id INTEGER,
            score INTEGER,
            points_forts TEXT,
            points_attention TEXT,
            recommandation TEXT,
            date_analyse TEXT,
            FOREIGN KEY (prospect_id) REFERENCES prospects(id),
            FOREIGN KEY (bien_id) REFERENCES biens(id)
        )
    ''')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    ''')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT,
            title TEXT,
            message TEXT,
            link TEXT,
            is_read INTEGER DEFAULT 0,
            created_at TEXT
        )
    ''')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            nom TEXT NOT NULL,
            role TEXT DEFAULT 'agent',
            created_at TEXT
        )
    ''')
    conn.commit()
    
    # Settings FTP par défaut
    cursor = conn.cursor()
    default_ftp = [
        ('ftp_host', ''),
        ('ftp_user', ''),
        ('ftp_pass', ''),
        ('ftp_port', '21'),
        ('ftp_path', ''),
        ('sync_interval_hours', '6'),
    ]
    for key, value in default_ftp:
        cursor.execute('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', (key, value))
    conn.commit()
    
    # Ajouter la colonne photos si elle n'existe pas
    try:
        conn.execute('ALTER TABLE biens ADD COLUMN photos TEXT')
        conn.commit()
    except Exception:
        pass
    
    # Ajouter colonnes lien et vendeur
    try:
        conn.execute('ALTER TABLE biens ADD COLUMN lien_annonce TEXT')
        conn.commit()
    except Exception:
        pass
    
    try:
        conn.execute('ALTER TABLE biens ADD COLUMN vendeur TEXT')
        conn.commit()
    except Exception:
        pass

# APRÈS (CORRECT - tout est indenté pareil)
    
    try:
        conn.execute('ALTER TABLE biens ADD COLUMN vendeur TEXT')
        conn.commit()
    except Exception:
        pass

    # Migration : ajouter colonne date_email_envoye
    # Migration : ajouter colonne date_email_envoye
    try:
        conn.execute('ALTER TABLE matchings ADD COLUMN date_email_envoye TEXT')
        conn.commit()
    except Exception:
        pass

    # Migration : ajouter statut_prospect si absent
    try:
        conn.execute('ALTER TABLE matchings ADD COLUMN statut_prospect TEXT DEFAULT NULL')
        conn.commit()
    except Exception:
        pass

    # Table calibration_feedback
    conn.execute('CREATE TABLE IF NOT EXISTS calibration_feedback (id INTEGER PRIMARY KEY AUTOINCREMENT, matching_id INTEGER, pertinent INTEGER, score_avis TEXT, commentaire TEXT, created_at TEXT)')
    conn.commit()

    # Migration : nouvelles colonnes biens (détails Hektor)
    nouvelles_colonnes = [
        ('etage_bien',          'INTEGER'),   # col[23]
        ('nb_etages_immeuble',  'INTEGER'),   # col[24]
        ('ascenseur',           'INTEGER'),   # col[25] OUI/NON → 1/0
        ('cave',                'INTEGER'),   # col[41] OUI/NON → 1/0
        ('nb_parkings',         'INTEGER'),   # col[42]
        ('nb_boxes',            'INTEGER'),   # col[43]
        ('terrasse',            'INTEGER'),   # col[40] OUI/NON → 1/0
        ('nb_balcons',          'INTEGER'),   # col[39]
        ('orientation_sud',     'INTEGER'),   # col[35] OUI/NON → 1/0
        ('orientation_est',     'INTEGER'),   # col[36] OUI/NON → 1/0
        ('orientation_ouest',   'INTEGER'),   # col[37] OUI/NON → 1/0
        ('orientation_nord',    'INTEGER'),   # col[38] OUI/NON → 1/0
        ('charges_mensuelles',  'REAL'),      # col[23] charges
        ('dpe_lettre',          'TEXT'),      # col[176]
        ('dpe_kwh',             'INTEGER'),   # col[177]
        ('ges_lettre',          'TEXT'),      # col[178]
        ('ges_co2',             'INTEGER'),   # col[179]
        ('latitude',            'REAL'),      # col[297]
        ('longitude',           'REAL'),      # col[298]
    ]
    for col_name, col_type in nouvelles_colonnes:
        try:
            conn.execute(f'ALTER TABLE biens ADD COLUMN {col_name} {col_type}')
            conn.commit()
        except Exception:
            pass  # La colonne existe déjà, on ignore

    conn.close()

init_db()

def prefiltre_biens(client, biens, budget_min_tolerance=50, budget_max_tolerance=130):
    """
    Préfiltre les biens pour ne garder que les candidats potentiels.
    - Exclut les biens de zones géographiques trop éloignées
    - Ajoute un flag 'hors_secteur' pour les biens dans des villes proches mais différentes
    """
    candidats = []
    
    # Définir les zones géographiques (villes proches entre elles)
    zones_geographiques = [
        # Zone Fréjus / Saint-Raphaël / Estérel
        ["frejus", "fréjus", "saint-raphael", "saint-raphaël", "st-raphael", "st raphael", 
         "roquebrune-sur-argens", "roquebrune sur argens", "puget-sur-argens", "puget sur argens",
         "saint-aygulf", "st-aygulf", "le muy", "les adrets", "bagnols-en-foret", "bagnols en foret",
         "les adrets-de-l'esterel", "adrets de l'esterel"],
        # Zone Cannes / Antibes / Grasse
        ["cannes", "antibes", "grasse", "mougins", "le cannet", "mandelieu", "vallauris", 
         "valbonne", "biot", "villeneuve-loubet", "cagnes-sur-mer"],
        # Zone Nice / Monaco
        ["nice", "monaco", "menton", "villefranche-sur-mer", "beaulieu-sur-mer", "eze", 
         "cap-d'ail", "roquebrune-cap-martin", "la trinite", "saint-laurent-du-var"],
        # Zone Toulon / Hyères
        ["toulon", "hyeres", "hyères", "la seyne-sur-mer", "six-fours", "sanary", 
         "bandol", "le pradet", "carqueiranne", "la garde"],
        # Zone Draguignan / Var intérieur
        ["draguignan", "lorgues", "vidauban", "trans-en-provence", "flayosc", 
         "taradeau", "les arcs", "le thoronet"],
        # Zone Marseille / Aix
        ["marseille", "aix-en-provence", "aix en provence", "cassis", "la ciotat", 
         "aubagne", "gardanne", "vitrolles", "martigues", "istres"],
        # Zone Avignon / Cavaillon
        ["avignon", "cavaillon", "carpentras", "orange", "apt", "l'isle-sur-la-sorgue",
         "isle sur la sorgue", "pertuis", "gordes", "roussillon"]
    ]
    
    def trouver_zone(ville):
        """Trouve la zone géographique d'une ville"""
        ville_clean = ville.lower().strip().replace('é', 'e').replace('è', 'e').replace('ë', 'e')
        for i, zone in enumerate(zones_geographiques):
            for v in zone:
                v_clean = v.replace('é', 'e').replace('è', 'e')
                if v_clean in ville_clean or ville_clean in v_clean:
                    return i
        return -1  # Zone inconnue
    
    def villes_meme_zone(ville1, ville2):
        """Vérifie si deux villes sont dans la même zone géographique"""
        zone1 = trouver_zone(ville1)
        zone2 = trouver_zone(ville2)
        # Si une des zones est inconnue, on accepte (on laisse Claude décider)
        if zone1 == -1 or zone2 == -1:
            return True
        return zone1 == zone2
    
    villes_client = []
    zones_client = set()
    if client.get("ville"):
        villes_raw = client["ville"].lower().strip()
        villes_client = [v.strip() for v in villes_raw.replace(';', ',').split(',')]
        # Identifier toutes les zones recherchées par le client
        for v in villes_client:
            zone = trouver_zone(v)
            if zone != -1:
                zones_client.add(zone)
    
    for bien in biens:
        exclu = False
        hors_secteur = False
        
        # Filtre budget (très souple)
        if client.get("budget") and bien.get("prix"):
            budget_max_tolere = client["budget"] * (budget_max_tolerance / 100)
            if bien["prix"] > budget_max_tolere:
                exclu = True
        
        # Filtre géographique
        if villes_client and bien.get("ville") and not exclu:
            ville_bien = bien["ville"].lower().strip()
            zone_bien = trouver_zone(ville_bien)
            
            # Si "tous secteurs" ou "tous", on garde tout
            if any("tous" in v for v in villes_client):
                hors_secteur = False
            # Si le bien est dans une zone complètement différente â†’ EXCLURE
            elif zone_bien != -1 and zones_client and zone_bien not in zones_client:
                exclu = True  # Trop loin, on exclut complètement
            else:
                # Le bien est dans une zone acceptable, vérifier si c'est la ville exacte
                ville_bien_clean = ville_bien.replace('é', 'e').replace('è', 'e').replace('ë', 'e')
                dans_secteur = False
                
                for ville_recherchee in villes_client:
                    ville_recherchee_clean = ville_recherchee.replace('é', 'e').replace('è', 'e').replace('ë', 'e')
                    if (ville_recherchee_clean in ville_bien_clean or 
                        ville_bien_clean in ville_recherchee_clean or
                        (ville_recherchee_clean.startswith('st ') and ville_bien_clean.startswith('saint')) or
                        (ville_recherchee_clean.startswith('st-') and ville_bien_clean.startswith('saint'))):
                        dans_secteur = True
                        break
                
                hors_secteur = not dans_secteur
        
        if not exclu:
            bien_copy = bien.copy()
            bien_copy['hors_secteur'] = hors_secteur
            candidats.append(bien_copy)
    
    return candidats

def get_settings_values():
    """Charge les settings depuis la base de données"""
    conn = sqlite3.connect("immomatch.db")
    conn.row_factory = sqlite3.Row
    
    # Valeurs par défaut
    settings = {
        'model': 'claude-sonnet-4-20250514',
        'max_biens_par_prospect': 5,
        'budget_tolerance_min': 70,
        'budget_tolerance_max': 120,
        'ftp_host': '',
        'ftp_user': '',
        'ftp_pass': '',
        'ftp_port': '21',
        'ftp_path': '',
        'sync_interval_hours': '6'
    }
    
    rows = conn.execute("SELECT key, value FROM settings").fetchall()
    conn.close()
    
    for row in rows:
        key = row['key']
        value = row['value']
        
        # Met à jour toutes les clés trouvées en base
        try:
            settings[key] = json.loads(value)
        except (json.JSONDecodeError, TypeError):
            settings[key] = value
    
    print(f"ðŸ”§ Settings chargés: model={settings['model']}, max_biens={settings['max_biens_par_prospect']}, budget={settings['budget_tolerance_min']}-{settings['budget_tolerance_max']}%")
    
    return settings

# ========== SYNC HEKTOR FTP ==========

import zipfile

def sync_hektor_ftp():
    """Synchronise les biens depuis le FTP Hektor (supporte ZIP)"""
    settings = get_settings_values()
    
    ftp_host = settings.get('ftp_host', '')
    ftp_user = settings.get('ftp_user', '')
    ftp_pass = settings.get('ftp_pass', '')
    ftp_port = int(settings.get('ftp_port', 21))
    ftp_path = settings.get('ftp_path', '')
    
    if not all([ftp_host, ftp_user, ftp_pass, ftp_path]):
        print("âš ï¸ Sync FTP : Configuration incomplète")
        return {"error": "Configuration FTP incomplète"}
    
    print(f"ðŸ”„ Sync Hektor : Connexion à {ftp_host}...")
    
    try:
        # Connexion FTP
        ftp = ftplib.FTP()
        ftp.connect(ftp_host, ftp_port, timeout=30)
        ftp.login(ftp_user, ftp_pass)
        print("ðŸ“¡ Connecté au FTP")
        
        # Télécharger le fichier
        is_zip = ftp_path.lower().endswith('.zip')
        local_file = "hektor_download.zip" if is_zip else "Annonces_hektor.csv"
        
        with open(local_file, "wb") as f:
            ftp.retrbinary(f"RETR {ftp_path}", f.write)
        
        ftp.quit()
        print(f"âœ… Fichier téléchargé : {local_file}")
        
        # Si c'est un ZIP, extraire Annonces.csv
        csv_file = "Annonces_hektor.csv"
        if is_zip:
            print("ðŸ“¦ Extraction du ZIP...")
            with zipfile.ZipFile(local_file, 'r') as zip_ref:
                # Chercher Annonces.csv dans le ZIP
                csv_found = None
                for name in zip_ref.namelist():
                    if 'annonces' in name.lower() and name.lower().endswith('.csv'):
                        csv_found = name
                        break
                
                if not csv_found:
                    # Lister les fichiers disponibles
                    files = zip_ref.namelist()
                    print(f"âš ï¸ Fichiers dans le ZIP : {files}")
                    return {"error": f"Annonces.csv non trouvé dans le ZIP. Fichiers disponibles: {files}"}
                
                # Extraire le fichier CSV
                with zip_ref.open(csv_found) as zf:
                    with open(csv_file, 'wb') as f:
                        f.write(zf.read())
                print(f"âœ… Extrait : {csv_found}")
        
        # Lire et importer le CSV
        with open(csv_file, "r", encoding="latin-1") as f:
            text = f.read()
        
        lines = text.strip().split("\n")
        
        conn = sqlite3.connect("immomatch.db")
        cursor = conn.cursor()
        
        imported = 0
        updated = 0
        skipped = 0
        
        for line in lines:
            cols = line.split('!#')
            cols = [c.strip().strip('"') for c in cols]
            
            if len(cols) < 25:
                skipped += 1
                continue
            
            d = parse_hektor_cols(cols)
            
            if d["transaction"].lower() != "vente":
                skipped += 1
                continue
            
            existing = cursor.execute("SELECT id FROM biens WHERE reference = ?", (d["reference"],)).fetchone()
            
            if existing:
                cursor.execute('''
                    UPDATE biens SET
                        type=?, ville=?, quartier=?, prix=?, surface=?, pieces=?, chambres=?,
                        description=?, photos=?, vendeur=?, lien_annonce=?,
                        etage_bien=?, nb_etages_immeuble=?, ascenseur=?, cave=?,
                        nb_parkings=?, nb_boxes=?, terrasse=?, nb_balcons=?,
                        orientation_sud=?, orientation_est=?, orientation_ouest=?, orientation_nord=?,
                        dpe_lettre=?, dpe_kwh=?, ges_lettre=?, ges_co2=?,
                        latitude=?, longitude=?, date_ajout=?, nom_agence=?
                    WHERE reference=?
                ''', (
                    d["type_bien"], d["ville"], d["adresse"], d["prix"], d["surface"],
                    d["pieces"], d["chambres"], d["description"], d["photos_str"],
                    d["vendeur"], "",
                    d["etage_bien"], d["nb_etages_immeuble"], d["ascenseur"], d["cave"],
                    d["nb_parkings"], d["nb_boxes"], d["terrasse"], d["nb_balcons"],
                    d["orientation_sud"], d["orientation_est"], d["orientation_ouest"], d["orientation_nord"],
                    d["dpe_lettre"], d["dpe_kwh"], d["ges_lettre"], d["ges_co2"],
                    d["latitude"], d["longitude"], datetime.now().isoformat(),
                    d["nom_agence"],
                    d["reference"]
                ))
                updated += 1
            else:
                cursor.execute('''
                    INSERT INTO biens (
                        reference, type, ville, quartier, prix, surface, pieces, chambres,
                        description, photos, vendeur, lien_annonce,
                        etage_bien, nb_etages_immeuble, ascenseur, cave,
                        nb_parkings, nb_boxes, terrasse, nb_balcons,
                        orientation_sud, orientation_est, orientation_ouest, orientation_nord,
                        dpe_lettre, dpe_kwh, ges_lettre, ges_co2,
                        latitude, longitude, date_ajout, nom_agence
                    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                ''', (
                    d["reference"], d["type_bien"], d["ville"], d["adresse"], d["prix"], d["surface"],
                    d["pieces"], d["chambres"], d["description"], d["photos_str"],
                    d["vendeur"], "",
                    d["etage_bien"], d["nb_etages_immeuble"], d["ascenseur"], d["cave"],
                    d["nb_parkings"], d["nb_boxes"], d["terrasse"], d["nb_balcons"],
                    d["orientation_sud"], d["orientation_est"], d["orientation_ouest"], d["orientation_nord"],
                    d["dpe_lettre"], d["dpe_kwh"], d["ges_lettre"], d["ges_co2"],
                    d["latitude"], d["longitude"], datetime.now().isoformat(),
                    d["nom_agence"]
                ))
                imported += 1
        
        conn.commit()
        
        # Sauvegarder la date de dernière sync
        cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", 
                      ("last_hektor_sync", datetime.now().isoformat()))
        conn.commit()
        
        # Créer une notification si nouveaux biens
        if imported > 0:
            conn.execute('''
                INSERT INTO notifications (type, title, message, link, created_at)
                VALUES (?, ?, ?, ?, ?)
            ''', (
                'sync',
                'Sync Hektor terminée',
                f'{imported} nouveau(x) bien(s) importé(s), {updated} mis à jour',
                '/biens',
                datetime.now().isoformat()
            ))
            conn.commit()
        
        conn.close()
        
        print(f"ðŸ“Š Import : {imported} nouveaux, {updated} mis à jour, {skipped} ignorés")
        return {"success": True, "imported": imported, "updated": updated, "skipped": skipped}
        
    except Exception as e:
        print(f"âŒ Erreur sync : {e}")
        return {"error": str(e)}

# Scheduler global
scheduler = BackgroundScheduler()
scheduler_started = False

def start_scheduler():
    global scheduler_started
    if not scheduler_started:
        settings = get_settings_values()
        interval = int(settings.get('sync_interval_hours', 12))
        
        # Ajouter la tâche de sync
        scheduler.add_job(sync_hektor_ftp, 'interval', hours=interval, id='hektor_sync', replace_existing=True, next_run_time=datetime.now())
        scheduler.start()
        scheduler_started = True
        print(f"â° Scheduler démarré (sync toutes les {interval}h)")


@app.on_event("startup")
async def startup_event():
    """Démarre le scheduler au lancement de l'app"""
    start_scheduler()


@app.get("/")
def accueil():
    return {"message": "API ImmoMatch OK"}


# ============================================================
# ROUTES AUTHENTIFICATION
# ============================================================

@app.post("/auth/register", response_model=TokenResponse)
def register(user_data: UserRegister):
    """Créer un nouveau compte"""
    conn = sqlite3.connect("immomatch.db")
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


@app.post("/auth/login", response_model=TokenResponse)
def login(user_data: UserLogin):
    """Connexion - retourne un token"""
    conn = sqlite3.connect("immomatch.db")
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


@app.get("/auth/me", response_model=UserResponse)
def get_me(current_user: dict = Depends(get_current_user)):
    """Récupère les infos de l'utilisateur connecté"""
    return current_user


@app.post("/auth/change-password")
def change_password(data: dict, current_user: dict = Depends(get_current_user)):
    """Changer le mot de passe"""
    old_password = data.get("old_password")
    new_password = data.get("new_password")
    
    if not old_password or not new_password:
        raise HTTPException(status_code=400, detail="Mots de passe requis")
    
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Le nouveau mot de passe doit contenir au moins 6 caractères")
    
    conn = sqlite3.connect("immomatch.db")
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


@app.post("/sync-hektor")
def trigger_sync():
    """Déclenche une synchronisation manuelle"""
    result = sync_hektor_ftp()
    return result


@app.get("/sync-status")
def sync_status():
    """Retourne le statut de la dernière synchronisation"""
    conn = sqlite3.connect("immomatch.db")
    cursor = conn.cursor()
    last_sync = cursor.execute("SELECT value FROM settings WHERE key = 'last_hektor_sync'").fetchone()
    interval = cursor.execute("SELECT value FROM settings WHERE key = 'sync_interval_hours'").fetchone()
    conn.close()

    next_run = None
    if scheduler_started:
        try:
            job = scheduler.get_job('hektor_sync')
            if job and job.next_run_time:
                next_run = job.next_run_time.isoformat()
        except Exception:
            pass

    return {
        "last_sync": last_sync[0] if last_sync else None,
        "next_sync": next_run,
        "interval_hours": int(interval[0]) if interval else 6,
        "scheduler_running": scheduler_started
    }


@app.get("/ftp-browse")
def ftp_browse(path: str = "/"):
    """Explore le contenu d'un dossier FTP"""
    settings = get_settings_values()
    
    ftp_host = settings.get('ftp_host', '')
    ftp_user = settings.get('ftp_user', '')
    ftp_pass = settings.get('ftp_pass', '')
    ftp_port = int(settings.get('ftp_port', 21))
    
    if not all([ftp_host, ftp_user, ftp_pass]):
        return {"error": "Configuration FTP incomplète"}
    
    try:
        ftp = ftplib.FTP()
        ftp.connect(ftp_host, ftp_port, timeout=30)
        ftp.login(ftp_user, ftp_pass)
        
        # Lister le contenu
        ftp.cwd(path)
        files = ftp.nlst()
        
        ftp.quit()
        
        return {"path": path, "files": files}
        
    except Exception as e:
        return {"error": str(e)}


@app.get("/prospects")
def get_prospects():
    conn = sqlite3.connect("immomatch.db")
    conn.row_factory = sqlite3.Row
    cursor = conn.execute("SELECT * FROM prospects")
    prospects = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return prospects

@app.get("/notifications")
def get_notifications():
    conn = sqlite3.connect("immomatch.db")
    conn.row_factory = sqlite3.Row
    
    notifications = conn.execute('''
        SELECT * FROM notifications 
        ORDER BY created_at DESC 
        LIMIT 20
    ''').fetchall()
    
    unread_count = conn.execute('SELECT COUNT(*) FROM notifications WHERE is_read = 0').fetchone()[0]
    
    conn.close()
    
    return {
        "notifications": [dict(n) for n in notifications],
        "unread_count": unread_count
    }

@app.post("/notifications/mark-read")
def mark_notifications_read():
    conn = sqlite3.connect("immomatch.db")
    conn.execute('UPDATE notifications SET is_read = 1 WHERE is_read = 0')
    conn.commit()
    conn.close()
    return {"success": True}

@app.post("/notifications/add")
def add_notification(notif: dict):
    conn = sqlite3.connect("immomatch.db")
    conn.execute('''
        INSERT INTO notifications (type, title, message, link, created_at)
        VALUES (?, ?, ?, ?, ?)
    ''', (
        notif.get('type'),
        notif.get('title'),
        notif.get('message'),
        notif.get('link'),
        datetime.now().isoformat()
    ))
    conn.commit()
    conn.close()
    return {"success": True}

@app.delete("/notifications/clear")
def clear_notifications():
    conn = sqlite3.connect("immomatch.db")
    conn.execute('DELETE FROM notifications')
    conn.commit()
    conn.close()
    return {"success": True}

@app.post("/prospects/import")
async def import_prospects(file: UploadFile = File(...)):
    contents = await file.read()
    df = pd.read_excel(BytesIO(contents), sheet_name="Prospects")
    df.columns = df.columns.str.strip()
    
    conn = sqlite3.connect("immomatch.db")
    conn.execute("DELETE FROM prospects")
    
    for _, row in df.iterrows():
        conn.execute('''
            INSERT INTO prospects (date, nom, mail, telephone, domicile, bien, villes, quartiers, budget_max, criteres, etat, expo, stationnement, copro, exterieur, etage, destination, observation)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            str(row.get('Date', '')) if pd.notna(row.get('Date')) else None,
            row.get('Nom') if pd.notna(row.get('Nom')) else None,
            row.get('Mail') if pd.notna(row.get('Mail')) else None,
            row.get('Téléphone') if pd.notna(row.get('Téléphone')) else None,
            row.get('Domicile') if pd.notna(row.get('Domicile')) else None,
            row.get('Bien') if pd.notna(row.get('Bien')) else None,
            row.get('Villes') if pd.notna(row.get('Villes')) else None,
            row.get('Quartiers') if pd.notna(row.get('Quartiers')) else None,
            row.get('Budget max') if pd.notna(row.get('Budget max')) else None,
            row.get('Critères') if pd.notna(row.get('Critères')) else None,
            row.get('Etat') if pd.notna(row.get('Etat')) else None,
            row.get('Expo') if pd.notna(row.get('Expo')) else None,
            row.get('Stationne.') if pd.notna(row.get('Stationne.')) else None,
            row.get('Copro') if pd.notna(row.get('Copro')) else None,
            row.get('Extérieur') if pd.notna(row.get('Extérieur')) else None,
            row.get('Etage') if pd.notna(row.get('Etage')) else None,
            row.get('Destination') if pd.notna(row.get('Destination')) else None,
            row.get('Observation') if pd.notna(row.get('Observation')) else None,
        ))
    
    conn.commit()
    conn.close()
    return {"message": f"{len(df)} prospects importés"}

@app.post("/prospects/add")
def add_prospect(prospect: dict):
    conn = sqlite3.connect("immomatch.db")
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO prospects (date, nom, mail, telephone, domicile, bien, villes, quartiers, budget_max, criteres, etat, expo, stationnement, copro, exterieur, etage, destination, observation)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        datetime.now().strftime("%Y-%m-%d"),
        prospect.get('nom'),
        prospect.get('mail'),
        prospect.get('telephone'),
        prospect.get('domicile'),
        prospect.get('bien'),
        prospect.get('villes'),
        prospect.get('quartiers'),
        prospect.get('budget_max'),
        prospect.get('criteres'),
        prospect.get('etat'),
        prospect.get('expo'),
        prospect.get('stationnement'),
        prospect.get('copro'),
        prospect.get('exterieur'),
        prospect.get('etage'),
        prospect.get('destination'),
        prospect.get('observation')
    ))
    
    prospect_id = cursor.lastrowid
    
    conn.commit()
    conn.close()
    
    return {"message": "Prospect ajouté avec succès", "id": prospect_id}

@app.put("/prospects/{prospect_id}")
def update_prospect(prospect_id: int, prospect: dict):
    conn = sqlite3.connect("immomatch.db")
    
    # Vérifier si le prospect existe
    existing = conn.execute("SELECT id FROM prospects WHERE id = ?", (prospect_id,)).fetchone()
    if not existing:
        conn.close()
        return {"error": "Prospect non trouvé"}
    
    conn.execute('''
        UPDATE prospects SET
            nom = ?, mail = ?, telephone = ?, domicile = ?, bien = ?, villes = ?,
            quartiers = ?, budget_max = ?, criteres = ?, etat = ?, expo = ?,
            stationnement = ?, copro = ?, exterieur = ?, etage = ?, destination = ?, observation = ?
        WHERE id = ?
    ''', (
        prospect.get('nom'),
        prospect.get('mail'),
        prospect.get('telephone'),
        prospect.get('domicile'),
        prospect.get('bien'),
        prospect.get('villes'),
        prospect.get('quartiers'),
        prospect.get('budget_max'),
        prospect.get('criteres'),
        prospect.get('etat'),
        prospect.get('expo'),
        prospect.get('stationnement'),
        prospect.get('copro'),
        prospect.get('exterieur'),
        prospect.get('etage'),
        prospect.get('destination'),
        prospect.get('observation'),
        prospect_id
    ))
    
    conn.commit()
    conn.close()
    return {"message": "Prospect mis à jour"}

@app.delete("/prospects/{prospect_id}")
def delete_prospect(prospect_id: int):
    conn = sqlite3.connect("immomatch.db")
    
    # Supprimer les matchings associés
    conn.execute("DELETE FROM matchings WHERE prospect_id = ?", (prospect_id,))
    # Supprimer le prospect
    conn.execute("DELETE FROM prospects WHERE id = ?", (prospect_id,))
    
    conn.commit()
    conn.close()
    return {"message": "Prospect supprimé"}

@app.get("/settings")
def get_settings():
    conn = sqlite3.connect("immomatch.db")
    conn.row_factory = sqlite3.Row
    cursor = conn.execute("SELECT key, value FROM settings")
    rows = cursor.fetchall()
    conn.close()
    
    settings = {}
    for row in rows:
        try:
            settings[row['key']] = json.loads(row['value'])
        except:
            settings[row['key']] = row['value']
    
    return settings

@app.post("/settings")
def save_settings(settings: dict):
    conn = sqlite3.connect("immomatch.db")
    
    for key, value in settings.items():
        value_str = json.dumps(value) if not isinstance(value, str) else value
        conn.execute('''
            INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)
        ''', (key, value_str))
    
    conn.commit()
    conn.close()
    # Mettre a jour le scheduler si l intervalle a change
    if 'sync_interval_hours' in settings and scheduler_started:
        try:
            new_interval = int(settings['sync_interval_hours'])
            scheduler.reschedule_job('hektor_sync', trigger='interval', hours=new_interval)
            print(f'Scheduler mis a jour : sync toutes les {new_interval}h')
        except Exception as e:
            print(f'Erreur mise a jour scheduler : {e}')

    return {"message": "Paramètres sauvegardés"}

@app.get("/export-all")
def export_all():
    conn = sqlite3.connect("immomatch.db")
    
    # Charger les données
    prospects_df = pd.read_sql_query("SELECT * FROM prospects", conn)
    biens_df = pd.read_sql_query("SELECT * FROM biens", conn)
    matchings_df = pd.read_sql_query('''
        SELECT m.id, m.prospect_id, m.bien_id, m.score, m.points_forts, m.points_attention, m.recommandation, m.date_analyse,
               p.nom as prospect_nom, p.budget_max as prospect_budget,
               b.type as bien_type, b.ville as bien_ville, b.prix as bien_prix
        FROM matchings m
        JOIN prospects p ON m.prospect_id = p.id
        JOIN biens b ON m.bien_id = b.id
        ORDER BY m.score DESC
    ''', conn)
    conn.close()
    
    # Créer le fichier Excel
    export_path = f"immomatch_export_{datetime.now().strftime('%Y-%m-%d_%H-%M')}.xlsx"
    
    with pd.ExcelWriter(export_path, engine='openpyxl') as writer:
        prospects_df.to_excel(writer, sheet_name='Prospects', index=False)
        biens_df.to_excel(writer, sheet_name='Biens', index=False)
        matchings_df.to_excel(writer, sheet_name='Matchings', index=False)
    
    return FileResponse(
        export_path,
        filename=export_path,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )

@app.post("/reset-database")
def reset_database():
    conn = sqlite3.connect("immomatch.db")
    conn.execute("DELETE FROM matchings")
    conn.execute("DELETE FROM prospects")
    conn.execute("DELETE FROM biens")
    conn.commit()
    conn.close()
    return {"message": "Base de données réinitialisée"}

@app.get("/biens")
def get_biens():
    conn = sqlite3.connect("immomatch.db")
    conn.row_factory = sqlite3.Row
    cursor = conn.execute("SELECT * FROM biens")
    biens = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return biens

@app.post("/biens/import")
async def import_biens(file: UploadFile = File(...)):
    contents = await file.read()
    df = pd.read_excel(BytesIO(contents))
    df.columns = df.columns.str.strip()
    
    conn = sqlite3.connect("immomatch.db")
    conn.execute("DELETE FROM biens")
    
    for _, row in df.iterrows():
        conn.execute('''
            INSERT INTO biens (reference, type, ville, quartier, prix, surface, pieces, chambres, etat, exposition, stationnement, copropriete, exterieur, etage, description, date_ajout)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            row.get('Reference') if pd.notna(row.get('Reference')) else None,
            row.get('Type') if pd.notna(row.get('Type')) else None,
            row.get('Ville') if pd.notna(row.get('Ville')) else None,
            row.get('Quartier') if pd.notna(row.get('Quartier')) else None,
            row.get('Prix') if pd.notna(row.get('Prix')) else None,
            row.get('Surface') if pd.notna(row.get('Surface')) else None,
            row.get('Pieces') if pd.notna(row.get('Pieces')) else None,
            row.get('Chambres') if pd.notna(row.get('Chambres')) else None,
            row.get('Etat') if pd.notna(row.get('Etat')) else None,
            row.get('Exposition') if pd.notna(row.get('Exposition')) else None,
            row.get('Stationnement') if pd.notna(row.get('Stationnement')) else None,
            row.get('Copropriete') if pd.notna(row.get('Copropriete')) else None,
            row.get('Exterieur') if pd.notna(row.get('Exterieur')) else None,
            row.get('Etage') if pd.notna(row.get('Etage')) else None,
            row.get('Description') if pd.notna(row.get('Description')) else None,
            str(row.get('Date')) if pd.notna(row.get('Date')) else None,
        ))
    
    conn.commit()
    conn.close()
    return {"message": f"{len(df)} biens importés"}





def parse_hektor_cols(cols):
    """Extrait toutes les données d'une ligne du CSV Hektor (335 colonnes, sep !#)"""

    def g(i, default=""):
        """Récupère la valeur d'une colonne de façon sécurisée"""
        try:
            return cols[i].strip() if i < len(cols) else default
        except Exception:
            return default

    def to_bool(i):
        """OUI → 1, NON/vide → 0"""
        return 1 if g(i).upper() == "OUI" else 0

    def to_int(i):
        try:
            v = g(i)
            return int(float(v)) if v else None
        except Exception:
            return None

    def to_float(i):
        try:
            v = g(i)
            return float(v) if v else None
        except Exception:
            return None

    def clean_dpe(i):
        """Retourne None si 'VI' (vierge) ou vide"""
        v = g(i)
        return None if (not v or v.upper() == "VI") else v

    # --- Champs de base ---
    reference = g(1)
    transaction = g(2)
    type_bien = g(3).capitalize()
    ville = g(5)
    adresse = g(7)
    prix = to_float(10) or 0
    surface = to_float(15) or 0
    pieces = to_int(17) or 0
    chambres = to_int(18) or 0
    titre = g(19)
    description = g(20).replace("<br>", "\n").replace("  ", " ").strip()

    # --- Nouveaux champs ---
    etage_bien = to_int(23)
    nb_etages_immeuble = to_int(24)
    ascenseur = to_bool(25)
    orientation_sud = to_bool(35)
    orientation_est = to_bool(36)
    orientation_ouest = to_bool(37)
    orientation_nord = to_bool(38)
    nb_balcons = to_int(39)
    terrasse = to_bool(40)
    cave = to_bool(41)
    nb_parkings = to_int(42)
    nb_boxes = to_int(43)
    dpe_lettre = clean_dpe(176)
    dpe_kwh = to_int(177)
    ges_lettre = clean_dpe(178)
    ges_co2 = to_int(179)
    latitude = to_float(297)
    longitude = to_float(298)

    # --- Photos (col 85-93 + 164-173) ---
    photo_indices = list(range(85, 94)) + list(range(164, 174))
    photos = []
    for i in photo_indices:
        v = g(i)
        if v.startswith("http") and any(ext in v.lower() for ext in ["jpg", "jpeg", "png"]):
            photos.append(v)
    photos_str = "|".join(photos[:10])

    # --- Agence (col 105 = nom agence, col 104 = téléphone agence) ---
    # Colonne 105 contient le nom exact de l'agence pour tous les biens du groupement Primmo
    nom_agence = g(105).strip()
    if not nom_agence:
        # Fallback : chercher dans toutes les colonnes
        for i in range(len(cols)):
            if "IMMOBILIER" in cols[i].upper() or "AGENCE" in cols[i].upper():
                nom_agence = cols[i].strip()
                break
    vendeur = nom_agence  # compatibilité avec le champ existant

    # Détecter si le bien appartient à Saint François ou à une agence partenaire
    est_saint_francois = "SAINT FRANCOIS" in nom_agence.upper() or "SAINT-FRANCOIS" in nom_agence.upper()

    return {
        "reference": reference,
        "transaction": transaction,
        "type_bien": type_bien,
        "ville": ville,
        "adresse": adresse,
        "prix": prix,
        "surface": surface,
        "pieces": pieces,
        "chambres": chambres,
        "titre": titre,
        "description": description,
        "photos_str": photos_str,
        "vendeur": vendeur,
        "nom_agence": nom_agence,
        "est_saint_francois": est_saint_francois,
        "etage_bien": etage_bien,
        "nb_etages_immeuble": nb_etages_immeuble,
        "ascenseur": ascenseur,
        "cave": cave,
        "nb_parkings": nb_parkings,
        "nb_boxes": nb_boxes,
        "terrasse": terrasse,
        "nb_balcons": nb_balcons,
        "orientation_sud": orientation_sud,
        "orientation_est": orientation_est,
        "orientation_ouest": orientation_ouest,
        "orientation_nord": orientation_nord,
        "dpe_lettre": dpe_lettre,
        "dpe_kwh": dpe_kwh,
        "ges_lettre": ges_lettre,
        "ges_co2": ges_co2,
        "latitude": latitude,
        "longitude": longitude,
    }


@app.post("/import-hektor")
async def import_hektor(file: UploadFile = File(...)):
    """Import des biens depuis le fichier Hektor (format CSV avec séparateur !#)"""
    try:
        content = await file.read()
        text = content.decode('latin-1')
        lines = text.strip().split('\n')
        
        conn = sqlite3.connect("immomatch.db")
        cursor = conn.cursor()
        
        imported = 0
        updated = 0
        skipped = 0
        
        for line in lines:
            cols = line.split('!#')
            cols = [c.strip().strip('"') for c in cols]
            
            if len(cols) < 25:
                skipped += 1
                continue
            
            d = parse_hektor_cols(cols)
            
            if d["transaction"].lower() != "vente":
                skipped += 1
                continue
            
            existing = cursor.execute("SELECT id FROM biens WHERE reference = ?", (d["reference"],)).fetchone()
            
            if existing:
                cursor.execute('''
                    UPDATE biens SET
                        type=?, ville=?, quartier=?, prix=?, surface=?, pieces=?, chambres=?,
                        description=?, photos=?, vendeur=?, lien_annonce=?,
                        etage_bien=?, nb_etages_immeuble=?, ascenseur=?, cave=?,
                        nb_parkings=?, nb_boxes=?, terrasse=?, nb_balcons=?,
                        orientation_sud=?, orientation_est=?, orientation_ouest=?, orientation_nord=?,
                        dpe_lettre=?, dpe_kwh=?, ges_lettre=?, ges_co2=?,
                        latitude=?, longitude=?, date_ajout=?, nom_agence=?
                    WHERE reference=?
                ''', (
                    d["type_bien"], d["ville"], d["adresse"], d["prix"], d["surface"],
                    d["pieces"], d["chambres"], d["description"], d["photos_str"],
                    d["vendeur"], "",
                    d["etage_bien"], d["nb_etages_immeuble"], d["ascenseur"], d["cave"],
                    d["nb_parkings"], d["nb_boxes"], d["terrasse"], d["nb_balcons"],
                    d["orientation_sud"], d["orientation_est"], d["orientation_ouest"], d["orientation_nord"],
                    d["dpe_lettre"], d["dpe_kwh"], d["ges_lettre"], d["ges_co2"],
                    d["latitude"], d["longitude"], datetime.now().isoformat(),
                    d["nom_agence"],
                    d["reference"]
                ))
                updated += 1
            else:
                cursor.execute('''
                    INSERT INTO biens (
                        reference, type, ville, quartier, prix, surface, pieces, chambres,
                        description, photos, vendeur, lien_annonce,
                        etage_bien, nb_etages_immeuble, ascenseur, cave,
                        nb_parkings, nb_boxes, terrasse, nb_balcons,
                        orientation_sud, orientation_est, orientation_ouest, orientation_nord,
                        dpe_lettre, dpe_kwh, ges_lettre, ges_co2,
                        latitude, longitude, date_ajout, nom_agence
                    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                ''', (
                    d["reference"], d["type_bien"], d["ville"], d["adresse"], d["prix"], d["surface"],
                    d["pieces"], d["chambres"], d["description"], d["photos_str"],
                    d["vendeur"], "",
                    d["etage_bien"], d["nb_etages_immeuble"], d["ascenseur"], d["cave"],
                    d["nb_parkings"], d["nb_boxes"], d["terrasse"], d["nb_balcons"],
                    d["orientation_sud"], d["orientation_est"], d["orientation_ouest"], d["orientation_nord"],
                    d["dpe_lettre"], d["dpe_kwh"], d["ges_lettre"], d["ges_co2"],
                    d["latitude"], d["longitude"], datetime.now().isoformat(),
                    d["nom_agence"]
                ))
                imported += 1
        
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "message": f"Import terminé : {imported} nouveaux biens, {updated} mis à jour, {skipped} ignorés (locations)"
        }
        
    except Exception as e:
        return {"error": str(e)}

@app.post("/biens/add")
def add_bien(bien: dict):
    conn = sqlite3.connect("immomatch.db")
    
    conn.execute('''
        INSERT INTO biens (reference, type, ville, quartier, prix, surface, pieces, chambres, etat, exposition, stationnement, copropriete, exterieur, etage, description, date_ajout)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        bien.get('reference'),
        bien.get('type'),
        bien.get('ville'),
        bien.get('quartier'),
        bien.get('prix'),
        bien.get('surface'),
        bien.get('pieces'),
        bien.get('chambres'),
        bien.get('etat'),
        bien.get('exposition'),
        bien.get('stationnement'),
        bien.get('copropriete'),
        bien.get('exterieur'),
        bien.get('etage'),
        bien.get('description'),
        datetime.now().strftime("%Y-%m-%d")
    ))
    
    conn.commit()
    conn.close()
    return {"message": "Bien ajouté avec succès"}

@app.put("/biens/{bien_id}")
def update_bien(bien_id: int, bien: dict):
    conn = sqlite3.connect("immomatch.db")
    
    # Vérifier si le bien existe
    existing = conn.execute("SELECT id FROM biens WHERE id = ?", (bien_id,)).fetchone()
    if not existing:
        conn.close()
        return {"error": "Bien non trouvé"}
    
    conn.execute('''
        UPDATE biens SET
            reference = ?, type = ?, ville = ?, quartier = ?, prix = ?, surface = ?,
            pieces = ?, chambres = ?, etat = ?, exposition = ?, stationnement = ?,
            copropriete = ?, exterieur = ?, etage = ?, description = ?, defauts = ?
        WHERE id = ?
    ''', (
        bien.get('reference'),
        bien.get('type'),
        bien.get('ville'),
        bien.get('quartier'),
        bien.get('prix'),
        bien.get('surface'),
        bien.get('pieces'),
        bien.get('chambres'),
        bien.get('etat'),
        bien.get('exposition'),
        bien.get('stationnement'),
        bien.get('copropriete'),
        bien.get('exterieur'),
        bien.get('etage'),
        bien.get('description'),
        bien.get('defauts'),
        bien_id
    ))
    
    conn.commit()
    conn.close()
    return {"message": "Bien mis à jour"}

@app.delete("/biens/{bien_id}")
def delete_bien(bien_id: int):
    conn = sqlite3.connect("immomatch.db")
    
    # Supprimer les matchings associés
    conn.execute("DELETE FROM matchings WHERE bien_id = ?", (bien_id,))
    # Supprimer le bien
    conn.execute("DELETE FROM biens WHERE id = ?", (bien_id,))
    
    conn.commit()
    conn.close()
    return {"message": "Bien supprimé"}

@app.get("/matchings")
def get_matchings():
    conn = sqlite3.connect("immomatch.db")
    conn.row_factory = sqlite3.Row
    cursor = conn.execute('''
        SELECT m.*, p.nom as prospect_nom, p.budget_max as prospect_budget, 
               p.mail as prospect_mail, p.telephone as prospect_tel,
               b.type as bien_type, b.ville as bien_ville, b.prix as bien_prix, 
               b.surface as bien_surface, b.pieces as bien_pieces, b.photos as bien_photos
        FROM matchings m
        JOIN prospects p ON m.prospect_id = p.id
        JOIN biens b ON m.bien_id = b.id
        ORDER BY m.score DESC
    ''')
    matchings = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return matchings

@app.get("/stats")
def get_stats():
    conn = sqlite3.connect("immomatch.db")
    conn.row_factory = sqlite3.Row
    
    # Compteurs de base
    nb_prospects = conn.execute("SELECT COUNT(*) as count FROM prospects").fetchone()['count']
    nb_biens = conn.execute("SELECT COUNT(*) as count FROM biens").fetchone()['count']
    nb_matchings = conn.execute("SELECT COUNT(*) as count FROM matchings").fetchone()['count']
    
    # Matchings par score
    excellents = conn.execute("SELECT COUNT(*) as count FROM matchings WHERE score >= 75").fetchone()['count']
    bons = conn.execute("SELECT COUNT(*) as count FROM matchings WHERE score >= 50 AND score < 75").fetchone()['count']
    
    # Budget moyen des prospects
    budget_moy = conn.execute("SELECT AVG(budget_max) as avg FROM prospects WHERE budget_max IS NOT NULL").fetchone()['avg']
    
    # Dernière analyse
    derniere_analyse = conn.execute("SELECT MAX(date_analyse) as date FROM matchings").fetchone()['date']
    
    # Top 5 matchings
    top_matchings = conn.execute('''
        SELECT m.*, p.nom as prospect_nom, p.telephone as prospect_tel, p.mail as prospect_mail,
               b.type as bien_type, b.ville as bien_ville, b.prix as bien_prix
        FROM matchings m
        JOIN prospects p ON m.prospect_id = p.id
        JOIN biens b ON m.bien_id = b.id
        ORDER BY m.score DESC
        LIMIT 5
    ''').fetchall()
    
    # Prospects sans matching
    prospects_sans_matching = conn.execute('''
        SELECT p.* FROM prospects p
        LEFT JOIN matchings m ON p.id = m.prospect_id
        WHERE m.id IS NULL
        LIMIT 5
    ''').fetchall()
    
    # Biens populaires (plus de matchings)
    biens_populaires = conn.execute('''
        SELECT b.*, COUNT(m.id) as nb_matchings, AVG(m.score) as score_moyen
        FROM biens b
        LEFT JOIN matchings m ON b.id = m.bien_id
        GROUP BY b.id
        ORDER BY nb_matchings DESC
        LIMIT 5
    ''').fetchall()
    
    # ── Évolution des scores sur les 10 dernières analyses ──
    evolution = conn.execute('''
        SELECT 
            DATE(date_analyse) as date,
            substr(TIME(date_analyse), 1, 5) as heure,
            ROUND(AVG(score), 1) as score_moyen,
            COUNT(*) as nb_matchings,
            SUM(CASE WHEN score >= 75 THEN 1 ELSE 0 END) as excellents
        FROM matchings
        GROUP BY DATE(date_analyse), substr(TIME(date_analyse), 1, 5)
        ORDER BY date_analyse DESC
        LIMIT 10
    ''').fetchall()
    evolution_list = list(reversed([dict(r) for r in evolution]))

    # ── Distribution des scores (tranches de 10) ──
    dist_raw = conn.execute('''
        SELECT 
            CASE 
                WHEN score >= 90 THEN '90-100'
                WHEN score >= 80 THEN '80-89'
                WHEN score >= 70 THEN '70-79'
                WHEN score >= 60 THEN '60-69'
                WHEN score >= 50 THEN '50-59'
                ELSE '< 50'
            END as tranche,
            COUNT(*) as nb
        FROM matchings
        GROUP BY tranche
        ORDER BY tranche DESC
    ''').fetchall()
    distribution = [dict(r) for r in dist_raw]

    # ── Prospects avec le meilleur score max ──
    top_prospects = conn.execute('''
        SELECT p.nom, p.telephone, p.mail, MAX(m.score) as best_score, COUNT(m.id) as nb_matchings
        FROM prospects p
        JOIN matchings m ON p.id = m.prospect_id
        GROUP BY p.id
        ORDER BY best_score DESC
        LIMIT 5
    ''').fetchall()

    # ── Faibles : matchings < 50 (prospects difficiles à matcher) ──
    faibles = conn.execute("SELECT COUNT(*) as count FROM matchings WHERE score < 50").fetchone()['count']

    # ── Score moyen global ──
    score_global = conn.execute("SELECT ROUND(AVG(score),1) as avg FROM matchings").fetchone()['avg'] or 0

    conn.close()

    return {
        "nb_prospects": nb_prospects,
        "nb_biens": nb_biens,
        "nb_matchings": nb_matchings,
        "excellents": excellents,
        "bons": bons,
        "faibles": faibles,
        "budget_moyen": round(budget_moy) if budget_moy else 0,
        "score_global": float(score_global),
        "derniere_analyse": derniere_analyse,
        "top_matchings": [dict(row) for row in top_matchings],
        "prospects_sans_matching": [dict(row) for row in prospects_sans_matching],
        "biens_populaires": [dict(row) for row in biens_populaires],
        "evolution": evolution_list,
        "distribution": distribution,
        "top_prospects": [dict(r) for r in top_prospects],
    }

@app.get("/historique")
def get_historique():
    conn = sqlite3.connect("immomatch.db")
    conn.row_factory = sqlite3.Row
    
    # Grouper les matchings par date d'analyse
    historique = conn.execute('''
        SELECT 
            DATE(date_analyse) as date,
            TIME(date_analyse) as heure,
            COUNT(*) as nb_matchings,
            COUNT(DISTINCT prospect_id) as nb_prospects,
            COUNT(DISTINCT bien_id) as nb_biens,
            ROUND(AVG(score), 1) as score_moyen,
            MAX(score) as score_max,
            SUM(CASE WHEN score >= 75 THEN 1 ELSE 0 END) as excellents,
            SUM(CASE WHEN score >= 50 AND score < 75 THEN 1 ELSE 0 END) as corrects,
            SUM(CASE WHEN score < 50 THEN 1 ELSE 0 END) as faibles,
            MIN(date_analyse) as date_complete
        FROM matchings
        GROUP BY DATE(date_analyse), substr(TIME(date_analyse), 1, 5)
        ORDER BY date_analyse DESC
        LIMIT 50
    ''').fetchall()
    
    conn.close()
    return [dict(row) for row in historique]

@app.post("/matching/run/{prospect_id}")
def run_matching(prospect_id: int):
    settings = get_settings_values()
    max_biens = settings['max_biens_par_prospect']
    budget_min = settings['budget_tolerance_min']
    budget_max = settings['budget_tolerance_max']

    conn = sqlite3.connect("immomatch.db")
    conn.row_factory = sqlite3.Row

    prospect = conn.execute("SELECT * FROM prospects WHERE id = ?", (prospect_id,)).fetchone()
    if not prospect:
        conn.close()
        return {"error": "Prospect non trouvé"}

    prospect = dict(prospect)
    biens = [dict(row) for row in conn.execute("SELECT * FROM biens").fetchall()]

    # Exclure les biens que le prospect a refusés
    refused_ids = {row[0] for row in conn.execute(
        "SELECT bien_id FROM matchings WHERE prospect_id = ? AND statut_prospect = 'refused'",
        (prospect_id,)
    ).fetchall()}
    conn.close()

    if refused_ids:
        biens = [b for b in biens if b['id'] not in refused_ids]

    if not biens:
        return {"error": "Aucun bien en base"}

    # Préfiltrage (budget, type, ville)
    client_data = {
        "nom": prospect.get("nom"),
        "bien": prospect.get("bien"),
        "ville": prospect.get("villes"),
        "budget": prospect.get("budget_max"),
    }
    biens_filtres = prefiltre_biens(client_data, biens, budget_min, budget_max)

    if not biens_filtres:
        return {
            "error": "Aucun bien ne correspond aux critères de ce prospect",
            "matchings_count": 0
        }

    # Limiter au max configuré, triés par proximité prix
    budget_client = prospect.get("budget_max") or 200000
    biens_filtres = sorted(biens_filtres, key=lambda b: abs((b.get("prix") or 0) - budget_client))[:max_biens]

    try:
        if not os.getenv("ANTHROPIC_API_KEY"):
            return {"error": "Clé API Anthropic non configurée"}

        # Scoring hybride (objectif Python + qualitatif Claude)
        resultats = scorer_biens_hybride(prospect, biens_filtres)
        resultat_brut = formater_pour_affichage(resultats)

        conn = sqlite3.connect("immomatch.db")
        # Sauvegarder les biens refuses avant suppression
        refused_biens = {row[0] for row in conn.execute(
            "SELECT bien_id FROM matchings WHERE prospect_id = ? AND statut_prospect = 'refused'",
            (prospect_id,)
        ).fetchall()}
        conn.execute("DELETE FROM matchings WHERE prospect_id = ?", (prospect_id,))

        nb_matchings = 0
        for r in resultats:
            bien_match = next((b for b in biens_filtres if b["id"] == r["bien_id"]), None)
            if not bien_match:
                continue

            points_forts = "\n".join(f"- {p}" for p in r.get("points_forts", []))
            points_attention = "\n".join(f"- {p}" for p in r.get("points_attention", []))
            recommandation = r.get("recommandation", "")

            conn.execute("""
                INSERT INTO matchings (prospect_id, bien_id, score, points_forts, points_attention, recommandation, date_analyse)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                prospect_id,
                r["bien_id"],
                r["score"],
                points_forts,
                points_attention,
                recommandation,
                datetime.now().isoformat()
            ))
            nb_matchings += 1

        # Restaurer les statuts refuses
        for bien_id in refused_biens:
            conn.execute(
                "UPDATE matchings SET statut_prospect = 'refused' WHERE prospect_id = ? AND bien_id = ?",
                (prospect_id, bien_id)
            )

        conn.commit()

        # Notification si excellent match
        best_score = max((r["score"] for r in resultats), default=0)
        if best_score >= 80:
            conn.execute("""
                INSERT INTO notifications (type, title, message, link, created_at)
                VALUES (?, ?, ?, ?, ?)
            """, (
                "match",
                "Excellent match trouvé !",
                f"Score {best_score} pour {prospect.get('nom')}",
                "/matchings",
                datetime.now().isoformat()
            ))
            conn.commit()

        conn.close()

        return {
            "message": f"Analyse terminée, {nb_matchings} matching(s) trouvé(s)",
            "matchings_count": nb_matchings,
            "resultat": resultat_brut
        }

    except Exception as e:
        return {"error": str(e)}

@app.post("/matching/run-all")
def run_all_matchings():
    settings = get_settings_values()
    max_biens = settings['max_biens_par_prospect']
    budget_min = settings['budget_tolerance_min']
    budget_max = settings['budget_tolerance_max']
    score_minimum = int(settings.get('score_minimum', 0))
    print(f"🎯 Score minimum configuré : {score_minimum}")

    conn = sqlite3.connect("immomatch.db")
    conn.row_factory = sqlite3.Row
    prospects = [dict(row) for row in conn.execute("SELECT * FROM prospects").fetchall()]
    biens = [dict(row) for row in conn.execute("SELECT * FROM biens").fetchall()]

    # Lire le score minimum depuis les settings
    row_score = conn.execute("SELECT value FROM settings WHERE key = 'score_minimum'").fetchone()
    score_minimum = int(row_score['value']) if row_score else 0
    print(f"🎯 Score minimum configuré : {score_minimum}")

    conn.close()

    if not prospects:
        return {"error": "Aucun prospect en base"}
    if not biens:
        return {"error": "Aucun bien en base"}
    if not os.getenv("ANTHROPIC_API_KEY"):
        return {"error": "Clé API Anthropic non configurée"}

    # Sauvegarder tous les refus avant de vider
    conn = sqlite3.connect("immomatch.db")
    refused_map = {(row[0], row[1]) for row in conn.execute("SELECT prospect_id, bien_id FROM matchings WHERE statut_prospect = 'refused'").fetchall()}
    conn.execute("DELETE FROM matchings")
    conn.commit()
    conn.close()

    total_matchings = 0
    prospects_analyses = 0
    prospects_sans_biens = 0

    for prospect in prospects:
        client_data = {
            "nom": prospect.get("nom"),
            "bien": prospect.get("bien"),
            "ville": prospect.get("villes"),
            "budget": prospect.get("budget_max"),
        }

        refused_ids_p = {bid for (pid, bid) in refused_map if pid == prospect["id"]}
        biens_prospect = [b for b in biens if b["id"] not in refused_ids_p]
        biens_filtres = prefiltre_biens(client_data, biens_prospect, budget_min, budget_max)

        if not biens_filtres:
            prospects_sans_biens += 1
            print(f"⭕ {prospect.get('nom')} - Aucun bien compatible")
            continue

        budget_client = prospect.get("budget_max") or 200000
        biens_filtres = sorted(biens_filtres, key=lambda b: abs((b.get("prix") or 0) - budget_client))[:max_biens]

        try:
            resultats = scorer_biens_hybride(prospect, biens_filtres)

            conn = sqlite3.connect("immomatch.db")
            for r in resultats:
                bien_match = next((b for b in biens_filtres if b["id"] == r["bien_id"]), None)
                if not bien_match:
                    continue

                points_forts = "\n".join(f"- {p}" for p in r.get("points_forts", []))
                points_attention = "\n".join(f"- {p}" for p in r.get("points_attention", []))
                recommandation = r.get("recommandation", "")

                # Ne pas sauvegarder si score sous le seuil minimum
                if r["score"] < score_minimum:
                    continue

                conn.execute("""
                    INSERT INTO matchings (prospect_id, bien_id, score, points_forts, points_attention, recommandation, date_analyse)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    prospect["id"],
                    r["bien_id"],
                    r["score"],
                    points_forts,
                    points_attention,
                    recommandation,
                    datetime.now().isoformat()
                ))
                total_matchings += 1

            # Restaurer refus
            for (pid, bid) in refused_map:
                if pid == prospect["id"]:
                    conn.execute("UPDATE matchings SET statut_prospect = 'refused' WHERE prospect_id = ? AND bien_id = ?", (pid, bid))
            conn.commit()
            conn.close()

            prospects_analyses += 1
            print(f"✅ {prospect.get('nom')} - {len(resultats)} matchings")

        except Exception as e:
            print(f"❌ Erreur pour {prospect.get('nom')}: {e}")
            continue

    return {
        "message": f"Analyse terminée ! {total_matchings} matchings trouvés",
        "details": {
            "prospects_analyses": prospects_analyses,
            "prospects_sans_biens": prospects_sans_biens,
            "total_matchings": total_matchings
        }
    }


# ==================== PROSPECTS CRUD ====================

@app.get("/prospects/{prospect_id}")
def get_prospect(prospect_id: int):
    conn = sqlite3.connect("immomatch.db")
    conn.row_factory = sqlite3.Row
    prospect = conn.execute("SELECT * FROM prospects WHERE id = ?", (prospect_id,)).fetchone()
    conn.close()
    if not prospect:
        return {"error": "Prospect non trouvé"}
    return dict(prospect)

# ==================== BIENS CRUD ====================

@app.get("/biens/{bien_id}")
def get_bien(bien_id: int):
    conn = sqlite3.connect("immomatch.db")
    conn.row_factory = sqlite3.Row
    bien = conn.execute("SELECT * FROM biens WHERE id = ?", (bien_id,)).fetchone()
    conn.close()
    if not bien:
        return {"error": "Bien non trouvé"}
    return dict(bien)

def generer_prompt_scoring(client_data, biens_candidats):
    client_desc = f"""NOM : {client_data.get('nom', 'Non renseigné')}

RECHERCHE :
- Type de bien : {client_data.get('bien', 'Non précisé')}
- Secteur : {client_data.get('ville', 'Non précisé')}
- Quartier souhaité : {client_data.get('quartier', 'Flexible')}
- Budget maximum : {client_data.get('budget', 'Non précisé')}€

CRITÈRES SPÉCIFIQUES :
- État accepté : {client_data.get('etat', 'Non précisé')}
- Critères particuliers : {client_data.get('criteres', 'Aucun')}
- Exposition souhaitée : {client_data.get('expo', 'Non précisé')}
- Stationnement : {client_data.get('stationnement', 'Non précisé')}
- Extérieur : {client_data.get('exterieur', 'Non précisé')}
- Étage : {client_data.get('etage', 'Non précisé')}
- Destination : {client_data.get('destination', 'Non précisé')}
- Observations : {client_data.get('observation', 'Aucune')}"""

    biens_desc = ""
    for bien in biens_candidats:
        hors_secteur_tag = "âš ï¸ HORS SECTEUR RECHERCHÉ" if bien.get('hors_secteur') else "âœ“ Dans le secteur"
        biens_desc += f"""
BIEN #{bien.get('id')} [{hors_secteur_tag}]
- Type : {bien.get('type', 'Non précisé')}
- Ville : {bien.get('ville', 'Non précisé')}
- Quartier : {bien.get('quartier', 'Non précisé')}
- Prix : {bien.get('prix', 'Non précisé')}€
- Surface : {bien.get('surface', 'Non précisé')}m²
- Pièces : {bien.get('pieces', 'Non précisé')}
- Chambres : {bien.get('chambres', 'Non précisé')}
- État : {bien.get('etat', 'Non précisé')}
- Description : {bien.get('description', 'Aucune')}
---"""

    prompt = f"""Tu es un agent immobilier expert sur la Côte d'Azur, spécialisé dans le secteur Fréjus/Saint-Raphaël.

=== VOCABULAIRE MÉTIER IMPORTANT ===
- "Marchand de bien" ou "Investisseur" = Cherche un bien À RÉNOVER ENTIÈREMENT, prix bas, potentiel de plus-value
- "Résidence principale" = Cherche un bien habitable, bon état préféré
- "Résidence secondaire" = Flexibilité sur l'état, cherche le charme/emplacement
- "Investissement locatif" = Cherche rentabilité, petit budget, centre-ville
- "Tous biens" ou "Tous types" = Ouvert à appartement ET maison
- "T2" = 2 pièces (1 chambre), "T3" = 3 pièces (2 chambres), etc.
- Budget "flexible" ou "à voir" = Peut dépasser de 10-20% pour un coup de cÅ“ur

=== RÈGLES DE MATCHING ===
1. Un dépassement de budget de 5-10% est ACCEPTABLE si le bien correspond parfaitement
2. Un bien en dessous du budget est TOUJOURS un avantage
3. Pour un "marchand de bien", privilégier les biens à rénover, même si l'état n'est pas précisé dans la fiche
4. La localisation (ville + quartier) est PRIORITAIRE sur les autres critères
5. Si le client cherche "Fréjus/Saint-Raphaël", les deux villes sont valides
6. Un T3 peut convenir à quelqu'un qui cherche un T2 (surface bonus)
7. Une maison peut convenir à quelqu'un qui cherche un appartement avec extérieur

=== GESTION DES BIENS HORS SECTEUR ===
Certains biens sont marqués "HORS SECTEUR RECHERCHÉ". Cela signifie qu'ils ne sont PAS dans la ville demandée par le client.
- Tu peux QUAND MÊME les proposer s'ils correspondent parfaitement aux autres critères
- MAIS tu DOIS OBLIGATOIREMENT mentionner dans les "Points d'attention" : "âš ï¸ Bien situé à [ville] - hors du secteur recherché ([secteur demandé])"
- Le score doit être réduit de 10-15 points pour un bien hors secteur
- Dans la recommandation, suggère : "À proposer en élargissement de recherche si le client est ouvert"

=== CLIENT ===
{client_desc}

=== BIENS À ÉVALUER ===
{biens_desc}

=== INSTRUCTIONS DE SCORING ===

Évalue CHAQUE bien avec un score de 0 à 100 :

CRITÈRES POSITIFS (ajouter des points) :
- Budget respecté ou inférieur : +25pts max
- Type de bien correspond : +20pts max  
- Bonne localisation : +20pts max (réduit à +5pts si hors secteur)
- État compatible avec le projet : +15pts max
- Critères spécifiques respectés : +10pts max
- Potentiel/Coup de cÅ“ur : +10pts max

CRITÈRES NÉGATIFS (retirer des points) :
- Dépassement budget > 15% : -20pts
- HORS SECTEUR : -10 à -15pts (selon distance)
- Type de bien incompatible : -15pts
- État incompatible avec projet : -10pts

SOIS GÉNÉREUX dans ton scoring si le bien a du potentiel pour ce client.
Un score de 60+ signifie "à proposer au client".
Un score de 75+ signifie "excellent match, prioritaire".

=== FORMAT DE RÉPONSE ===

**BIEN #[id] - [type] à [ville]**
**SCORE : [XX]/100**

âœ… Points forts :
- [point 1]
- [point 2]

âš ï¸ Points d'attention :
- [point 1]
- [Si hors secteur : "Bien situé à [ville] - hors du secteur recherché"]

ðŸ’¡ Recommandation : [action concrète à mener]

---

Termine par un RÉSUMÉ avec le classement des biens du meilleur au moins bon.
"""
    return prompt

@app.get("/debug/prefiltre/{prospect_id}")
def debug_prefiltre(prospect_id: int):
    """Debug : voir quels biens passent le préfiltre pour un prospect"""
    settings = get_settings_values()
    budget_min = settings['budget_tolerance_min']
    budget_max = settings['budget_tolerance_max']
    
    conn = sqlite3.connect("immomatch.db")
    conn.row_factory = sqlite3.Row
    
    prospect = conn.execute("SELECT * FROM prospects WHERE id = ?", (prospect_id,)).fetchone()
    if not prospect:
        conn.close()
        return {"error": "Prospect non trouvé"}
    
    prospect = dict(prospect)
    biens = [dict(row) for row in conn.execute("SELECT * FROM biens").fetchall()]
    conn.close()
    
    client_data = {
        "nom": prospect.get('nom'),
        "bien": prospect.get('bien'),
        "ville": prospect.get('villes'),
        "budget": prospect.get('budget_max'),
    }
    
    biens_filtres = prefiltre_biens(client_data, biens, budget_min, budget_max)
    
    return {
        "prospect": {
            "id": prospect_id,
            "nom": prospect.get('nom'),
            "ville_recherchee": prospect.get('villes'),
            "budget": prospect.get('budget_max'),
            "type_bien": prospect.get('bien')
        },
        "settings": {
            "budget_min_tolerance": budget_min,
            "budget_max_tolerance": budget_max
        },
        "total_biens": len(biens),
        "biens_apres_filtre": len(biens_filtres),
        "biens_filtres": [
            {
                "id": b["id"],
                "reference": b.get("reference"),
                "ville": b.get("ville"),
                "prix": b.get("prix"),
                "type": b.get("type")
            }
            for b in biens_filtres
        ]
    }

@app.get("/matchings/by-date")
def get_matchings_by_date(date_analyse: str):
    """Récupère les matchings d'une analyse spécifique (par minute)"""
    conn = sqlite3.connect("immomatch.db")
    conn.row_factory = sqlite3.Row
    
    # Extraire la date jusqu'à la minute (sans secondes) pour grouper les analyses faites ensemble
    date_minute = date_analyse[:16]  # "2026-02-09T21:32"
    
    matchings = conn.execute('''
        SELECT m.*, 
               p.nom as prospect_nom, p.budget_max as prospect_budget, p.mail as prospect_mail, p.telephone as prospect_tel,
               b.type as bien_type, b.ville as bien_ville, b.prix as bien_prix, b.surface as bien_surface, b.pieces as bien_pieces, b.id as bien_id
        FROM matchings m
        JOIN prospects p ON m.prospect_id = p.id
        JOIN biens b ON m.bien_id = b.id
        WHERE m.date_analyse LIKE ?
        ORDER BY p.nom, m.score DESC
    ''', (f"{date_minute}%",)).fetchall()
    
    conn.close()
    return [dict(m) for m in matchings]

@app.post("/send-email")
async def send_email(data: EmailRequest):
    """Envoie un email de proposition immobilière"""
    try:
        # Créer le message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = data.subject
        msg["From"] = f"{SMTP_CONFIG['from_name']} <{SMTP_CONFIG['user']}>"
        msg["To"] = data.to_email
        msg["Reply-To"] = SMTP_CONFIG["reply_to"]
        
        # Ajouter les versions texte et HTML
        text_content = generate_email_text(data)
        html_content = generate_email_html(data)
        
        msg.attach(MIMEText(text_content, "plain", "utf-8"))
        msg.attach(MIMEText(html_content, "html", "utf-8"))
        
        # Connexion et envoi
        with smtplib.SMTP(SMTP_CONFIG["server"], SMTP_CONFIG["port"]) as server:
            server.starttls()
            server.login(SMTP_CONFIG["user"], SMTP_CONFIG["password"])
            server.send_message(msg)
        
        return {"success": True, "message": f"Email envoyé à {data.to_email}"}
    
    except smtplib.SMTPAuthenticationError:
        return JSONResponse(
            status_code=401,
            content={"success": False, "error": "Erreur d'authentification SMTP. Vérifiez les identifiants."}
        )
    except smtplib.SMTPException as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": f"Erreur SMTP: {str(e)}"}
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": f"Erreur: {str(e)}"}
        )
    
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": f"Erreur: {str(e)}"}
        )

@app.post("/preview-email")
async def preview_email(data: EmailRequest):
    """Génère un aperçu de l'email sans l'envoyer"""
    try:
        html_content = generate_email_html(data)
        return {"success": True, "html": html_content}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": f"Erreur: {str(e)}"}
        )


@app.get("/calibration/matchings")
def get_matchings_for_calibration():
    conn = sqlite3.connect("immomatch.db")
    conn.row_factory = sqlite3.Row
    rows = conn.execute("""
        SELECT m.id, m.prospect_id, m.bien_id, m.score, m.points_forts,
               p.nom as prospect_nom, p.bien as prospect_type, p.budget_max,
               b.type as bien_type, b.ville as bien_ville, b.prix as bien_prix, b.surface,
               b.photos as bien_photos, b.pieces, b.chambres, b.quartier, b.etat, b.description, b.defauts as bien_defauts,
               cf.pertinent, cf.score_avis, cf.commentaire
        FROM matchings m
        JOIN prospects p ON m.prospect_id = p.id
        JOIN biens b ON m.bien_id = b.id
        LEFT JOIN calibration_feedback cf ON cf.matching_id = m.id
        WHERE (m.statut_prospect IS NULL OR m.statut_prospect != 'refused')
        ORDER BY m.score DESC
    """).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/calibration/feedback")
def save_feedback(body: dict):
    conn = sqlite3.connect("immomatch.db")
    existing = conn.execute("SELECT id FROM calibration_feedback WHERE matching_id = ?", (body['matching_id'],)).fetchone()
    if existing:
        conn.execute("UPDATE calibration_feedback SET pertinent=?, score_avis=?, commentaire=?, created_at=? WHERE matching_id=?",
            (body.get('pertinent'), body.get('score_avis'), body.get('commentaire',''), datetime.now().isoformat(), body['matching_id']))
    else:
        conn.execute("INSERT INTO calibration_feedback (matching_id, pertinent, score_avis, commentaire, created_at) VALUES (?,?,?,?,?)",
            (body['matching_id'], body.get('pertinent'), body.get('score_avis'), body.get('commentaire',''), datetime.now().isoformat()))
    conn.commit()
    conn.close()
    return {"success": True}

@app.get("/calibration/stats")
def get_calibration_stats():
    conn = sqlite3.connect("immomatch.db")
    rows = conn.execute("""
        SELECT m.score, cf.pertinent, cf.score_avis
        FROM calibration_feedback cf
        JOIN matchings m ON m.id = cf.matching_id
        WHERE cf.pertinent IS NOT NULL
    """).fetchall()
    conn.close()
    total = len(rows)
    if not total:
        return {"total": 0, "pertinents": 0, "non_pertinents": 0, "score_trop_haut": 0, "score_ok": 0, "score_trop_bas": 0}
    pertinents = sum(1 for r in rows if r[1] == 1)
    scores_pertinents = [r[0] for r in rows if r[1] == 1]
    scores_non_pertinents = [r[0] for r in rows if r[1] == 0]
    return {
        "total": total,
        "pertinents": pertinents,
        "non_pertinents": total - pertinents,
        "score_trop_haut": sum(1 for r in rows if r[2] == 'trop_haut'),
        "score_ok": sum(1 for r in rows if r[2] == 'ok'),
        "score_trop_bas": sum(1 for r in rows if r[2] == 'trop_bas'),
        "avg_score_pertinent": round(sum(scores_pertinents)/len(scores_pertinents), 1) if scores_pertinents else 0,
        "avg_score_non_pertinent": round(sum(scores_non_pertinents)/len(scores_non_pertinents), 1) if scores_non_pertinents else 0,
    }

@app.patch("/matchings/{matching_id}/statut-prospect")
def set_statut_prospect(matching_id: int, body: dict):
    """Marque un matching comme refusé ou réinitialise"""
    conn = sqlite3.connect("immomatch.db")
    cursor = conn.cursor()
    statut = body.get("statut")  # "refused" ou None
    cursor.execute("UPDATE matchings SET statut_prospect = ? WHERE id = ?", (statut, matching_id))
    conn.commit()
    conn.close()
    return {"success": True, "statut_prospect": statut}

@app.patch("/matchings/{matching_id}/email-sent")
def mark_email_sent(matching_id: int):
    """Marque un matching comme ayant reçu un email"""
    conn = sqlite3.connect("immomatch.db")
    cursor = conn.cursor()
    
    now = datetime.now().isoformat()
    cursor.execute('UPDATE matchings SET date_email_envoye = ? WHERE id = ?', (now, matching_id))
    conn.commit()
    
    conn.close()
    
    return {"success": True, "date_email_envoye": now}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)