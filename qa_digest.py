import os
import re
import sqlite3
import smtplib
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from html import escape

from logger import get_logger
log = get_logger('qa_digest')

ADMIN_EMAIL = "contact@immoflash.app"
SMTP_SERVER  = os.getenv("DEMO_SMTP_SERVER", "smtp.mail.ovh.net")
SMTP_PORT    = int(os.getenv("DEMO_SMTP_PORT", "587"))
SMTP_USER    = os.getenv("DEMO_SMTP_USER", "")
SMTP_PASSWORD = os.getenv("DEMO_SMTP_PASSWORD", "")


# ============================================================
# RÈGLES QA
# ============================================================

_RECO_NEGATIVE = [
    "ne correspond pas", "ne répond pas", "pas ce qu", "incompatible",
    "inadéquat", "inadapté", "à écarter", "non recommandé", "contredit",
    "ne permet pas", "hors budget", "hors secteur", "hors zone",
]

_POINTS_GENERIQUES = [
    "bel emplacement", "bon emplacement", "belle exposition",
    "bien situé", "très bien situé", "idéalement situé",
    "environnement agréable", "cadre agréable",
]


def _check(matching):
    """
    Retourne une liste d'anomalies pour un matching.
    Chaque anomalie est un dict {code, label, detail}.
    """
    issues = []
    score      = matching.get("score") or 0
    reco       = (matching.get("recommandation") or "").lower()
    pf         = (matching.get("points_forts") or "").lower()
    pa         = (matching.get("points_attention") or "").lower()
    obs        = (matching.get("observation") or "").strip()
    budget     = matching.get("budget_max")
    prix       = matching.get("prix")
    criteres   = (matching.get("criteres") or "").strip()
    villes     = (matching.get("villes") or "").strip()
    bien_type  = (matching.get("bien_type") or "").strip()

    # ── 1. Contradiction score / recommandation ──────────────────────────────
    if score >= 70 and any(k in reco for k in _RECO_NEGATIVE):
        issues.append({
            "code": "SCORE_RECO",
            "label": "Contradiction score/reco",
            "detail": f"Score {score} mais reco signale une inadéquation.",
        })

    # ── 2. Budget dépassé non signalé ───────────────────────────────────────
    if budget and prix and prix > budget * 1.05:
        if "budget" not in pa and "dépasse" not in pa and "hors budget" not in pa:
            pct = round((prix / budget - 1) * 100)
            issues.append({
                "code": "BUDGET_DEPASSE",
                "label": "Budget dépassé non signalé",
                "detail": f"Prix {prix:,.0f}€ > budget {budget:,.0f}€ (+{pct}%), absent des points_attention.",
            })

    # ── 3. Observation ignorée ───────────────────────────────────────────────
    # Ne flag que si l'observation contient des critères immobiliers concrets
    # (pas les postures financières/comportementales comme "voit avec sa banque")
    _CRITERES_IMMO = {
        "jardin", "terrasse", "garage", "parking", "cave", "balcon", "piscine",
        "ascenseur", "calme", "lumineux", "lumiere", "etage", "surface", "pieces",
        "chambres", "travaux", "neuf", "ancien", "villa", "maison", "appartement",
        "immeuble", "studio", "duplex", "plain-pied", "plainpied", "exposition",
        "secteur", "quartier", "centre", "village", "lotissement", "dependance",
        "bureau", "commerce", "divisible", "logement", "louer", "loue", "locatif",
        "investissement", "rendement", "marchand",
    }
    if obs and len(obs) > 15:
        mots_obs = set(
            w for w in re.split(r'\W+', obs.lower())
            if len(w) > 4 and w not in {"avec", "pour", "dans", "elle", "vient", "depuis", "tout", "aussi", "cette", "plus", "meme", "faire"}
        )
        contient_critere_immo = bool(mots_obs & _CRITERES_IMMO)
        if contient_critere_immo:
            mots_pa = set(re.split(r'\W+', pa))
            mots_pf = set(re.split(r'\W+', pf))
            communs = mots_obs & (mots_pa | mots_pf)
            if len(mots_obs) >= 4 and len(communs) == 0:
                issues.append({
                    "code": "OBS_IGNOREE",
                    "label": "Observation agent ignorée",
                    "detail": f'Observation : "{obs[:120]}…" — critère immobilier non repris dans points_forts/attention.',
                })

    # ── 4. Formules génériques dans les points_forts ────────────────────────
    found = [g for g in _POINTS_GENERIQUES if g in pf]
    if found:
        found_str = ", ".join('"' + g + '"' for g in found)
        issues.append({
            "code": "GENERIQUE",
            "label": "Formule générique détectée",
            "detail": f"Points_forts contient : {found_str}.",
        })

    # ── 5. Score élevé sur profil quasi-vide ────────────────────────────────
    if score >= 80 and not budget and not criteres and not villes:
        issues.append({
            "code": "PROFIL_VIDE",
            "label": "Score élevé sur profil vide",
            "detail": f"Score {score} sans budget, ville ni critères renseignés.",
        })

    return issues


