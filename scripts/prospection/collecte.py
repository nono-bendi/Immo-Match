"""
Collecte des agences immobilières du secteur via Google Places API (New) Text
Search, puis extraction de l'email pro sur leur site (regex).

Usage :
    python -u collecte.py --all            # toutes les zones de PROSPECT_ZONES
    python -u collecte.py --ville Fayence   # une seule zone
    python -u collecte.py --emails-only     # ré-essaie l'extraction email pour
                                             # les agences deja en 'sans_email',
                                             # sans re-appeler Google Places
"""
import argparse
import os
import re
import sys
import time

import httpx
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(__file__))
import db

sys.stdout.reconfigure(encoding="utf-8")
load_dotenv()

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")
PROSPECT_ZONES = [z.strip() for z in os.getenv("PROSPECT_ZONES", "").split(",") if z.strip()]

PLACES_URL = "https://places.googleapis.com/v1/places:searchText"
FIELD_MASK = "places.id,places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber"

# Emails generiques prioritaires (boites pro, pas des persos type prenom.nom@)
_PREFIXES_GENERIQUES = ["contact", "info", "agence", "accueil", "commercial", "immo"]

# Domaines/adresses placeholder qu'on trouve parfois sur des sites (templates
# jamais remplaces) -- pas de vraies boites, a exclure de la collecte.
_DOMAINES_BIDON = ["exemple.fr", "example.com", "example.fr", "yourdomain.com",
                   "domain.com", "email.com", "test.com", "sentry.io", "wixpress.com"]
_LOCAUX_BIDON = ["exemple", "example", "test", "sample", "placeholder",
                 "votreadresse", "youremail", "yourname", "john.doe", "jane.doe"]

_EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")


def _email_valide(e: str) -> bool:
    local, _, domaine = e.partition("@")
    domaine = domaine.lower()
    local = local.lower()
    if any(bidon in domaine for bidon in _DOMAINES_BIDON):
        return False
    if any(bidon in local for bidon in _LOCAUX_BIDON):
        return False
    return True


def rechercher_agences(zone: str) -> list[dict]:
    """Appelle Google Places Text Search pour 'agence immobilière {zone}'."""
    if not GOOGLE_MAPS_API_KEY:
        print(f"[ERREUR] GOOGLE_MAPS_API_KEY manquante dans .env")
        return []
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask": FIELD_MASK,
    }
    body = {"textQuery": f"agence immobilière {zone}", "languageCode": "fr"}
    try:
        r = httpx.post(PLACES_URL, headers=headers, json=body, timeout=20)
        r.raise_for_status()
        return r.json().get("places", [])
    except Exception as e:
        print(f"[ERREUR] Places pour {zone!r}: {e}")
        return []


