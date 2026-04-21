import sqlite3
from datetime import datetime
from fastapi import APIRouter, Depends

from agencies_db import get_db_path
from routers.auth import get_current_user

router = APIRouter()


@router.get("/calibration/matchings")
def get_matchings_for_calibration(
    sans_feedback_only: bool = False,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """
    Retourne les matchings pour calibration.
    - sans_feedback_only=true : uniquement ceux sans feedback (priorité à collecter)
    - Triés : d'abord sans feedback (récents en premier), puis ceux déjà évalués
    """
    conn = sqlite3.connect(get_db_path(current_user["agency_slug"]))
    conn.row_factory = sqlite3.Row

    filtre_feedback = "AND cf.id IS NULL" if sans_feedback_only else ""

    rows = conn.execute(f"""
        SELECT m.id, m.prospect_id, m.bien_id, m.score, m.points_forts, m.points_attention,
               m.recommandation, m.date_analyse,
               p.nom as prospect_nom, p.bien as prospect_type, p.budget_max, p.destination,
               b.type as bien_type, b.ville as bien_ville, b.prix as bien_prix, b.surface,
               b.photos as bien_photos, b.pieces, b.chambres, b.quartier, b.etat,
               b.description, b.defauts as bien_defauts, b.reference as bien_ref,
               cf.id as feedback_id, cf.pertinent, cf.score_avis, cf.commentaire
        FROM matchings m
        JOIN prospects p ON m.prospect_id = p.id
        JOIN biens b ON m.bien_id = b.id
        LEFT JOIN calibration_feedback cf ON cf.matching_id = m.id
        WHERE (m.statut_prospect IS NULL OR m.statut_prospect != 'refused')
          AND (p.archive = 0 OR p.archive IS NULL)
          {filtre_feedback}
        ORDER BY cf.id IS NULL DESC, m.date_analyse DESC
        LIMIT ?
    """, (limit,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@router.get("/calibration/a-evaluer")
def get_matchings_a_evaluer(current_user: dict = Depends(get_current_user)):
    """
    Retourne un échantillon représentatif de matchings sans feedback à évaluer :
    - 5 scores élevés (>=75) sans feedback
    - 5 scores moyens (50-74) sans feedback
    - 5 scores faibles (<50) sans feedback
    Objectif : couvrir toute l'échelle de score pour une calibration équilibrée.
    """
    conn = sqlite3.connect(get_db_path(current_user["agency_slug"]))
    conn.row_factory = sqlite3.Row

    base_query = """
        SELECT m.id, m.score, m.points_forts, m.points_attention, m.recommandation,
               p.nom as prospect_nom, p.bien as prospect_type, p.budget_max, p.destination,
               b.type as bien_type, b.ville as bien_ville, b.prix as bien_prix,
               b.surface, b.reference as bien_ref
        FROM matchings m
        JOIN prospects p ON m.prospect_id = p.id
        JOIN biens b ON m.bien_id = b.id
        LEFT JOIN calibration_feedback cf ON cf.matching_id = m.id
        WHERE cf.id IS NULL
          AND (p.archive = 0 OR p.archive IS NULL)
          AND m.score {condition}
        ORDER BY RANDOM()
        LIMIT 5
    """

    hauts  = conn.execute(base_query.format(condition=">= 75")).fetchall()
    moyens = conn.execute(base_query.format(condition="BETWEEN 50 AND 74")).fetchall()
    faibles = conn.execute(base_query.format(condition="< 50")).fetchall()

    # Stats globales pour afficher la progression
    total_matchings = conn.execute("SELECT COUNT(*) FROM matchings").fetchone()[0]
    total_feedbacks = conn.execute("SELECT COUNT(*) FROM calibration_feedback").fetchone()[0]
    sans_feedback = conn.execute("""
        SELECT COUNT(*) FROM matchings m
        LEFT JOIN calibration_feedback cf ON cf.matching_id = m.id
        WHERE cf.id IS NULL
    """).fetchone()[0]

    conn.close()
    return {
        "progression": {
            "total_matchings": total_matchings,
            "total_feedbacks": total_feedbacks,
            "sans_feedback": sans_feedback,
            "taux_couverture": round(total_feedbacks / total_matchings * 100, 1) if total_matchings else 0,
        },
        "a_evaluer": {
            "hauts_scores": [dict(r) for r in hauts],
            "scores_moyens": [dict(r) for r in moyens],
            "scores_faibles": [dict(r) for r in faibles],
        }
    }


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
