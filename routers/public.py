# ════════════════════════════════════════════════════════════════════════════
# PUBLIC — Page publique d'une annonce immobilière
# Route sans authentification : /public/bien/{agency_slug}/{bien_id}
# ════════════════════════════════════════════════════════════════════════════

import sqlite3
from fastapi import APIRouter
from fastapi.responses import HTMLResponse, RedirectResponse
from html import escape
from agencies_db import get_db_path, AGENCIES_DB_PATH

router = APIRouter()


# ── Helpers ──────────────────────────────────────────────────────────────────

def _get_agency_by_slug(slug: str) -> dict | None:
    conn = sqlite3.connect(AGENCIES_DB_PATH)
    conn.row_factory = sqlite3.Row
    row = conn.execute("SELECT * FROM agencies WHERE slug = ?", (slug,)).fetchone()
    conn.close()
    return dict(row) if row else None


def _fmt_prix(prix) -> str:
    if not prix:
        return ""
    try:
        return f"{int(float(prix)):,}".replace(",", "\u202f") + "\u00a0€"
    except Exception:
        return str(prix)


def _dpe_color(lettre: str) -> str:
    return {
        "A": "#009a44", "B": "#51b84d", "C": "#b5d334",
        "D": "#f7ec00", "E": "#f5a623", "F": "#e2531f", "G": "#c0001d",
    }.get((lettre or "").upper(), "#9ca3af")


# ── Icônes SVG inline ─────────────────────────────────────────────────────────
ICONS = {
    "surface":    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="24" height="24"><path d="M3 21l18-18M3 21h6M3 21v-6" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 3h-6M21 3v6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    "pieces":     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="24" height="24"><rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M3 9h18M12 9v12M3 15h9" stroke-linecap="round"/></svg>',
    "chambres":   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="24" height="24"><path d="M3 17V9.5a1 1 0 011-1h16a1 1 0 011 1V17M3 17h18M3 17v2M21 17v2" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 12.5V11a1 1 0 011-1h8a1 1 0 011 1v1.5" stroke-linecap="round"/><path d="M5 8.5V7a1 1 0 011-1h12a1 1 0 011 1v1.5" stroke-linecap="round"/></svg>',
    "etage":      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="24" height="24"><path d="M3 21h18M6 21V8l6-5 6 5v13" stroke-linecap="round" stroke-linejoin="round"/><rect x="9" y="14" width="6" height="7" rx="0.5"/></svg>',
    "ascenseur":  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="24" height="24"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 9l3-3 3 3M9 15l3 3 3-3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    "terrasse":   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="24" height="24"><path d="M3 17h18M6 17V9M18 17V9M6 9h12M9 9V6h6v3" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 21h16" stroke-linecap="round"/></svg>',
    "balcon":     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="24" height="24"><path d="M4 12h16v6H4zM4 18h16M8 12V9M16 12V9M4 12V9h16v3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    "parking":    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="24" height="24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17V7h5a3 3 0 010 6H9" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    "cave":       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="24" height="24"><path d="M3 9l9-6 9 6v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 21V12h6v9" stroke-linecap="round"/></svg>',
    "orientation":'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="24" height="24"><circle cx="12" cy="12" r="9"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2" stroke-linecap="round"/><path d="M14.5 9.5l-5 5M9.5 9.5l2 2" stroke-linecap="round"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/></svg>',
    "charges":    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="24" height="24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    "piscine":    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="24" height="24"><path d="M2 16c2 2 4 2 6 0s4-2 6 0 4 2 6 0M2 20c2 2 4 2 6 0s4-2 6 0 4 2 6 0" stroke-linecap="round"/><path d="M8 4l4 8M12 4v8M16 4l-4 8" stroke-linecap="round"/></svg>',
    "vue":        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="24" height="24"><path d="M2 12C4 7 8 4 12 4s8 3 10 8c-2 5-6 8-10 8s-8-3-10-8z" stroke-linecap="round"/><circle cx="12" cy="12" r="3"/></svg>',
    "jardin":     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="24" height="24"><path d="M12 22V12M12 12C12 7 7 4 3 6c2 4 6 6 9 6zM12 12c0-5 5-8 9-6-2 4-6 6-9 6z" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    "lumineux":   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="24" height="24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke-linecap="round"/></svg>',
    "calme":      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="24" height="24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    "cuisine":    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="24" height="24"><rect x="2" y="8" width="20" height="13" rx="2"/><path d="M7 8V5M12 8V5M17 8V5" stroke-linecap="round"/><circle cx="7" cy="13" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="13" r="1.5" fill="currentColor" stroke="none"/><circle cx="17" cy="13" r="1.5" fill="currentColor" stroke="none"/></svg>',
    "sdb":        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="24" height="24"><path d="M4 20h16M4 20V9a2 2 0 012-2h.5M4 20a2 2 0 01-2-2v-1h20v1a2 2 0 01-2 2M7 7V5a2 2 0 012-2h6a2 2 0 012 2v8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    "wc":         '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="24" height="24"><path d="M5 3h14M5 3a2 2 0 00-2 2v4h18V5a2 2 0 00-2-2M3 9c0 5 2 9 9 9s9-4 9-9" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    "honoraires": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="24" height="24"><path d="M9 14l6-6M9.5 9a.5.5 0 100-1 .5.5 0 000 1zM14.5 14a.5.5 0 100-1 .5.5 0 000 1z" stroke-linecap="round" stroke-linejoin="round"/><rect x="3" y="3" width="18" height="18" rx="3"/></svg>',
    "mer":        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="24" height="24"><path d="M2 19c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0M6 9l6-6 6 6" stroke-linecap="round"/></svg>',
    "gardien":    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="24" height="24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 12l2 2 4-4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    "box":        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="24" height="24"><rect x="2" y="10" width="20" height="11" rx="1"/><path d="M5 10V7a7 7 0 0114 0v3" stroke-linecap="round"/><path d="M8 10h8" stroke-linecap="round"/></svg>',
    "dpe":        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="24" height="24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    "copropriete":'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="24" height="24"><path d="M3 21h18M5 21V7l7-4 7 4v14" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 21v-6h6v6" stroke-linecap="round"/></svg>',
}

