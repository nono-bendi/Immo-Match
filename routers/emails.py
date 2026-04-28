import os
import re
import smtplib
import traceback
from datetime import datetime
from html import escape
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from config import SMTP_BASE, SMTP_FALLBACK, EmailRequest, _email_rate, APP_BASE_URL
from routers.auth import get_current_user
from agencies_db import get_monthly_usage, increment_monthly_usage
from plans import check_quota

router = APIRouter()


def _lighten(hex_color: str, factor: float = 0.35) -> str:
    h = hex_color.lstrip('#')
    if len(h) != 6:
        return hex_color
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    r = int(r + (255 - r) * factor)
    g = int(g + (255 - g) * factor)
    b = int(b + (255 - b) * factor)
    return f"#{r:02x}{g:02x}{b:02x}"

def _darken(hex_color: str, factor: float = 0.25) -> str:
    h = hex_color.lstrip('#')
    if len(h) != 6:
        return hex_color
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    r = int(r * (1 - factor))
    g = int(g * (1 - factor))
    b = int(b * (1 - factor))
    return f"#{r:02x}{g:02x}{b:02x}"


# ============================================================
# FONCTIONS UTILITAIRES EMAIL
# ============================================================

def fix_mojibake(text):
    """Corrige les séquences mojibake courantes (ex: 'ÃƒÂ©' -> 'é')."""
    if text is None:
        return None
    value = str(text)
    # Marqueurs mojibake : séquences issues d'un double-encodage UTF-8/latin-1
    _MOJIBAKE_MARKERS = (
        "\u00c3\u0192",     # Ãƒ
        "\u00c3\u201a",     # Ã‚
        "\u20ac\u201e\u00a2",  # â€â„¢
        "\u20ac\u0152",     # â€Å"
        "\u20ac",           # â€
        "\u20ac\u0153",     # â€œ
        "\u20ac\u009d",     # â€
        "\u20ac\u00c2\u00a2",  # â€Â¢
    )
    if any(marker in value for marker in _MOJIBAKE_MARKERS):
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

    # Nettoyer les mentions COUP DE CŒUR en majuscules agressives
    cleaned = re.sub(r'COUP DE C[OÅ\']UR\s*(POTENTIEL)?', 'Coup de cœur', cleaned, flags=re.IGNORECASE)

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
    # Découper par \n AVANT clean_ai_content (qui écrase les sauts de ligne)
    raw_points = [p.strip() for p in text.split('\n') if p.strip()]
    points = []
    for p in raw_points:
        cleaned = clean_ai_content(p).lstrip('-•● ').strip()
        if len(cleaned) > 3:
            points.append(cleaned)
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


