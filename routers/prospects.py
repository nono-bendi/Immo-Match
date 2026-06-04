import sqlite3
import os
import json
import re
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from pydantic import BaseModel
import pandas as pd
from io import BytesIO
import anthropic

from agencies_db import get_db_path
from routers.auth import get_current_user
from analytics import track

router = APIRouter()

_anthropic = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

VOICE_PARSE_PROMPT_TEMPLATE = """Tu es un assistant pour agents immobiliers. On te donne une transcription vocale décrivant un prospect immobilier.
Extrais les informations et retourne UNIQUEMENT un JSON valide avec ces champs (laisse vide si non mentionné) :

{{
  "nom": "",
  "prenom": "",
  "telephone": "",
  "mail": "",
  "domicile": "",
  "bien": [],
  "villes": [],
  "quartiers": [],
  "quartiersExclus": "",
  "budget_max": null,
  "surface_min": "",
  "pieces_min": "",
  "etat": [],
  "expo": [],
  "stationnement": "",
  "exterieur": [],
  "etage": [],
  "copro": "",
  "destination": "",
  "observation": ""
}}

Règles :
- "nom" : UNIQUEMENT le nom de famille (ex: "Fontaine"). Jamais le prénom dans ce champ.
- "prenom" : le ou les prénoms (ex: "Jean-Pierre", ou "Jean-Pierre et Sophie" pour un couple)
- "mail" : l'adresse email. Si la transcription vocale déforme l'email (ex: "jean tiret pierre" → "jean-pierre", "arobase" → "@", "point" → "."), corrige-la intelligemment.
- "bien" : liste parmi ["Maison", "Appartement", "T1", "T2", "T3", "T4", "T5+", "Local commercial", "Terrain", "Tous biens"]
- "villes" : liste de noms de villes (villes connues de l'agence : {villes})
- "quartiers" : TOUS les quartiers/secteurs souhaités mentionnés, même s'ils ne sont pas dans la liste connue. Quartiers connus : {quartiers}
- "quartiersExclus" : quartiers ou zones que le prospect veut ÉVITER (ex: "centre-ville"). Ne pas mettre dans observation.
- "budget_max" : nombre entier (euros), null si non mentionné
- "surface_min" : string (ex: "60")
- "pieces_min" : string (ex: "3")
- "etat" : liste parmi ["Neuf", "Bon état", "Menus travaux", "À rénover", "À démolir"]
- "expo" : liste parmi ["Sud", "Est", "Ouest", "Nord", "Lumineux"]
- "stationnement" : une valeur parmi ["Garage", "Parking", "Box", "Obligatoire", "Pas nécessaire"] ou ""
- "exterieur" : liste parmi ["Balcon", "Terrasse", "Jardin", "Piscine", "Vue mer", "Mer à pied", "Tout à pied", "Au calme", "Cuisine fermée", "Contemporain"]
- "etage" : liste parmi ["RDC", "Étage bas", "Étage élevé", "Dernier étage", "Avec ascenseur"]
- "copro" : une valeur parmi ["Oui", "Faibles charges", "Non", "Peu importe"] ou ""
- "destination" : une valeur parmi ["Résidence principale", "Inv. Locatif à l'année", "Inv. Locatif saisonnier", "Résidence secondaire", "Marchand de biens"] ou ""
- "observation" : UNIQUEMENT les informations non catégorisables par les autres champs

Retourne UNIQUEMENT le JSON, sans markdown, sans explication."""


def build_voice_prompt(agency_slug: str) -> str:
    try:
        conn = sqlite3.connect(get_db_path(agency_slug))
        villes = [r[0] for r in conn.execute(
            "SELECT DISTINCT ville FROM biens WHERE ville IS NOT NULL AND ville != '' ORDER BY ville"
        ).fetchall()]
        quartiers = [r[0] for r in conn.execute(
            "SELECT DISTINCT quartier FROM biens WHERE quartier IS NOT NULL AND quartier != '' ORDER BY quartier"
        ).fetchall()]
        conn.close()
    except Exception:
        villes, quartiers = [], []
    villes_str = ", ".join(f'"{v}"' for v in villes) if villes else "toutes villes"
    quartiers_str = ", ".join(f'"{q}"' for q in quartiers) if quartiers else "tous quartiers"
    return VOICE_PARSE_PROMPT_TEMPLATE.format(villes=villes_str, quartiers=quartiers_str)


@router.get("/prospects")
def get_prospects(current_user: dict = Depends(get_current_user)):
    conn = sqlite3.connect(get_db_path(current_user["agency_slug"]))
    conn.row_factory = sqlite3.Row
    cursor = conn.execute("SELECT * FROM prospects")
    prospects = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return prospects


