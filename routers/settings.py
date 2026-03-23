import sqlite3
from logger import get_logger
log = get_logger('settings')
import json
from datetime import datetime
from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse
import pandas as pd

from agencies_db import get_db_path
from routers.auth import require_not_demo, get_current_user, require_admin
import routers.sync as sync_module

router = APIRouter()


@router.get("/settings")
def get_settings(current_user: dict = Depends(get_current_user)):
    conn = sqlite3.connect(get_db_path(current_user["agency_slug"]))
    conn.row_factory = sqlite3.Row
    cursor = conn.execute("SELECT key, value FROM settings")
    rows = cursor.fetchall()
    conn.close()

    settings = {}
    for row in rows:
        try:
            settings[row['key']] = json.loads(row['value'])
        except Exception:
            settings[row['key']] = row['value']

    return settings


@router.post("/settings")
def save_settings(settings: dict, current_user: dict = Depends(require_not_demo)):
    conn = sqlite3.connect(get_db_path(current_user["agency_slug"]))

    for key, value in settings.items():
        value_str = json.dumps(value) if not isinstance(value, str) else value
        conn.execute('''
            INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)
        ''', (key, value_str))

    conn.commit()
    conn.close()
    # Mettre a jour le scheduler si l intervalle a change
    if 'sync_interval_hours' in settings and sync_module.scheduler_started:
        try:
            new_interval = int(settings['sync_interval_hours'])
            sync_module.scheduler.reschedule_job('hektor_sync', trigger='interval', hours=new_interval)
            log.info(f'Scheduler mis a jour : sync toutes les {new_interval}h')
        except Exception as e:
            log.error(f'Erreur mise a jour scheduler : {e}')

    return {"message": "Paramètres sauvegardés"}


@router.get("/export-all")
def export_all(current_user: dict = Depends(get_current_user)):
    conn = sqlite3.connect(get_db_path(current_user["agency_slug"]))

    # Charger les données
    prospects_df = pd.read_sql_query("SELECT * FROM prospects", conn)
    biens_df = pd.read_sql_query("SELECT * FROM biens", conn)
    matchings_df = pd.read_sql_query('''
        SELECT m.id, m.prospect_id, m.bien_id, m.score, m.points_forts, m.points_attention, m.recommandation, m.date_analyse,
               p.nom as prospect_nom, p.budget_max as prospect_budget,
               b.type as bien_type, b.ville as bien_ville, b.prix as bien_prix
        FROM matchings m
        JOIN prospects p ON m.prospect_id = p.id
        JOIN biens b ON m.bien_id = b.id
        WHERE (p.archive = 0 OR p.archive IS NULL)
        ORDER BY m.score DESC
    ''', conn)
    conn.close()

    # Créer le fichier Excel
    export_path = f"immomatch_export_{datetime.now().strftime('%Y-%m-%d_%H-%M')}.xlsx"

    with pd.ExcelWriter(export_path, engine='openpyxl') as writer:
        prospects_df.to_excel(writer, sheet_name='Prospects', index=False)
        biens_df.to_excel(writer, sheet_name='Biens', index=False)
        matchings_df.to_excel(writer, sheet_name='Matchings', index=False)

    return FileResponse(
        export_path,
        filename=export_path,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )


@router.post("/reset-database")
def reset_database(current_user: dict = Depends(require_admin)):
    conn = sqlite3.connect(get_db_path(current_user["agency_slug"]))
    conn.execute("DELETE FROM matchings")
    conn.execute("DELETE FROM prospects")
    conn.execute("DELETE FROM biens")
    conn.commit()
    conn.close()
    return {"message": "Base de données réinitialisée"}
