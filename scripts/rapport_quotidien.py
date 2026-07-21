"""
Rapport quotidien ImmoFlash — un seul email qui regroupe :
  1. Le backup chiffré (agencies.db + data/*.db) en pièce jointe
  2. Le coût IA du mois (tokens Claude -> dollars/euros) par agence
  3. Les quotas des plans (matchings, emails, questions IA)
  4. L'état des syncs FTP Hektor (dernière sync, erreurs)
  5. La santé des bases (biens actifs, prospects, matchings, taille des fichiers)
Chaque bloc a un indicateur 🟢 / 🟠 / 🔴 et le sujet de l'email résume l'état global.

Usage :
  python scripts/rapport_quotidien.py            # envoie l'email quotidien (avec backup joint)
  python scripts/rapport_quotidien.py --alerte   # mode alerte : même rapport sans backup, sujet "Alerte"
                                                 # (appelé par scripts/monitor.py quand un problème apparaît)
  python scripts/rapport_quotidien.py --dry-run  # affiche le rapport, écrit rapport_quotidien.html, n'envoie rien

Cron serveur (remplace scripts/backup_offsite.py) :
  30 3 * * * cd /chemin/vers/projet-immo && python scripts/rapport_quotidien.py >> logs/rapport_quotidien.log 2>&1

Variables d'environnement utilisées :
  BACKUP_KEY            clé Fernet pour chiffrer le backup (comme backup_offsite.py)
  REPORT_EMAIL          destinataire (défaut : noabendiaf@gmail.com)
  DEMO_SMTP_SERVER/PORT/USER/PASSWORD  compte d'envoi système (contact@immoflash.app)
  EUR_USD_RATE          taux de conversion USD->EUR (défaut : 0.93)
"""
import glob
import io
import json
import os
import shutil
import smtplib
import socket
import sqlite3
import ssl
import subprocess
import sys
import tarfile
import urllib.request
from datetime import datetime, timedelta
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# Le script vit dans scripts/ mais s'exécute depuis la racine du projet
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
sys.path.insert(0, ROOT)

from dotenv import load_dotenv
load_dotenv()

from agencies_db import AGENCIES_DB_PATH, DATA_DIR, all_agencies, get_claude_usage, get_db_path, get_monthly_usage
from plans import PLANS

# ── Tarifs Claude (USD par million de tokens) ─────────────────────────────────
# Le scoring utilise claude-sonnet-4-20250514 et l'assistant claude-sonnet-4-6 :
# même tarif Sonnet. Les appels Haiku (extraction prospect, scraper) ne sont pas
# comptabilisés dans claude_usage — le coût affiché est donc un léger minimum.
PRIX_INPUT_USD_PAR_MTOK = 3.0
PRIX_OUTPUT_USD_PAR_MTOK = 15.0
EUR_USD_RATE = float(os.getenv("EUR_USD_RATE", "0.93"))

# ── Seuils des indicateurs ────────────────────────────────────────────────────
SEUIL_COUT_IA_ORANGE_EUR = 5.0    # coût IA mensuel par agence
SEUIL_COUT_IA_ROUGE_EUR = 15.0
SEUIL_QUOTA_ORANGE = 0.8          # 80 % d'un quota consommé
SEUIL_SYNC_ORANGE_H = 24          # dernière sync plus vieille que 24 h

VERT, ORANGE, ROUGE = "🟢", "🟠", "🔴"

DESTINATAIRE = os.getenv("REPORT_EMAIL", "noabendiaf@gmail.com")

# Slugs des vraies agences clientes : carte détaillée dans le rapport.
# Les autres (comptes test/démo) sont regroupées en une table compacte.
CLIENT_SLUGS = {s.strip() for s in os.getenv("CLIENT_SLUGS", "saint_francois").split(",") if s.strip()}