def analyser_matchings(db_path, depuis_heures=24):
    """
    Récupère les matchings récents et retourne les anomalies détectées.
    """
    depuis = (datetime.now() - timedelta(hours=depuis_heures)).isoformat()

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    rows = conn.execute("""
        SELECT
            m.id, m.score, m.points_forts, m.points_attention, m.recommandation,
            m.date_analyse,
            p.nom, p.prenom, p.budget_max, p.observation, p.criteres, p.villes,
            b.type as bien_type, b.ville as bien_ville, b.prix, b.reference
        FROM matchings m
        JOIN prospects p ON m.prospect_id = p.id
        JOIN biens b ON m.bien_id = b.id
        WHERE m.date_analyse >= ?
          AND m.bien_id IS NOT NULL
          AND m.points_forts IS NOT NULL AND m.points_forts != ''
          AND (p.archive = 0 OR p.archive IS NULL)
        ORDER BY m.date_analyse DESC
    """, (depuis,)).fetchall()
    conn.close()

    anomalies = []
    for row in rows:
        m = dict(row)
        issues = _check(m)
        if issues:
            anomalies.append({"matching": m, "issues": issues})

    return anomalies, len(rows)


# ============================================================
# GÉNÉRATION EMAIL HTML
# ============================================================

_COLORS = {
    "SCORE_RECO":   "#DC2626",
    "BUDGET_DEPASSE": "#D97706",
    "OBS_IGNOREE":  "#7C3AED",
    "GENERIQUE":    "#6B7280",
    "PROFIL_VIDE":  "#2563EB",
}

_ICONS = {
    "SCORE_RECO":    "!",
    "BUDGET_DEPASSE": "€",
    "OBS_IGNOREE":   "?",
    "GENERIQUE":     "~",
    "PROFIL_VIDE":   "0",
}


def _badge(issue):
    color = _COLORS.get(issue["code"], "#6B7280")
    icon  = _ICONS.get(issue["code"], "!")
    return (
        f'<span style="display:inline-block;background:{color};color:#fff;'
        f'font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px;'
        f'margin-right:6px;">{icon} {escape(issue["label"])}</span>'
    )


