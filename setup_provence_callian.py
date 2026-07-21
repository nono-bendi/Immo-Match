#!/usr/bin/env python3
"""
Setup compte Provence Immobilier Callian — données réelles scrapées depuis provenceimmocallian.com
"""
import sys, os
sys.path.insert(0, '/app')

import sqlite3, bcrypt
from datetime import datetime
from agencies_db import AGENCIES_DB_PATH, DATA_DIR
from database import init_db

SLUG       = "provence_callian"
NOM        = "Provence Immobilier"
NOM_COURT  = "Provence Immo"
NOM_FILTRE = "PROVENCE IMMOBILIER"
ADRESSE    = "Callian, 83440 Var"
TELEPHONE  = ""
EMAIL      = "contact@provenceimmocallian.com"
COULEUR    = "#8B6914"
USER_EMAIL = "mathis.duverger@free.fr"
USER_NOM   = "Régis Duverger"
USER_PASS  = "reg12314*"

BIENS = [
    # ── Page 1 ──
    {"reference":"RD1191","type":"Appartement","ville":"Mandelieu-la-Napoule","prix":210000,"surface":66.0,"pieces":3,"chambres":None,"description":"Appartement T3 avec terrasse au cœur de Mandelieu, 3 pièces, 66 m².","photos":["https://www.provenceimmocallian.com/office12/gnimmo_otletimmobilier/catalog/images/pr_p/6/0/0/2/2/2/9/9/60022299a.jpg"],"terrasse":True,"cave":None,"nb_parkings":None,"dpe_lettre":None,"ges_lettre":None},
    {"reference":"1239","type":"Maison","ville":"Montauroux","prix":545000,"surface":92.0,"pieces":4,"chambres":None,"description":"Maison 4 pièces à Montauroux, surface 92 m².","photos":["https://www.provenceimmocallian.com/office12/gnimmo_otletimmobilier/catalog/images/pr_p/6/0/5/4/9/3/3/5/60549335a.jpg"],"terrasse":None,"cave":None,"nb_parkings":None,"dpe_lettre":None,"ges_lettre":None},
    {"reference":"RD1236","type":"Maison de village","ville":"Saint-Paul-en-Forêt","prix":127000,"surface":56.0,"pieces":5,"chambres":3,"description":"Exclusivité — Maison de village 3 chambres 56 m² à Saint-Paul-en-Forêt.","photos":["https://www.provenceimmocallian.com/office12/gnimmo_otletimmobilier/catalog/images/pr_p/6/0/4/8/1/9/4/8/60481948a.jpg"],"terrasse":None,"cave":None,"nb_parkings":None,"dpe_lettre":None,"ges_lettre":None},
    {"reference":"RD1235","type":"Maison de village","ville":"Callian","prix":170000,"surface":65.0,"pieces":5,"chambres":3,"description":"Charmante maison de village rénovée avec terrasse et vue imprenable à Callian.","photos":["https://www.provenceimmocallian.com/office12/gnimmo_otletimmobilier/catalog/images/pr_p/6/0/4/8/1/2/2/7/60481227a.jpg"],"terrasse":True,"cave":None,"nb_parkings":None,"dpe_lettre":None,"ges_lettre":None},
    {"reference":"LO1193","type":"Villa","ville":"Callian","prix":630000,"surface":173.07,"pieces":4,"chambres":None,"description":"Villa familiale avec piscine et appartement indépendant à Callian.","photos":["https://www.provenceimmocallian.com/office12/gnimmo_otletimmobilier/catalog/images/pr_p/6/0/0/2/9/5/8/2/60029582a.jpg"],"terrasse":None,"cave":None,"nb_parkings":None,"dpe_lettre":None,"ges_lettre":None},
    {"reference":"SDVA1231","type":"Maison","ville":"Bargemon","prix":249000,"surface":95.5,"pieces":4,"chambres":3,"description":"Maison T4 à Bargemon, 4 pièces, 95,5 m².","photos":["https://www.provenceimmocallian.com/office12/gnimmo_otletimmobilier/catalog/images/pr_p/6/0/4/3/3/9/4/6/60433946a.jpg"],"terrasse":None,"cave":None,"nb_parkings":None,"dpe_lettre":None,"ges_lettre":None},
    # ── Page 2 ──
    {"reference":"VMSD1005","type":"Villa","ville":"Bagnols-en-Forêt","prix":599000,"surface":155.0,"pieces":5,"chambres":3,"description":"Villa individuelle au calme avec 5 pièces et 155 m², 2 parkings.","photos":["https://www.provenceimmocallian.com/office12/gnimmo_otletimmobilier/catalog/images/pr_p/5/8/0/9/5/2/8/6/58095286a.jpg"],"terrasse":None,"cave":None,"nb_parkings":2,"dpe_lettre":None,"ges_lettre":None},
    {"reference":"CPY1228","type":"Maison","ville":"Vidauban","prix":421500,"surface":126.4,"pieces":5,"chambres":4,"description":"Maison individuelle 5-6 pièces à Vidauban, 2 parkings.","photos":["https://www.provenceimmocallian.com/office12/gnimmo_otletimmobilier/catalog/images/pr_p/6/0/2/9/8/4/3/5/60298435a.jpg"],"terrasse":None,"cave":None,"nb_parkings":2,"dpe_lettre":None,"ges_lettre":None},
    {"reference":"RD1227","type":"Terrain","ville":"Callian","prix":190000,"surface":1800.0,"pieces":None,"chambres":None,"description":"Terrain de 1 800 m² avec permis de construire accepté à Callian.","photos":["https://www.provenceimmocallian.com/office12/gnimmo_otletimmobilier/catalog/images/pr_p/6/0/2/9/3/2/5/7/60293257a.jpg"],"terrasse":None,"cave":None,"nb_parkings":None,"dpe_lettre":None,"ges_lettre":None},
    {"reference":"RD1219","type":"Appartement","ville":"Fréjus","prix":143000,"surface":27.0,"pieces":2,"chambres":1,"description":"T2 en résidence sécurisée avec piscine à Fréjus, 1 parking.","photos":["https://www.provenceimmocallian.com/office12/gnimmo_otletimmobilier/catalog/images/pr_p/6/0/2/1/5/0/0/6/60215006a.jpg"],"terrasse":None,"cave":None,"nb_parkings":1,"dpe_lettre":None,"ges_lettre":None},
    {"reference":"RD1146","type":"Maison de village","ville":"Callian","prix":168000,"surface":63.0,"pieces":4,"chambres":2,"description":"Maison de village rénovée sur 4 niveaux avec fort potentiel locatif à Callian.","photos":["https://www.provenceimmocallian.com/office12/gnimmo_otletimmobilier/catalog/images/pr_p/5/9/4/9/4/4/0/7/59494407a.jpg"],"terrasse":None,"cave":None,"nb_parkings":None,"dpe_lettre":None,"ges_lettre":None},
    {"reference":"1208","type":"Studio","ville":"Callian","prix":85000,"surface":17.0,"pieces":1,"chambres":1,"description":"Studio avec terrasse et vue panoramique, appartement témoin de résidence à Callian.","photos":["https://www.provenceimmocallian.com/office12/gnimmo_otletimmobilier/catalog/images/pr_p/6/0/1/5/9/5/8/7/60159587a.jpg"],"terrasse":True,"cave":None,"nb_parkings":1,"dpe_lettre":None,"ges_lettre":None},
    # ── Page 3 ──
    {"reference":"RD1205","type":"Villa","ville":"Callian","prix":466000,"surface":137.0,"pieces":5,"chambres":2,"description":"Villa de charme avec piscine et vue panoramique exceptionnelle à Callian.","photos":["https://www.provenceimmocallian.com/office12/gnimmo_otletimmobilier/catalog/images/pr_p/6/0/1/4/8/5/4/8/60148548a.jpg"],"terrasse":True,"cave":None,"nb_parkings":None,"dpe_lettre":None,"ges_lettre":None},
    {"reference":"VASD1203","type":"Appartement","ville":"Callian","prix":210000,"surface":74.0,"pieces":3,"chambres":1,"description":"Appartement de caractère T3 avec vue et charme à Callian.","photos":["https://www.provenceimmocallian.com/office12/gnimmo_otletimmobilier/catalog/images/pr_p/6/0/1/4/6/8/4/7/60146847a.jpg"],"terrasse":None,"cave":None,"nb_parkings":None,"dpe_lettre":None,"ges_lettre":None},
    {"reference":"VTSD1169","type":"Terrain","ville":"Callian","prix":87000,"surface":4055.0,"pieces":None,"chambres":None,"description":"Terrain constructible à Callian.","photos":["https://www.provenceimmocallian.com/office12/gnimmo_otletimmobilier/catalog/images/pr_p/5/9/8/0/2/4/9/9/59802499a.jpg"],"terrasse":None,"cave":None,"nb_parkings":None,"dpe_lettre":None,"ges_lettre":None},
    {"reference":"RD1132","type":"Maison de village","ville":"Fayence","prix":394000,"surface":142.0,"pieces":7,"chambres":2,"description":"Maison de village avec jardin et terrasse 142 m² à Fayence.","photos":["https://www.provenceimmocallian.com/office12/gnimmo_otletimmobilier/catalog/images/pr_p/5/9/2/7/0/0/9/8/59270098a.jpg"],"terrasse":True,"cave":None,"nb_parkings":None,"dpe_lettre":None,"ges_lettre":None},
    {"reference":"683","type":"Terrain","ville":"Callian","prix":250000,"surface":168453.0,"pieces":None,"chambres":None,"description":"Merveilleux terrain naturel de 17 hectares à Callian.","photos":["https://www.provenceimmocallian.com/office12/gnimmo_otletimmobilier/catalog/images/pr_p/5/3/6/6/4/9/4/1/53664941a.jpg"],"terrasse":None,"cave":None,"nb_parkings":None,"dpe_lettre":None,"ges_lettre":None},
    {"reference":"1109","type":"Appartement","ville":"Callian","prix":137000,"surface":65.0,"pieces":3,"chambres":1,"description":"T3 au village de Callian, idéal investissement.","photos":["https://www.provenceimmocallian.com/office12/gnimmo_otletimmobilier/catalog/images/pr_p/5/9/0/7/2/6/0/4/59072604a.jpg"],"terrasse":None,"cave":None,"nb_parkings":None,"dpe_lettre":None,"ges_lettre":None},
    # ── Page 4 ──
    {"reference":"VASD1082","type":"Appartement","ville":"Saint-Raphaël","prix":399000,"surface":83.6,"pieces":4,"chambres":3,"description":"Appartement T4 en centre-ville de Saint-Raphaël, à 3 minutes des plages.","photos":["https://www.provenceimmocallian.com/office12/gnimmo_otletimmobilier/catalog/images/pr_p/5/8/7/5/3/1/1/7/58753117a.jpg"],"terrasse":None,"cave":None,"nb_parkings":None,"dpe_lettre":None,"ges_lettre":None},
    {"reference":"RD1143","type":"Maison de village","ville":"Callian","prix":199000,"surface":93.0,"pieces":5,"chambres":2,"description":"Maison de village 93 m² avec vue panoramique et tranquillité à Callian.","photos":["https://www.provenceimmocallian.com/office12/gnimmo_otletimmobilier/catalog/images/pr_p/5/9/4/1/9/6/3/4/59419634a.jpg"],"terrasse":None,"cave":None,"nb_parkings":None,"dpe_lettre":None,"ges_lettre":None},
    {"reference":"VMSD1128","type":"Maison","ville":"Saint-Paul-en-Forêt","prix":884000,"surface":263.0,"pieces":10,"chambres":7,"description":"Grande maison 263 m², 10 pièces, 7 chambres à Saint-Paul-en-Forêt.","photos":["https://www.provenceimmocallian.com/office12/gnimmo_otletimmobilier/catalog/images/pr_p/5/9/2/4/5/2/0/4/59245204a.jpg"],"terrasse":None,"cave":None,"nb_parkings":None,"dpe_lettre":None,"ges_lettre":None},
    {"reference":"VTSD1123","type":"Terrain","ville":"Mons","prix":35000,"surface":50500.0,"pieces":None,"chambres":None,"description":"Terrain de 50 500 m² à Mons en exclusivité.","photos":["https://www.provenceimmocallian.com/office12/gnimmo_otletimmobilier/catalog/images/pr_p/5/9/2/0/7/7/5/3/59207753a.jpg"],"terrasse":None,"cave":None,"nb_parkings":None,"dpe_lettre":None,"ges_lettre":None},
    {"reference":"RD1113","type":"Appartement","ville":"Callian","prix":189000,"surface":52.0,"pieces":3,"chambres":2,"description":"Appartement 3 pièces 52 m² avec terrasse et ascenseur à Callian.","photos":["https://www.provenceimmocallian.com/office12/gnimmo_otletimmobilier/catalog/images/pr_p/5/9/1/2/3/9/9/9/59123999a.jpg"],"terrasse":True,"cave":None,"nb_parkings":None,"dpe_lettre":None,"ges_lettre":None},
    {"reference":"RD1080","type":"Appartement","ville":"Bagnols-en-Forêt","prix":149000,"surface":56.0,"pieces":3,"chambres":2,"description":"Appartement T3 56 m², 2 chambres à Bagnols-en-Forêt.","photos":["https://www.provenceimmocallian.com/office12/gnimmo_otletimmobilier/catalog/images/pr_p/5/8/7/3/2/8/9/8/58732898a.jpg"],"terrasse":None,"cave":None,"nb_parkings":None,"dpe_lettre":None,"ges_lettre":None},
    # ── Page 5 ──
    {"reference":"837","type":"Terrain","ville":"Tourrettes","prix":245000,"surface":2000.0,"pieces":None,"chambres":None,"description":"Terrain viabilisé avec permis de construire, libre constructeur à Tourrettes.","photos":["https://www.provenceimmocallian.com/office12/gnimmo_otletimmobilier/catalog/images/pr_p/5/5/8/4/2/5/3/0/55842530a.jpg"],"terrasse":None,"cave":None,"nb_parkings":None,"dpe_lettre":None,"ges_lettre":None},
    {"reference":"471","type":"Terrain","ville":"Tourrettes","prix":248000,"surface":1500.0,"pieces":None,"chambres":None,"description":"Terrains constructibles dans secteur recherché à Tourrettes.","photos":["https://www.provenceimmocallian.com/office12/gnimmo_otletimmobilier/catalog/images/pr_p/5/0/3/1/5/9/0/3/50315903a.jpg"],"terrasse":None,"cave":None,"nb_parkings":None,"dpe_lettre":None,"ges_lettre":None},
    {"reference":"365","type":"Terrain","ville":"Callian","prix":240000,"surface":2000.0,"pieces":None,"chambres":None,"description":"Terrain viabilisé à Callian.","photos":["https://www.provenceimmocallian.com/office12/gnimmo_otletimmobilier/catalog/images/pr_p/4/8/6/3/3/3/2/7/48633327a.jpg"],"terrasse":None,"cave":None,"nb_parkings":None,"dpe_lettre":None,"ges_lettre":None},
    # VTAR287 ignoré (bien vendu, prix null)
]


