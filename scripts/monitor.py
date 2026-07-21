#!/usr/bin/env python3
"""
Surveillance ImmoFlash — alerte par email si quelque chose tombe.

Vérifie : l'API répond, le service tourne, le disque n'est pas plein, et aucune
agence n'a d'erreur de synchronisation Hektor récente. Envoie un email seulement
quand l'état change (pas de spam) ou si un problème persiste depuis > 6h.

L'alerte est envoyée sous la forme du rapport 360 (scripts/rapport_quotidien.py
--alerte) : même mise en page que le rapport quotidien, bandeau rouge, sans
backup joint. Si cet envoi échoue, un email texte simple part en secours.

À lancer en cron toutes les 15 min sur le VPS :
    */15 * * * * /app/venv/bin/python /app/scripts/monitor.py >> /var/log/immo-monitor.log 2>&1
"""
import os
import ssl
import sys
import glob
import json
import time
import shutil
import smtplib
import sqlite3
import subprocess
import urllib.request
from datetime import datetime, timedelta
from email.mime.text import MIMEText

from dotenv import load_dotenv

APP_DIR = "/app"
load_dotenv(os.path.join(APP_DIR, ".env"))

ALERT_EMAIL = os.getenv("ALERT_EMAIL", "noabendiaf@gmail.com")
STATE_FILE = os.path.join(APP_DIR, ".monitor_state.json")
RESEND_AFTER = 6 * 3600  # ré-alerte si un problème persiste plus de 6h

SMTP = {
    "server":   os.getenv("DEMO_SMTP_SERVER", "smtp.mail.ovh.net"),
    "port":     int(os.getenv("DEMO_SMTP_PORT", "587")),
    "user":     os.getenv("DEMO_SMTP_USER", "contact@immoflash.app"),
    "password": os.getenv("DEMO_SMTP_PASSWORD", ""),
}


def check_api():
    try:
        req = urllib.request.urlopen("http://127.0.0.1:8000/", timeout=10)
        if req.status != 200:
            return f"API : code HTTP {req.status}"
    except Exception as e:
        return f"API injoignable en local : {e}"
    return None


def check_disk():
    total, used, free = shutil.disk_usage(APP_DIR)
    pct_free = free / total * 100
    if pct_free < 10:
        return f"Disque presque plein : {pct_free:.0f}% libre ({free // (1024**3)} Go)"
    return None


def check_sync_errors():
    problems = []
    cutoff = datetime.now() - timedelta(hours=48)
    for db in glob.glob(os.path.join(APP_DIR, "data", "*.db")):
        try:
            conn = sqlite3.connect(db)
            err = conn.execute("SELECT value FROM settings WHERE key='last_sync_error'").fetchone()
            err_at = conn.execute("SELECT value FROM settings WHERE key='last_sync_error_at'").fetchone()
            conn.close()
        except Exception:
            continue
        if err and err[0]:
            recent = True
            if err_at and err_at[0]:
                try:
                    recent = datetime.fromisoformat(err_at[0]) > cutoff
                except ValueError:
                    recent = True
            if recent:
                agence = os.path.basename(db).replace(".db", "")
                problems.append(f"Sync KO ({agence}) : {err[0][:120]}")
    return problems


def send_alert(problems):
    """Envoie le rapport 360 en mode alerte ; email texte simple en secours."""
    try:
        subprocess.run(
            [os.path.join(APP_DIR, "venv", "bin", "python"),
             os.path.join(APP_DIR, "scripts", "rapport_quotidien.py"), "--alerte"],
            cwd=APP_DIR, check=True, timeout=300,
        )
        return
    except Exception as e:
        print(f"[{datetime.now():%H:%M}] Rapport alerte KO ({e}), envoi texte de secours", file=sys.stderr)
    _send_alert_texte(problems)


def _send_alert_texte(problems):
    body = (
        "ALERTE ImmoFlash — un ou plusieurs problèmes détectés le "
        f"{datetime.now().strftime('%d/%m/%Y à %H:%M')} :\n\n"
        + "\n".join(f"  - {p}" for p in problems)
        + "\n\nVérifie le VPS : ssh root@178.104.57.75\n"
        "  systemctl status immo-match\n"
        "  journalctl -u immo-match -n 50\n"
    )
    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = f"[ALERTE ImmoFlash] {len(problems)} probleme(s) detecte(s)"
    msg["From"] = f"ImmoFlash Monitor <{SMTP['user']}>"
    msg["To"] = ALERT_EMAIL
    ctx = ssl.create_default_context()
    with smtplib.SMTP(SMTP["server"], SMTP["port"], timeout=20) as s:
        s.ehlo(); s.starttls(context=ctx); s.ehlo()
        s.login(SMTP["user"], SMTP["password"])
        s.sendmail(SMTP["user"], [ALERT_EMAIL], msg.as_string())


def load_state():
    try:
        with open(STATE_FILE) as f:
            return json.load(f)
    except Exception:
        return {"problems": [], "last_alert": 0}


def save_state(state):
    try:
        with open(STATE_FILE, "w") as f:
            json.dump(state, f)
    except Exception:
        pass


def main():
    problems = []
    for check in (check_api, check_disk):
        p = check()
        if p:
            problems.append(p)
    problems.extend(check_sync_errors())

    state = load_state()
    now = time.time()

    if not problems:
        if state.get("problems"):
            print(f"[{datetime.now():%H:%M}] Retour à la normale.")
        save_state({"problems": [], "last_alert": 0})
        return

    changed = set(problems) != set(state.get("problems", []))
    stale = now - state.get("last_alert", 0) > RESEND_AFTER
    if changed or stale:
        # Sauvegarder l'état AVANT l'envoi pour que le rapport alerte
        # affiche les problèmes en cours dans sa ligne "Moniteur temps réel"
        save_state({"problems": problems, "last_alert": now})
        try:
            send_alert(problems)
            print(f"[{datetime.now():%H:%M}] Alerte envoyée : {problems}")
        except Exception as e:
            print(f"[{datetime.now():%H:%M}] Echec envoi alerte : {e}", file=sys.stderr)
            save_state({"problems": problems, "last_alert": state.get("last_alert", 0)})
    else:
        print(f"[{datetime.now():%H:%M}] Problème connu déjà signalé : {problems}")


if __name__ == "__main__":
    main()
