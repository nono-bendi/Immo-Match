import sys, os, json, sqlite3, asyncio, httpx, re
from datetime import datetime
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup

sys.path.insert(0, "/app")
os.chdir("/app")
from dotenv import load_dotenv
load_dotenv("/app/.env")
import anthropic
_client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

DB = "/app/data/aplimmo.db"
AGENCY_SLUG = "aplimmo"
APP_BASE_URL = "https://immoflash.app/api"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0",
    "Accept-Language": "fr-FR,fr;q=0.9",
    "Accept": "text/html,application/xhtml+xml,*/*"
}

# Logo partagé à exclure de toutes les photos
LOGO_FILENAMES = {"7b6a7b512623fc32940dd58d572c941b.png"}

ALL_URLS = [
    # ── VENTES (27) ──────────────────────────────────────────────────────────
    "https://aplimmo.fr/fr/propriete/vente+appartement+le-teil+t2-meuble-tres-confortable+85936521",
    "https://aplimmo.fr/fr/propriete/vente+appartement+le-teil+t3-avec-terrain-et-garage+86159699",
    "https://aplimmo.fr/fr/propriete/vente+commerce+le-teil+murs-restaurant+86125255",
    "https://aplimmo.fr/fr/propriete/vente+immeuble+lavilledieu+immeuble-a-finir-beau-potentiel+86741105",
    "https://aplimmo.fr/fr/propriete/vente+immeuble+le-teil+immeuble-7-lots-renove+86660783",
    "https://aplimmo.fr/fr/propriete/vente+immeuble+le-teil+immeuble-devant-parking+7867274",
    "https://aplimmo.fr/fr/propriete/vente+immeuble+pierrelatte+immeuble-avec-commerce+86743379",
    "https://aplimmo.fr/fr/propriete/vente+immeuble+viriville+82835998",
    "https://aplimmo.fr/fr/propriete/vente+immeuble+viviers+immeuble-de-rapport-bien-situe+85982642",
    "https://aplimmo.fr/fr/propriete/vente+locaux-d-activite-entrepots+alba-la-romaine+entrepot-400m-terrain+85394155",
    "https://aplimmo.fr/fr/propriete/vente+maison+le-teil+ferme-ardechoise-en-pierre+86619245",
    "https://aplimmo.fr/fr/propriete/vente+maison+le-teil+grande-maison-en-pierre-impeccable+84898899",
    "https://aplimmo.fr/fr/propriete/vente+maison+le-teil+maison-avec-belles-terrasses+6480648",
    "https://aplimmo.fr/fr/propriete/vente+maison+le-teil+maison-avec-studio-et-piscine+86191941",
    "https://aplimmo.fr/fr/propriete/vente+maison+le-teil+maison-avec-terrasses+86462391",
    "https://aplimmo.fr/fr/propriete/vente+maison+le-teil+maison-dans-quartier-residentiel+3591416",
    "https://aplimmo.fr/fr/propriete/vente+maison+le-teil+maison-de-standing-avec-piscine+83565799",
    "https://aplimmo.fr/fr/propriete/vente+maison+le-teil+maison-plain-pied-avec-pisicne+7531694",
    "https://aplimmo.fr/fr/propriete/vente+maison+montelimar+maison-familiale-dans-quartier-prise-de-saint-james+86731821",
    "https://aplimmo.fr/fr/propriete/vente+maison+montpezat-sous-bauzon+votre-refuge-familial-au-coeur-de-l-ardeche+86844649",
    "https://aplimmo.fr/fr/propriete/vente+maison+puy-saint-martin+appartement-dans-magnanerie+86139717",
    "https://aplimmo.fr/fr/propriete/vente+maison+puy-saint-martin+maison-en-copro-avec-jardin+86444237",
    "https://aplimmo.fr/fr/propriete/vente+maison+rochefort-en-valdaine+maison-en-pierre-cadre-champetre+7756499",
    "https://aplimmo.fr/fr/propriete/vente+maison+saint-montan+mas-en-pierre+85737206",
    "https://aplimmo.fr/fr/propriete/vente+maison+saint-montan+propriete-avec-2-gites-et-piscine+83589297",
    "https://aplimmo.fr/fr/propriete/vente+maison+saint-pons+2-maisons-en-pierres-vue-panoramique+85862085",
    "https://aplimmo.fr/fr/propriete/vente+maison+saint-thome+villa-de-qualite-avec-piscine+86954630",
    # ── LOCATIONS (17) ───────────────────────────────────────────────────────
    "https://aplimmo.fr/fr/propriete/location+appartement+le-teil+appartement-t2-bis-avec-mezzanine+2600358",
    "https://aplimmo.fr/fr/propriete/location+appartement+le-teil+t2-bis-2eme-etage+86657345",
    "https://aplimmo.fr/fr/propriete/location+appartement+le-teil+t3-avec-cour-privee-et-jardin-commun+2601021",
    "https://aplimmo.fr/fr/propriete/location+appartement+montelimar+t2-centre-ville-lumineux+86649247",
    "https://aplimmo.fr/fr/propriete/location+appartement+saint-thome+t2-meuble-avec-terrase+6342131",
    "https://aplimmo.fr/fr/propriete/location+bureau+le-teil+2-entrepot-sur-terrain-800-m-+86730131",
    "https://aplimmo.fr/fr/propriete/location+bureau+le-teil+entrepot-bureau+85985001",
    "https://aplimmo.fr/fr/propriete/location+bureau+le-teil+local-professionnel+7078171",
    "https://aplimmo.fr/fr/propriete/location+commerce+le-teil+local-commercial+86476844",
    "https://aplimmo.fr/fr/propriete/location+commerce+le-teil+local-commercial-bien-situe+86657412",
    "https://aplimmo.fr/fr/propriete/location+commerce+le-teil+local-loyers-offerts-sous-conditions+3413665",
    "https://aplimmo.fr/fr/propriete/location+locaux-d-activite-entrepots+alba-la-romaine+entrepot-500m-terrain+85393024",
    "https://aplimmo.fr/fr/propriete/location+locaux-d-activite-entrepots+alba-la-romaine+entrepot-500m-terrain+86730133",
    "https://aplimmo.fr/fr/propriete/location+locaux-d-activite-entrepots+le-teil+box-entre-30-et-360-m-+86876454",
    "https://aplimmo.fr/fr/propriete/location+locaux-d-activite-entrepots+le-teil+entrepot-360m-+86220144",
    "https://aplimmo.fr/fr/propriete/location+maison+le-teil+maison-de-ville-avec-grand-garage+85702226",
    "https://aplimmo.fr/fr/propriete/location+maison+saint-thome+maisonnette-a-la-campagne+86517645",
]

