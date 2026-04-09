import sqlite3

conn = sqlite3.connect('data/demo.db')

# Voir tous les prospects
print("=== PROSPECTS ===")
for row in conn.execute("SELECT id, nom FROM prospects").fetchall():
    print(row)

print("\n=== MATCHINGS PAR PROSPECT ===")
for row in conn.execute("SELECT prospect_id, id, score FROM matchings ORDER BY prospect_id, score DESC").fetchall():
    print(row)

# Corriger les scores pour tous les prospects
# Chaque prospect a 5 matchings — on leur donne des scores variés
scores_par_prospect = {
    # prospect_id: [score1, score2, score3, score4, score5]
}

# Récupérer les matchings groupés par prospect
from collections import defaultdict
groupes = defaultdict(list)
for row in conn.execute("SELECT id, prospect_id, score FROM matchings ORDER BY prospect_id, score DESC").fetchall():
    groupes[row[1]].append(row[0])

# Scores réalistes variés pour chaque prospect
grilles = [
    [94, 81, 68, 52, 37],
    [88, 76, 63, 49, 31],
    [96, 84, 71, 58, 42],
    [91, 79, 65, 47, 28],
    [87, 74, 62, 45, 33],
    [93, 82, 69, 53, 38],
]

for i, (pid, ids) in enumerate(sorted(groupes.items())):
    grille = grilles[i % len(grilles)]
    for j, mid in enumerate(ids[:5]):
        conn.execute("UPDATE matchings SET score=? WHERE id=?", (grille[j], mid))
        print(f"prospect {pid} matching {mid} -> score {grille[j]}")

conn.commit()
conn.close()
print("\nOK - scores mis a jour")
