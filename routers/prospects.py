import sqlite3
from datetime import datetime
from fastapi import APIRouter, UploadFile, File
import pandas as pd
from io import BytesIO

from config import DB_PATH

router = APIRouter()


@router.get("/prospects")
def get_prospects():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.execute("SELECT * FROM prospects")
    prospects = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return prospects


@router.post("/prospects/import")
async def import_prospects(file: UploadFile = File(...)):
    contents = await file.read()
    df = pd.read_excel(BytesIO(contents), sheet_name="Prospects")
    df.columns = df.columns.str.strip()

    conn = sqlite3.connect(DB_PATH)
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


@router.post("/prospects/add")
def add_prospect(prospect: dict):
    conn = sqlite3.connect(DB_PATH)
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


@router.put("/prospects/{prospect_id}")
def update_prospect(prospect_id: int, prospect: dict):
    conn = sqlite3.connect(DB_PATH)

    # Vérifier si le prospect existe
    existing = conn.execute("SELECT id FROM prospects WHERE id = ?", (prospect_id,)).fetchone()
    if not existing:
        conn.close()
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Prospect non trouvé")

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


@router.delete("/prospects/{prospect_id}")
def delete_prospect(prospect_id: int):
    conn = sqlite3.connect(DB_PATH)

    # Supprimer les matchings associés
    conn.execute("DELETE FROM matchings WHERE prospect_id = ?", (prospect_id,))
    # Supprimer le prospect
    conn.execute("DELETE FROM prospects WHERE id = ?", (prospect_id,))

    conn.commit()
    conn.close()
    return {"message": "Prospect supprimé"}


@router.patch("/prospects/{prospect_id}/archiver")
def archiver_prospect(prospect_id: int):
    conn = sqlite3.connect(DB_PATH)
    conn.execute("UPDATE prospects SET archive = 1 WHERE id = ?", (prospect_id,))
    conn.commit()
    conn.close()
    return {"success": True}


@router.patch("/prospects/{prospect_id}/desarchiver")
def desarchiver_prospect(prospect_id: int):
    conn = sqlite3.connect(DB_PATH)
    conn.execute("UPDATE prospects SET archive = 0 WHERE id = ?", (prospect_id,))
    conn.commit()
    conn.close()
    return {"success": True}


@router.get("/prospects/{prospect_id}")
def get_prospect(prospect_id: int):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    prospect = conn.execute("SELECT * FROM prospects WHERE id = ?", (prospect_id,)).fetchone()
    conn.close()
    if not prospect:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Prospect non trouvé")
    return dict(prospect)
