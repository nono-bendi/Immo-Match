import os
import sqlite3
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request

from routers.auth import get_current_user

router = APIRouter()

_OWNER_EMAIL = os.getenv("OWNER_EMAIL", "noabendiaf@gmail.com")
_DB_PATH = os.getenv("VIDEO_TRACKING_DB_PATH", "prospection_tracking.db")
_EVENTS_VALIDES = {"page_view", "play", "progress_25", "progress_50", "progress_75", "ended"}


def _check_owner(current_user: dict):
    if current_user["email"] != _OWNER_EMAIL:
        raise HTTPException(status_code=403, detail="Accès réservé")


def _conn():
    conn = sqlite3.connect(_DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute('''
        CREATE TABLE IF NOT EXISTS video_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            agency_ref TEXT,
            event TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    ''')
    return conn


@router.post("/video-track", include_in_schema=False)
async def track_event(request: Request):
    try:
        data = await request.json()
    except Exception:
        return {"ok": False}
    event = data.get("event")
    if event not in _EVENTS_VALIDES:
        return {"ok": False}
    agency_ref = str(data.get("a") or "")[:100]
    conn = _conn()
    conn.execute(
        "INSERT INTO video_events (agency_ref, event, created_at) VALUES (?, ?, ?)",
        (agency_ref, event, datetime.now(timezone.utc).isoformat()),
    )
    conn.commit()
    conn.close()
    return {"ok": True}


@router.get("/video-track/stats")
def video_stats(current_user: dict = Depends(get_current_user)):
    _check_owner(current_user)
    conn = _conn()
    rows = conn.execute('''
        SELECT agency_ref, event, MIN(created_at) as first_seen
        FROM video_events
        WHERE agency_ref != ''
        GROUP BY agency_ref, event
        ORDER BY agency_ref, first_seen
    ''').fetchall()
    conn.close()
    par_agence = {}
    for r in rows:
        par_agence.setdefault(r["agency_ref"], {})[r["event"]] = r["first_seen"]
    return par_agence
