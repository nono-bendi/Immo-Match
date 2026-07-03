"""
Tests des routes API — la donnée métier est protégée, seul l'accueil est public.

Note : depuis l'isolation multi-agences, /biens /prospects /matchings /settings
/notifications exigent un token (l'agence vient du JWT). Ces tests verrouillent
cette protection contre toute régression. Tester le contenu (schéma des données)
nécessiterait une fixture authentifiée avec base de test isolée — à ajouter en
Phase 2 (cf. NOTATION.md).
"""
import pytest
from fastapi.testclient import TestClient
from backend import app

client = TestClient(app)

# Endpoints qui exposent de la donnée métier : doivent tous refuser l'accès sans token
PROTECTED_GET = ["/biens", "/prospects", "/matchings", "/settings", "/notifications"]
PROTECTED_POST = [
    ("/settings", {"model": "test"}),
    ("/reset-database", {}),
    ("/matching/run/1", {}),
    ("/matching/run-all", {}),
    ("/send-email", {"matching_id": 1}),
    ("/prospects/add", {"nom": "Test"}),
]


# ── Route publique ────────────────────────────────────────────────────────────

def test_accueil():
    r = client.get("/")
    assert r.status_code == 200
    assert r.json() == {"message": "API ImmoFlash OK"}


# ── Lecture métier : protégée sans token ──────────────────────────────────────

@pytest.mark.parametrize("path", PROTECTED_GET)
def test_lecture_protegee_sans_token(path):
    r = client.get(path)
    assert r.status_code in (401, 403), f"{path} devrait exiger un token"


# ── Écriture : protégée sans token ────────────────────────────────────────────

@pytest.mark.parametrize("path,payload", PROTECTED_POST)
def test_ecriture_protegee_sans_token(path, payload):
    r = client.post(path, json=payload)
    assert r.status_code in (401, 403), f"{path} devrait exiger un token"


# ── Détail d'une ressource : protégé sans token ───────────────────────────────

def test_bien_detail_protege():
    r = client.get("/biens/999999")
    assert r.status_code in (401, 403)


def test_prospect_detail_protege():
    r = client.get("/prospects/999999")
    assert r.status_code in (401, 403)
