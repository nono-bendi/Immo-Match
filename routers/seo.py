from fastapi import APIRouter
from fastapi.responses import PlainTextResponse, Response
from datetime import date
from config import APP_BASE_URL

router = APIRouter()

BASE = APP_BASE_URL.rstrip("/")
TODAY = date.today().isoformat()

# ── Pages publiques du landing ────────────────────────────────────────────────
_PAGES = [
    ("",                    "1.0", "weekly"),
    ("/demarrer",           "0.9", "monthly"),
    ("/showcase",           "0.8", "monthly"),
    ("/faq",                "0.7", "monthly"),
    ("/guide-de-demarrage", "0.7", "monthly"),
    ("/documentation",      "0.6", "monthly"),
    ("/mentions-legales",   "0.3", "yearly"),
    ("/cgu",                "0.3", "yearly"),
    ("/confidentialite",    "0.3", "yearly"),
    ("/cookies",            "0.3", "yearly"),
]


@router.get("/sitemap.xml", include_in_schema=False)
def sitemap():
    urls = "\n".join(
        f"""  <url>
    <loc>{BASE}{path}</loc>
    <lastmod>{TODAY}</lastmod>
    <changefreq>{freq}</changefreq>
    <priority>{priority}</priority>
  </url>"""
        for path, priority, freq in _PAGES
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