PROMPT = (
    "Tu es un assistant pour une agence immobiliere francaise. "
    "Voici la page detail d un bien a vendre. Les photos sont indiquees [PHOTO:url].\n\n"
    "Extrais TOUTES les informations et retourne UN SEUL objet JSON avec ces champs :\n"
    "reference, type (Maison/Appartement/Villa/Immeuble/Terrain/Local commercial/Entrepot/autre), "
    "ville, quartier (null si absent), prix (entier euros FAI), prix_hn (entier hors honoraires ou null), "
    "honoraires_pct (float % ou null), surface (float m2 habitable), surface_terrain (float m2 ou null), "
    "pieces (entier), chambres (entier), nb_salles_bain (entier ou null), nb_salles_eau (entier ou null), "
    "nb_wc (entier ou null), etat (Neuf/Bon etat/Menus travaux/A renover/A demolir ou null), "
    "exposition (string ex: Sud ou null), orientation_sud/est/ouest/nord (bool), "
    "etage_bien (entier ou null), nb_etages_immeuble (entier ou null), "
    "ascenseur (bool/null), cave (bool/null), terrasse (bool/null), jardin (bool/null), "
    "piscine (bool/null), nb_balcons (entier ou null), nb_parkings (entier), nb_boxes (entier ou null), "
    "copropriete (bool/null), charges_mensuelles (float euros/mois ou null), "
    "dpe_lettre (A-G ou null), dpe_kwh (entier ou null), ges_lettre (A-G ou null), ges_co2 (entier ou null), "
    "description (3-5 phrases completes et detaillees : etat, atouts, localisation, prestations, points forts), "
    "photos (array de TOUTES les URLs [PHOTO:...] de la page, TOUTES sans exception), "
    "proximites (string ce qui est proche : commerces, ecoles, gare, etc. ou null), "
    "stationnement (Garage/Parking/Box/Obligatoire/Pas necessaire ou null).\n\n"
    "Retourne UNIQUEMENT le JSON, sans markdown.\n\n"
    "Contenu :\n{content}"
)


