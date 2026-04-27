import sqlite3, os

DATA_DIR = os.getenv("DATA_DIR", "data")
db = sqlite3.connect(os.path.join(DATA_DIR, 'saint_francois.db'))
db.row_factory = sqlite3.Row

matchings = db.execute("""
    SELECT m.id, m.prospect_id, m.bien_id, m.score,
           p.nom, p.budget_max, p.bien as type_recherche, p.villes,
           p.exterieur as ext_prospect, p.stationnement as stat_prospect,
           p.etage as etage_prospect, p.criteres,
           b.type as type_bien, b.ville, b.prix,
           b.terrasse, b.nb_balcons, b.exterieur as ext_bien,
           b.ascenseur, b.nb_parkings, b.nb_boxes, b.etage_bien
    FROM matchings m
    JOIN prospects p ON m.prospect_id = p.id
    JOIN biens b ON m.bien_id = b.id
    WHERE (m.statut_prospect IS NULL OR m.statut_prospect != 'refused')
      AND (p.archive = 0 OR p.archive IS NULL)
    ORDER BY p.nom, m.score DESC
""").fetchall()

print(f"Total matchings actifs: {len(matchings)}\n")

problems = []
for m in matchings:
    issues = []
    budget = m['budget_max']
    prix = m['prix']

    # Budget hors fourchette 70-130%
    if budget and prix:
        ratio = prix / budget
        if ratio < 0.70:
            issues.append(f"BUDGET TROP BAS: {prix:,.0f}€ vs budget {budget:,.0f}€ ({int(ratio*100)}%)")
        elif ratio > 1.30:
            issues.append(f"BUDGET DEPASSE: {prix:,.0f}€ vs budget {budget:,.0f}€ ({int(ratio*100)}%)")

    # Extérieur demandé mais absent
    ext_p = (m['ext_prospect'] or '').lower()
    ext_b_present = m['terrasse'] or m['nb_balcons'] or m['ext_bien']
    if ext_p and any(k in ext_p for k in ['balcon', 'terrasse', 'jardin', 'exterieur', 'extérieur']):
        if not ext_b_present:
            issues.append(f"EXTERIEUR MANQUANT: prospect demande '{m['ext_prospect']}' — bien sans extérieur")

    # Ascenseur demandé mais absent
    etage_p = (m['etage_prospect'] or '').lower()
    if 'ascenseur' in etage_p or 'asc' in etage_p:
        if m['ascenseur'] != 1:
            issues.append(f"ASCENSEUR MANQUANT: prospect demande ascenseur — bien sans ascenseur (étage {m['etage_bien']})")

    # Stationnement demandé mais absent
    stat_p = (m['stat_prospect'] or '').lower()
    if stat_p and stat_p not in ('non', 'sans', ''):
        has_parking = (m['nb_parkings'] and m['nb_parkings'] > 0) or (m['nb_boxes'] and m['nb_boxes'] > 0)
        if not has_parking:
            issues.append(f"STATIONNEMENT MANQUANT: prospect demande '{m['stat_prospect']}' — bien sans parking/box")

    if issues:
        problems.append({
            'matching_id': m['id'],
            'prospect': m['nom'],
            'budget': budget,
            'bien_id': m['bien_id'],
            'score': m['score'],
            'type_bien': m['type_bien'],
            'ville': m['ville'],
            'prix': prix,
            'issues': issues
        })

print(f"=== PROBLEMES DETECTES: {len(problems)} matchings suspects ===\n")

by_prospect = {}
for p in problems:
    name = p['prospect']
    by_prospect.setdefault(name, []).append(p)

for name, items in sorted(by_prospect.items()):
    print(f"[{name}]")
    for item in items:
        print(f"  Bien #{item['bien_id']} {item['type_bien']} {item['ville']} — {item['prix']:,.0f}€ — score {item['score']}")
        for issue in item['issues']:
            print(f"    ⚠ {issue}")
    print()

db.close()
print(f"\n{len(problems)} matchings suspects / {len(matchings)} total")
