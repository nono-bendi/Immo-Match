"""
Désinscription en un clic — token signé.

Le lien de désinscription placé dans les emails encode (agence, email du prospect)
et est signé (HMAC) pour qu'on ne puisse pas désinscrire un prospect arbitraire en
devinant l'URL. Réutilise JWT_SECRET_KEY (garanti présent au démarrage).
"""
import os
import hmac
import base64
import hashlib

_SECRET = (os.getenv("JWT_SECRET_KEY") or "").encode()


def _sign(payload: bytes) -> str:
    return hmac.new(_SECRET, payload, hashlib.sha256).hexdigest()[:24]


def make_token(agency_slug: str, email: str) -> str:
    payload = f"{agency_slug}|{email}".encode("utf-8")
    b = base64.urlsafe_b64encode(payload).decode().rstrip("=")
    return f"{b}.{_sign(payload)}"


def parse_token(token: str):
    """Retourne (agency_slug, email) si le token est valide, sinon None."""
    try:
        b, sig = token.rsplit(".", 1)
        payload = base64.urlsafe_b64decode(b + "=" * (-len(b) % 4))
        if not hmac.compare_digest(sig, _sign(payload)):
            return None
        agency_slug, email = payload.decode("utf-8").split("|", 1)
        return agency_slug, email
    except Exception:
        return None


def unsub_url(base_url: str, agency_slug: str, email: str) -> str:
    return f"{base_url.rstrip('/')}/public/unsubscribe?token={make_token(agency_slug, email)}"