# Santé serveur
API_URL = os.getenv("HEALTH_URL", "http://127.0.0.1:8000/")
SERVICE_NAME = os.getenv("SERVICE_NAME", "immo-match")
DOMAINE_SSL = os.getenv("DOMAINE_SSL", "immoflash.app")
BACKUPS_DIR = os.getenv("BACKUPS_DIR", "backups")
MONITOR_STATE = ".monitor_state.json"   # état du moniteur temps réel (scripts/monitor.py)
SMTP = {
    "server": os.getenv("DEMO_SMTP_SERVER", "smtp.mail.ovh.net"),
    "port": int(os.getenv("DEMO_SMTP_PORT", "587")),
    "user": os.getenv("DEMO_SMTP_USER", "contact@immoflash.app"),
    "password": os.getenv("DEMO_SMTP_PASSWORD", ""),
}


# ══════════════════════════════════════════════════════════════════════════════
# 1. BACKUP CHIFFRÉ
# ══════════════════════════════════════════════════════════════════════════════

def creer_backup():
    """tar.gz de agencies.db + data/*.db, chiffré Fernet avec BACKUP_KEY.
    Retourne (nom_fichier, bytes, erreur). Déchiffrement :
      python -c "from cryptography.fernet import Fernet;import os,sys;open('b.tar.gz','wb').write(Fernet(os.environ['BACKUP_KEY'].encode()).decrypt(open(sys.argv[1],'rb').read()))" fichier.enc
    """
    fichiers = []
    if os.path.exists(AGENCIES_DB_PATH):
        fichiers.append(AGENCIES_DB_PATH)
    fichiers += sorted(glob.glob(os.path.join(DATA_DIR, "*.db")))
    if not fichiers:
        return None, None, "Aucune base de données trouvée"

    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode="w:gz") as tar:
        for f in fichiers:
            tar.add(f, arcname=os.path.basename(f) if f == AGENCIES_DB_PATH
                    else os.path.join("data", os.path.basename(f)))
    archive = buf.getvalue()

    cle = os.getenv("BACKUP_KEY", "")
    if not cle:
        return None, None, "BACKUP_KEY manquante — backup non chiffré, non joint"
    try:
        from cryptography.fernet import Fernet
        chiffre = Fernet(cle.encode()).encrypt(archive)
    except Exception as e:
        return None, None, f"Chiffrement impossible : {e}"

    nom = f"immoflash-backup-{datetime.now():%Y-%m-%d}.tar.gz.enc"
    return nom, chiffre, None


# ══════════════════════════════════════════════════════════════════════════════
# 2. SANTÉ DU SERVEUR (vue 360 : API, service, disque, RAM, logs, SSL, backups)
# ══════════════════════════════════════════════════════════════════════════════

