import sqlite3
from logger import get_logger
log = get_logger('sync')
import os
import re
import socket
import zipfile
import ftplib
import threading
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends

from agencies_db import get_db_path, all_agencies
from routers.auth import get_current_user
from routers.matchings import get_settings_values, _core_analyser_bien
from routers.biens import parse_hektor_cols

router = APIRouter()

# Scheduler global
from apscheduler.schedulers.background import BackgroundScheduler
scheduler = BackgroundScheduler()
scheduler_started = False


def sync_hektor_ftp(db_path: str = None):
    """Synchronise les biens depuis le FTP Hektor (supporte ZIP)"""
    db_path = db_path or get_db_path("saint_francois")
    settings = get_settings_values(db_path)

    ftp_host = settings.get('ftp_host', '')
    ftp_user = settings.get('ftp_user', '')
    ftp_pass = settings.get('ftp_pass', '')
    ftp_port = int(settings.get('ftp_port', 21))
    ftp_path = settings.get('ftp_path', '')

    if not all([ftp_host, ftp_user, ftp_pass, ftp_path]):
        log.warning("Sync FTP : Configuration incomplète")
        return {"error": "Configuration FTP incomplète"}

    log.info(f"Sync Hektor : Connexion à {ftp_host}...")

    try:
        # Connexion FTP
        ftp = ftplib.FTP()
        ftp.connect(ftp_host, ftp_port, timeout=30)
        ftp.login(ftp_user, ftp_pass)
        log.info("Connecté au FTP")

        # Télécharger le fichier
        is_zip = ftp_path.lower().endswith('.zip')
        local_file = "hektor_download.zip" if is_zip else "Annonces_hektor.csv"

        with open(local_file, "wb") as f:
            ftp.retrbinary(f"RETR {ftp_path}", f.write)

        ftp.quit()
        log.info(f"Fichier téléchargé : {local_file}")

        # Si c'est un ZIP, extraire Annonces.csv
        csv_file = "Annonces_hektor.csv"
        if is_zip:
            log.info("Extraction du ZIP...")
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
                    log.debug(f"Fichiers dans le ZIP : {files}")
                    return {"error": f"Annonces.csv non trouvé dans le ZIP. Fichiers disponibles: {files}"}

                # Extraire le fichier CSV
                with zip_ref.open(csv_found) as zf:
                    with open(csv_file, 'wb') as f:
                        f.write(zf.read())
                log.info(f"Extrait : {csv_found}")

        # Lire et importer le CSV
        with open(csv_file, "r", encoding="latin-1") as f:
            text = f.read()

        lines = text.strip().split("\n")

        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        imported = 0
        updated = 0
        skipped = 0
        vendu = 0
        nouveaux_bien_ids = []
        csv_references = set()

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

            ref_norm = re.sub(r'^\d+_', '', d["reference"])
            csv_references.add(d["reference"])
            csv_references.add(ref_norm)

            existing = cursor.execute(
                "SELECT id FROM biens WHERE reference = ? OR reference = ?",
                (d["reference"], ref_norm)
            ).fetchone()

            if existing:
                cursor.execute('''
                    UPDATE biens SET
                        type=?, ville=?, quartier=?, prix=?, surface=?, pieces=?, chambres=?,
                        description=?, photos=?, vendeur=?, lien_annonce=?,
                        etage_bien=?, nb_etages_immeuble=?, ascenseur=?, cave=?,
                        nb_parkings=?, nb_boxes=?, terrasse=?, nb_balcons=?,
                        orientation_sud=?, orientation_est=?, orientation_ouest=?, orientation_nord=?,
                        dpe_lettre=?, dpe_kwh=?, ges_lettre=?, ges_co2=?,
                        latitude=?, longitude=?, video_url=?,
                        nb_salles_bain=?, nb_salles_eau=?, nb_wc=?, surface_cave=?, prix_hn=?, honoraires_pct=?,
                        date_ajout=?, nom_agence=?, statut=?, source=?, date_vendu=NULL
                    WHERE reference=?
                ''', (
                    d["type_bien"], d["ville"], d["adresse"], d["prix"], d["surface"],
                    d["pieces"], d["chambres"], d["description"], d["photos_str"],
                    d["vendeur"], "",
                    d["etage_bien"], d["nb_etages_immeuble"], d["ascenseur"], d["cave"],
                    d["nb_parkings"], d["nb_boxes"], d["terrasse"], d["nb_balcons"],
                    d["orientation_sud"], d["orientation_est"], d["orientation_ouest"], d["orientation_nord"],
                    d["dpe_lettre"], d["dpe_kwh"], d["ges_lettre"], d["ges_co2"],
                    d["latitude"], d["longitude"], d["video_url"],
                    d["nb_salles_bain"], d["nb_salles_eau"], d["nb_wc"], d["surface_cave"], d["prix_hn"], d["honoraires_pct"],
                    datetime.now().isoformat(), d["nom_agence"], "actif", "ftp",
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
                        latitude, longitude, video_url,
                        nb_salles_bain, nb_salles_eau, nb_wc, surface_cave, prix_hn, honoraires_pct,
                        date_ajout, nom_agence, source, date_creation
                    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                ''', (
                    d["reference"], d["type_bien"], d["ville"], d["adresse"], d["prix"], d["surface"],
                    d["pieces"], d["chambres"], d["description"], d["photos_str"],
                    d["vendeur"], "",
                    d["etage_bien"], d["nb_etages_immeuble"], d["ascenseur"], d["cave"],
                    d["nb_parkings"], d["nb_boxes"], d["terrasse"], d["nb_balcons"],
                    d["orientation_sud"], d["orientation_est"], d["orientation_ouest"], d["orientation_nord"],
                    d["dpe_lettre"], d["dpe_kwh"], d["ges_lettre"], d["ges_co2"],
                    d["latitude"], d["longitude"], d["video_url"],
                    d["nb_salles_bain"], d["nb_salles_eau"], d["nb_wc"], d["surface_cave"], d["prix_hn"], d["honoraires_pct"],
                    datetime.now().isoformat(), d["nom_agence"], "ftp", datetime.now().isoformat()
                ))
                nouveau_id = cursor.lastrowid
                nouveaux_bien_ids.append(nouveau_id)
                cursor.execute("""
                    INSERT INTO notifications (type, title, message, link, created_at)
                    VALUES (?, ?, ?, ?, ?)
                """, (
                    'new_bien',
                    f'Nouveau bien — {d["type_bien"]} a {d["ville"]}',
                    f'{d["prix"]}EUR - Ajoutez des notes avant analyse',
                    f'/nouveau-bien/{nouveau_id}',
                    datetime.now().isoformat()
                ))
                imported += 1

        # Marquer les biens FTP absents du CSV comme vendus (Annule et Remplace)
        now_iso = datetime.now().isoformat()
        if csv_references:
            all_ftp_actif = cursor.execute(
                "SELECT id, reference FROM biens WHERE source = 'ftp' AND (statut IS NULL OR statut = 'actif')"
            ).fetchall()
            vendu_ids = [
                bid for bid, bref in all_ftp_actif
                if bref not in csv_references
                and re.sub(r'^\d+_', '', bref or '') not in csv_references
            ]
            if vendu_ids:
                cursor.executemany(
                    "UPDATE biens SET statut = 'vendu', date_vendu = ? WHERE id = ?",
                    [(now_iso, vid) for vid in vendu_ids]
                )
                vendu = len(vendu_ids)

        # Supprimer les biens vendus depuis plus de 2 jours
        limite_2j = (datetime.now() - timedelta(days=2)).isoformat()
        cursor.execute(
            "DELETE FROM biens WHERE statut = 'vendu' AND date_vendu IS NOT NULL AND date_vendu <= ?",
            (limite_2j,)
        )

        conn.commit()

        # Sauvegarder la date de dernière sync et effacer l'erreur précédente
        cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
                       ("last_hektor_sync", datetime.now().isoformat()))
        cursor.execute("DELETE FROM settings WHERE key IN ('last_sync_error', 'last_sync_error_at')")
        conn.commit()

        # Créer une notification si nouveaux biens ou vendus
        if imported > 0 or vendu > 0:
            parts = []
            if imported > 0:
                parts.append(f"{imported} nouveau(x) bien(s)")
            if vendu > 0:
                parts.append(f"{vendu} vendu(s) / retiré(s)")
            conn.execute('''
                INSERT INTO notifications (type, title, message, link, created_at)
                VALUES (?, ?, ?, ?, ?)
            ''', (
                'sync',
                'Sync Hektor terminée',
                f'{", ".join(parts)}, {updated} mis à jour',
                '/biens',
                datetime.now().isoformat()
            ))
            conn.commit()

        conn.close()

        # Lancer l'analyse des nouveaux biens en arrière-plan
        if nouveaux_bien_ids and os.getenv("ANTHROPIC_API_KEY") and settings.get('analyse_auto_import', True):
            def analyser_nouveaux_biens(ids, _db_path):
                for bid in ids:
                    try:
                        log.info(f"Analyse auto bien #{bid}...")
                        _core_analyser_bien(bid, db_path=_db_path)
                    except Exception as e:
                        log.error(f"Erreur analyse bien #{bid}: {e}")
            threading.Thread(target=analyser_nouveaux_biens, args=(nouveaux_bien_ids, db_path), daemon=True).start()

        log.info(f"Import : {imported} nouveaux, {updated} mis à jour, {vendu} vendus, {skipped} ignorés")
        return {"success": True, "imported": imported, "updated": updated, "vendu": vendu, "skipped": skipped}

    except ftplib.error_perm as e:
        msg = f"Authentification FTP échouée : {e}"
        log.error(msg)
    except (socket.gaierror, ConnectionRefusedError, OSError) as e:
        msg = f"Impossible de joindre le serveur FTP ({ftp_host}) : {e}"
        log.error(msg)
    except TimeoutError as e:
        msg = f"Connexion FTP expirée (timeout) : {e}"
        log.error(msg)
    except zipfile.BadZipFile as e:
        msg = f"Le fichier téléchargé n'est pas un ZIP valide : {e}"
        log.error(msg)
    except Exception as e:
        msg = f"Erreur inattendue lors de la sync FTP : {e}"
        log.error(msg)
    # Persister l'erreur dans les settings pour affichage persistant dans l'UI
    try:
        _conn = sqlite3.connect(db_path)
        _conn.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
                      ("last_sync_error", msg))
        _conn.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
                      ("last_sync_error_at", datetime.now().isoformat()))
        _conn.execute('''
            INSERT INTO notifications (type, title, message, link, created_at)
            VALUES (?, ?, ?, ?, ?)
        ''', ('sync_error', 'Erreur sync FTP', msg, '/administration', datetime.now().isoformat()))
        _conn.commit()
        _conn.close()
    except Exception:
        pass
    return {"error": msg}


def sync_all_agencies():
    """Synchronise le FTP pour toutes les agences."""
    agencies = all_agencies()
    for agency in agencies:
        try:
            sync_hektor_ftp(db_path=get_db_path(agency["slug"]))
        except Exception as e:
            log.error(f"Erreur sync agence {agency['slug']}: {e}")


def start_scheduler():
    global scheduler_started
    if not scheduler_started:
        settings = get_settings_values()
        interval = int(settings.get('sync_interval_hours', 12))

        # Ajouter la tâche de sync pour toutes les agences
        scheduler.add_job(sync_all_agencies, 'interval', hours=interval, id='hektor_sync', replace_existing=True, next_run_time=datetime.now())
        scheduler.start()
        scheduler_started = True
        log.info(f"Scheduler démarré (sync toutes les {interval}h)")


# ============================================================
# ROUTES
# ============================================================

@router.post("/sync-hektor")
def trigger_sync(current_user: dict = Depends(get_current_user)):
    """Déclenche une synchronisation manuelle"""
    result = sync_hektor_ftp(db_path=get_db_path(current_user["agency_slug"]))
    return result


@router.get("/sync-status")
def sync_status(current_user: dict = Depends(get_current_user)):
    """Retourne le statut de la dernière synchronisation"""
    conn = sqlite3.connect(get_db_path(current_user["agency_slug"]))
    cursor = conn.cursor()
    last_sync = cursor.execute("SELECT value FROM settings WHERE key = 'last_hektor_sync'").fetchone()
    interval = cursor.execute("SELECT value FROM settings WHERE key = 'sync_interval_hours'").fetchone()
    last_error = cursor.execute("SELECT value FROM settings WHERE key = 'last_sync_error'").fetchone()
    last_error_at = cursor.execute("SELECT value FROM settings WHERE key = 'last_sync_error_at'").fetchone()
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
        "scheduler_running": scheduler_started,
        "last_sync_error": last_error[0] if last_error else None,
        "last_sync_error_at": last_error_at[0] if last_error_at else None,
    }


@router.get("/ftp-browse")
def ftp_browse(path: str = "/", current_user: dict = Depends(get_current_user)):
    """Explore le contenu d'un dossier FTP"""
    settings = get_settings_values(get_db_path(current_user["agency_slug"]))

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

    except ftplib.error_perm as e:
        return {"error": f"Authentification FTP échouée : {e}"}
    except (socket.gaierror, ConnectionRefusedError, OSError) as e:
        return {"error": f"Impossible de joindre le serveur FTP ({ftp_host}) : {e}"}
    except TimeoutError as e:
        return {"error": f"Connexion FTP expirée (timeout) : {e}"}
    except Exception as e:
        return {"error": f"Erreur FTP : {e}"}