@router.post("/prospects/import")
async def import_prospects(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    contents = await file.read()
    df = pd.read_excel(BytesIO(contents), sheet_name="Prospects")
    df.columns = df.columns.str.strip()

    conn = sqlite3.connect(get_db_path(current_user["agency_slug"]))
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


class VoiceParseRequest(BaseModel):
    transcript: str

@router.post("/prospects/voice-parse")
async def voice_parse(req: VoiceParseRequest, current_user: dict = Depends(get_current_user)):
    if not os.getenv("ANTHROPIC_API_KEY"):
        raise HTTPException(status_code=503, detail="Clé API Anthropic non configurée")
    try:
        prompt = build_voice_prompt(current_user["agency_slug"])
        response = _anthropic.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1024,
            messages=[{"role": "user", "content": f"{prompt}\n\nTranscription : {req.transcript}"}]
        )
        raw = response.content[0].text.strip()
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if match:
            raw = match.group(0)
        data = json.loads(raw)
        return data
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=422, detail=f"Impossible de parser la réponse : {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/prospects/import-add")
async def import_prospects_add(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    contents = await file.read()
    df = pd.read_excel(BytesIO(contents), sheet_name="Prospects")
    df.columns = df.columns.str.strip()

    conn = sqlite3.connect(get_db_path(current_user["agency_slug"]))
    added = 0
    for _, row in df.iterrows():
        conn.execute('''
            INSERT INTO prospects (date, nom, mail, telephone, domicile, bien, villes, quartiers, budget_max, criteres, etat, expo, stationnement, copro, exterieur, etage, destination, observation)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            str(row.get('Date', '')) if pd.notna(row.get('Date')) else datetime.now().strftime("%Y-%m-%d"),
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
        added += 1

    conn.commit()
    conn.close()
    return {"message": f"{added} prospect{'s' if added > 1 else ''} ajouté{'s' if added > 1 else ''}"}


@router.post("/prospects/add")
def add_prospect(prospect: dict, current_user: dict = Depends(get_current_user)):
    conn = sqlite3.connect(get_db_path(current_user["agency_slug"]))
    cursor = conn.cursor()

    cursor.execute('''
        INSERT INTO prospects (date, nom, prenom, titre, mail, email2, telephone, telephone2, domicile, bien, villes, quartiers, budget_max, criteres, etat, expo, stationnement, copro, exterieur, etage, destination, observation, chambre_plain_pied, plain_pied_total, sdb_min, wc_min)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        datetime.now().strftime("%Y-%m-%d"),
        prospect.get('nom'),
        prospect.get('prenom'),
        prospect.get('titre'),
        prospect.get('mail'),
        prospect.get('email2'),
        prospect.get('telephone'),
        prospect.get('telephone2'),
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
        1 if prospect.get('chambre_plain_pied') else 0,
        1 if prospect.get('plain_pied_total') else 0,
        prospect.get('sdb_min') or 0,
        prospect.get('wc_min') or 0,
    ))

    prospect_id = cursor.lastrowid
    conn.commit()
    conn.close()

    try:
        track(current_user["id"], "prospect_created", {"agency": current_user["agency_slug"]})
    except Exception:
        pass
    return {"message": "Prospect ajouté avec succès", "id": prospect_id}


@router.put("/prospects/{prospect_id}")
def update_prospect(prospect_id: int, prospect: dict, current_user: dict = Depends(get_current_user)):
    conn = sqlite3.connect(get_db_path(current_user["agency_slug"]))

    existing = conn.execute("SELECT id FROM prospects WHERE id = ?", (prospect_id,)).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Prospect non trouvé")

    conn.execute('''
        UPDATE prospects SET
            nom = ?, prenom = ?, titre = ?, mail = ?, email2 = ?, telephone = ?, telephone2 = ?,
            domicile = ?, bien = ?, villes = ?, quartiers = ?, budget_max = ?, criteres = ?,
            etat = ?, expo = ?, stationnement = ?, copro = ?, exterieur = ?, etage = ?,
            destination = ?, observation = ?, chambre_plain_pied = ?, plain_pied_total = ?, sdb_min = ?, wc_min = ?
        WHERE id = ?
    ''', (
        prospect.get('nom'),
        prospect.get('prenom'),
        prospect.get('titre'),
        prospect.get('mail'),
        prospect.get('email2'),
        prospect.get('telephone'),
        prospect.get('telephone2'),
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
        1 if prospect.get('chambre_plain_pied') else 0,
        1 if prospect.get('plain_pied_total') else 0,
        prospect.get('sdb_min') or 0,
        prospect.get('wc_min') or 0,
        prospect_id
    ))

    conn.commit()
    conn.close()
    return {"message": "Prospect mis à jour"}


@router.delete("/prospects/{prospect_id}")
def delete_prospect(prospect_id: int, current_user: dict = Depends(get_current_user)):
    conn = sqlite3.connect(get_db_path(current_user["agency_slug"]))
    conn.execute("DELETE FROM matchings WHERE prospect_id = ?", (prospect_id,))
    conn.execute("DELETE FROM prospects WHERE id = ?", (prospect_id,))
    conn.commit()
    conn.close()
    return {"message": "Prospect supprimé"}


@router.patch("/prospects/{prospect_id}/archiver")
def archiver_prospect(prospect_id: int, current_user: dict = Depends(get_current_user)):
    conn = sqlite3.connect(get_db_path(current_user["agency_slug"]))
    conn.execute("UPDATE prospects SET archive = 1 WHERE id = ?", (prospect_id,))
    conn.commit()
    conn.close()
    return {"success": True}


@router.patch("/prospects/{prospect_id}/desarchiver")
def desarchiver_prospect(prospect_id: int, current_user: dict = Depends(get_current_user)):
    conn = sqlite3.connect(get_db_path(current_user["agency_slug"]))
    conn.execute("UPDATE prospects SET archive = 0 WHERE id = ?", (prospect_id,))
    conn.commit()
    conn.close()
    return {"success": True}


@router.get("/prospects/{prospect_id}")
def get_prospect(prospect_id: int, current_user: dict = Depends(get_current_user)):
    conn = sqlite3.connect(get_db_path(current_user["agency_slug"]))
    conn.row_factory = sqlite3.Row
    prospect = conn.execute("SELECT * FROM prospects WHERE id = ?", (prospect_id,)).fetchone()
    conn.close()
    if not prospect:
        raise HTTPException(status_code=404, detail="Prospect non trouvé")
    return dict(prospect)