# ── Extraction mots-clés description ─────────────────────────────────────────
KEYWORDS = [
    (["piscine"],                              "piscine",  "Piscine"),
    (["vue mer", "vue sur la mer"],            "mer",      "Vue mer"),
    (["vue panoramique", "vue exceptionnelle"],"vue",      "Vue panoramique"),
    (["vue dégagée", "vue degagee"],           "vue",      "Vue dégagée"),
    (["jardin", "terrain", "parc"],            "jardin",   "Jardin / Terrain"),
    (["cuisine équipée", "cuisine equipee",
      "cuisine aménagée", "cuisine amenagee"], "cuisine",  "Cuisine équipée"),
    (["lumineux", "lumineuse", "très clair",
      "belle luminosité"],                     "lumineux", "Très lumineux"),
    (["calme", "environnement calme",
      "quartier calme"],                       "calme",    "Environnement calme"),
    (["proche mer", "bord de mer",
      "à 5 mn de la mer", "a 5 mn de la mer"],"mer",      "Proche de la mer"),
    (["gardien", "gardienne"],                 "gardien",  "Gardien(ne)"),
    (["digicode", "interphone", "visiophone"], "gardien",  "Accès sécurisé"),
    (["plain-pied", "plain pied"],             "etage",    "Plain-pied"),
    (["cheminée", "cheminee"],                 "lumineux", "Cheminée"),
]

def _extract_keywords(description: str) -> list:
    """Retourne les (icon_key, label) détectés dans la description."""
    desc_low = description.lower()
    found = []
    seen_icons = set()
    for keywords, icon_key, label in KEYWORDS:
        if any(kw in desc_low for kw in keywords):
            if icon_key not in seen_icons:
                found.append((icon_key, label))
                seen_icons.add(icon_key)
    return found


