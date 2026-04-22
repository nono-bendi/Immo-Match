# ════════════════════════════════════════════════════════════════════════════
# SCRAPER — Extraction de biens depuis le site web d'une agence
#
# POST /api/scrape-preview  { url }
#   → fetch HTML → nettoyage → Claude Haiku → liste de biens structurés
#
# Coût : ~$0.001 par appel (Haiku, HTML tronqué à 6000 chars)
# ════════════════════════════════════════════════════════════════════════════

import os
import json
import re
import httpx
from bs4 import BeautifulSoup
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import anthropic

router = APIRouter()

_anthropic = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))

MAX_HTML_CHARS  = 6_000   # chars envoyés à Claude
MAX_BIENS       = 15      # biens extraits max
FETCH_TIMEOUT   = 10      # secondes

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0 Safari/537.36"
    ),
    "Accept-Language": "fr-FR,fr;q=0.9",
}


# ── Nettoyage HTML ────────────────────────────────────────────────────────────

def _clean_html(html: str) -> str:
    """Supprime scripts/styles/nav/footer, retourne le texte utile tronqué."""
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "noscript", "nav", "footer",
                     "header", "aside", "meta", "link", "svg", "img"]):
        tag.decompose()

    # Essayer de trouver la zone de listings (heuristiques communes)
    main = (
        soup.find("main") or
        soup.find(id=re.compile(r"(content|listing|biens|properties|annonces)", re.I)) or
        soup.find(class_=re.compile(r"(listing|biens|properties|annonces|catalog)", re.I)) or
        soup.body
    )

    text = (main or soup).get_text(separator="\n", strip=True)
    # Supprimer les lignes vides consécutives
    lines = [l for l in text.splitlines() if l.strip()]
    cleaned = "\n".join(lines)
    return cleaned[:MAX_HTML_CHARS]


# ── Appel Claude Haiku ────────────────────────────────────────────────────────

PROMPT = """Voici le contenu textuel d'une page de listings immobiliers d'une agence française.

Extrais jusqu'à {max} biens immobiliers à vendre (ignore les biens en location).
Pour chaque bien retourne un objet JSON avec ces champs (null si non trouvé) :
- type : "Appartement" | "Maison" | "Villa" | "Studio" | "Local commercial" | "Terrain" | autre
- ville : string
- prix : integer (euros, sans espaces ni €)
- surface : float (m²)
- pieces : integer
- chambres : integer
- reference : string (ref interne si présente)
- description : string (1-2 phrases max, résumé du bien)

Réponds UNIQUEMENT avec un tableau JSON valide. Pas de markdown, pas d'explication.
Exemple : [{{"type":"Appartement","ville":"Fréjus","prix":245000,"surface":68.0,"pieces":3,"chambres":2,"reference":"REF123","description":"Bel appartement lumineux."}}]

Contenu de la page :
{content}"""


def _extract_with_claude(content: str) -> list[dict]:
    """Envoie le contenu à Claude Haiku et parse la réponse JSON."""
    msg = _anthropic.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1500,
        messages=[{
            "role": "user",
            "content": PROMPT.format(max=MAX_BIENS, content=content),
        }],
    )
    raw = msg.content[0].text.strip()

    # Extraire le JSON même si Claude a ajouté du texte autour
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
        raise HTTPException(status_code=422, detail="Le site ne répond pas (timeout). Vérifiez l'URL.")
    except httpx.RequestError as e:
        raise HTTPException(status_code=422, detail=f"Impossible d'accéder au site : {e}")

    # 2. Nettoyer le HTML
    content = _clean_html(html)
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

    # Filtrer les entrées sans prix ni ville (bruit)
    biens = [b for b in biens if b.get("prix") or b.get("ville")][:MAX_BIENS]

    return {
        "url": url,
        "nb_biens": len(biens),
        "biens": biens,
    }