def collecter_serveur():
    """Chaque check est indépendant : s'il n'est pas mesurable (ex : dry-run
    sous Windows), il est simplement omis du rapport."""
    s = {"items": [], "alertes": []}

    def add(label, valeur, statut=VERT, alerte=None):
        s["items"].append({"label": label, "valeur": valeur, "statut": statut})
        if alerte:
            s["alertes"].append(alerte)

    # API backend en local
    try:
        code = urllib.request.urlopen(API_URL, timeout=10).status
        if code == 200:
            add("API backend", "En ligne (HTTP 200)")
        else:
            add("API backend", f"HTTP {code}", ROUGE, f"API : code HTTP {code}")
    except Exception as e:
        add("API backend", f"Injoignable : {str(e)[:80]}", ROUGE, "API backend injoignable")

    # Service systemd
    try:
        r = subprocess.run(["systemctl", "is-active", SERVICE_NAME],
                           capture_output=True, text=True, timeout=10)
        etat = r.stdout.strip() or "inconnu"
        if etat == "active":
            add(f"Service {SERVICE_NAME}", "Actif")
        else:
            add(f"Service {SERVICE_NAME}", etat, ROUGE, f"Service {SERVICE_NAME} : {etat}")
    except Exception:
        pass

    # Disque
    try:
        total, used, free = shutil.disk_usage(ROOT)
        pct = used / total * 100
        statut = ROUGE if pct >= 90 else ORANGE if pct >= 80 else VERT
        add("Disque", f"{pct:.0f} % utilisé · {free // 2**30} Go libres", statut,
            f"Disque presque plein ({pct:.0f} %)" if statut == ROUGE else None)
    except Exception:
        pass

    # RAM (Linux)
    try:
        info = {}
        with open("/proc/meminfo") as f:
            for line in f:
                k, v = line.split(":", 1)
                info[k] = int(v.strip().split()[0])
        pct = (1 - info["MemAvailable"] / info["MemTotal"]) * 100
        statut = ROUGE if pct >= 90 else ORANGE if pct >= 80 else VERT
        add("RAM", f"{pct:.0f} % utilisée · {info['MemAvailable'] // 1024} Mo dispo", statut,
            f"RAM saturée ({pct:.0f} %)" if statut == ROUGE else None)
    except Exception:
        pass

    # Charge CPU (moyenne 15 min)
    try:
        load = os.getloadavg()[2]
        nb_cpu = os.cpu_count() or 1
        statut = ROUGE if load > nb_cpu else ORANGE if load > nb_cpu * 0.7 else VERT
        add("Charge CPU", f"{load:.2f} (sur {nb_cpu} cœur(s), moy. 15 min)", statut)
    except Exception:
        pass

    # Erreurs du backend sur 24 h (journalctl)
    try:
        r = subprocess.run(["journalctl", "-u", SERVICE_NAME, "--since", "24 hours ago",
                            "-p", "err", "--no-pager", "-q"],
                           capture_output=True, text=True, timeout=20)
        nb = len([l for l in r.stdout.splitlines() if l.strip()])
        statut = VERT if nb == 0 else ORANGE if nb < 20 else ROUGE
        add("Erreurs backend (24 h)", f"{nb} ligne(s) en erreur dans les logs", statut,
            f"{nb} erreurs backend en 24 h" if statut == ROUGE else None)
    except Exception:
        pass

    # Backups locaux (backup.sh de 3h00)
    try:
        dossiers = sorted(glob.glob(os.path.join(BACKUPS_DIR, "*")))
        if dossiers:
            dernier = max(dossiers, key=os.path.getmtime)
            age_h = (datetime.now() - datetime.fromtimestamp(os.path.getmtime(dernier))).total_seconds() / 3600
            statut = VERT if age_h < 26 else ROUGE
            add("Backups locaux", f"{len(dossiers)} conservés · dernier il y a {age_h:.0f} h", statut,
                f"Dernier backup local vieux de {age_h:.0f} h" if statut == ROUGE else None)
    except Exception:
        pass

    # Certificat SSL du domaine public
    try:
        ctx = ssl.create_default_context()
        with socket.create_connection((DOMAINE_SSL, 443), timeout=10) as sock:
            with ctx.wrap_socket(sock, server_hostname=DOMAINE_SSL) as tls:
                exp = datetime.strptime(tls.getpeercert()["notAfter"], "%b %d %H:%M:%S %Y %Z")
        jours = (exp - datetime.now()).days
        statut = ROUGE if jours < 7 else ORANGE if jours < 15 else VERT
        add(f"Certificat SSL ({DOMAINE_SSL})", f"Expire dans {jours} j", statut,
            f"Certificat SSL expire dans {jours} j" if statut != VERT else None)
    except Exception:
        pass

    # État du moniteur temps réel (monitor.py, toutes les 15 min)
    try:
        with open(MONITOR_STATE) as f:
            problemes = json.load(f).get("problems", [])
        if problemes:
            add("Moniteur temps réel", " · ".join(p[:80] for p in problemes), ROUGE,
                f"Moniteur : {len(problemes)} problème(s) en cours")
        else:
            add("Moniteur temps réel", "Aucun problème en cours")
    except Exception:
        pass

    return s


# ══════════════════════════════════════════════════════════════════════════════
# 2 bis. STRIPE (revenus, abonnements, paiements échoués)
# ══════════════════════════════════════════════════════════════════════════════

