# ImmoMatch

Outil de matching IA entre prospects et biens immobiliers.
Développé pour Saint François Immobilier — Fréjus / Saint-Raphaël.

---

## Architecture

```
projet-immo/
├── backend.py          # Point d'entrée uvicorn
├── config.py           # App FastAPI, JWT, modèles Pydantic
├── database.py         # Init SQLite + migrations automatiques
├── scoring.py          # Algorithme hybride Python + Claude
├── logger.py           # Logging centralisé
├── routers/
│   ├── auth.py         # Login, JWT, gestion utilisateurs
│   ├── biens.py        # CRUD biens + import CSV
│   ├── prospects.py    # CRUD prospects + archivage
│   ├── matchings.py    # Scoring, run-all, run-by-prospect
│   ├── emails.py       # Génération + envoi email HTML
│   ├── sync.py         # Sync FTP Hektor (APScheduler)
│   ├── rapport.py      # Rapport mensuel HTML
│   ├── settings.py     # Paramètres + export Excel
│   ├── notifications.py
│   └── calibration.py
├── tests/
│   ├── test_auth.py
│   ├── test_scoring.py
│   └── test_routes.py
└── dashboard/          # React 19 + Vite
```

---

## Prérequis

- Python 3.11+
- Node.js 18+
- Clé API Anthropic (Claude)

---

## Installation

### Backend

```bash
pip install -r requirements.txt
```

### Frontend

```bash
cd dashboard
npm install
```

---

## Variables d'environnement

Créer un fichier `.env` à la racine :

```env
# Obligatoire
ANTHROPIC_API_KEY=sk-ant-...
JWT_SECRET_KEY=une_clé_secrète_longue_et_aléatoire

# FTP Hektor (sync automatique des biens)
FTP_HOST=
FTP_USER=
FTP_PASS=
FTP_PORT=21
FTP_PATH=

# Email (optionnel)
EMAIL_LOGO_URL=
```

---

## Lancer en local

**Backend** (terminal 1) :
```bash
python -m uvicorn backend:app --host 127.0.0.1 --port 8000 --reload
```

**Frontend** (terminal 2) :
```bash
cd dashboard
npm run dev
```

Ouvrir `http://localhost:5173`

---

## Tests

```bash
python -m pytest tests/ -v
```

33 tests couvrant : authentification, scoring objectif, routes API critiques.

---

## Déploiement VPS

```bash
# Local — build + push
cd dashboard && npm run build
git add -A && git commit -m "..." && git push origin main

# Sur le serveur
ssh root@178.104.57.75
cd /app && git checkout -- Annonces_hektor.csv && git pull origin main && systemctl restart immo-match
```

Service systemd : `immo-match`
Port backend : `8000`

---

## Fonctionnement du scoring

Le score final `/100` est la somme de deux parties :

**Score objectif `/60` — Python pur**

| Critère | Points |
|---|---|
| Budget | /25 |
| Type de bien | /20 |
| Ville / zone | /15 |

**Score qualitatif `/40` — Claude**

Analyse de la description, du DPE, des points de vie (calme, exposition, stationnement...) selon la destination du prospect (résidence principale, investissement, rénovation).

---

## Rôles utilisateurs

| Rôle | Accès |
|---|---|
| `admin` | Tout, y compris reset DB |
| `agent` | Tout sauf reset DB |
| `demo` | Lecture seule |

---

## Sync FTP Hektor

Toutes les 6h (configurable dans Paramètres), le serveur :
1. Télécharge le ZIP depuis le FTP Hektor
2. Parse le CSV des annonces
3. Met à jour les biens existants (`source = 'ftp'`)
4. Marque absents comme `statut = 'vendu'`
5. Supprime automatiquement les vendus après 2 jours

Les biens ajoutés manuellement (`source = 'manual'`) ne sont jamais marqués vendus.

---

## Base de données

SQLite — fichier `immomatch.db`

Tables : `prospects`, `biens`, `matchings`, `users`, `settings`, `notifications`, `emails_sent`, `calibration_feedback`

Les migrations sont automatiques au démarrage (`database.py`).