def _render_page(bien: dict, agency: dict) -> str:
    # ── Données bien ──────────────────────────────────────────────────────────
    photos    = [p.strip() for p in (bien.get("photos") or "").split("|") if p.strip().startswith("http")]
    titre     = escape(bien.get("titre") or f"{bien.get('type', 'Bien')} à {bien.get('ville', '')}")
    type_b    = escape(bien.get("type") or "Bien")
    ville     = escape(bien.get("ville") or "")

    prix      = _fmt_prix(bien.get("prix"))
    surface   = bien.get("surface") or ""
    pieces    = bien.get("pieces") or ""
    chambres  = bien.get("chambres") or ""
    desc_raw  = bien.get("description") or ""
    desc      = escape(desc_raw).replace("\n", "<br>")
    dpe       = (bien.get("dpe_lettre") or "").upper()
    dpe_kwh   = bien.get("dpe_kwh") or ""
    ges       = (bien.get("ges_lettre") or "").upper()
    ges_co2   = bien.get("ges_co2") or ""
    lat       = bien.get("latitude") or ""
    lng       = bien.get("longitude") or ""
    reference = bien.get("reference") or ""
    video_url = (bien.get("video_url") or "").strip()

    etage_bien        = bien.get("etage_bien")
    nb_etages         = bien.get("nb_etages_immeuble")
    ascenseur         = bien.get("ascenseur")
    cave              = bien.get("cave")
    nb_parkings       = bien.get("nb_parkings") or 0
    nb_boxes          = bien.get("nb_boxes") or 0
    terrasse          = bien.get("terrasse")
    nb_balcons        = bien.get("nb_balcons") or 0
    orientation_sud   = bien.get("orientation_sud")
    orientation_est   = bien.get("orientation_est")
    orientation_ouest = bien.get("orientation_ouest")
    orientation_nord  = bien.get("orientation_nord")
    charges           = bien.get("charges_mensuelles") or 0
    copropriete       = escape(bien.get("copropriete") or "")
    nb_salles_bain    = bien.get("nb_salles_bain") or 0
    nb_salles_eau     = bien.get("nb_salles_eau") or 0
    nb_wc             = bien.get("nb_wc") or 0
    surface_cave      = bien.get("surface_cave") or 0
    prix_hn           = bien.get("prix_hn") or 0
    honoraires_pct    = bien.get("honoraires_pct") or 0

    # ── Données agence ────────────────────────────────────────────────────────
    ag_nom    = escape(agency.get("nom") or "")
    ag_tel    = escape(agency.get("telephone") or "")
    ag_email  = escape(agency.get("email") or "")
    ag_adresse= escape(agency.get("adresse") or "")
    ag_logo   = (agency.get("logo_url") or "").strip()
    ag_color  = (agency.get("couleur_primaire") or "#1E3A5F").strip()

    # ── Logo ──────────────────────────────────────────────────────────────────
    if ag_logo.startswith("http"):
        logo_hdr  = f'<img src="{escape(ag_logo)}" alt="{ag_nom}" class="hdr-logo">'
        logo_card = f'<img src="{escape(ag_logo)}" alt="{ag_nom}" class="card-logo">'
    else:
        ini = ag_nom[:2].upper() if ag_nom else "AG"
        logo_hdr  = f'<div class="hdr-ini" style="background:{ag_color}">{ini}</div>'
        logo_card = f'<div class="card-ini" style="background:{ag_color}">{ini}</div>'

    # ── Carousel mobile ───────────────────────────────────────────────────────
    if photos:
        slides = ""
        for i, p in enumerate(photos):
            loading = "eager" if i == 0 else "lazy"
            slides += f'<div class="slide" onclick="openLb({i})"><img src="{escape(p)}" alt="Photo {i+1}" loading="{loading}"></div>'
        nb_photos = len(photos)
        carousel = (
            f'<div class="carousel-wrap">'
            f'<div class="carousel" id="carousel" onscroll="onScroll()">{slides}</div>'
            f'<div class="ctr" id="ctr">1 / {nb_photos}</div>'
            f'<button class="lb-trigger" onclick="openLb(0)">'
            f'<svg viewBox="0 0 20 20" fill="none" stroke="white" stroke-width="1.5" width="13" height="13"><rect x="2" y="2" width="7" height="7" rx="1"/><rect x="11" y="2" width="7" height="7" rx="1"/><rect x="2" y="11" width="7" height="7" rx="1"/><rect x="11" y="11" width="7" height="7" rx="1"/></svg>'
            f' {nb_photos} photos</button>'
            f'</div>'
        )
    else:
        carousel = '<div class="no-photo">Aucune photo disponible</div>'

    # ── Grille desktop ────────────────────────────────────────────────────────
    p = photos
    n = len(p)
    if n == 0:
        grid = '<div class="grid-empty">Aucune photo disponible</div>'
    elif n == 1:
        grid = f'<div class="grid grid-1" onclick="openLb(0)"><img src="{escape(p[0])}" alt="Photo 1" loading="eager" class="grid-full-img"></div>'
    elif n == 2:
        grid = (
            f'<div class="grid grid-2">'
            f'<div class="g-main" onclick="openLb(0)"><img src="{escape(p[0])}" alt="Photo 1" loading="eager"></div>'
            f'<div class="g-side"><div class="g-cell" onclick="openLb(1)"><img src="{escape(p[1])}" alt="Photo 2" loading="lazy"></div></div>'
            f'</div>'
        )
    else:
        thumbs = ""
        for i in range(min(4, n - 1)):
            idx = i + 1
            is_last = (i == 3 and n > 5)
            overlay = f'<div class="g-ov">+{n - 5} photos</div>' if is_last else ""
            thumbs += f'<div class="g-cell" onclick="openLb({idx})">{overlay}<img src="{escape(p[idx])}" alt="Photo {idx+1}" loading="lazy"></div>'
        grid = (
            f'<div class="grid grid-5">'
            f'<div class="g-main" onclick="openLb(0)"><img src="{escape(p[0])}" alt="Photo principale" loading="eager"></div>'
            f'<div class="g-side">{thumbs}</div>'
            f'<button class="show-all" onclick="openLb(0);event.stopPropagation()">'
            f'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" width="13" height="13"><rect x="2" y="2" width="7" height="7" rx="1"/><rect x="11" y="2" width="7" height="7" rx="1"/><rect x="2" y="11" width="7" height="7" rx="1"/><rect x="11" y="11" width="7" height="7" rx="1"/></svg>'
            f' Voir toutes les photos</button>'
            f'</div>'
        )

    photos_json = "[" + ",".join(f'"{escape(ph)}"' for ph in photos) + "]"

    # ── Stats principales (bande) ─────────────────────────────────────────────
    feats = []
    if surface:
        feats.append((ICONS["surface"], f"{surface} m²", "Surface"))
    if pieces:
        feats.append((ICONS["pieces"], f"{int(float(pieces))} pièce{'s' if int(float(pieces)) > 1 else ''}", "Pièces"))
    if chambres:
        feats.append((ICONS["chambres"], f"{int(float(chambres))} chambre{'s' if int(float(chambres)) > 1 else ''}", "Chambres"))

    feats_html = ""
    for icon, val, lbl in feats:
        feats_html += f'<div class="feat">{icon}<span class="feat-val">{val}</span><span class="feat-lbl">{lbl}</span></div>'

    # ── Amenities (style Airbnb) ──────────────────────────────────────────────
    amenities = []

    if etage_bien is not None and etage_bien != 0:
        txt = f"Étage {etage_bien}"
        if nb_etages:
            txt += f" sur {nb_etages}"
        amenities.append((ICONS["etage"], txt))
    if ascenseur:
        amenities.append((ICONS["ascenseur"], "Ascenseur"))
    if terrasse:
        amenities.append((ICONS["terrasse"], "Terrasse"))
    if nb_balcons and int(nb_balcons) > 0:
        lbl = f"{nb_balcons} balcon{'s' if int(nb_balcons) > 1 else ''}"
        amenities.append((ICONS["balcon"], lbl))
    if cave:
        amenities.append((ICONS["cave"], "Cave"))
    if nb_parkings and int(nb_parkings) > 0:
        lbl = f"{nb_parkings} parking{'s' if int(nb_parkings) > 1 else ''}"
        amenities.append((ICONS["parking"], lbl))
    if nb_boxes and int(nb_boxes) > 0:
        lbl = f"{nb_boxes} box{'s' if int(nb_boxes) > 1 else ''}"
        amenities.append((ICONS["box"], lbl))
    orients = []
    if orientation_sud:   orients.append("Sud")
    if orientation_est:   orients.append("Est")
    if orientation_ouest: orients.append("Ouest")
    if orientation_nord:  orients.append("Nord")
    if orients:
        amenities.append((ICONS["orientation"], "Orientation " + " · ".join(orients)))
    if nb_salles_bain and int(nb_salles_bain) > 0:
        lbl = f"{nb_salles_bain} salle{'s' if int(nb_salles_bain) > 1 else ''} de bains"
        amenities.append((ICONS["sdb"], lbl))
    if nb_salles_eau and int(nb_salles_eau) > 0:
        lbl = f"{nb_salles_eau} salle{'s' if int(nb_salles_eau) > 1 else ''} d'eau"
        amenities.append((ICONS["sdb"], lbl))
    if nb_wc and int(nb_wc) > 0:
        lbl = f"{nb_wc} WC{'s' if int(nb_wc) > 1 else ''} séparé{'s' if int(nb_wc) > 1 else ''}"
        amenities.append((ICONS["wc"], lbl))
    if charges and float(charges) > 0:
        amenities.append((ICONS["charges"], f"Charges {int(float(charges))} €/mois"))
    if surface_cave and float(surface_cave) > 0:
        amenities.append((ICONS["cave"], f"Cave {surface_cave} m²"))
    if copropriete:
        amenities.append((ICONS["copropriete"], copropriete))
    if dpe and dpe in "ABCDEFG":
        amenities.append((ICONS["dpe"], f"DPE classe {dpe}"))

    # Extraction depuis la description
    for icon_key, label in _extract_keywords(desc_raw):
        amenities.append((ICONS[icon_key], label))

    # ── Infos financières (honoraires) ────────────────────────────────────────
    finance_html = ""
    if prix_hn and float(prix_hn) > 0 and honoraires_pct and float(honoraires_pct) > 0:
        prix_hn_fmt = _fmt_prix(prix_hn)
        finance_html = (
            f'<div class="section"><h2 class="sh">Informations financières</h2>'
            f'<div class="fin-grid">'
            f'<div class="fin-item"><span class="fin-lbl">Prix hors honoraires</span><span class="fin-val">{prix_hn_fmt}</span></div>'
            f'<div class="fin-item"><span class="fin-lbl">Honoraires acquéreur</span><span class="fin-val">{honoraires_pct:.2f} %</span></div>'
            f'</div></div>'
        )

    amenities_html = ""
    if amenities:
        items = "".join(
            f'<div class="am-item">{icon}<span>{label}</span></div>'
            for icon, label in amenities
        )
        amenities_html = f'<div class="section"><h2 class="sh">Ce que propose ce bien</h2><div class="am-grid">{items}</div></div>'

    # ── Description ───────────────────────────────────────────────────────────
    desc_html = ""
    if desc:
        if len(desc) > 500:
            short = desc[:420]
            rest  = desc[420:]
            desc_html = (
                f'<div class="section"><h2 class="sh">À propos de ce bien</h2>'
                f'<div class="desc">{short}'
                f'<span id="desc-rest">{rest}</span>'
                f'<br><button class="desc-btn" id="desc-btn" onclick="toggleDesc()">Lire la suite →</button>'
                f'</div></div>'
            )
        else:
            desc_html = f'<div class="section"><h2 class="sh">À propos de ce bien</h2><div class="desc">{desc}</div></div>'

    # ── Vidéo ─────────────────────────────────────────────────────────────────
    video_html = ""
    if video_url:
        if "youtube.com/watch" in video_url:
            vid_id = video_url.split("v=")[-1].split("&")[0]
            src = f"https://www.youtube.com/embed/{vid_id}?rel=0&modestbranding=1"
            video_html = f'<div class="section"><h2 class="sh">Visite vidéo</h2><div class="vid-wrap"><iframe src="{src}" allowfullscreen loading="lazy" title="Visite vidéo" class="vid-frame"></iframe></div></div>'
        elif "previsite.net" in video_url:
            video_html = f'<div class="section"><h2 class="sh">Visite vidéo</h2><div class="vid-wrap"><iframe src="{escape(video_url)}" allowfullscreen loading="lazy" title="Visite vidéo" class="vid-frame"></iframe></div></div>'

    # ── DPE ───────────────────────────────────────────────────────────────────
    dpe_html = ""
    if dpe and dpe in "ABCDEFG":
        col = _dpe_color(dpe)
        ges_block = ""
        if ges and ges in "ABCDEFG":
            gcol = _dpe_color(ges)
            ges_num = f'<p class="dpe-num">{ges_co2}<span>kg CO₂/m².an</span></p>' if ges_co2 else ""
            ges_block = f'<div class="dpe-item"><div class="dpe-pill" style="background:{gcol}"><span class="dpe-l">{ges}</span><span class="dpe-lbl">GES</span></div>{ges_num}</div>'
        dpe_num = f'<p class="dpe-num">{dpe_kwh}<span>kWh/m².an</span></p>' if dpe_kwh else ""
        dpe_html = (
            f'<div class="section"><h2 class="sh">Performance énergétique</h2>'
            f'<div class="dpe-row">'
            f'<div class="dpe-item"><div class="dpe-pill" style="background:{col}"><span class="dpe-l">{dpe}</span><span class="dpe-lbl">DPE</span></div>{dpe_num}</div>'
            f'{ges_block}'
            f'</div></div>'
        )

    map_html = ""

    # ── Boutons contact ───────────────────────────────────────────────────────
    tel_btn  = (
        f'<a href="tel:{ag_tel}" class="btn btn-primary">'
        f'<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.58.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C10.29 21 3 13.71 3 4.5c0-.55.45-1 1-1H8c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.24 1.01L6.6 10.8z"/></svg>'
        f'{ag_tel}</a>'
    ) if ag_tel else ""

    mail_btn = (
        f'<a href="mailto:{ag_email}" class="btn btn-outline">'
        f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="16" height="16"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7" stroke-linecap="round"/></svg>'
        f'{ag_email}</a>'
    ) if ag_email else ""

    ref_line = f'<p class="ref">Réf. {escape(str(reference))}</p>' if reference else ""

    # ── Mini stats pour la sidebar ────────────────────────────────────────────
    cs_items = ""
    if surface:
        cs_items += f'<div class="cs-item"><span class="cs-val">{surface} m²</span><span class="cs-lbl">Surface</span></div>'
    if pieces:
        cs_items += f'<div class="cs-item"><span class="cs-val">{int(float(pieces))} pièces</span><span class="cs-lbl">Pièces</span></div>'
    if chambres:
        cs_items += f'<div class="cs-item"><span class="cs-val">{int(float(chambres))} ch.</span><span class="cs-lbl">Chambres</span></div>'
    if dpe and dpe in "ABCDEFG":
        cs_items += f'<div class="cs-item"><span class="cs-val cs-dpe" style="background:{_dpe_color(dpe)};color:#fff;padding:2px 10px;border-radius:6px;">{dpe}</span><span class="cs-lbl">DPE</span></div>'
    card_stats_html = f'<div class="card-stats">{cs_items}</div>' if cs_items else ""

    map_init = ""
    if lat and lng:
        marker_color = ag_color.replace("#", "%23")
        map_init = f"""
    const map = L.map('map', {{ scrollWheelZoom: false, zoomControl: true }}).setView([{lat}, {lng}], 15);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{{z}}/{{y}}/{{x}}', {{
        attribution: 'Tiles © Esri — Source: Esri, Maxar, GeoEye, Earthstar Geographics',
        maxZoom: 19
    }}).addTo(map);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{{z}}/{{y}}/{{x}}', {{
        attribution: '', maxZoom: 19, opacity: 0.9
    }}).addTo(map);
    const icon = L.divIcon({{
        html: '<div style="width:52px;height:52px;border-radius:50%;background:{ag_color};border:5px solid white;box-shadow:0 4px 20px rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;"><svg viewBox=\\"0 0 24 24\\" fill=\\"white\\" width=\\"20\\" height=\\"20\\"><path d=\\"M12 2a6 6 0 016 6c0 4.5-6 10-6 10S6 12.5 6 8a6 6 0 016-6zm0 4a2 2 0 100 4 2 2 0 000-4z\\"/></svg></div>',
        className: '', iconSize: [52, 52], iconAnchor: [26, 52]
    }});
    L.marker([{lat}, {lng}], {{icon}}).addTo(map);"""

    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>{titre} — {ag_nom}</title>
  <meta name="description" content="{type_b} à {ville}{' — ' + prix if prix else ''}">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
    :root {{
      --c:   {ag_color};
      --c12: {ag_color}1f;
      --ink: #222;
      --sub: #717171;
      --muted: #b0b0b0;
      --border: #e0e0e0;
      --bg: #f7f7f7;
      --white: #fff;
      --r: 12px;
    }}
    html {{ font-size: 16px; scroll-behavior: smooth; color-scheme: light; }}
    body {{ font-family: 'Inter', system-ui, sans-serif; color: var(--ink); background: var(--white); line-height: 1.5; }}
    a {{ text-decoration: none; color: inherit; }}
    img {{ display: block; width: 100%; height: 100%; object-fit: cover; }}

    /* ── Header ── */
    .hdr {{
      position: sticky; top: 0; z-index: 200;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 24px; height: 64px;
      background: rgba(255,255,255,.97); backdrop-filter: blur(10px);
      border-bottom: 1px solid var(--border);
    }}
    .hdr-left {{ display: flex; align-items: center; gap: 10px; }}
    .hdr-logo {{ height: 32px; width: auto; object-fit: contain; }}
    .hdr-ini {{ width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; color: #fff; }}
    .hdr-name {{ font-weight: 600; font-size: 15px; }}
    .hdr-badge {{ font-size: 11px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; padding: 5px 14px; border-radius: 20px; border: 1.5px solid var(--ink); color: var(--ink); }}

    /* ── Carousel mobile ── */
    .carousel-wrap {{ position: relative; }}
    .carousel {{ display: flex; overflow-x: scroll; scroll-snap-type: x mandatory; scroll-behavior: smooth; -webkit-overflow-scrolling: touch; }}
    .carousel::-webkit-scrollbar {{ display: none; }}
    .slide {{ flex: none; width: 100%; scroll-snap-align: start; height: 300px; cursor: zoom-in; }}
    .slide img {{ height: 300px; object-fit: cover; pointer-events: none; }}
    .ctr {{ position: absolute; bottom: 12px; right: 12px; background: rgba(0,0,0,.55); color: #fff; font-size: 12px; font-weight: 500; padding: 4px 10px; border-radius: 20px; pointer-events: none; }}
    .lb-trigger {{ position: absolute; bottom: 12px; left: 12px; display: flex; align-items: center; gap: 6px; background: rgba(0,0,0,.6); color: #fff; border: none; cursor: pointer; font-size: 12px; font-weight: 600; padding: 6px 12px; border-radius: 8px; font-family: inherit; }}
    .no-photo {{ height: 220px; display: flex; align-items: center; justify-content: center; background: var(--bg); color: var(--muted); font-size: 14px; }}

    /* ── Grid desktop ── */
    .grid {{ display: none; position: relative; cursor: zoom-in; }}
    .grid-1 {{ height: 520px; overflow: hidden; border-radius: var(--r); }}
    .grid-full-img {{ height: 100%; }}
    .grid-2, .grid-5 {{ display: none; grid-template-columns: 1fr 1fr; height: 520px; gap: 3px; background: #d0d0d0; border-radius: var(--r); overflow: hidden; }}
    .g-main {{ overflow: hidden; }}
    .g-side {{ display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 3px; overflow: hidden; }}
    .g-cell {{ overflow: hidden; position: relative; cursor: zoom-in; }}
    .g-ov {{ position: absolute; inset: 0; background: rgba(0,0,0,.5); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; }}
    .show-all {{ position: absolute; bottom: 16px; right: 16px; display: flex; align-items: center; gap: 6px; background: #fff; border: 1.5px solid #222; border-radius: 8px; padding: 9px 16px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }}
    .show-all:hover {{ background: var(--bg); }}
    .grid-empty {{ height: 240px; display: flex; align-items: center; justify-content: center; background: var(--bg); color: var(--muted); border-radius: var(--r); }}

    /* ── Layout ── */
    .layout {{ max-width: 1120px; margin: 0 auto; padding: 32px 20px 48px; display: grid; grid-template-columns: 1fr; gap: 40px; }}

    /* ── Contenu ── */
    .pill-row {{ display: flex; gap: 8px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }}
    .pill {{ font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; padding: 4px 12px; border-radius: 20px; background: var(--c12); color: var(--c); }}
    .pill-type {{ font-size: 12px; color: var(--sub); font-weight: 500; }}
    h1.titre {{ font-size: clamp(22px, 4vw, 30px); font-weight: 700; line-height: 1.2; margin-bottom: 8px; }}
    .loc {{ display: flex; align-items: center; gap: 5px; font-size: 14px; color: var(--sub); margin-bottom: 24px; }}
    .loc svg {{ color: var(--c); flex-shrink: 0; }}
    .divider {{ height: 1px; background: var(--border); margin: 24px 0; }}
    .prix-row {{ display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 24px; }}
    .prix-main {{ font-size: clamp(28px, 5vw, 40px); font-weight: 700; color: var(--ink); letter-spacing: -.02em; }}
    .btn-call-pill {{ display: inline-flex; align-items: center; gap: 7px; background: var(--c); color: #fff; padding: 11px 18px; border-radius: 12px; font-size: 14px; font-weight: 700; font-family: inherit; border: none; cursor: pointer; white-space: nowrap; flex-shrink: 0; }}
    @media (min-width: 768px) {{ .btn-call-pill {{ display: none; }} }}

    /* ── Stats bande ── */
    .feats {{ display: flex; gap: 0; margin-bottom: 28px; }}
    .feat {{ flex: 1; display: flex; flex-direction: column; align-items: center; gap: 5px; padding: 16px 12px; text-align: center; border: 1px solid var(--border); border-right: none; background: var(--white); }}
    .feat:first-child {{ border-radius: var(--r) 0 0 var(--r); }}
    .feat:last-child {{ border-right: 1px solid var(--border); border-radius: 0 var(--r) var(--r) 0; }}
    .feat svg {{ color: var(--c); }}
    .feat-val {{ font-size: 15px; font-weight: 700; color: var(--ink); }}
    .feat-lbl {{ font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; }}

    /* ── Sections ── */
    .section {{ margin-bottom: 40px; padding-bottom: 40px; border-bottom: 1px solid var(--border); }}
    .section:last-of-type {{ border-bottom: none; }}
    .sh {{ font-size: 18px; font-weight: 700; margin-bottom: 20px; }}
    .desc {{ font-size: 15px; line-height: 1.85; color: var(--sub); }}
    #desc-rest {{ display: none; }}
    .desc-btn {{ background: none; border: none; font-family: inherit; font-size: 14px; font-weight: 700; color: var(--ink); cursor: pointer; margin-top: 10px; padding: 0; text-decoration: underline; }}

    /* ── Amenities Airbnb ── */
    .am-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 0; }}
    .am-item {{ display: flex; align-items: center; gap: 14px; padding: 16px 4px; border-bottom: 1px solid var(--border); font-size: 15px; color: var(--ink); }}
    .am-item:nth-last-child(-n+2) {{ border-bottom: none; }}
    .am-item svg {{ flex-shrink: 0; color: var(--ink); }}
    @media (max-width: 600px) {{
      .am-grid {{ grid-template-columns: 1fr; }}
      .am-item:last-child {{ border-bottom: none; }}
      .am-item:nth-last-child(2) {{ border-bottom: 1px solid var(--border); }}
    }}

    /* ── Finances ── */
    .fin-grid {{ display: flex; gap: 32px; flex-wrap: wrap; }}
    .fin-item {{ display: flex; flex-direction: column; gap: 4px; }}
    .fin-lbl {{ font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; }}
    .fin-val {{ font-size: 20px; font-weight: 700; color: var(--ink); }}

    /* ── DPE ── */
    .dpe-row {{ display: flex; gap: 32px; flex-wrap: wrap; }}
    .dpe-item {{ display: flex; align-items: center; gap: 16px; }}
    .dpe-pill {{ width: 64px; height: 64px; border-radius: 14px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #fff; }}
    .dpe-l {{ font-size: 28px; font-weight: 700; line-height: 1; }}
    .dpe-lbl {{ font-size: 9px; letter-spacing: .06em; opacity: .85; margin-top: 2px; }}
    .dpe-num {{ line-height: 1.4; }}
    .dpe-num {{ font-size: 18px; font-weight: 700; color: var(--ink); }}
    .dpe-num span {{ display: block; font-size: 11px; color: var(--muted); font-weight: 400; }}

    /* ── Vidéo ── */
    .vid-wrap {{ border-radius: var(--r); overflow: hidden; aspect-ratio: 16/9; background: #000; }}
    .vid-frame {{ width: 100%; height: 100%; border: 0; }}

    /* ── Map Leaflet ── */
    .map-wrap {{ border-radius: var(--r) var(--r) 0 0; overflow: hidden; border: 1px solid var(--border); border-bottom: none; }}
    #map {{ height: 380px; }}
    .map-footer {{ display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: var(--bg); border: 1px solid var(--border); border-radius: 0 0 var(--r) var(--r); font-size: 13px; flex-wrap: wrap; gap: 8px; }}
    .map-addr {{ display: flex; align-items: center; gap: 5px; color: var(--sub); }}
    .map-link {{ color: var(--c); font-weight: 600; }}
    .map-link:hover {{ text-decoration: underline; }}

    /* ── Sidebar ── */
    .sidebar {{ display: none; }}
    .card {{ border: 1px solid var(--border); border-radius: 20px; box-shadow: 0 12px 48px rgba(0,0,0,.12); overflow: hidden; }}
    .card-top {{ height: 6px; background: var(--c); }}
    .card-body {{ padding: 32px; }}
    .card-prix {{ font-size: 36px; font-weight: 800; color: var(--ink); margin-bottom: 8px; letter-spacing: -.03em; line-height: 1; }}
    .card-prix-sub {{ font-size: 12px; color: var(--muted); margin-bottom: 24px; }}
    .card-ag {{ display: flex; align-items: center; gap: 14px; padding: 16px; background: var(--bg); border-radius: 12px; margin-bottom: 24px; }}
    .card-logo {{ height: 42px; width: auto; object-fit: contain; max-width: 110px; }}
    .card-ini {{ width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 15px; color: #fff; flex-shrink: 0; }}
    .card-ag-name {{ font-weight: 700; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }}
    .card-ag-addr {{ font-size: 12px; color: var(--muted); margin-top: 3px; }}
    .btn {{ display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 16px 20px; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; border: none; font-family: inherit; transition: all .15s; margin-bottom: 12px; }}
    .btn-primary {{ background: var(--c); color: #fff; }}
    .btn-primary:hover {{ filter: brightness(1.08); transform: translateY(-1px); }}
    .btn-outline {{ background: transparent; border: 1.5px solid var(--border); color: var(--sub); }}
    .btn-outline:hover {{ border-color: var(--c); color: var(--c); }}
    .btn-share {{ background: transparent; border: 1.5px solid var(--border); color: var(--sub); margin-top: 2px; }}
    .btn-share:hover {{ border-color: var(--c); color: var(--c); }}
    .ref {{ font-size: 11px; color: var(--muted); text-align: center; margin-top: 16px; }}
    .card-divider {{ height: 1px; background: var(--border); margin: 24px 0; }}
    .card-stats {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 4px; margin-bottom: 20px; }}
    .cs-item {{ display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 14px 8px; background: var(--bg); border-radius: 10px; text-align: center; }}
    .cs-val {{ font-size: 15px; font-weight: 700; color: var(--ink); }}
    .cs-lbl {{ font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; }}
    .side-note {{ background: var(--bg); border-radius: 12px; padding: 18px; font-size: 13px; color: var(--sub); line-height: 1.65; display: flex; gap: 14px; align-items: flex-start; }}
    .side-note svg {{ flex-shrink: 0; color: var(--c); margin-top: 2px; }}
    .side-note-title {{ font-weight: 700; color: var(--ink); font-size: 14px; margin-bottom: 4px; }}

    /* ── Mobile bar ── */
    .mobile-bar {{ display: flex; position: fixed; bottom: 0; left: 0; right: 0; z-index: 150; background: var(--white); border-top: 1px solid var(--border); padding: 12px 16px 24px; gap: 10px; box-shadow: 0 -4px 20px rgba(0,0,0,.08); }}
    .mobile-bar .btn {{ margin-bottom: 0; flex: 1; }}

    /* ── Toast ── */
    .toast {{ position: fixed; bottom: 96px; left: 50%; transform: translateX(-50%) translateY(10px); background: rgba(17,24,39,.9); color: #fff; padding: 10px 22px; border-radius: 24px; font-size: 13px; font-weight: 500; opacity: 0; transition: all .25s; z-index: 999; pointer-events: none; white-space: nowrap; }}
    .toast.show {{ opacity: 1; transform: translateX(-50%) translateY(0); }}

    /* ── Share panel ── */
    #share-backdrop {{ position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 300; }}
    #share-sheet {{ position: fixed; bottom: 0; left: 0; right: 0; z-index: 301; background: var(--white); border-radius: 20px 20px 0 0; padding: 24px 20px 36px; transform: translateY(100%); transition: transform .3s cubic-bezier(.32,1,.23,1); }}
    #share-sheet.open {{ transform: translateY(0); }}
    #share-grid {{ display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 4px; }}
    .share-item {{ display: flex; flex-direction: column; align-items: center; gap: 8px; text-decoration: none; background: none; border: none; cursor: pointer; padding: 10px 4px; border-radius: 14px; transition: background .15s; }}
    .share-item:hover {{ background: var(--surface2, #f2f2f7); }}
    .share-item span {{ font-size: 12px; color: var(--fg); font-weight: 500; }}

    /* ── Lightbox ── */
    .lb {{ display: none; position: fixed; inset: 0; z-index: 999; background: rgba(0,0,0,.95); align-items: center; justify-content: center; }}
    .lb.open {{ display: flex; }}
    .lb-img {{ max-width: 92vw; max-height: 90vh; width: auto; height: auto; object-fit: contain; border-radius: 4px; }}
    .lb-x {{ position: absolute; top: 16px; right: 16px; width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,.15); border: none; color: #fff; font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; }}
    .lb-nav {{ position: absolute; top: 50%; transform: translateY(-50%); width: 46px; height: 46px; border-radius: 50%; background: rgba(255,255,255,.15); border: none; color: #fff; font-size: 22px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background .15s; }}
    .lb-nav:hover {{ background: rgba(255,255,255,.3); }}
    .lb-prev {{ left: 16px; }} .lb-next {{ right: 16px; }}
    .lb-n {{ position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%); color: rgba(255,255,255,.5); font-size: 12px; }}

    /* ── Footer ── */
    footer {{ border-top: 1px solid var(--border); padding: 24px; text-align: center; font-size: 12px; color: var(--muted); margin-bottom: 80px; }}

    /* ════ DESKTOP ════ */
    @media (min-width: 768px) {{
      .carousel-wrap {{ display: none; }}
      .grid {{ display: block; }}
      .grid-2, .grid-5 {{ display: grid; }}
      .layout {{ grid-template-columns: 1fr 420px; gap: 56px; padding: 40px 40px 60px; }}
      .sidebar {{ display: block; position: sticky; top: 80px; align-self: start; }}
      .mobile-bar {{ display: none; }}
      footer {{ margin-bottom: 0; }}
    }}
    @media (min-width: 1024px) {{
      .layout {{ padding: 48px 80px 72px; max-width: 1280px; }}
    }}
  </style>
</head>
<body>

  <header class="hdr">
    <div class="hdr-left">
      {logo_hdr}
      <span class="hdr-name">{ag_nom}</span>
    </div>
    <span class="hdr-badge">Vente</span>
  </header>

  {carousel}
  {grid}

  <div class="layout">
    <main>
      <div class="pill-row">
        <span class="pill">Vente</span>
        <span class="pill-type">{type_b}</span>
      </div>
      <h1 class="titre">{titre}</h1>
      {"" if not ville else f'<p class="loc"><svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13"><path d="M10 2a6 6 0 016 6c0 4.5-6 10-6 10S4 12.5 4 8a6 6 0 016-6zm0 4a2 2 0 100 4 2 2 0 000-4z"/></svg>{ville}</p>'}
      <div class="divider"></div>
      {"" if not prix else f'<div class="prix-row"><div class="prix-main">{prix}</div>{"" if not ag_tel else f\'<a href="tel:{ag_tel}" class="btn-call-pill"><svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.58.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C10.29 21 3 13.71 3 4.5c0-.55.45-1 1-1H8c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.24 1.01L6.6 10.8z"/></svg>Appeler</a>\'}</div>'}
      {f'<div class="feats">{feats_html}</div>' if feats_html else ""}

      {desc_html}
      {amenities_html}
      {finance_html}
      {video_html}
      {dpe_html}
      {map_html}
    </main>

    <aside class="sidebar">
      <div class="card">
        <div class="card-top"></div>
        <div class="card-body">

          {"" if not prix else f'<div class="card-prix">{prix}</div>'}
          {"" if not (prix_hn and float(prix_hn) > 0 and honoraires_pct and float(honoraires_pct) > 0) else f'<p class="card-prix-sub">Honoraires inclus ({honoraires_pct:.2f} %) · Prix HN : {_fmt_prix(prix_hn)}</p>'}

          {card_stats_html}

          <div class="card-divider"></div>

          <div class="card-ag">
            {logo_card}
            <div>
              <div class="card-ag-name">{ag_nom}</div>
              {f'<div class="card-ag-addr">{ag_adresse}</div>' if ag_adresse else ""}
              {f'<div class="card-ag-addr">{ag_tel}</div>' if ag_tel else ""}
            </div>
          </div>

          {tel_btn}
          {mail_btn}
          <button class="btn btn-share" onclick="share()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            Partager ce bien
          </button>

          <div class="card-divider"></div>

          <div class="side-note">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="22" height="22"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18" stroke-linecap="round"/></svg>
            <div>
              <p class="side-note-title">Organiser une visite</p>
              <p>Nos conseillers sont disponibles pour vous accompagner et répondre à toutes vos questions.</p>
            </div>
          </div>

          {ref_line}
        </div>
      </div>
    </aside>
  </div>

  <footer>Annonce publiée par <strong>{ag_nom}</strong> · Tous droits réservés</footer>

  <div class="mobile-bar">
    {"" if not ag_tel else f'<a href="tel:{ag_tel}" class="btn btn-primary"><svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.58.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C10.29 21 3 13.71 3 4.5c0-.55.45-1 1-1H8c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.24 1.01L6.6 10.8z"/></svg>Appeler</a>'}
    <button class="btn btn-outline" onclick="share()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
      Partager
    </button>
  </div>

  <div class="lb" id="lb" onclick="if(event.target===this)closeLb()">
    <button class="lb-x" onclick="closeLb()">✕</button>
    <button class="lb-nav lb-prev" onclick="navLb(-1);event.stopPropagation()">‹</button>
    <img class="lb-img" id="lb-img" src="" alt="">
    <button class="lb-nav lb-next" onclick="navLb(1);event.stopPropagation()">›</button>
    <span class="lb-n" id="lb-n"></span>
  </div>

  <script>
    const PH = {photos_json};
    let cur = 0;
    function openLb(i) {{ if (!PH.length) return; cur = i; showLb(); }}
    function showLb() {{
      document.getElementById('lb').classList.add('open');
      document.getElementById('lb-img').src = PH[cur];
      document.getElementById('lb-n').textContent = (cur+1) + ' / ' + PH.length;
      document.body.style.overflow = 'hidden';
    }}
    function closeLb() {{ document.getElementById('lb').classList.remove('open'); document.body.style.overflow = ''; }}
    function navLb(d) {{ cur = (cur + d + PH.length) % PH.length; showLb(); }}
    document.addEventListener('keydown', e => {{
      if (!document.getElementById('lb').classList.contains('open')) return;
      if (e.key === 'ArrowRight') navLb(1);
      if (e.key === 'ArrowLeft')  navLb(-1);
      if (e.key === 'Escape')     closeLb();
    }});
    function onScroll() {{
      const c = document.getElementById('carousel');
      if (!c) return;
      const idx = Math.round(c.scrollLeft / c.offsetWidth);
      const el  = document.getElementById('ctr');
      if (el) el.textContent = (idx + 1) + ' / ' + PH.length;
    }}
    function toggleDesc() {{
      const el = document.getElementById('desc-rest');
      const btn = document.getElementById('desc-btn');
      if (!el || !btn) return;
      const open = el.style.display === 'inline';
      el.style.display = open ? 'none' : 'inline';
      btn.textContent  = open ? 'Lire la suite →' : 'Réduire ↑';
    }}
    async function share() {{
      const url = window.location.href;
      const title = document.title;
      if (navigator.share) {{
        try {{ await navigator.share({{ title, url }}); return; }} catch(e) {{ if (e.name === 'AbortError') return; }}
      }}
      showSharePanel(url, title);
    }}
    function showSharePanel(url, title) {{
      if (document.getElementById('share-panel')) return;
      const enc = encodeURIComponent(url);
      const txt = encodeURIComponent(title + ' ' + url);
      const panel = document.createElement('div');
      panel.id = 'share-panel';
      panel.innerHTML = `
        <div id="share-backdrop" onclick="closeSharePanel()"></div>
        <div id="share-sheet">
          <div style="font-weight:600;font-size:15px;margin-bottom:18px;color:var(--fg)">Partager ce bien</div>
          <div id="share-grid">
            <a href="https://wa.me/?text=${{txt}}" target="_blank" class="share-item">
              <svg viewBox="0 0 32 32" width="32" height="32"><circle cx="16" cy="16" r="16" fill="#25D366"/><path d="M22.5 19.4c-.3-.15-1.8-.9-2.1-1-.3-.1-.5-.15-.7.15s-.8 1-.97 1.2c-.18.2-.35.22-.65.07a8.2 8.2 0 01-2.4-1.48 9 9 0 01-1.67-2.07c-.17-.3 0-.46.13-.6l.44-.52c.14-.16.18-.3.27-.5.1-.2.05-.36-.02-.5s-.7-1.68-.96-2.3c-.25-.6-.5-.52-.7-.53h-.6c-.2 0-.52.07-.8.37s-1.04 1.02-1.04 2.48 1.07 2.88 1.22 3.08c.14.2 2.1 3.2 5.08 4.48.71.3 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.3.18-1.42-.07-.1-.27-.17-.57-.32z" fill="#fff"/></svg>
              <span>WhatsApp</span>
            </a>
            <a href="sms:?body=${{txt}}" class="share-item">
              <svg viewBox="0 0 32 32" width="32" height="32"><circle cx="16" cy="16" r="16" fill="#5AC8FA"/><path d="M8 10h16v10H8z" rx="2" fill="none" stroke="#fff" stroke-width="1.5"/><path d="M8 12l8 5 8-5" fill="none" stroke="#fff" stroke-width="1.5"/></svg>
              <span>SMS</span>
            </a>
            <a href="mailto:?subject=${{encodeURIComponent(title)}}&body=${{txt}}" class="share-item">
              <svg viewBox="0 0 32 32" width="32" height="32"><circle cx="16" cy="16" r="16" fill="#EA4335"/><path d="M8 11h16v10H8z" fill="none" stroke="#fff" stroke-width="1.5" rx="1"/><path d="M8 12l8 5.5L24 12" fill="none" stroke="#fff" stroke-width="1.5"/></svg>
              <span>Email</span>
            </a>
            <button class="share-item" onclick="copyShareLink('${{url}}')">
              <svg viewBox="0 0 32 32" width="32" height="32"><circle cx="16" cy="16" r="16" fill="#636366"/><rect x="10" y="13" width="9" height="10" rx="1.5" fill="none" stroke="#fff" stroke-width="1.5"/><rect x="13" y="9" width="9" height="10" rx="1.5" fill="none" stroke="#fff" stroke-width="1.5"/></svg>
              <span>Copier</span>
            </button>
          </div>
          <button onclick="closeSharePanel()" style="margin-top:18px;width:100%;padding:12px;border-radius:12px;border:none;background:var(--surface2,#f2f2f7);color:var(--fg);font-size:15px;font-weight:500;cursor:pointer;">Annuler</button>
        </div>`;
      document.body.appendChild(panel);
      requestAnimationFrame(() => panel.querySelector('#share-sheet').classList.add('open'));
    }}
    function closeSharePanel() {{
      const p = document.getElementById('share-panel');
      if (!p) return;
      const s = p.querySelector('#share-sheet');
      s.classList.remove('open');
      setTimeout(() => p.remove(), 300);
    }}
    async function copyShareLink(url) {{
      try {{ await navigator.clipboard.writeText(url); }} catch(e) {{}}
      closeSharePanel();
      toast('Lien copié ✓');
    }}
    function toast(msg) {{
      const t = document.createElement('div');
      t.className = 'toast'; t.textContent = msg;
      document.body.appendChild(t);
      setTimeout(() => t.classList.add('show'), 10);
      setTimeout(() => {{ t.classList.remove('show'); setTimeout(() => t.remove(), 300); }}, 2800);
    }}
    {map_init}
  </script>
</body>
</html>"""


# ════════════════════════════════════════════════════════════════════════════
# ROUTE PUBLIQUE
# ════════════════════════════════════════════════════════════════════════════

@router.get("/public/bien/{agency_slug}/{bien_id}", response_class=HTMLResponse)
def page_bien_public(agency_slug: str, bien_id: int):
    if not agency_slug.replace("_", "").replace("-", "").isalnum():
        return HTMLResponse("<h1>Lien invalide</h1>", status_code=400)

    agency = _get_agency_by_slug(agency_slug)
    if not agency:
        return HTMLResponse("<h1>Agence introuvable</h1>", status_code=404)

    db_path = get_db_path(agency_slug)
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        bien = conn.execute("SELECT * FROM biens WHERE id = ?", (bien_id,)).fetchone()
        conn.close()
    except Exception:
        return HTMLResponse("<h1>Erreur base de données</h1>", status_code=500)

    if not bien:
        return HTMLResponse("<h1>Bien introuvable</h1>", status_code=404)

    bien = dict(bien)

    lien = (bien.get("lien_annonce") or "").strip()
    if lien.startswith("http"):
        return RedirectResponse(url=lien, status_code=302)

    return HTMLResponse(_render_page(bien, agency))
