import sqlite3, re, os

DATA_DIR = os.getenv("DATA_DIR", "data")
db = sqlite3.connect(os.path.join(DATA_DIR, 'saint_francois.db'))

# 1. Parking/box matchés avec non-chercheurs de parking
cur = db.execute("""
    DELETE FROM matchings WHERE id IN (
        SELECT m.id FROM matchings m
        JOIN prospects p ON m.prospect_id = p.id
        JOIN biens b ON m.bien_id = b.id
        WHERE (b.type LIKE '%parking%' OR b.type LIKE '%box%')
        AND (m.statut_prospect IS NULL OR m.statut_prospect != 'refused')
        AND LOWER(COALESCE(p.bien,'')) NOT LIKE '%parking%'
        AND LOWER(COALESCE(p.bien,'')) NOT LIKE '%box%'
        AND LOWER(COALESCE(p.bien,'')) NOT LIKE '%garage%'
    )
""")
print(f"Supprime {cur.rowcount} matchings parking/box incompatibles")

# 2. Maison/villa matchés avec chercheurs T-type uniquement
rows = db.execute("""
    SELECT m.id, p.bien, p.nom, b.type
    FROM matchings m
    JOIN prospects p ON m.prospect_id = p.id
    JOIN biens b ON m.bien_id = b.id
    WHERE (b.type LIKE '%maison%' OR b.type LIKE '%villa%')
    AND (m.statut_prospect IS NULL OR m.statut_prospect != 'refused')
    AND LOWER(COALESCE(p.bien,'')) NOT LIKE '%maison%'
    AND LOWER(COALESCE(p.bien,'')) NOT LIKE '%villa%'
    AND LOWER(COALESCE(p.bien,'')) NOT LIKE '%tous%'
    AND p.bien IS NOT NULL AND p.bien != ''
""").fetchall()

ids_to_delete = []
for row in rows:
    mid, bien_p, nom, bien_t = row
    tp = (bien_p or '').lower()
    cherche_t = bool(re.search(r'\bt[1-5]\b', tp)) or 'appartement' in tp or 'studio' in tp
    if cherche_t:
        ids_to_delete.append(mid)
        print(f"  {nom} cherche '{bien_p}' — {bien_t}")

if ids_to_delete:
    placeholders = ','.join('?' * len(ids_to_delete))
    db.execute(f"DELETE FROM matchings WHERE id IN ({placeholders})", ids_to_delete)
print(f"Supprime {len(ids_to_delete)} matchings maison/villa vs T-type incompatibles")

db.commit()
db.close()
print("Nettoyage termine")