def _sv(obj, cle, defaut=None):
    """Accès sécurisé aux objets Stripe v15+ (plus des dicts : pas de .get())."""
    try:
        return obj[cle] if obj[cle] is not None else defaut
    except Exception:
        return defaut


def collecter_stripe():
    """Retourne None si pas de clé configurée. Utilise STRIPE_SECRET_KEY :
    avec une clé sk_test_ les chiffres sont ceux du mode test (bandeau orange)."""
    cle = os.getenv("STRIPE_SECRET_KEY", "").strip()
    if not cle:
        return None
    s = {"mode_test": cle.startswith("sk_test"), "items": [], "alertes": [], "erreur": None}
    try:
        import stripe
        stripe.api_key = cle
        maintenant = datetime.now()
        debut_mois = int(datetime(maintenant.year, maintenant.month, 1).timestamp())

        # Solde du compte
        bal = stripe.Balance.retrieve()
        dispo = sum(b["amount"] for b in bal["available"]) / 100
        attente = sum(b["amount"] for b in bal["pending"]) / 100
        s["items"].append({"label": "Solde Stripe", "statut": VERT,
                           "valeur": f"{dispo:.2f} € disponible · {attente:.2f} € en attente"})

        # Encaissé / échoué ce mois (100 derniers paiements max)
        encaisse, nb_ok, nb_echoues = 0, 0, 0
        for ch in stripe.Charge.list(created={"gte": debut_mois}, limit=100)["data"]:
            if ch["status"] == "succeeded":
                encaisse += ch["amount"]
                nb_ok += 1
            elif ch["status"] == "failed":
                nb_echoues += 1
        s["items"].append({"label": "Encaissé ce mois", "statut": VERT,
                           "valeur": f"{encaisse / 100:.2f} € · {nb_ok} paiement(s)"})
        statut_echecs = VERT if nb_echoues == 0 else ROUGE
        s["items"].append({"label": "Paiements échoués (mois)", "statut": statut_echecs,
                           "valeur": str(nb_echoues)})
        if nb_echoues:
            s["alertes"].append(f"{nb_echoues} paiement(s) Stripe échoué(s) ce mois")

        # Abonnements actifs + revenu mensuel récurrent
        subs = stripe.Subscription.list(status="active", limit=100)["data"]
        mrr = 0
        for sub in subs:
            for it in _sv(sub, "items", {"data": []})["data"]:
                prix = _sv(it, "price", {})
                montant = (_sv(prix, "unit_amount", 0) or 0) * (_sv(it, "quantity", 1) or 1)
                if _sv(_sv(prix, "recurring", {}), "interval") == "year":
                    montant /= 12
                mrr += montant
        s["items"].append({"label": "Abonnements actifs", "statut": VERT,
                           "valeur": f"{len(subs)} · revenu récurrent ≈ {mrr / 100:.2f} €/mois"})
    except Exception as e:
        s["erreur"] = str(e)[:150]
        s["alertes"].append(f"Stripe injoignable : {str(e)[:80]}")
    return s


# ══════════════════════════════════════════════════════════════════════════════
# 3. COLLECTE DES MÉTRIQUES PAR AGENCE
# ══════════════════════════════════════════════════════════════════════════════

def _query_one(conn, sql, params=()):
    try:
        row = conn.execute(sql, params).fetchone()
        return row[0] if row else None
    except Exception:
        return None


