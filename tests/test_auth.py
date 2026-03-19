"""
Tests d'authentification — login, JWT, rôles
"""
import pytest
from fastapi.testclient import TestClient
from backend import app

client = TestClient(app)


def test_login_invalide():
    """Un mauvais mot de passe doit retourner 401"""
    r = client.post("/auth/login", json={"email": "nobody@test.com", "password": "wrong"})
    assert r.status_code == 401


def test_login_champ_manquant():
    """Login sans mot de passe doit retourner 422"""
    r = client.post("/auth/login", json={"email": "test@test.com"})
    assert r.status_code == 422


def test_route_protegee_sans_token():
    """Accéder à une route protégée sans token doit retourner 403"""
    r = client.post("/matching/run/1")
    assert r.status_code in (401, 403)


def test_route_protegee_token_invalide():
    """Un faux token doit être rejeté sur une route d'écriture"""
    r = client.post("/settings", json={"model": "test"}, headers={"Authorization": "Bearer faketoken123"})
    assert r.status_code == 401


def test_token_demo_bloque_ecriture():
    """Le compte demo ne peut pas modifier les données"""
    # Login demo
    r = client.post("/auth/login", json={"email": "demo@immomatch.fr", "password": "demo"})
    if r.status_code != 200:
        pytest.skip("Compte demo non configuré")
    token = r.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}

    # Tentative d'écriture
    r = client.post("/prospects", json={"nom": "Test"}, headers=headers)
    assert r.status_code in (401, 403)
