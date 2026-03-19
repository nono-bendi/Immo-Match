from config import app
from database import init_db
from routers import auth, biens, prospects, matchings, emails, sync, rapport, settings, notifications, calibration

# ── Initialisation de la base de données ─────────────────────────────────────
init_db()

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