def generate_email_html(data: EmailRequest, agent_nom: str = None, agency: dict = None) -> str:
    """Génère un email HTML professionnel et personnalisé."""
    agency = agency or {}
    color = escape((agency.get("agency_couleur") or agency.get("couleur_primaire") or "#1E3A5F").strip())
    color_light = _lighten(color, 0.18)
    color_dark  = _darken(color, 0.22)
    agent_title = "Gérant(e)" if agency.get("role") == "admin" else "Conseiller immobilier"

    raw_name = (data.to_name or "").strip()
    salutation = format_salutation(raw_name)
    bien_type = safe_html_text(data.bien_type, "Bien immobilier")
    bien_ville = safe_html_text(data.bien_ville, "Non précisé")
    bien_prix = safe_html_text(data.bien_prix, "Non précisé")
    bien_surface = safe_html_text(data.bien_surface, "Non précisée")
    bien_pieces = safe_html_text(data.bien_pieces, "")

    logo_url = (agency.get("agency_logo_url") or "").strip()
    if logo_url.startswith("/"):
        logo_url = APP_BASE_URL.rstrip("/") + logo_url
    has_logo = is_valid_http_url(logo_url)
    safe_logo_url = escape(logo_url) if has_logo else ""

    image_url = (data.bien_image_url or "").strip()
    has_image = is_valid_http_url(image_url)
    safe_image_url = escape(image_url) if has_image else ""

    annonce_url = (data.lien_annonce or "").strip()
    if not is_valid_http_url(annonce_url) and data.bien_id and data.agency_slug:
        annonce_url = f"{APP_BASE_URL}/public/bien/{data.agency_slug}/{data.bien_id}"
    has_annonce = is_valid_http_url(annonce_url)
    safe_annonce_url = escape(annonce_url) if has_annonce else ""

    default_intro = "Suite à notre dernier échange, nous avons le plaisir de vous proposer un bien qui pourrait vous intéresser. Voici pourquoi je pense qu'il mérite votre attention."
    intro_text = fix_mojibake((data.custom_intro or "").strip()) or default_intro

    default_conclusion = "Ce bien vous intéresse ? N'hésitez pas à me contacter pour organiser une visite ou obtenir plus d'informations."
    conclusion_text = fix_mojibake((data.custom_conclusion or "").strip()) or default_conclusion

    # Points forts avec puces vertes (nettoyés)
    points_forts = normalize_points(data.points_forts)
    if points_forts:
        items = "".join(f'''<tr>
          <td style="padding:5px 0;vertical-align:top;width:20px;"><div style="width:8px;height:8px;border-radius:50%;background:#10B981;margin-top:5px;"></div></td>
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

    # Section analyse personnalisée (si au moins un élément)
    if points_forts_block:
        analyse_block = f"""
        <tr>
          <td style="padding:0 20px 20px 20px;">
            <div style="background:#FAFAFA;border-radius:12px;padding:20px;border:1px solid #E5E7EB;">
              <p style="margin:0 0 16px 0;font-size:15px;font-weight:700;color:{color};">Pourquoi ce bien pour vous ?</p>
              {points_forts_block}


            </div>
          </td>
        </tr>
        """
    else:
        analyse_block = ""

    # Logo block
    logo_fond_colore = bool(agency.get("agency_logo_fond_colore") or agency.get("logo_fond_colore"))
    if has_logo:
        logo_bg = color if logo_fond_colore else "#FFFFFF"
        logo_border = "" if logo_fond_colore else "border-bottom:1px solid #E5E7EB;"
        logo_block = f"""
        <tr>
          <td style="padding:24px 20px;background:{logo_bg};{logo_border}">
            <img src="{safe_logo_url}" alt="{escape(agency.get('agency_nom', 'Agence'))}" height="70"
                 style="display:block;border:0;height:70px;width:auto;" />
          </td>
        </tr>
        """
    else:
        logo_block = f"""
        <tr>
          <td style="padding:28px 20px;background:#FFFFFF;border-bottom:1px solid #E5E7EB;">
            <p style="margin:0;font-size:20px;font-weight:700;color:{color};">{escape(agency.get('agency_nom', 'Agence Immobilière'))}</p>
          </td>
        </tr>
        """

    # Image block
    if has_image:
        image_block = f"""
        <tr>
          <td style="padding:0 0 20px 0;">
            <img src="{safe_image_url}" alt="{bien_type} à {bien_ville}" width="720"
                 style="display:block;width:100%;height:auto;border:0;" />
          </td>
        </tr>
        """
    else:
        image_block = ""

    # CTA block
    if has_annonce:
        cta_block = f"""
        <tr>
          <td align="center" style="padding:16px 20px 36px 20px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" style="border-radius:12px;background:{color};background-image:linear-gradient(180deg,{color_light} 0%,{color_dark} 100%);box-shadow:0 6px 20px rgba(0,0,0,0.18);">
                  <a href="{safe_annonce_url}" target="_blank" rel="noopener noreferrer"
                     style="display:inline-block;padding:18px 52px;color:#FFFFFF;text-decoration:none;font-size:15px;font-weight:700;letter-spacing:0.05em;border-radius:12px;">
                    Voir ce bien &rarr;
                  </a>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-top:10px;">
                  <a href="{safe_annonce_url}" target="_blank" rel="noopener noreferrer"
                     style="font-size:11px;color:#9CA3AF;text-decoration:underline;">
                    Ouvrir le lien dans votre navigateur
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
  <meta name="color-scheme" content="light only" />
  <title>Proposition immobilière</title>
</head>
<body style="margin:0;padding:0;background:#FFFFFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FFFFFF;">
    <tr>
      <td align="center" style="padding:0;">

        <table role="presentation" width="720" cellpadding="0" cellspacing="0" border="0"
               style="width:100%;max-width:720px;background:#FFFFFF;overflow:hidden;">

          {logo_block}

          <!-- Header Band -->
          <tr>
            <td style="background:{color};padding:22px 20px;">
              <p style="margin:0;color:#FFFFFF;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;">
                Sélectionné pour vous
              </p>
            </td>
          </tr>

          <!-- Intro -->
          <tr>
            <td style="padding:28px 20px 20px 20px;">
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
            <td style="padding:0 20px 20px 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="background:{color};padding:18px 24px;">
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
                              <td align="right" style="color:{color};font-size:20px;font-weight:700;">{bien_prix}</td>
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
            <td style="padding:0 20px 28px 20px;">
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
            <td style="padding:0 20px 28px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-left:3px solid {color};padding-left:16px;">
                    <p style="margin:0 0 4px 0;font-size:15px;font-weight:600;color:#111827;">{escape(agent_nom or 'Votre conseiller')}</p>
                    <p style="margin:0 0 12px 0;font-size:13px;color:#6B7280;">{agent_title}</p>
                    <p style="margin:0;font-size:13px;line-height:1.8;color:#374151;">
                      {escape(agency.get('agency_adresse', ''))}<br />
                      Tél. <a href="tel:{escape((agency.get('agency_telephone') or '').replace(' ', ''))}" style="color:{color};text-decoration:none;font-weight:500;">{escape(agency.get('agency_telephone', ''))}</a><br />
                      <a href="mailto:{escape(agency.get('agency_email', ''))}" style="color:{color};text-decoration:none;">{escape(agency.get('agency_email', ''))}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F9FAFB;padding:20px;border-top:1px solid #E5E7EB;">
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


def generate_email_text(data: EmailRequest, agent_nom: str = None, agency: dict = None) -> str:
    """Génère la version texte de l'email (fallback)"""
    agency = agency or {}
    agent_title = "Gérant(e)" if agency.get("role") == "admin" else "Conseiller immobilier"

    salutation = format_salutation(data.to_name)
    default_intro = "Suite à notre dernier échange, nous avons le plaisir de vous proposer un bien qui pourrait vous intéresser. Voici pourquoi je pense qu'il mérite votre attention."
    intro_text = fix_mojibake((data.custom_intro or "").strip()) or default_intro
    default_conclusion = "Ce bien vous intéresse ? N'hésitez pas à me contacter pour organiser une visite ou obtenir plus d'informations."
    conclusion_text = fix_mojibake((data.custom_conclusion or "").strip()) or default_conclusion

    # Nettoyer le contenu IA
    points_forts_clean = clean_ai_content(data.points_forts) if data.points_forts else ""
    points_attention_clean = clean_ai_content(data.points_attention) if data.points_attention else ""
    recommandation_clean = clean_ai_content(data.recommandation) if data.recommandation else ""

    text = f"""Bonjour {salutation},

{intro_text}

══════════════════════════════════════════════════════
BIEN PROPOSÉ : {data.bien_type} à {data.bien_ville}
══════════════════════════════════════════════════════

Prix : {data.bien_prix}
Surface : {data.bien_surface or 'Non précisée'}
{f"Pièces : {data.bien_pieces}" if data.bien_pieces else ""}

{f"Ce qui correspond à votre recherche :{chr(10)}{points_forts_clean}" if points_forts_clean else ""}




{f"Voir l'annonce : {data.lien_annonce}" if data.lien_annonce else ""}

══════════════════════════════════════════════════════

{conclusion_text}

À très bientôt,

{agent_nom or 'Votre conseiller'}
{agent_title}

{(agency.get('agency_nom') or '').upper()}
{agency.get('agency_adresse', '')}
Tél. {agency.get('agency_telephone', '')}
{agency.get('agency_email', '')}

──────────────────────────────────────────────────────
Vous recevez cet email car vous avez effectué une recherche immobilière auprès de notre agence.
Pour ne plus recevoir nos propositions : répondez "STOP" à cet email.
"""
    return fix_mojibake(text)


# ============================================================
# ROUTES
# ============================================================

@router.post("/send-email")
async def send_email(data: EmailRequest, _user: dict = Depends(get_current_user)):
    """Envoie un email de proposition immobilière"""
    # Rate limiting : max 3 emails par minute par utilisateur
    uid = str(_user.get("id", _user.get("nom", "unknown")))
    now = datetime.now().timestamp()
    _email_rate[uid] = [t for t in _email_rate.get(uid, []) if now - t < 60]
    if len(_email_rate[uid]) >= 3:
        return JSONResponse(status_code=429, content={"error": "Trop d'emails envoyés, attendez 1 minute"})
    _email_rate[uid].append(now)

    # Quota mensuel emails
    usage = get_monthly_usage(_user["agency_slug"])
    check_quota(_user.get("agency_plan_id", "agence"), "max_emails_mois", usage["emails_count"])

    # Construire la config SMTP : agence en priorité, SMTP de secours sinon
    agency_smtp_user = (_user.get("smtp_user") or "").strip()
    agency_smtp_pass = (_user.get("smtp_password") or "").strip()
    via_fallback = not (agency_smtp_user and agency_smtp_pass)

    if via_fallback:
        if not SMTP_FALLBACK["user"] or not SMTP_FALLBACK["password"]:
            return JSONResponse(
                status_code=503,
                content={
                    "success": False,
                    "error": "Aucun SMTP configuré. Rendez-vous dans Administration → Email pour configurer votre adresse d'envoi.",
                    "smtp_missing": True,
                }
            )
        agency_nom = (_user.get("agency_nom") or "").strip()
        smtp_cfg = {
            "server":    SMTP_FALLBACK["server"],
            "port":      SMTP_FALLBACK["port"],
            "user":      SMTP_FALLBACK["user"],
            "password":  SMTP_FALLBACK["password"],
            "from_name": f"{agency_nom} via ImmoFlash" if agency_nom else SMTP_FALLBACK["from_name"],
            "reply_to":  (_user.get("agency_email") or SMTP_FALLBACK["user"]),
        }
    else:
        smtp_cfg = {
            "server":    _user.get("smtp_server") or SMTP_BASE["server"],
            "port":      int(_user.get("smtp_port") or SMTP_BASE["port"]),
            "user":      agency_smtp_user,
            "password":  agency_smtp_pass,
            "from_name": _user.get("smtp_from_name") or _user.get("agency_nom", ""),
            "reply_to":  _user.get("smtp_reply_to") or _user.get("agency_email", ""),
        }

    try:
        # Créer le message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = data.subject
        msg["From"] = f"{smtp_cfg['from_name']} <{smtp_cfg['user']}>"
        msg["To"] = data.to_email
        msg["Reply-To"] = smtp_cfg["reply_to"]

        # Ajouter les versions texte et HTML
        text_content = generate_email_text(data, agent_nom=_user.get("nom"), agency=_user)
        html_content = generate_email_html(data, agent_nom=_user.get("nom"), agency=_user)

        msg.attach(MIMEText(text_content, "plain", "utf-8"))
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        # Connexion et envoi
        with smtplib.SMTP(smtp_cfg["server"], smtp_cfg["port"]) as server:
            server.starttls()
            server.login(smtp_cfg["user"], smtp_cfg["password"])
            server.send_message(msg)

        increment_monthly_usage(_user["agency_slug"], "emails_count")
        return {
            "success": True,
            "message": f"Email envoyé à {data.to_email}",
            "via_fallback": via_fallback,
            "fallback_address": SMTP_FALLBACK["user"] if via_fallback else None,
        }

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
        print(f"[send-email] Erreur: {e}\n{traceback.format_exc()}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": f"Erreur: {str(e)}"}
        )


@router.post("/preview-email")
async def preview_email(data: EmailRequest, current_user: dict = Depends(get_current_user)):
    """Génère un aperçu de l'email sans l'envoyer"""
    try:
        html_content = generate_email_html(data, agent_nom=current_user.get("nom"), agency=current_user)
        return {"success": True, "html": html_content}
    except Exception as e:
        print(f"[preview-email] Erreur: {e}\n{traceback.format_exc()}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": f"Erreur: {str(e)}"}
        )
