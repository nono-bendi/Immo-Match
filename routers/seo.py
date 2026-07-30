from fastapi import APIRouter
from fastapi.responses import PlainTextResponse, Response
from datetime import date, datetime
from pathlib import Path
from config import APP_BASE_URL

router = APIRouter()

BASE = APP_BASE_URL.rstrip("/")
TODAY = date.today().isoformat()

# landing/dist/blog/ — un sous-dossier par article prérendu. Repéré depuis ce
# fichier (pas depuis le cwd du process) pour rester correct quel que soit
# l'endroit d'où uvicorn est lancé.
_BLOG_DIST = Path(__file__).resolve().parent.parent / "landing" / "dist" / "blog"


def _blog_slugs():
    """Slugs des articles publiés — dérivés du build, jamais codés en dur.
    Permet à l'automatisation (routine cloud) d'ajouter un article sans jamais
    toucher au backend Python ni nécessiter de redémarrage du service."""
    if not _BLOG_DIST.is_dir():
        return []
    return sorted(
        p.name for p in _BLOG_DIST.iterdir()
        if p.is_dir() and (p / "index.html").is_file()
    )


def _lastmod(slug=None):
    """Date de dernière modification réelle du fichier prérendu (mtime),
    plutôt qu'une date figée au dernier redémarrage du service."""
    path = (_BLOG_DIST / slug / "index.html") if slug else (_BLOG_DIST / "index.html")
    try:
        return datetime.fromtimestamp(path.stat().st_mtime).date().isoformat()
    except OSError:
        return TODAY


# ── Pages publiques du landing ────────────────────────────────────────────────
# Slash final obligatoire : les pages prérendues sont des dossiers (nginx 301
# /faq → /faq/), le sitemap doit déclarer l'URL finale, pas la redirection.
_PAGES = [
    ("/",                    "1.0", "weekly"),
    ("/demarrer/",           "0.9", "monthly"),
    ("/faq/",                "0.7", "monthly"),
    ("/guide-de-demarrage/", "0.7", "monthly"),
    ("/documentation/",      "0.6", "monthly"),
    ("/mentions-legales/",   "0.3", "yearly"),
    ("/cgu/",                "0.3", "yearly"),
    ("/confidentialite/",    "0.3", "yearly"),
    ("/cookies/",            "0.3", "yearly"),
]


@router.get("/sitemap.xml", include_in_schema=False)
def sitemap():
    entries = [(path, priority, freq, TODAY) for path, priority, freq in _PAGES]
    entries.append(("/blog/", "0.7", "weekly", _lastmod()))
    entries += [
        (f"/blog/{slug}/", "0.6", "monthly", _lastmod(slug))
        for slug in _blog_slugs()
    ]
    urls = "\n".join(
        f"""  <url>
    <loc>{BASE}{path}</loc>
    <lastmod>{lastmod}</lastmod>
    <changefreq>{freq}</changefreq>
    <priority>{priority}</priority>
  </url>"""
        for path, priority, freq, lastmod in entries
    )
    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{urls}
</urlset>"""
    return Response(content=xml, media_type="application/xml")


@router.get("/robots.txt", include_in_schema=False)
def robots():
    content = f"""User-agent: *

# Pages publiques autorisées
Allow: /$
Allow: /demarrer
Allow: /showcase
Allow: /video
Allow: /blog
Allow: /faq
Allow: /guide-de-demarrage
Allow: /documentation
Allow: /mentions-legales
Allow: /cgu
Allow: /confidentialite
Allow: /cookies
Allow: /public/bien/

# Tout le reste est privé
Disallow: /dashboard/
Disallow: /auth/
Disallow: /admin/
Disallow: /agent/
Disallow: /biens/
Disallow: /prospects/
Disallow: /matchings/
Disallow: /emails/
Disallow: /notifications/
Disallow: /settings/
Disallow: /calibration/
Disallow: /sync/
Disallow: /scrape/
Disallow: /stats/
Disallow: /historique
Disallow: /rapport/
Disallow: /static/logos/
Disallow: /guide

Sitemap: {BASE}/sitemap.xml
"""
    return PlainTextResponse(content=content)