def collecter_agence(agency):
    """Toutes les métriques d'une agence. Chaque bloc est tolérant aux erreurs."""
    slug = agency["slug"]
    m = {"slug": slug, "nom": agency.get("nom") or slug,
         "plan_id": agency.get("plan_id") or "agence", "alertes": []}

    # ── Coût IA (table claude_usage, mois courant) ────────────────────────────
    usage = get_claude_usage(slug)
    cout_usd = (usage["input_tokens"] / 1e6 * PRIX_INPUT_USD_PAR_MTOK
                + usage["output_tokens"] / 1e6 * PRIX_OUTPUT_USD_PAR_MTOK)
    m["ia"] = {
        "nb_appels": usage["nb_appels"],
        "input_tokens": usage["input_tokens"],
        "output_tokens": usage["output_tokens"],
        "cout_eur": round(cout_usd * EUR_USD_RATE, 2),
    }
    if m["ia"]["cout_eur"] >= SEUIL_COUT_IA_ROUGE_EUR:
        m["ia"]["statut"] = ROUGE
        m["alertes"].append(f"Coût IA élevé : {m['ia']['cout_eur']} € ce mois")
    elif m["ia"]["cout_eur"] >= SEUIL_COUT_IA_ORANGE_EUR:
        m["ia"]["statut"] = ORANGE
    else:
        m["ia"]["statut"] = VERT

    # ── Quotas du plan ────────────────────────────────────────────────────────
    plan = PLANS.get(m["plan_id"]) or PLANS["agence"]
    mensuel = get_monthly_usage(slug)
    m["quotas"] = []
    for label, compteur, cle_plan in [
        ("Matchings", mensuel["matchings_count"], "max_matchings_mois"),
        ("Emails", mensuel["emails_count"], "max_emails_mois"),
        ("Questions IA", mensuel["questions_ia_count"], "max_questions_ia_mois"),
    ]:
        limite = plan[cle_plan]
        if limite is None:
            statut, texte = VERT, f"{compteur} / illimité"
        else:
            ratio = compteur / limite if limite else 1
            texte = f"{compteur} / {limite}"
            if ratio >= 1:
                statut = ROUGE
                m["alertes"].append(f"Quota {label} atteint ({texte})")
            elif ratio >= SEUIL_QUOTA_ORANGE:
                statut = ORANGE
            else:
                statut = VERT
        m["quotas"].append({"label": label, "texte": texte, "statut": statut})

    # ── Sync FTP + santé de la base agence ────────────────────────────────────
    db_path = get_db_path(slug)
    m["db_mo"] = round(os.path.getsize(db_path) / 1e6, 2) if os.path.exists(db_path) else None
    m["sync"] = {"statut": VERT, "texte": "—"}
    m["donnees"] = {}
    try:
        conn = sqlite3.connect(db_path)

        last_sync = _query_one(conn, "SELECT value FROM settings WHERE key='last_hektor_sync'")
        last_err = _query_one(conn, "SELECT value FROM settings WHERE key='last_sync_error'")
        ftp_host = _query_one(conn, "SELECT value FROM settings WHERE key='ftp_host'")
        if last_err:
            m["sync"] = {"statut": ROUGE, "texte": f"Erreur : {last_err[:120]}"}
            m["alertes"].append(f"Sync FTP en erreur : {last_err[:80]}")
        elif last_sync:
            age_h = (datetime.now() - datetime.fromisoformat(last_sync)).total_seconds() / 3600
            texte = f"il y a {age_h:.0f} h"
            if age_h > SEUIL_SYNC_ORANGE_H:
                m["sync"] = {"statut": ORANGE, "texte": f"Ancienne ({texte})"}
                m["alertes"].append(f"Dernière sync FTP {texte}")
            else:
                m["sync"] = {"statut": VERT, "texte": f"OK ({texte})"}
        elif ftp_host:
            m["sync"] = {"statut": ORANGE, "texte": "FTP configuré mais jamais synchronisé"}
        else:
            m["sync"] = {"statut": VERT, "texte": "Pas de FTP configuré"}

        hier = (datetime.now() - timedelta(hours=24)).isoformat()
        m["donnees"] = {
            "biens_actifs": _query_one(conn, "SELECT COUNT(*) FROM biens WHERE statut IS NULL OR statut='actif'"),
            "biens_vendus": _query_one(conn, "SELECT COUNT(*) FROM biens WHERE statut='vendu'"),
            "prospects": _query_one(conn, "SELECT COUNT(*) FROM prospects WHERE archive IS NULL OR archive=0"),
            "matchings": _query_one(conn, "SELECT COUNT(*) FROM matchings"),
            "score_moyen": _query_one(conn, "SELECT ROUND(AVG(score),1) FROM matchings"),
            # Activité des dernières 24 h
            "biens_24h": _query_one(conn, "SELECT COUNT(*) FROM biens WHERE date_creation >= ?", (hier,)),
            "matchings_24h": _query_one(conn, "SELECT COUNT(*) FROM matchings WHERE date_analyse >= ?", (hier,)),
        }
        conn.close()
    except Exception as e:
        m["sync"] = {"statut": ROUGE, "texte": f"Base illisible : {e}"}
        m["alertes"].append(f"Base {slug} illisible : {e}")

    return m