def clean_html(html, base_url=""):
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script","style","noscript","nav","footer","aside","meta","link","svg","iframe"]):
        tag.decompose()
    all_imgs = []
    for img in soup.find_all("img"):
        src = (img.get("data-src") or img.get("data-lazy-src") or
               img.get("data-original") or img.get("src") or "").strip()
        if src and not src.startswith("data:") and not src.endswith(".svg"):
            src = urljoin(base_url, src) if base_url else src
            if src.startswith("//"): src = "https:" + src
            # Exclure logo et icônes partagés
            filename = src.split("/")[-1]
            if filename not in LOGO_FILENAMES and not filename.endswith(".png"):
                all_imgs.append(src)
                img.replace_with(f"[PHOTO:{src}]")
            else:
                img.decompose()
        else:
            img.decompose()
    for a in soup.find_all("a"): a.unwrap()
    main = (soup.find("main") or
            soup.find(id=re.compile(r"content|detail|bien|property", re.I)) or
            soup.find(class_=re.compile(r"detail|property|bien|fiche|annonce", re.I)) or
            soup.body)
    text = (main or soup).get_text(separator="\n", strip=True)
    lines = [l for l in text.splitlines() if l.strip()]
    return "\n".join(lines)[:15000], all_imgs


def call_claude(content):
    r = _client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=4000,
        messages=[{"role": "user", "content": PROMPT.format(content=content)}]
    )
    raw = r.content[0].text.strip()
    m = re.search(r"\{.*\}", raw, re.DOTALL)
    if not m:
        return None
    try:
        return json.loads(m.group())
    except Exception:
        return None


SEM = asyncio.Semaphore(5)


async def process(session, url, idx):
    async with SEM:
        try:
            r = await session.get(url, headers=HEADERS)
            content, imgs = clean_html(r.text, str(r.url))
            ref_fallback = url.split("+")[-1]
            data = await asyncio.to_thread(call_claude, content)
            if not data:
                print(f"  [{idx:02d}] ERREUR Claude — {url.split('/')[-1][:50]}")
                return None
            if not data.get("photos"):
                data["photos"] = imgs
            nb_photos = len(data.get("photos") or [])
            print(f"  [{idx:02d}] OK {data.get('type','?')} | {data.get('ville','?')} | "
                  f"{data.get('prix','?')}€ | {data.get('surface','?')}m2 | {nb_photos} photos")
            data["_url"] = url
            data["_ref_fallback"] = ref_fallback
            data["_is_location"] = url.split("/propriete/")[1].startswith("location")
            return data
        except Exception as e:
            print(f"  [{idx:02d}] EXCEPTION : {e}")
            return None


async def main():
    print(f"Scraping {len(ALL_URLS)} fiches detail APL Immo...\n")
    async with httpx.AsyncClient(timeout=25, follow_redirects=True) as session:
        tasks = [process(session, url, i+1) for i, url in enumerate(ALL_URLS)]
        results = await asyncio.gather(*tasks)
    return [r for r in results if r]


