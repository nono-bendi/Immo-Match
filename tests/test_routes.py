"""
Tests des routes API critiques — lecture publique et écriture protégée
"""
import pytest
from fastapi.testclient import TestClient
from backend import app

client = TestClient(app)


# ── Routes publiques (lecture sans auth) ─────────────────────────────────────

def test_accueil():
    r = client.get("/")
    assert r.status_code == 200
    assert r.json() == {"message": "API ImmoMatch OK"}


def test_get_biens():
    r = client.get("/biens")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_get_prospects():
    r = client.get("/prospects")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_get_matchings():
    r = client.get("/matchings")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_get_settings():
    r = client.get("/settings")
    assert r.status_code == 200


def test_get_notifications():
    r = client.get("/notifications")
    assert r.status_code == 200


# ── Routes protégées sans token ───────────────────────────────────────────────

def test_save_settings_sans_token():
    r = client.post("/settings", json={"model": "test"})
    assert r.status_code in (401, 403)


def test_reset_database_sans_token():
    r = client.post("/reset-database")
    assert r.status_code in (401, 403)


def test_run_matching_sans_token():
    r = client.post("/matching/run/1")
    assert r.status_code in (401, 403)


def test_run_all_sans_token():
    r = client.post("/matching/run-all")
    assert r.status_code in (401, 403)


def test_send_email_sans_token():
    r = client.post("/send-email", json={"matching_id": 1})
    assert r.status_code in (401, 403)


# ── Cohérence des données ─────────────────────────────────────────────────────

def test_biens_schema():
    """Chaque bien doit avoir les champs obligatoires"""
    r = client.get("/biens")
    for bien in r.json():
        assert "id" in bien
        assert "type" in bien
        assert "ville" in bien
        assert "prix" in bien


def test_prospects_schema():
    """Chaque prospect doit avoir les champs obligatoires"""
    r = client.get("/prospects")
    for prospect in r.json():
        assert "id" in prospect
        assert "nom" in prospect


def test_matchings_schema():
    """Chaque matching doit avoir score et références"""
    r = client.get("/matchings")
    for m in r.json():
        assert "score" in m
        assert "prospect_id" in m
        assert "bien_id" in m
        assert 0 <= m["score"] <= 100


def test_bien_inexistant():
    r = client.get("/biens/999999")
    assert r.status_code == 404


def test_prospect_inexistant():
    r = client.get("/prospects/999999")
    assert r.status_code == 404