def _generer_html(anomalies, nb_analyses, agence_slug, periode_h):
    nb_ok = nb_analyses - len(anomalies)
    taux_ok = round(nb_ok / nb_analyses * 100) if nb_analyses else 0

    rows_html = ""
    for item in anomalies:
        m   = item["matching"]
        nom = f"{(m.get('prenom') or '').strip()} {(m.get('nom') or '').strip()}".strip()
        bien = f"{escape(m.get('bien_type','?'))} — {escape(m.get('bien_ville','?'))}"
        prix_str = f"{m['prix']:,.0f}€" if m.get('prix') else "N/A"
        date_str = (m.get('date_analyse') or '')[:16].replace('T', ' ')

        badges = "".join(_badge(i) for i in item["issues"])
        details = "".join(
            f'<li style="margin:4px 0;color:#374151;font-size:13px;">{escape(i["detail"])}</li>'
            for i in item["issues"]
        )

        rows_html += f"""
        <tr>
          <td style="padding:16px;border-bottom:1px solid #F3F4F6;vertical-align:top;">
            <div style="font-weight:600;font-size:14px;color:#111827;margin-bottom:4px;">
              {escape(nom)} &nbsp;<span style="color:#6B7280;font-weight:400;">#{m['id']}</span>
            </div>
            <div style="font-size:13px;color:#6B7280;margin-bottom:8px;">
              {bien} &nbsp;·&nbsp; {prix_str} &nbsp;·&nbsp; Score {m['score']} &nbsp;·&nbsp; {date_str}
            </div>
            <div style="margin-bottom:8px;">{badges}</div>
            <ul style="margin:0;padding-left:18px;">{details}</ul>
          </td>
        </tr>"""

    return f"""<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>ImmoFlash QA</title></head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;padding:32px 0;">
<tr><td align="center">
<table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">

  <!-- Header -->
  <tr><td style="background:#1E3A5F;padding:24px 28px;">
    <p style="margin:0;color:#fff;font-size:18px;font-weight:700;">ImmoFlash — Rapport QA</p>
    <p style="margin:6px 0 0;color:#93C5FD;font-size:13px;">
      {escape(agence_slug)} &nbsp;·&nbsp; Dernières {periode_h}h &nbsp;·&nbsp; {datetime.now().strftime("%d/%m/%Y %H:%M")}
    </p>
  </td></tr>

  <!-- Stats -->
  <tr><td style="padding:24px 28px 0;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="text-align:center;padding:16px;background:#F0FDF4;border-radius:10px;width:30%;">
          <p style="margin:0;font-size:28px;font-weight:700;color:#16A34A;">{nb_analyses}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#6B7280;">matchings analysés</p>
        </td>
        <td style="width:5%;"></td>
        <td style="text-align:center;padding:16px;background:#FEF2F2;border-radius:10px;width:30%;">
          <p style="margin:0;font-size:28px;font-weight:700;color:#DC2626;">{len(anomalies)}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#6B7280;">anomalies détectées</p>
        </td>
        <td style="width:5%;"></td>
        <td style="text-align:center;padding:16px;background:#EFF6FF;border-radius:10px;width:30%;">
          <p style="margin:0;font-size:28px;font-weight:700;color:#2563EB;">{taux_ok}%</p>
          <p style="margin:4px 0 0;font-size:12px;color:#6B7280;">matchings corrects</p>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Légende -->
  <tr><td style="padding:20px 28px 0;">
    <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:.05em;">Légende</p>
    <div>
      {''.join(
          f'<span style="display:inline-block;background:{c};color:#fff;font-size:11px;font-weight:600;'
          f'padding:2px 8px;border-radius:20px;margin:2px 4px 2px 0;">{_ICONS[code]} {code.replace("_"," ")}</span>'
          for code, c in _COLORS.items()
      )}
    </div>
  </td></tr>

  <!-- Anomalies -->
  <tr><td style="padding:20px 28px 0;">
    <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#111827;">Détail des anomalies</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;border-radius:10px;overflow:hidden;">
      {rows_html}
    </table>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:24px 28px;border-top:1px solid #F3F4F6;margin-top:24px;">
    <p style="margin:0;font-size:12px;color:#9CA3AF;text-align:center;">
      Rapport automatique ImmoFlash · usage interne uniquement
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>"""


# ============================================================
# ENVOI EMAIL
# ============================================================

def envoyer_digest(db_path, agence_slug, depuis_heures=24):
    """
    Analyse les matchings récents et envoie le digest QA si anomalies détectées.
    Retourne {"sent": bool, "anomalies": int, "analyses": int}.
    """
    if not SMTP_USER or not SMTP_PASSWORD:
        log.warning("QA digest : SMTP non configuré, envoi ignoré.")
        return {"sent": False, "reason": "smtp_missing"}

    anomalies, nb_analyses = analyser_matchings(db_path, depuis_heures)

    if not anomalies:
        log.info(f"QA digest [{agence_slug}] : {nb_analyses} matchings analysés, aucune anomalie.")
        return {"sent": False, "anomalies": 0, "analyses": nb_analyses}

    html = _generer_html(anomalies, nb_analyses, agence_slug, depuis_heures)
    date_str = datetime.now().strftime("%d/%m/%Y")
    subject = f"ImmoFlash QA — {len(anomalies)} anomalie(s) · {agence_slug} · {date_str}"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = f"ImmoFlash QA <{SMTP_USER}>"
    msg["To"]      = ADMIN_EMAIL

    msg.attach(MIMEText(f"{len(anomalies)} anomalie(s) sur {nb_analyses} matchings analysés.", "plain", "utf-8"))
    msg.attach(MIMEText(html, "html", "utf-8"))

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        log.info(f"QA digest [{agence_slug}] envoyé : {len(anomalies)} anomalies / {nb_analyses} matchings.")
        return {"sent": True, "anomalies": len(anomalies), "analyses": nb_analyses}
    except Exception as e:
        log.error(f"QA digest [{agence_slug}] erreur envoi : {e}")
        return {"sent": False, "error": str(e)}
