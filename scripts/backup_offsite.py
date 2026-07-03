#!/usr/bin/env python3
"""
Backup hors-site chiffré — ImmoFlash.

Archive agencies.db + data/*.db, CHIFFRE l'archive (Fernet), puis l'envoie par
email vers une adresse hors du VPS. Objectif : garder une copie des données même
si le serveur est perdu (les backups locaux de backup.sh disparaissent avec lui).

Les données prospects sont des données personnelles : l'archive est chiffrée
AVANT l'envoi, Gmail ne stocke donc que du chiffré. La clé BACKUP_KEY reste sur
le VPS (dans .env) — pour restaurer : déchiffrer avec cette clé.

Restauration :
    python -c "from cryptography.fernet import Fernet; \
      open('backup.tar.gz','wb').write(Fernet(b'<BACKUP_KEY>').decrypt(open('backup.tar.gz.enc','rb').read()))"

Cron quotidien recommandé (après le backup local de 3h) :
    30 3 * * * /app/venv/bin/python /app/scripts/backup_offsite.py >> /var/log/immo-backup.log 2>&1

Limite : l'email plafonne autour de 20-25 Mo. Au-delà (croissance du nombre
d'agences), basculer sur un stockage objet (Backblaze B2 / S3 via restic).
"""
import os
import io
import ssl
import sys
import glob
import tarfile
import smtplib
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication

from dotenv import load_dotenv
from cryptography.fernet import Fernet

APP_DIR = "/app"
load_dotenv(os.path.join(APP_DIR, ".env"))

DEST_EMAIL = os.getenv("BACKUP_EMAIL", os.getenv("ALERT_EMAIL", "noabendiaf@gmail.com"))
BACKUP_KEY = os.getenv("BACKUP_KEY", "").encode()
MAX_BYTES = 22 * 1024 * 1024  # limite raisonnable pour une pièce jointe email

SMTP = {
    "server":   os.getenv("DEMO_SMTP_SERVER", "smtp.mail.ovh.net"),
    "port":     int(os.getenv("DEMO_SMTP_PORT", "587")),
    "user":     os.getenv("DEMO_SMTP_USER", "contact@immoflash.app"),
    "password": os.getenv("DEMO_SMTP_PASSWORD", ""),
}


def build_archive() -> bytes:
    """tar.gz en mémoire de agencies.db + data/*.db."""
    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode="w:gz") as tar:
        agencies = os.path.join(APP_DIR, "agencies.db")
        if os.path.exists(agencies):
            tar.add(agencies, arcname="agencies.db")
        for db in glob.glob(os.path.join(APP_DIR, "data", "*.db")):
            if os.path.getsize(db) > 0:
                tar.add(db, arcname=os.path.join("data", os.path.basename(db)))
    return buf.getvalue()


def main():
    if len(BACKUP_KEY) < 32:
        print("BACKUP_KEY absente ou invalide — abandon. "
              "Générer : python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\"",
              file=sys.stderr)
        sys.exit(1)

    archive = build_archive()
    encrypted = Fernet(BACKUP_KEY).encrypt(archive)
    size_mb = len(encrypted) / (1024 * 1024)
    stamp = datetime.now().strftime("%Y-%m-%d")

    if len(encrypted) > MAX_BYTES:
        print(f"Archive chiffrée trop lourde ({size_mb:.1f} Mo > 22 Mo) : "
              "email non envoyé. Passer à un stockage objet (Backblaze B2/S3).",
              file=sys.stderr)
        sys.exit(1)

    msg = MIMEMultipart()
    msg["Subject"] = f"[ImmoFlash] Backup chiffré {stamp} ({size_mb:.1f} Mo)"
    msg["From"] = f"ImmoFlash Backup <{SMTP['user']}>"
    msg["To"] = DEST_EMAIL
    msg.attach(MIMEText(
        f"Sauvegarde chiffrée du {stamp}.\n"
        f"Contenu : agencies.db + data/*.db. Taille chiffrée : {size_mb:.1f} Mo.\n"
        "Déchiffrer avec la clé BACKUP_KEY (voir scripts/backup_offsite.py).\n",
        "plain", "utf-8"))
    part = MIMEApplication(encrypted, Name=f"immoflash-backup-{stamp}.tar.gz.enc")
    part["Content-Disposition"] = f'attachment; filename="immoflash-backup-{stamp}.tar.gz.enc"'
    msg.attach(part)

    ctx = ssl.create_default_context()
    with smtplib.SMTP(SMTP["server"], SMTP["port"], timeout=30) as s:
        s.ehlo(); s.starttls(context=ctx); s.ehlo()
        s.login(SMTP["user"], SMTP["password"])
        s.sendmail(SMTP["user"], [DEST_EMAIL], msg.as_string())
    print(f"[{datetime.now():%Y-%m-%d %H:%M}] Backup hors-site envoyé à {DEST_EMAIL} ({size_mb:.1f} Mo)")


if __name__ == "__main__":
    main()
