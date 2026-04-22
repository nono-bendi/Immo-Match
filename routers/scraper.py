# ════════════════════════════════════════════════════════════════════════════
# SCRAPER — Extraction de biens depuis le site web d'une agence
#
# POST /api/scrape-preview  { url }
#   → fetch HTML → nettoyage + photos inline → Claude Haiku → biens structurés
#
# Coût : ~$0.002–0.004 par appel (Haiku, HTML tronqué à 15 000 chars)
# ════════════════════════════════════════════════════════════════════════════

import os
import json
import re
import httpx
from bs4 import BeautifulSoup
from urllib.parse import urlparse
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import anthropic

router = APIRouter()

_anthropic = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))

MAX_HTML_CHARS  = 15_000  # chars envoyés à Claude
MAX_BIENS       = 20      # biens extraits max
FETCH_TIMEOUT   = 12      # secondes

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0 Safari/537.36"
    ),
    "Accept-Language": "fr-FR,fr;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


# ── Nettoyage HTML ────────────────────────────────────────────────────────────

def _clean_html(html: str, base_url: str = "") -> str:
    """Supprime le bruit, insère les photos inline, retourne texte tronqué."""
    soup = BeautifulSoup(html, "html.parser")
    parsed_base = urlparse(base_url)

    # Supprimer les balises de bruit
    for tag in soup(["script", "style", "noscript", "nav", "footer",
                     "header", "aside", "meta", "link", "svg"]):
        tag.decompose()

    # Remplacer <img> par leur URL (support lazy loading)
    for img in soup.find_all("img"):
        src = (
            img.get("data-src") or img.get("data-lazy-src") or
            img.get("data-original") or img.get("data-url") or
            img.get("src") or ""
        ).strip()
        # Ignorer data-URI, SVG, icônes (< 20 chars après le nom de fichier)
        if src and not src.startswith("data:") and not src.endswith(".svg"):
            if src.startswith("//"):
                src = "https:" + src
            elif src.startswith("/") and parsed_base.netloc:
                src = f"{parsed_base.scheme}://{parsed_base.netloc}{src}"
            img.replace_with(f"\n[PHOTO:{src}]\n")
        else:
            img.decompose()

    # Trouver la zone de listings
    main = (
        soup.find("main") or
        soup.find(id=re.compile(r"(content|listing|biens|properties|annonces|catalog|results)", re.I)) or
        soup.find(class_=re.compile(r"(listing|biens|properties|annonces|catalog|results|cards)", re.I)) or
        soup.body
    )

    text = (main or soup).get_text(separator="\n", strip=True)
    lines = [l for l in text.splitlines() if l.strip()]
    return "\n".join(lines)[:MAX_HTML_CHARS]


# ── Appel Claude Haiku ────────────────────────────────────────────────────────

PROMPT = """Voici le contenu textuel d'une page de listings immobiliers d'une agence française.
Les photos sont indiquées sous la forme [PHOTO:url] juste avant ou après le bien auquel elles appartiennent.

Extrais jusqu'à {max} biens immobiliers à vendre (ignore les biens en location).
Pour chaque bien retourne un objet JSON avec ces champs (null si non trouvé) :
- type        : "Appartement" | "Maison" | "Villa" | "Studio" | "Local commercial" | "Terrain" | autre
- ville       : string
- prix        : integer (euros, sans espaces ni €)
- surface     : float (m²)
- pieces      : integer
- chambres    : integer
- reference   : string (ref interne si présente)
- description : string (2-3 phrases : état, atouts, localisation, prestations notables)
- photos      : array of strings (toutes les URLs [PHOTO:...] liées à ce bien, [] si aucune)
- terrasse    : true | false | null
- cave        : true | false | null
- nb_parkings : integer (garages + parkings, 0 si aucun)
- exposition  : string ("Sud", "Nord", "Est", "Ouest", "Sud-Est", etc.) ou null
- charges     : float (charges mensuelles en euros) ou null
- dpe_lettre  : string ("A" à "G") ou null
- dpe_kwh     : integer ou null
- ges_lettre  : string ("A" à "G") ou null
- copropriete : true | false | null

Réponds UNIQUEMENT avec un tableau JSON valide. Pas de markdown, pas d'explication.

Contenu de la page :
{content}"""


def _extract_with_claude(content: str) -> list[dict]:
    """Envoie le contenu à Claude Haiku et parse la réponse JSON."""
    msg = _anthropic.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=4000,
        messages=[{
            "role": "user",
            "content": PROMPT.format(max=MAX_BIENS, content=content),
        }],
    )
    raw = msg.content[0].text.strip()

    match = re.search(r"\[.*\]", raw, re.DOTALL)
    if not match:
        return []
    try:
        biens = json.loads(match.group())
        return biens if isinstance(biens, list) else []
    except json.JSONDecodeError:
        return []


# ── Endpoint ──────────────────────────────────────────────────────────────────

class ScrapeRequest(BaseModel):
    url: str


@router.post("/scrape-preview")
async def scrape_preview(data: ScrapeRequest):
    url = data.url.strip()
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    # 1. Fetch
    try:
        async with httpx.AsyncClient(timeout=FETCH_TIMEOUT, follow_redirects=True) as client:
            resp = await client.get(url, headers=HEADERS)
        if resp.status_code >= 400:
            raise HTTPException(
                status_code=422,
                detail=f"Site inaccessible (HTTP {resp.status_code}). Vérifiez l'URL.",
            )
        html = resp.text
    except httpx.TimeoutException:
        raise HTTPException(status_code=422, detail="Le site ne répond pas (timeout).")
    except httpx.RequestError as e:
        raise HTTPException(status_code=422, detail=f"Impossible d'accéder au site : {e}")

    # 2. Nettoyer
    content = _clean_html(html, base_url=url)
    if len(content) < 100:
        raise HTTPException(
            status_code=422,
            detail="Page trop vide — le site utilise peut-être JavaScript dynamique.",
        )

    # 3. Claude Haiku
    try:
        biens = _extract_with_claude(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur d'extraction : {e}")

    biens = [b for b in biens if b.get("prix") or b.get("ville")][:MAX_BIENS]

    return {
        "url": url,
        "nb_biens": len(biens),
        "biens": biens,
    }
