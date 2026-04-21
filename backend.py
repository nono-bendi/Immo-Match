import os
from fastapi.staticfiles import StaticFiles
from config import app
from database import init_db
from agencies_db import init_agencies_db, all_agencies, get_db_path
from demo_data import init_demo_db
from routers import auth, biens, prospects, matchings, emails, sync, rapport, settings, notifications, calibration
from routers import admin, public, agent, demo

# ── Initialisation de la DB centrale des agences ──────────────────────────────
init_agencies_db()

# ── Initialisation de la DB de chaque agence enregistrée ──────────────────────
for _agency in all_agencies():
    init_db(get_db_path(_agency["slug"]))

# ── Initialisation du compte démo ─────────────────────────────────────────────
init_demo_db()  # idempotent — ne recrée que si demo.db est vide

# ── Enregistrement des routers ────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(biens.router)
app.include_router(prospects.router)
app.include_router(matchings.router)
app.include_router(emails.router)
app.include_router(sync.router)
app.include_router(rapport.router)
app.include_router(settings.router)
app.include_router(notifications.router)
app.include_router(calibration.router)
app.include_router(admin.router)
app.include_router(public.router)
app.include_router(agent.router)
app.include_router(demo.router)

# ── Fichiers statiques (logos agences) ────────────────────────────────────────
os.makedirs("static/logos", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")


# ── Route racine ──────────────────────────────────────────────────────────────
@app.get("/")
def accueil():
    return {"message": "API ImmoMatch OK"}


# ── Startup event ─────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    """Démarre le scheduler au lancement de l'app"""
    sync.start_scheduler()


# ── Point d'entrée uvicorn ────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
