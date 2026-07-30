# Outil de prospection cold email — ImmoFlash

Outil **perso** de Noa pour vendre ImmoFlash aux agences immobilières de son
secteur par email. **Ce n'est pas une feature du produit** — standalone,
jamais exposé dans le SaaS, pas de rapport avec le suivi de visites
(`/prospection` dans le dashboard, table `prospection` de `agencies.db`).

Reconstruit le 2026-07-21 après perte de la version d'origine (841 agences
collectées le 09/07/2026, jamais commitée, restée sur un autre PC).

## Fichiers

| Fichier | Rôle |
|---|---|
| `db.py` | Base SQLite `prospection.db`, table `agences`. Connexion unique partagée. |
| `collecte.py` | Google Places API (New) Text Search → agences → visite les sites → extrait l'email pro par regex. |
| `envoi.py` | Envoi via API Brevo. **Bloqué tant que le contenu du mail est un placeholder.** |
| `daily.py` | Orchestrateur : recollecte si stock bas + envoie le quota du jour. |

Statuts d'une agence : `nouveau` / `sans_site` / `sans_email` / `a_envoyer` / `envoye` / `repondu` / `desinscrit` / `erreur`.

## Avant tout envoi réel

**Étape obligatoire** : éditer `envoi.py`, fonctions `_sujet()` et `_corps_html()`,
et remplacer le contenu `[PLACEHOLDER]` par le vrai texte du mail (écrit par Noa).
Tant que ce n'est pas fait, `envoi.py` refuse d'envoyer sauf en `--dry-run`.

Garder les variables `{nom}` (nom agence) et `{ville}`/`{adresse}` disponibles
dans le dict `agence` passé à ces deux fonctions.

## Commandes

```bash
# Collecte tout le secteur (lit PROSPECT_ZONES du .env)
python -u scripts/prospection/collecte.py --all

# Collecte une seule ville
python -u scripts/prospection/collecte.py --ville Fayence

# Ré-extraire seulement les emails manquants (reprise, sans re-Places)
python -u scripts/prospection/collecte.py --emails-only

# Voir ce qui partirait, SANS envoyer
python -u scripts/prospection/envoi.py --dry-run

# Envoyer un petit lot de test (n'ouvre PAS les vannes)
python -u scripts/prospection/envoi.py --limit 5

# Tout automatique (recollecte si besoin + envoi du quota du jour)
python -u scripts/prospection/daily.py

# Voir les stats
python -c "import sys; sys.path.insert(0,'scripts/prospection'); import db; print(db.stats())"
```

## Variables d'environnement (`.env` à la racine du projet)

```
PROSPECT_SOURCE=google
GOOGLE_MAPS_API_KEY=...
BREVO_API_KEY=...
PROSPECT_FROM_EMAIL=contact@immoflash.app
PROSPECT_FROM_NAME=Noa — ImmoFlash
PROSPECT_REPLY_TO=contact@immoflash.app
PROSPECT_ZONES=Fayence, Tourrettes, Callian, ...
PROSPECT_MIN_STOCK=100
PROSPECT_MAX_PER_DAY=280
```

## Légal (cold email B2B France)

Autorisé sans consentement préalable car l'offre est liée au métier du
destinataire (SaaS immo → agence immo). Conditions respectées dans le code :
on cible les emails **pro génériques** (`contact@`, `info@`…), on s'identifie,
et chaque mail a un moyen de désinscription (`List-Unsubscribe` + mention
"répondez STOP"). Passer une agence en `desinscrit` si elle demande STOP.

## `prospection.db`

Ce fichier est local (gitignored, comme `*.db`). Sur un autre PC, le
copier pour ne pas re-collecter depuis zéro (coût Google Places).
