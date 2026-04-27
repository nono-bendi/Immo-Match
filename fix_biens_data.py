import sqlite3, re, os

DATA_DIR = os.getenv("DATA_DIR", "data")
db = sqlite3.connect(os.path.join(DATA_DIR, 'saint_francois.db'))
db.row_factory = sqlite3.Row

biens = db.execute(
    "SELECT id, description, ascenseur, terrasse, nb_balcons, exterieur FROM biens "
    "WHERE description IS NOT NULL AND description != ''"
).fetchall()

updates = 0
for b in biens:
    bid = b['id']
    desc = (b['description'] or '').lower()
    changes = {}

    # ASCENSEUR
    if b['ascenseur'] is None or b['ascenseur'] == 0:
        has_elevator = bool(re.search(r'ascenseur', desc))
        no_elevator = bool(re.search(r'sans ascenseur|pas d.ascenseur|sans asc\.', desc))
        if has_elevator and not no_elevator:
            changes['ascenseur'] = 1

    # TERRASSE
    if not b['terrasse']:
        if re.search(r'\bterrasse\b', desc):
            changes['terrasse'] = 1

    # EXTERIEUR (champ texte) — jardin, terrain, piscine, véranda, loggia
    if not b['exterieur']:
        ext_parts = []
        if re.search(r'\bjardin\b', desc):
            ext_parts.append('jardin')
        if re.search(r'\bterrain\b', desc):
            ext_parts.append('terrain')
        if re.search(r'\bpiscine\b', desc):
            ext_parts.append('piscine')
        if re.search(r'\bv[eé]randa\b', desc):
            ext_parts.append('véranda')
        if re.search(r'\bloggia\b', desc):
            ext_parts.append('loggia')
        if ext_parts:
            changes['exterieur'] = ', '.join(ext_parts)

    # NB_BALCONS
    if not b['nb_balcons']:
        m = re.search(r'(\d+)\s*balcon', desc)
        if m:
            changes['nb_balcons'] = int(m.group(1))
        elif re.search(r'\bbalcon\b', desc):
            changes['nb_balcons'] = 1

    if changes:
        set_clause = ', '.join(f"{k} = ?" for k in changes)
        db.execute(
            f"UPDATE biens SET {set_clause} WHERE id = ?",
            list(changes.values()) + [bid]
        )
        print(f"Bien #{bid}: {changes}")
        updates += 1

db.commit()
db.close()
print(f'\nTotal: {updates} biens mis a jour')