def run():
    print("=" * 60)
    print("  SETUP PROVENCE IMMOBILIER CALLIAN")
    print("=" * 60)
    now = datetime.now().isoformat()

    # ── Agence ──────────────────────────────────────────────────
    conn = sqlite3.connect(AGENCIES_DB_PATH)
    existing = conn.execute("SELECT id FROM agencies WHERE slug = ?", (SLUG,)).fetchone()
    if existing:
        agency_id = existing[0]
        print(f"[!] Agence déjà existante (id={agency_id})")
    else:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO agencies (slug, nom, nom_court, nom_filtre, adresse, telephone, email, couleur_primaire)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (SLUG, NOM, NOM_COURT, NOM_FILTRE, ADRESSE, TELEPHONE, EMAIL, COULEUR))
        agency_id = cur.lastrowid
        conn.commit()
        print(f"[+] Agence créée : id={agency_id}")

    # ── User ─────────────────────────────────────────────────────
    if conn.execute("SELECT id FROM users WHERE email = ?", (USER_EMAIL,)).fetchone():
        print(f"[!] Compte déjà existant : {USER_EMAIL}")
    else:
        pw_hash = bcrypt.hashpw(USER_PASS.encode(), bcrypt.gensalt()).decode()
        conn.execute("""
            INSERT INTO users (email, password_hash, nom, role, agency_id, created_at)
            VALUES (?, ?, ?, 'admin', ?, ?)
        """, (USER_EMAIL, pw_hash, USER_NOM, agency_id, now))
        conn.commit()
        print(f"[+] Compte créé : {USER_EMAIL} ({USER_NOM})")
    conn.close()

    # ── DB agence ─────────────────────────────────────────────────
    db_path = os.path.join(DATA_DIR, f"{SLUG}.db")
    init_db(db_path)
    print(f"[+] DB initialisée : {db_path}")

    # ── Biens ─────────────────────────────────────────────────────
    conn2 = sqlite3.connect(db_path)
    inserted = 0
    for b in BIENS:
        ref = b.get("reference") or ""
        if ref and conn2.execute("SELECT id FROM biens WHERE reference = ?", (ref,)).fetchone():
            print(f"    [skip] {ref}")
            continue

        photos_str = " | ".join(p for p in (b.get("photos") or []) if p.startswith("http"))

        conn2.execute("""
            INSERT INTO biens (
                reference, type, ville, prix, surface, pieces, chambres,
                description, photos, terrasse, cave, nb_parkings,
                dpe_lettre, ges_lettre, statut, source, date_ajout, date_creation
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'actif', 'manual', ?, ?)
        """, (
            ref or None,
            b.get("type") or "Bien",
            b.get("ville") or "Callian",
            b.get("prix") or 0,
            b.get("surface") or 0,
            b.get("pieces") or None,
            b.get("chambres") or None,
            b.get("description") or "",
            photos_str,
            1 if b.get("terrasse") else 0,
            1 if b.get("cave") else 0,
            b.get("nb_parkings") or 0,
            b.get("dpe_lettre"),
            b.get("ges_lettre"),
            now, now,
        ))
        inserted += 1

    conn2.commit()
    conn2.close()

    print(f"\n[+] {inserted} bien(s) insérés")
    print("\n" + "=" * 60)
    print(f"  TERMINÉ")
    print(f"  Agence  : {NOM} (slug={SLUG})")
    print(f"  Compte  : {USER_EMAIL} / {USER_PASS}")
    print(f"  Biens   : {inserted}/{len(BIENS)}")
    print("=" * 60)


if __name__ == "__main__":
    run()
