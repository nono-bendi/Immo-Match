"""
Orchestrateur quotidien : recollecte si le stock de 'a_envoyer' est bas,
puis envoie le quota du jour. A planifier une fois par jour (cron).

Usage :
    python -u daily.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import db
import collecte
import envoi

sys.stdout.reconfigure(encoding="utf-8")

from dotenv import load_dotenv
load_dotenv()

MIN_STOCK = int(os.getenv("PROSPECT_MIN_STOCK", "100"))


def main():
    s = db.stats()
    stock = s.get("a_envoyer", 0)
    print(f"Stock 'a_envoyer' actuel : {stock}")

    if stock < MIN_STOCK:
        print(f"Stock sous le seuil ({MIN_STOCK}) — recollecte...")
        if not collecte.PROSPECT_ZONES:
            print("[ERREUR] PROSPECT_ZONES vide, recollecte impossible")
        else:
            for zone in collecte.PROSPECT_ZONES:
                collecte.collecter_zone(zone)
        collecte.relancer_emails_manquants()

    print("\nEnvoi du quota du jour...")
    envoi.lancer(dry_run=False, limit=None)

    print("\n--- Stats finales ---")
    print(db.stats())


if __name__ == "__main__":
    main()
