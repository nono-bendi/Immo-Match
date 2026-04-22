# ════════════════════════════════════════════════════════════════════════════
# SCRAPER — Extraction de biens depuis le site web d'une agence
#
# POST /api/scrape-preview  { url }
#   Stratégie 2 passes :
#     1. Page listing  → biens basiques + liens détail (Claude Haiku x1)
#     2. Pages détail  → info complète par bien (Claude Haiku x N, parallèle)
#
# Coût : ~1 + N appels Haiku ≈ $0.01 max pour 10 biens
# ════════════════════════════════════════════════════════════════════════════

import os
import re
import json
import asyncio
import httpx
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urljoin
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import anthropic

router = APIRouter()

_anthropic = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))

MAX_HTML_CHARS   = 12_000   # par page envoyée à Claude
MAX_BIENS        = 15       # biens max
MAX_DETAIL_PAGES = 10       # pages détail fetchées en parallèle
FETCH_TIMEOUT    = 12

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0 Safari/537.36"
    ),
    "Accept-Language": "fr-FR,fr;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

# Mots-clés qui indiquent une page détail d'un bien
_DETAIL_PATTERNS = re.compile(
    r"/(bien|vente|annonce|property|listing|fiche|detail|achat|programme|appartement|maison|villa|terrain|local|immeuble)/",
    re.I,
)
# Pages à exclure (navigation, contact, etc.)
_NAV_PATTERNS = re.compile(
    r"/(login|compte|contact|mentions|cgu|faq|blog|actualite|equipe|about|sitemap|recherche|search|"
    r"location|louer|estimation|estimer|presse|nous-contacter|honoraires|newsletter|inscription)",
    re.I,
)


# ── Nettoyage HTML ────────────────────────────────────────────────────────────

def _clean_html(html: str, base_url: str = "", keep_links: bool = False) -> str:
    """
    Nettoie le HTML.
    - Photos  → [PHOTO:url]
    - Liens   → texte [LIEN:url]  (si keep_links=True)
    """
    soup = BeautifulSoup(html, "html.parser")
    parsed = urlparse(base_url)
    origin = f"{parsed.scheme}://{parsed.netloc}" if parsed.netloc else ""

    # Supprimer le bruit
    for tag in soup(["script", "style", "noscript", "nav", "footer",
                     "header", "aside", "meta", "link", "svg"]):
        tag.decompose()

    # Photos → [PHOTO:url]
    for img in soup.find_all("img"):
        src = (
            img.get("data-src") or img.get("data-lazy-src") or
            img.get("data-original") or img.get("data-url") or
            img.get("src") or ""
        ).strip()
        if src and not src.startswith("data:") and not src.endswith(".svg"):
            src = urljoin(base_url, src) if base_url else src
            if src.startswith("//"):
                src = "https:" + src
            img.replace_with(f"\n[PHOTO:{src}]\n")
        else:
            img.decompose()

    # Liens → texte [LIEN:url]
    if keep_links:
        for a in soup.find_all("a", href=True):
            href = a.get("href", "").strip()
            if not href or href.startswith(("#", "javascript:", "mailto:", "tel:")):
                a.unwrap()
                continue
            href = urljoin(base_url, href) if base_url else href
            if href.startswith("//"):
                href = "https:" + href
            # Ne garder que les liens du même domaine, pas les pages de navigation
            if origin and parsed.netloc not in href:
                a.unwrap()
                continue
            if _NAV_PATTERNS.search(href):
                a.unwrap()
                continue
            inner = a.get_text(strip=True)
            a.replace_with(f"{inner} [LIEN:{href}]")
    else:
        for a in soup.find_all("a"):
            a.unwrap()

    # Zone de listings (heuristiques)
    main = (
        soup.find("main") or
        soup.find(id=re.compile(r"(content|listing|biens|properties|annonces|catalog|results)", re.I)) or
        soup.find(class_=re.compile(r"(listing|biens|properties|annonces|catalog|results|cards)", re.I)) or
        soup.body
    )

    text = (main or soup).get_text(separator="\n", strip=True)
    lines = [l for l in text.splitlines() if l.strip()]
    return "\n".join(lines)[:MAX_HTML_CHARS]


# ── Prompts Claude ────────────────────────────────────────────────────────────

PROMPT_LISTING = """Voici le contenu d'une page de listings immobiliers d'une agence française.
Les photos sont indiquées [PHOTO:url], les liens [LIEN:url].

Extrais jusqu'à {max} biens à vendre (ignore les locations).
Pour chaque bien, retourne un objet JSON (null si non trouvé) :
- type        : "Appartement"|"Maison"|"Villa"|"Studio"|"Local commercial"|"Terrain"|autre
- ville       : string
- prix        : integer (€, sans espaces)
- surface     : float (m²)
- pieces      : integer
- chambres    : integer
- reference   : string
- description : string (1-2 phrases)
- photos      : array of strings (URLs [PHOTO:...] liées à ce bien)
- lien_detail : string (URL [LIEN:...] menant à la fiche détail du bien, null si absent)
- terrasse    : true|false|null
- cave        : true|false|null
- nb_parkings : integer (0 si aucun)
- exposition  : string ou null
- charges     : float (€/mois) ou null
- dpe_lettre  : "A"-"G" ou null
- dpe_kwh     : integer ou null
- ges_lettre  : "A"-"G" ou null
- copropriete : true|false|null

Réponds UNIQUEMENT avec un tableau JSON valide, sans markdown.

Contenu :
{content}"""


