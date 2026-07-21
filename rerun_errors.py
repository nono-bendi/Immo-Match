"""Relance le scoring pour tous les matchings en erreur (saint_francois)."""
import sys, os, sqlite3, json
from datetime import datetime

sys.path.insert(0, '/app')
os.chdir('/app')

DB = '/app/data/saint_francois.db'

def main():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row

    # Récupère tous les matchings en erreur
    rows = conn.execute("""
        SELECT m.id, m.prospect_id, m.bien_id
        FROM matchings m
        WHERE m.points_forts LIKE '%Analyse indisponible%'
           OR m.recommandation LIKE '%Vérifier manuellement%'
           OR m.points_attention LIKE '%Erreur%'
        ORDER BY m.prospect_id, m.bien_id
    """).fetchall()

    print(f"[rerun] {len(rows)} matchings en erreur à relancer")

    from scoring import scorer_bien_claude, calculer_score_objectif

    ok = 0
    fail = 0
    for row in rows:
        mid, pid, bid = row['id'], row['prospect_id'], row['bien_id']
        prospect = conn.execute("SELECT * FROM prospects WHERE id=?", (pid,)).fetchone()
        bien     = conn.execute("SELECT * FROM biens WHERE id=?", (bid,)).fetchone()
        if not prospect or not bien:
            print(f"  [SKIP] matching #{mid} — prospect ou bien introuvable")
            fail += 1
            continue

        prospect = dict(prospect)
        bien     = dict(bien)

        try:
            score_obj, detail_obj = calculer_score_objectif(prospect, bien)
            result = scorer_bien_claude(prospect, bien, score_obj, detail_obj,
                                        agency_slug='saint_francois')
            score_total = score_obj + result.get('score_qualitatif', 0)
            conn.execute("""
                UPDATE matchings SET
                    score = ?,
                    points_forts = ?,
                    points_attention = ?,
                    recommandation = ?,
                    date_analyse = ?
                WHERE id = ?
            """, (
                score_total,
                json.dumps(result.get('points_forts', []), ensure_ascii=False),
                json.dumps(result.get('points_attention', []), ensure_ascii=False),
                result.get('recommandation', ''),
                datetime.now().isoformat(),
                mid
            ))
            conn.commit()
            print(f"  [OK] matching #{mid} prospect={pid} bien={bid} score={score_total}")
            ok += 1
        except Exception as e:
            print(f"  [FAIL] matching #{mid} — {e}")
            fail += 1

    conn.close()
    print(f"\n[rerun] Terminé : {ok} OK, {fail} erreurs")

if __name__ == '__main__':
    main()