def extraire_email(url: str) -> str | None:
    """Va chercher un email pro sur la page d'accueil (et /contact si rien trouve)."""
    if not url:
        return None
    for path in ("", "contact", "nous-contacter", "contact-us"):
        page_url = url.rstrip("/") + (f"/{path}" if path else "")
        try:
            r = httpx.get(page_url, timeout=10, follow_redirects=True,
                          headers={"User-Agent": "Mozilla/5.0"})
            if r.status_code != 200:
                continue
            emails = set(_EMAIL_RE.findall(r.text))
            emails = {e for e in emails if not any(ext in e.lower() for ext in [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"])}
            emails = {e for e in emails if _email_valide(e)}
            if not emails:
                continue
            # Priorite aux emails generiques
            for e in emails:
                local = e.split("@")[0].lower()
                if any(local == p or local.startswith(p) for p in _PREFIXES_GENERIQUES):
                    return e
            return sorted(emails)[0]
        except Exception:
            continue
    return None


# Statuts "terminaux" : une fois atteints, une re-collecte ne doit jamais les
# ecraser (sans quoi un desabonnement ou un bounce serait annule et l'agence
# recontactee par erreur).
_STATUTS_PROTEGES = ("envoye", "desinscrit", "erreur")


def upsert_agence(conn, place: dict, email: str | None):
    place_id = place.get("id")
    nom = (place.get("displayName") or {}).get("text", "")
    adresse = place.get("formattedAddress", "")
    site = place.get("websiteUri", "")
    tel = place.get("nationalPhoneNumber", "")

    existing = conn.execute("SELECT id, statut FROM agences WHERE place_id = ?", (place_id,)).fetchone()
    if existing and existing["statut"] in _STATUTS_PROTEGES:
        # Deja contactee (ou desinscrite/en erreur) : on ne touche a rien.
        return existing["statut"]

    if not site:
        statut = "sans_site"
    elif not email:
        statut = "sans_email"
    else:
        statut = "a_envoyer"
        # Meme boite mail deja utilisee par une autre fiche (franchise avec
        # boite centrale type rgpd@, donneespersonnelles@...) : si cette boite
        # a deja un statut terminal ailleurs, on l'applique ici aussi plutot
        # que de renvoyer un email a la meme adresse sous un autre nom.
        autre = conn.execute(
            "SELECT statut FROM agences WHERE email = ? AND statut IN ('envoye','desinscrit','erreur') LIMIT 1",
            (email,)
        ).fetchone()
        if autre:
            statut = autre["statut"]

    now = time.strftime("%Y-%m-%dT%H:%M:%S")
    if existing:
        conn.execute(
            "UPDATE agences SET nom=?, adresse=?, site_web=?, email=?, telephone=?, statut=?, date_collecte=? WHERE place_id=?",
            (nom, adresse, site, email, tel, statut, now, place_id)
        )
    else:
        conn.execute(
            "INSERT INTO agences (nom, adresse, site_web, email, telephone, place_id, statut, date_collecte) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (nom, adresse, site, email, tel, place_id, statut, now)
        )
    conn.commit()
    return statut


def collecter_zone(zone: str):
    conn = db.get_conn()
    places = rechercher_agences(zone)
    print(f"[{zone}] {len(places)} resultat(s) Places")
    for place in places:
        site = place.get("websiteUri", "")
        email = extraire_email(site) if site else None
        statut = upsert_agence(conn, place, email)
        nom = (place.get("displayName") or {}).get("text", "?")
        print(f"  - {nom} -> {statut}" + (f" ({email})" if email else ""))
        time.sleep(0.3)  # menagement API + sites tiers


def relancer_emails_manquants():
    """Reprend les agences en 'sans_email' avec un site connu, sans re-Places."""
    conn = db.get_conn()
    rows = conn.execute("SELECT id, nom, site_web FROM agences WHERE statut = 'sans_email' AND site_web != ''").fetchall()
    print(f"{len(rows)} agence(s) a re-essayer")
    for row in rows:
        email = extraire_email(row["site_web"])
        if email:
            conn.execute("UPDATE agences SET email=?, statut='a_envoyer' WHERE id=?", (email, row["id"]))
            conn.commit()
            print(f"  - {row['nom']} -> a_envoyer ({email})")
        time.sleep(0.3)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--all", action="store_true", help="Collecte toutes les zones de PROSPECT_ZONES")
    parser.add_argument("--ville", type=str, help="Collecte une seule zone/ville")
    parser.add_argument("--emails-only", action="store_true", help="Re-essaie l'extraction email des agences 'sans_email'")
    args = parser.parse_args()

    if args.emails_only:
        relancer_emails_manquants()
    elif args.ville:
        collecter_zone(args.ville)
    elif args.all:
        if not PROSPECT_ZONES:
            print("[ERREUR] PROSPECT_ZONES vide dans .env")
            sys.exit(1)
        for zone in PROSPECT_ZONES:
            collecter_zone(zone)
    else:
        parser.print_help()

    print("\n--- Stats ---")
    print(db.stats())