biens = asyncio.run(main())
print(f"\n{len(biens)}/{len(ALL_URLS)} biens recuperes")

conn = sqlite3.connect(DB)
conn.execute("DELETE FROM biens")
conn.commit()
print("Biens precedents supprimees")

ok = 0
for b in biens:
    photos_list = b.get("photos") or []
    photos_str = "|".join(
        str(p) for p in photos_list
        if p
        and not str(p).endswith(".svg")
        and not str(p).startswith("data:")
        and str(p).split("/")[-1] not in LOGO_FILENAMES
        and not str(p).endswith(".png")
    )
    ref = b.get("reference") or b.get("_ref_fallback", "APL-???")

    expo = b.get("exposition") or ""
    if not expo:
        parts = []
        if b.get("orientation_sud"): parts.append("Sud")
        if b.get("orientation_est"): parts.append("Est")
        if b.get("orientation_ouest"): parts.append("Ouest")
        if b.get("orientation_nord"): parts.append("Nord")
        expo = ", ".join(parts)

    ext_parts = []
    if b.get("terrasse"): ext_parts.append("Terrasse")
    if b.get("jardin"): ext_parts.append("Jardin")
    if b.get("piscine"): ext_parts.append("Piscine")
    if b.get("nb_balcons") and int(b["nb_balcons"] or 0) > 0: ext_parts.append("Balcon")
    exterieur = ", ".join(ext_parts)

    desc = b.get("description") or ""
    if b.get("proximites"):
        desc = desc.rstrip(".").rstrip() + ". " + b["proximites"] if desc else b["proximites"]
    if b.get("_is_location"):
        desc = "[LOCATION] " + desc

    try:
        conn.execute(
            """INSERT INTO biens (
                reference, type, ville, quartier, prix, prix_hn, honoraires_pct,
                surface, pieces, chambres, nb_salles_bain, nb_salles_eau, nb_wc,
                etat, exposition, exterieur,
                etage_bien, nb_etages_immeuble, ascenseur, cave,
                terrasse, nb_balcons, nb_parkings, nb_boxes,
                copropriete, charges_mensuelles,
                dpe_lettre, dpe_kwh, ges_lettre, ges_co2,
                orientation_sud, orientation_est, orientation_ouest, orientation_nord,
                description, photos, lien_annonce, stationnement,
                source, nom_agence, date_ajout, date_creation, statut
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                ref, b.get("type","Bien"), b.get("ville",""), b.get("quartier"),
                b.get("prix"), b.get("prix_hn"), b.get("honoraires_pct"),
                b.get("surface"), b.get("pieces"), b.get("chambres"),
                b.get("nb_salles_bain"), b.get("nb_salles_eau"), b.get("nb_wc"),
                b.get("etat"), expo, exterieur,
                b.get("etage_bien"), b.get("nb_etages_immeuble"),
                1 if b.get("ascenseur") else 0,
                1 if b.get("cave") else 0,
                1 if b.get("terrasse") else 0,
                b.get("nb_balcons") or 0,
                b.get("nb_parkings") or 0,
                b.get("nb_boxes") or 0,
                1 if b.get("copropriete") else 0,
                b.get("charges_mensuelles"),
                b.get("dpe_lettre"), b.get("dpe_kwh"),
                b.get("ges_lettre"), b.get("ges_co2"),
                1 if b.get("orientation_sud") else 0,
                1 if b.get("orientation_est") else 0,
                1 if b.get("orientation_ouest") else 0,
                1 if b.get("orientation_nord") else 0,
                desc, photos_str, f"{APP_BASE_URL}/public/bien/{AGENCY_SLUG}/{ref}", b.get("stationnement"),
                "scraper", "APL Immo",
                datetime.now().isoformat(), datetime.now().isoformat(), "actif"
            )
        )
        ok += 1
    except Exception as e:
        print(f"  DB ERR ({ref}): {e}")

conn.commit()
conn.close()
print(f"\nTermine : {ok}/{len(biens)} biens inseres dans aplimmo.db")
