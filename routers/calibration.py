import sqlite3
from datetime import datetime
from fastapi import APIRouter, Depends

from agencies_db import get_db_path
from routers.auth import get_current_user

router = APIRouter()


@router.get("/calibration/matchings")
def get_matchings_for_calibration(current_user: dict = Depends(get_current_user)):
    conn = sqlite3.connect(get_db_path(current_user["agency_slug"]))
    conn.row_factory = sqlite3.Row
    rows = conn.execute("""
        SELECT m.id, m.prospect_id, m.bien_id, m.score, m.points_forts,
               p.nom as prospect_nom, p.bien as prospect_type, p.budget_max,
               b.type as bien_type, b.ville as bien_ville, b.prix as bien_prix, b.surface,
               b.photos as bien_photos, b.pieces, b.chambres, b.quartier, b.etat, b.description, b.defauts as bien_defauts,
               cf.pertinent, cf.score_avis, cf.commentaire
        FROM matchings m
        JOIN prospects p ON m.prospect_id = p.id
        JOIN biens b ON m.bien_id = b.id
        LEFT JOIN calibration_feedback cf ON cf.matching_id = m.id
        WHERE (m.statut_prospect IS NULL OR m.statut_prospect != 'refused')
          AND (p.archive = 0 OR p.archive IS NULL)
        ORDER BY m.score DESC
    """).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@router.post("/calibration/feedback")
def save_feedback(body: dict, current_user: dict = Depends(get_current_user)):
    conn = sqlite3.connect(get_db_path(current_user["agency_slug"]))
    existing = conn.execute("SELECT id FROM calibration_feedback WHERE matching_id = ?", (body['matching_id'],)).fetchone()
    if existing:
        conn.execute("UPDATE calibration_feedback SET pertinent=?, score_avis=?, commentaire=?, created_at=? WHERE matching_id=?",
                     (body.get('pertinent'), body.get('score_avis'), body.get('commentaire', ''), datetime.now().isoformat(), body['matching_id']))
    else:
        conn.execute("INSERT INTO calibration_feedback (matching_id, pertinent, score_avis, commentaire, created_at) VALUES (?,?,?,?,?)",
                     (body['matching_id'], body.get('pertinent'), body.get('score_avis'), body.get('commentaire', ''), datetime.now().isoformat()))
    conn.commit()
    conn.close()
    return {"success": True}


@router.get("/calibration/stats")
def get_calibration_stats(current_user: dict = Depends(get_current_user)):
    conn = sqlite3.connect(get_db_path(current_user["agency_slug"]))
    rows = conn.execute("""
        SELECT m.score, cf.pertinent, cf.score_avis
        FROM calibration_feedback cf
        JOIN matchings m ON m.id = cf.matching_id
        WHERE cf.pertinent IS NOT NULL
    """).fetchall()
    conn.close()
    total = len(rows)
    if not total:
        return {"total": 0, "pertinents": 0, "non_pertinents": 0, "score_trop_haut": 0, "score_ok": 0, "score_trop_bas": 0}
    pertinents = sum(1 for r in rows if r[1] == 1)
    scores_pertinents = [r[0] for r in rows if r[1] == 1]
    scores_non_pertinents = [r[0] for r in rows if r[1] == 0]
    return {
        "total": total,
        "pertinents": pertinents,
        "non_pertinents": total - pertinents,
        "score_trop_haut": sum(1 for r in rows if r[2] == 'trop_haut'),
        "score_ok": sum(1 for r in rows if r[2] == 'ok'),
        "score_trop_bas": sum(1 for r in rows if r[2] == 'trop_bas'),
        "avg_score_pertinent": round(sum(scores_pertinents) / len(scores_pertinents), 1) if scores_pertinents else 0,
        "avg_score_non_pertinent": round(sum(scores_non_pertinents) / len(scores_non_pertinents), 1) if scores_non_pertinents else 0,
    }


@router.patch("/matchings/{matching_id}/statut-prospect")
def set_statut_prospect(matching_id: int, body: dict, current_user: dict = Depends(get_current_user)):
    """Marque un matching comme refusé ou réinitialise"""
    conn = sqlite3.connect(get_db_path(current_user["agency_slug"]))
    statut = body.get("statut")
    conn.execute("UPDATE matchings SET statut_prospect = ? WHERE id = ?", (statut, matching_id))
    conn.commit()
    conn.close()
    return {"success": True, "statut_prospect": statut}


@router.patch("/matchings/{matching_id}/email-sent")
def mark_email_sent(matching_id: int, current_user: dict = Depends(get_current_user)):
    """Marque un matching comme ayant reçu un email"""
    conn = sqlite3.connect(get_db_path(current_user["agency_slug"]))
    now = datetime.now().isoformat()
    conn.execute('UPDATE matchings SET date_email_envoye = ? WHERE id = ?', (now, matching_id))
    conn.commit()
    conn.close()
    return {"success": True, "date_email_envoye": now}