PROMPT_DETAIL = """Voici la fiche détail d'un bien immobilier d'une agence française.
Les photos sont indiquées [PHOTO:url].

Extrais TOUTES les informations disponibles sur CE bien (un seul objet) :
- type, ville, prix, surface, pieces, chambres, reference
- description : 2-3 phrases complètes (état, atouts, localisation, prestations)
- photos      : array (toutes les URLs [PHOTO:...] de la page)
- terrasse    : true|false|null
- cave        : true|false|null
- nb_parkings : integer
- exposition  : string ou null
- charges     : float (€/mois) ou null
- dpe_lettre, dpe_kwh, ges_lettre, ges_co2 : valeurs ou null
- copropriete : true|false|null
- annee_construction : integer ou null
- nb_salles_bain : integer ou null
- etage       : integer ou null

Réponds UNIQUEMENT avec un tableau JSON à UN seul élément, sans markdown.

Contenu :
{content}"""


def _call_claude(prompt: str, max_tokens: int = 3000) -> list[dict]:
    msg = _anthropic.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=max_tokens,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = msg.content[0].text.strip()
    match = re.search(r"\[.*\]", raw, re.DOTALL)
    if not match:
        return []
    try:
        result = json.loads(match.group())
        return result if isinstance(result, list) else []
    except json.JSONDecodeError:
        return []


# ── Fetch helpers ─────────────────────────────────────────────────────────────

async def _fetch(client: httpx.AsyncClient, url: str) -> tuple[str, str]:
    """Retourne (html, url_finale). Lève une exception si erreur."""
    resp = await client.get(url, headers=HEADERS)
    resp.raise_for_status()
    return resp.text, str(resp.url)


# ── Endpoint ──────────────────────────────────────────────────────────────────

class ScrapeRequest(BaseModel):
    url: str


@router.post("/scrape-preview")
async def scrape_preview(data: ScrapeRequest):
    url = data.url.strip()
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    # ── Passe 1 : page listing ────────────────────────────────────────────────
    try:
        async with httpx.AsyncClient(timeout=FETCH_TIMEOUT, follow_redirects=True) as client:
            html, url = await _fetch(client, url)
    except httpx.TimeoutException:
        raise HTTPException(status_code=422, detail="Le site ne répond pas (timeout).")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=422, detail=f"Site inaccessible (HTTP {e.response.status_code}).")
    except httpx.RequestError as e:
        raise HTTPException(status_code=422, detail=f"Impossible d'accéder au site : {e}")

    content = _clean_html(html, base_url=url, keep_links=True)
    if len(content) < 100:
        raise HTTPException(status_code=422, detail="Page trop vide — le site utilise peut-être JavaScript dynamique.")

    try:
        biens = _call_claude(PROMPT_LISTING.format(max=MAX_BIENS, content=content))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur d'extraction : {e}")

    biens = [b for b in biens if b.get("prix") or b.get("ville")][:MAX_BIENS]

    # ── Passe 2 : pages détail (parallèle) ────────────────────────────────────
    detail_jobs = []   # (index_bien, url_detail)
    for i, b in enumerate(biens):
        lien = b.pop("lien_detail", None) or ""
        if lien.startswith("http"):
            detail_jobs.append((i, lien))

    # Limiter à MAX_DETAIL_PAGES pages
    detail_jobs = detail_jobs[:MAX_DETAIL_PAGES]

    if detail_jobs:
        async with httpx.AsyncClient(timeout=FETCH_TIMEOUT, follow_redirects=True) as client:
            tasks = [_fetch(client, lien) for _, lien in detail_jobs]
            results = await asyncio.gather(*tasks, return_exceptions=True)

        for (idx, lien), result in zip(detail_jobs, results):
            if isinstance(result, Exception):
                continue
            detail_html, detail_url = result
            detail_content = _clean_html(detail_html, base_url=detail_url, keep_links=False)
            try:
                detail_biens = _call_claude(
                    PROMPT_DETAIL.format(content=detail_content), max_tokens=2000
                )
            except Exception:
                continue
            if not detail_biens:
                continue
            d = detail_biens[0]
            # Merger : les détails enrichissent ce qui vient du listing
            for k, v in d.items():
                if v is not None:
                    # Photos et description : toujours prendre les détails (plus complets)
                    if k in ("photos", "description") or biens[idx].get(k) is None:
                        biens[idx][k] = v

    return {
        "url": url,
        "nb_biens": len(biens),
        "biens": biens,
    }