# ══════════════════════════════════════════════════════════════════════════════
# 3. CONSTRUCTION DE L'EMAIL HTML
# ══════════════════════════════════════════════════════════════════════════════

def _pire_statut(a):
    """Pastille globale d'une agence = le pire de ses indicateurs."""
    statuts = [a["ia"]["statut"], a["sync"]["statut"]] + [q["statut"] for q in a["quotas"]]
    return ROUGE if ROUGE in statuts else ORANGE if ORANGE in statuts else VERT


def _ligne(label, valeur, statut=""):
    return (f"<tr><td style='padding:4px 10px;color:#555'>{label}</td>"
            f"<td style='padding:4px 10px;font-weight:600'>{statut} {valeur}</td></tr>")


def construire_html(agences, serveur, stripe_data, backup_nom, backup_taille_mo, backup_erreur, alertes, mode_alerte=False):
    date_fr = datetime.now().strftime("%d/%m/%Y")
    mois = datetime.now().strftime("%Y-%m")
    titre = "Alerte" if mode_alerte else f"Rapport quotidien du {date_fr}"

    if any(a.startswith(ROUGE) for a in alertes):
        bandeau, couleur = f"{ROUGE} {sum(1 for a in alertes if a.startswith(ROUGE))} alerte(s) à traiter", "#c0392b"
    elif alertes:
        bandeau, couleur = f"{ORANGE} {len(alertes)} point(s) de vigilance", "#e67e22"
    else:
        bandeau, couleur = f"{VERT} Tout va bien", "#27ae60"

    html = f"""<html><body style="font-family:Arial,sans-serif;background:#f4f6f8;padding:20px">
<div style="max-width:640px;margin:auto;background:#fff;border-radius:8px;overflow:hidden">
  <div style="background:#1E3A5F;color:#fff;padding:18px 24px">
    <h2 style="margin:0">ImmoFlash — {titre}</h2>
    <div style="margin-top:6px;font-size:15px;color:{couleur};background:#fff;display:inline-block;
                padding:3px 10px;border-radius:12px;font-weight:600">{bandeau}</div>
  </div>
  <div style="padding:20px 24px">"""

    if alertes:
        html += "<div style='background:#fdf2ec;border-left:4px solid #e67e22;padding:10px 14px;border-radius:4px;margin-bottom:16px'>"
        html += "".join(f"<div style='padding:2px 0'>{a}</div>" for a in alertes)
        html += "</div>"

    # Santé du serveur
    if serveur["items"]:
        pire = ROUGE if any(i["statut"] == ROUGE for i in serveur["items"]) \
            else ORANGE if any(i["statut"] == ORANGE for i in serveur["items"]) else VERT
        html += (f"<h3>{pire} Serveur</h3>"
                 "<table style='width:100%;border-collapse:collapse;font-size:14px'>")
        for i in serveur["items"]:
            html += _ligne(i["label"], i["valeur"], i["statut"])
        html += "</table>"

    # Backup (absent en mode alerte pour rester léger)
    if mode_alerte:
        pass
    elif backup_erreur:
        html += f"<h3>{ROUGE} Sauvegarde</h3><p>{backup_erreur}</p>"
    else:
        html += (f"<h3>{VERT} Sauvegarde</h3>"
                 f"<p>Backup chiffré joint : <code>{backup_nom}</code> ({backup_taille_mo} Mo). "
                 f"Contenu : agencies.db + data/*.db. Déchiffrement : clé BACKUP_KEY "
                 f"(voir scripts/rapport_quotidien.py).</p>")

    # Stripe (revenus)
    if stripe_data:
        if stripe_data["erreur"]:
            html += f"<h3>{ROUGE} Stripe</h3><p>Erreur : {stripe_data['erreur']}</p>"
        else:
            pire = ROUGE if any(i["statut"] == ROUGE for i in stripe_data["items"]) else VERT
            note_test = (" <span style='color:#e67e22;font-size:12px;font-weight:600'>"
                         "⚠ clé en mode TEST — pas les vrais paiements</span>") if stripe_data["mode_test"] else ""
            html += (f"<h3>{pire} Stripe (revenus){note_test}</h3>"
                     "<table style='width:100%;border-collapse:collapse;font-size:14px'>")
            for i in stripe_data["items"]:
                html += _ligne(i["label"], i["valeur"], i["statut"])
            html += "</table>"

    clientes = [a for a in agences if a["slug"] in CLIENT_SLUGS]
    tests = [a for a in agences if a["slug"] not in CLIENT_SLUGS]

    # Coût IA global (clients mis en avant, comptes test à part)
    cout_clients = round(sum(a["ia"]["cout_eur"] for a in clientes), 2)
    cout_tests = round(sum(a["ia"]["cout_eur"] for a in tests), 2)
    appels_total = sum(a["ia"]["nb_appels"] for a in agences)
    html += (f"<h3>Coût IA du mois ({mois})</h3>"
             f"<p style='font-size:20px;margin:4px 0'><b>{cout_clients} €</b> "
             f"<span style='color:#777;font-size:13px'>clients · {cout_tests} € comptes test · "
             f"{appels_total} appels Claude au total (hors extraction Haiku, non comptabilisée)</span></p>")

    # Carte détaillée pour chaque vraie agence cliente
    for a in clientes:
        pire = _pire_statut(a)
        d = a["donnees"]
        html += f"""
  <div style="border:1px solid #e3e8ee;border-radius:6px;margin:14px 0;overflow:hidden">
    <div style="background:#f0f4f8;padding:8px 14px;font-weight:700">{pire} {a['nom']}
      <span style="color:#888;font-weight:400;font-size:12px">({a['plan_id']})</span></div>
    <table style="width:100%;border-collapse:collapse;font-size:14px">"""
        html += _ligne("Coût IA du mois", f"{a['ia']['cout_eur']} € · {a['ia']['nb_appels']} appels · "
                       f"{a['ia']['input_tokens']:,} in / {a['ia']['output_tokens']:,} out".replace(",", " "),
                       a["ia"]["statut"])
        for q in a["quotas"]:
            html += _ligne(f"Quota {q['label']}", q["texte"], q["statut"])
        html += _ligne("Sync Hektor", a["sync"]["texte"], a["sync"]["statut"])
        if d:
            html += _ligne("Biens actifs / vendus", f"{d.get('biens_actifs', '—')} / {d.get('biens_vendus', '—')}")
            html += _ligne("Prospects actifs", d.get("prospects", "—"))
            score = f" · score moyen {d['score_moyen']}" if d.get("score_moyen") else ""
            html += _ligne("Matchings", f"{d.get('matchings', '—')}{score}")
            html += _ligne("Activité 24 h", f"{d.get('biens_24h') or 0} nouveau(x) bien(s) · "
                           f"{d.get('matchings_24h') or 0} matching(s) analysé(s)")
        if a["db_mo"] is not None:
            html += _ligne("Taille base", f"{a['db_mo']} Mo")
        html += "</table></div>"

    # Les comptes test ne sont pas détaillés : seul leur coût IA agrégé
    # apparaît dans la ligne "Coût IA du mois" ci-dessus.

    html += f"""
  </div>
  <div style="background:#f0f4f8;color:#888;padding:10px 24px;font-size:12px">
    Généré automatiquement par scripts/rapport_quotidien.py · seuils : coût IA {SEUIL_COUT_IA_ORANGE_EUR}€/{SEUIL_COUT_IA_ROUGE_EUR}€,
    quotas {int(SEUIL_QUOTA_ORANGE*100)}%, sync {SEUIL_SYNC_ORANGE_H}h
  </div>
</div></body></html>"""
    return html, bandeau


