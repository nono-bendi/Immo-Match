import sqlite3
import re
from datetime import datetime, timedelta
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
import pandas as pd
from io import BytesIO

from agencies_db import get_db_path
from routers.auth import get_current_user

router = APIRouter()


# ============================================================
# FONCTION PARTAGÉE : parse_hektor_cols
# ============================================================

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
    nom_agence = g(105).strip()
    if not nom_agence:
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


# ============================================================
# ROUTES
# ============================================================

@router.get("/biens")
def get_biens(current_user: dict = Depends(get_current_user)):
    conn = sqlite3.connect(get_db_path(current_user["agency_slug"]))
    conn.row_factory = sqlite3.Row
    cursor = conn.execute("SELECT * FROM biens")
    biens = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return biens


@router.post("/biens/import")
async def import_biens(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    contents = await file.read()
    df = pd.read_excel(BytesIO(contents))
    df.columns = df.columns.str.strip()

    conn = sqlite3.connect(get_db_path(current_user["agency_slug"]))
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


@router.post("/import-hektor")
async def import_hektor(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Import des biens depuis le fichier Hektor (format CSV avec séparateur !#)"""
    try:
        content = await file.read()
        text = content.decode('latin-1')
        lines = text.strip().split('\n')

        conn = sqlite3.connect(get_db_path(current_user["agency_slug"]))
        cursor = conn.cursor()

        imported = 0
        updated = 0
        skipped = 0
        vendu = 0
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
                        latitude=?, longitude=?, date_ajout=?, nom_agence=?, statut=?, source=?, date_vendu=NULL
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
                    d["nom_agence"], "actif", "ftp",
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
                        latitude, longitude, date_ajout, nom_agence, source
                    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                ''', (
                    d["reference"], d["type_bien"], d["ville"], d["adresse"], d["prix"], d["surface"],
                    d["pieces"], d["chambres"], d["description"], d["photos_str"],
                    d["vendeur"], "",
                    d["etage_bien"], d["nb_etages_immeuble"], d["ascenseur"], d["cave"],
                    d["nb_parkings"], d["nb_boxes"], d["terrasse"], d["nb_balcons"],
                    d["orientation_sud"], d["orientation_est"], d["orientation_ouest"], d["orientation_nord"],
                    d["dpe_lettre"], d["dpe_kwh"], d["ges_lettre"], d["ges_co2"],
                    d["latitude"], d["longitude"], datetime.now().isoformat(),
                    d["nom_agence"], "ftp"
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
        conn.close()

        vendu_msg = f", {vendu} vendu(s) / retiré(s)" if vendu > 0 else ""
        return {
            "success": True,
            "message": f"Import terminé : {imported} nouveaux biens, {updated} mis à jour{vendu_msg}, {skipped} ignorés (locations)"
        }

    except Exception as e:
        return {"error": "Une erreur interne est survenue"}


@router.post("/biens/add")
def add_bien(bien: dict, current_user: dict = Depends(get_current_user)):
    conn = sqlite3.connect(get_db_path(current_user["agency_slug"]))

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


@router.put("/biens/{bien_id}")
def update_bien(bien_id: int, bien: dict, current_user: dict = Depends(get_current_user)):
    conn = sqlite3.connect(get_db_path(current_user["agency_slug"]))

    existing = conn.execute("SELECT id FROM biens WHERE id = ?", (bien_id,)).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Bien non trouvé")

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


@router.patch("/biens/{bien_id}/defauts")
def patch_bien_defauts(bien_id: int, data: dict, current_user: dict = Depends(get_current_user)):
    conn = sqlite3.connect(get_db_path(current_user["agency_slug"]))
    conn.execute("UPDATE biens SET defauts = ? WHERE id = ?", (data.get("defauts"), bien_id))
    conn.commit()
    conn.close()
    return {"message": "Defauts mis a jour"}


@router.patch("/biens/{bien_id}/restaurer")
def restaurer_bien(bien_id: int, current_user: dict = Depends(get_current_user)):
    conn = sqlite3.connect(get_db_path(current_user["agency_slug"]))
    conn.execute("UPDATE biens SET statut = 'actif', date_vendu = NULL WHERE id = ?", (bien_id,))
    conn.commit()
    conn.close()
    return {"success": True}


@router.delete("/biens/{bien_id}")
def delete_bien(bien_id: int, current_user: dict = Depends(get_current_user)):
    conn = sqlite3.connect(get_db_path(current_user["agency_slug"]))

    # Supprimer les matchings associés
    conn.execute("DELETE FROM matchings WHERE bien_id = ?", (bien_id,))
    # Supprimer le bien
    conn.execute("DELETE FROM biens WHERE id = ?", (bien_id,))

    conn.commit()
    conn.close()
    return {"message": "Bien supprimé"}


@router.get("/biens/{bien_id}")
def get_bien(bien_id: int, current_user: dict = Depends(get_current_user)):
    conn = sqlite3.connect(get_db_path(current_user["agency_slug"]))
    conn.row_factory = sqlite3.Row
    bien = conn.execute("SELECT * FROM biens WHERE id = ?", (bien_id,)).fetchone()
    conn.close()
    if not bien:
        raise HTTPException(status_code=404, detail="Bien non trouvé")
    return dict(bien)
