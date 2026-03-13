"""
Synchronisation automatique des biens depuis Hektor (FTP)
Lance ce script en arrière-plan ou avec un planificateur de tâches
"""

import ftplib
import os
import time
import sqlite3
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# Configuration FTP
FTP_HOST = os.getenv("FTP_HOST", "72.60.93.6")
FTP_USER = os.getenv("FTP_USER", "u816945787")
FTP_PASS = os.getenv("FTP_PASS", "")
FTP_PORT = int(os.getenv("FTP_PORT", 21))
FTP_PATH = os.getenv("FTP_PATH", "/home/u816945787/domains/khaki-baboon-114536.hostingersite.com/public_html/hektor/Annonces.csv")

# Fichier local
LOCAL_FILE = "Annonces_hektor.csv"
LAST_MODIFIED_FILE = "last_sync.txt"

# Intervalle de vérification (en secondes)
CHECK_INTERVAL = 43200  # 5 minutes


def get_ftp_file_time(ftp, filepath):
    """Récupère la date de modification du fichier sur le FTP"""
    try:
        response = ftp.sendcmd(f"MDTM {filepath}")
        # Format: 213 20260209153000
        timestamp = response[4:].strip()
        return datetime.strptime(timestamp, "%Y%m%d%H%M%S")
    except:
        return None


def get_last_sync_time():
    """Récupère la date de la dernière synchronisation"""
    if os.path.exists(LAST_MODIFIED_FILE):
        with open(LAST_MODIFIED_FILE, "r") as f:
            try:
                return datetime.fromisoformat(f.read().strip())
            except:
                return None
    return None


def save_last_sync_time(dt):
    """Sauvegarde la date de synchronisation"""
    with open(LAST_MODIFIED_FILE, "w") as f:
        f.write(dt.isoformat())


def download_file(ftp, remote_path, local_path):
    """Télécharge un fichier depuis le FTP"""
    with open(local_path, "wb") as f:
        ftp.retrbinary(f"RETR {remote_path}", f.write)
    print(f"✅ Fichier téléchargé : {local_path}")


def import_to_database(filepath):
    """Importe le fichier CSV dans la base de données"""
    try:
        with open(filepath, "r", encoding="latin-1") as f:
            text = f.read()
        
        lines = text.strip().split("\n")
        
        conn = sqlite3.connect("immomatch.db")
        cursor = conn.cursor()
        
        imported = 0
        updated = 0
        skipped = 0
        
        for line in lines:
            cols = line.split("!#")
            cols = [c.strip().strip('"') for c in cols]
            
            if len(cols) < 25:
                skipped += 1
                continue
            
            # Colonnes Hektor
            reference = cols[1]
            transaction = cols[2]
            type_bien = cols[3]
            ville = cols[5]
            adresse = cols[7]
            prix = cols[10]
            surface = cols[15]
            pieces = cols[17]
            chambres = cols[18]
            description = cols[20]
            
            # Filtrer uniquement les ventes
            if transaction.lower() != "vente":
                skipped += 1
                continue
            
            # Convertir les valeurs
            try:
                prix = float(prix) if prix else 0
            except:
                prix = 0
            
            try:
                surface = float(surface) if surface else 0
            except:
                surface = 0
            
            try:
                pieces = int(pieces) if pieces else 0
            except:
                pieces = 0
            
            try:
                chambres = int(chambres) if chambres else 0
            except:
                chambres = 0
            
            # Récupérer les photos
            photos = []
            for i in range(len(cols)):
                if cols[i].startswith("http") and ("jpg" in cols[i].lower() or "jpeg" in cols[i].lower() or "png" in cols[i].lower()):
                    photos.append(cols[i])
            photos_str = "|".join(photos[:10])
            
            # Vendeur
            vendeur = ""
            for i in range(len(cols)):
                if "SAINT FRANCOIS" in cols[i].upper() or "IMMOBILIER" in cols[i].upper():
                    vendeur = cols[i].strip()
                    break
            
            # Nettoyer
            description = description.replace("<br>", "\n").replace("  ", " ").strip()
            type_bien = type_bien.capitalize()
            
            # Insert ou Update
            existing = cursor.execute("SELECT id FROM biens WHERE reference = ?", (reference,)).fetchone()
            
            if existing:
                cursor.execute("""
                    UPDATE biens SET 
                        type = ?, ville = ?, quartier = ?, prix = ?, surface = ?,
                        pieces = ?, chambres = ?, description = ?, photos = ?, 
                        vendeur = ?, date_ajout = ?
                    WHERE reference = ?
                """, (type_bien, ville, adresse, prix, surface, pieces, chambres, description, photos_str, vendeur, datetime.now().isoformat(), reference))
                updated += 1
            else:
                cursor.execute("""
                    INSERT INTO biens (reference, type, ville, quartier, prix, surface, pieces, chambres, description, photos, vendeur, date_ajout)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (reference, type_bien, ville, adresse, prix, surface, pieces, chambres, description, photos_str, vendeur, datetime.now().isoformat()))
                imported += 1
        
        conn.commit()
        conn.close()
        
        print(f"📊 Import : {imported} nouveaux, {updated} mis à jour, {skipped} ignorés")
        return True
        
    except Exception as e:
        print(f"❌ Erreur import : {e}")
        return False


def sync():
    """Effectue une synchronisation"""
    print(f"\n🔄 Vérification à {datetime.now().strftime('%H:%M:%S')}...")
    
    try:
        # Connexion FTP
        ftp = ftplib.FTP()
        ftp.connect(FTP_HOST, FTP_PORT, timeout=30)
        ftp.login(FTP_USER, FTP_PASS)
        print(f"📡 Connecté au FTP")
        
        # Vérifier la date de modification
        remote_time = get_ftp_file_time(ftp, FTP_PATH)
        last_sync = get_last_sync_time()
        
        if remote_time:
            print(f"   Fichier distant : {remote_time}")
            print(f"   Dernière sync   : {last_sync or 'Jamais'}")
        
        # Si fichier modifié ou jamais synchronisé
        if remote_time and (last_sync is None or remote_time > last_sync):
            print("📥 Nouveau fichier détecté, téléchargement...")
            download_file(ftp, FTP_PATH, LOCAL_FILE)
            
            print("📦 Import dans la base de données...")
            if import_to_database(LOCAL_FILE):
                save_last_sync_time(remote_time)
                print("✅ Synchronisation terminée !")
            else:
                print("⚠️ Import échoué")
        else:
            print("✓ Aucune modification détectée")
        
        ftp.quit()
        
    except ftplib.all_errors as e:
        print(f"❌ Erreur FTP : {e}")
    except Exception as e:
        print(f"❌ Erreur : {e}")


def main():
    """Boucle principale"""
    print("=" * 50)
    print("🏠 ImmoMatch - Synchronisation Hektor")
    print("=" * 50)
    print(f"Serveur : {FTP_HOST}:{FTP_PORT}")
    print(f"Fichier : {FTP_PATH}")
    print(f"Intervalle : {CHECK_INTERVAL // 60} minutes")
    print("=" * 50)
    print("Appuyez sur Ctrl+C pour arrêter\n")
    
    while True:
        sync()
        print(f"💤 Prochaine vérification dans {CHECK_INTERVAL // 60} minutes...")
        time.sleep(CHECK_INTERVAL)


if __name__ == "__main__":
    main()