# ══════════════════════════════════════════════════════════════════════════════
# 4. ENVOI
# ══════════════════════════════════════════════════════════════════════════════

def envoyer(html, sujet, backup_nom, backup_bytes):
    msg = MIMEMultipart("mixed")
    msg["Subject"] = sujet
    msg["From"] = f"ImmoFlash <{SMTP['user']}>"
    msg["To"] = DESTINATAIRE
    msg.attach(MIMEText(html, "html", "utf-8"))

    if backup_bytes:
        piece = MIMEApplication(backup_bytes)
        piece.add_header("Content-Disposition", "attachment", filename=backup_nom)
        msg.attach(piece)

    with smtplib.SMTP(SMTP["server"], SMTP["port"]) as s:
        s.ehlo(); s.starttls(); s.ehlo()
        s.login(SMTP["user"], SMTP["password"])
        s.sendmail(SMTP["user"], [DESTINATAIRE], msg.as_string())


def main():
    dry_run = "--dry-run" in sys.argv
    mode_alerte = "--alerte" in sys.argv
    # Console Windows en cp1252 : éviter le crash sur les emojis des indicateurs
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    if mode_alerte:
        backup_nom, backup_bytes, backup_erreur, backup_mo = None, None, None, 0
    else:
        backup_nom, backup_bytes, backup_erreur = creer_backup()
        backup_mo = round(len(backup_bytes) / 1e6, 2) if backup_bytes else 0

    serveur = collecter_serveur()
    stripe_data = collecter_stripe()
    agences, alertes = [], [f"{ROUGE} <b>Serveur</b> — {a}" for a in serveur["alertes"]]
    if stripe_data:
        alertes += [f"{ROUGE} <b>Stripe</b> — {a}" for a in stripe_data["alertes"]]
    for agency in all_agencies():
        try:
            m = collecter_agence(agency)
            agences.append(m)
            # Seules les vraies agences clientes remontent des alertes
            if m["slug"] in CLIENT_SLUGS:
                alertes += [f"{ROUGE if any(x in a for x in ('erreur', 'atteint', 'illisible', 'élevé')) else ORANGE} "
                            f"<b>{m['nom']}</b> — {a}" for a in m["alertes"]]
        except Exception as e:
            alertes.append(f"{ROUGE} <b>{agency.get('nom', agency['slug'])}</b> — collecte impossible : {e}")
    if backup_erreur:
        alertes.insert(0, f"{ROUGE} <b>Backup</b> — {backup_erreur}")

    html, bandeau = construire_html(agences, serveur, stripe_data, backup_nom, backup_mo, backup_erreur, alertes, mode_alerte)
    sujet = (f"[ImmoFlash] {'Alerte' if mode_alerte else f'Rapport quotidien {datetime.now():%d/%m/%Y}'}"
             f" — {bandeau}")

    if dry_run:
        with open("rapport_quotidien.html", "w", encoding="utf-8") as f:
            f.write(html)
        print(f"Sujet : {sujet}")
        print(f"Backup : {backup_nom or backup_erreur or 'aucun (mode alerte)'} ({backup_mo} Mo)")
        for a in agences:
            print(f"  {a['nom']} ({a['plan_id']}) : IA {a['ia']['cout_eur']}€/{a['ia']['nb_appels']} appels, "
                  f"sync {a['sync']['statut']} {a['sync']['texte']}, données {a['donnees']}")
        print(f"Alertes : {len(alertes)}")
        print("HTML écrit dans rapport_quotidien.html — rien n'a été envoyé.")
        return

    envoyer(html, sujet, backup_nom, backup_bytes)
    print(f"Email envoyé à {DESTINATAIRE} ({sujet}, backup {backup_mo} Mo)")


if __name__ == "__main__":
    main()
