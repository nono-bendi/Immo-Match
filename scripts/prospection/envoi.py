"""
Envoi des cold emails via l'API Brevo, aux agences en statut 'a_envoyer'.

Usage :
    python -u envoi.py --dry-run           # affiche ce qui partirait, n'envoie rien
    python -u envoi.py --to moi@exemple.fr  # envoie UN email de test a cette adresse
                                             # (bypasse la base, aucune agence n'est touchee)
    python -u envoi.py --limit 5           # envoie un petit lot reel (n'ouvre pas les vannes)
    python -u envoi.py                     # envoie le quota du jour (plafond PROSPECT_MAX_PER_DAY)

Le contenu (sujet + template HTML) vient de email_template.html, design final
issu de design_handoff_email_prospection/. Pas de personnalisation {nom}/{ville}
dans ce template -- copy generique et definitive (cf. son README).
"""
import argparse
import os
import sys
import time

import httpx
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(__file__))
import db

sys.stdout.reconfigure(encoding="utf-8")
load_dotenv()

BREVO_API_KEY = os.getenv("BREVO_API_KEY", "")
FROM_EMAIL = os.getenv("PROSPECT_FROM_EMAIL", "")
FROM_NAME = os.getenv("PROSPECT_FROM_NAME", "")
REPLY_TO = os.getenv("PROSPECT_REPLY_TO", "")
MAX_PER_DAY = int(os.getenv("PROSPECT_MAX_PER_DAY", "280"))
THROTTLE_SECONDS = 4

BREVO_URL = "https://api.brevo.com/v3/smtp/email"

_SUJET = "Combien de clients perdez-vous à cause d'un rapprochement approximatif ?"
_TEMPLATE_PATH = os.path.join(os.path.dirname(__file__), "email_template.html")


def _sujet(agence: dict) -> str:
    return _SUJET


def _corps_html(agence: dict) -> str:
    with open(_TEMPLATE_PATH, encoding="utf-8") as f:
        return f.read()


def _contenu_valide() -> bool:
    """Le template doit exister et ne pas etre vide."""
    return os.path.isfile(_TEMPLATE_PATH) and os.path.getsize(_TEMPLATE_PATH) > 0


def envoyer_un(agence: dict, marquer_en_base: bool = True) -> bool:
    sujet = _sujet(agence)
    corps = _corps_html(agence)
    payload = {
        "sender": {"name": FROM_NAME, "email": FROM_EMAIL},
        "to": [{"email": agence["email"], "name": agence["nom"]}],
        "subject": sujet,
        "htmlContent": corps,
        "replyTo": {"email": REPLY_TO},
        "headers": {"List-Unsubscribe": f"<mailto:{REPLY_TO}?subject=STOP>"},
    }
    try:
        r = httpx.post(BREVO_URL, headers={"api-key": BREVO_API_KEY, "Content-Type": "application/json"},
                        json=payload, timeout=15)
        r.raise_for_status()
        return True
    except Exception as e:
        print(f"  [ERREUR] {agence['nom']}: {e}")
        if marquer_en_base:
            conn = db.get_conn()
            conn.execute("UPDATE agences SET statut='erreur', erreur=? WHERE id=?", (str(e), agence["id"]))
            conn.commit()
        return False


def envoyer_test(destinataire: str):
    """Envoi unique de test, hors base de donnees -- pour verifier le rendu reel."""
    agence_test = {"id": None, "nom": "Test", "email": destinataire, "ville": ""}
    print(f"Envoi d'un email de test a {destinataire}...")
    ok = envoyer_un(agence_test, marquer_en_base=False)
    print("  [OK] envoye." if ok else "  echec, voir l'erreur ci-dessus.")


def lancer(dry_run: bool, limit: int | None):
    conn = db.get_conn()
    rows = conn.execute("SELECT * FROM agences WHERE statut = 'a_envoyer' ORDER BY id").fetchall()
    quota = limit if limit is not None else MAX_PER_DAY
    a_envoyer = rows[:quota]

    print(f"{len(rows)} agence(s) en attente, {len(a_envoyer)} seront traitees cette execution"
          + (" (DRY RUN — rien n'est envoye)" if dry_run else ""))

    if not dry_run and not _contenu_valide():
        print(f"\n[BLOQUE] Template introuvable ou vide : {_TEMPLATE_PATH}\n")
        return

    envoyes = 0
    for agence in a_envoyer:
        agence = dict(agence)
        if dry_run:
            print(f"  [DRY] -> {agence['nom']} <{agence['email']}> : {_sujet(agence)}")
            continue
        ok = envoyer_un(agence)
        if ok:
            now = time.strftime("%Y-%m-%dT%H:%M:%S")
            conn.execute("UPDATE agences SET statut='envoye', date_envoi=? WHERE id=?", (now, agence["id"]))
            conn.commit()
            envoyes += 1
            print(f"  [OK] {agence['nom']} <{agence['email']}>")
        time.sleep(THROTTLE_SECONDS)

    if not dry_run:
        print(f"\n{envoyes} email(s) envoye(s).")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Affiche ce qui partirait sans envoyer")
    parser.add_argument("--to", type=str, default=None, help="Envoie UN email de test a cette adresse, sans toucher la base")
    parser.add_argument("--limit", type=int, default=None, help="Nombre max d'emails a envoyer cette execution")
    args = parser.parse_args()

    if not BREVO_API_KEY or not FROM_EMAIL:
        print("[ERREUR] BREVO_API_KEY ou PROSPECT_FROM_EMAIL manquant dans .env")
        sys.exit(1)

    if args.to:
        envoyer_test(args.to)
    else:
        lancer(dry_run=args.dry_run, limit=args.limit)
