"""
Tests de la désinscription en un clic — token signé + endpoint public.
"""
from fastapi.testclient import TestClient
from backend import app
import unsubscribe as U

client = TestClient(app)


def test_token_roundtrip():
    t = U.make_token("saint_francois", "jean@test.fr")
    assert U.parse_token(t) == ("saint_francois", "jean@test.fr")


def test_token_invalide():
    assert U.parse_token("nimportequoi") is None
    assert U.parse_token("abc.def") is None


def test_token_signature_falsifiee():
    t = U.make_token("saint_francois", "jean@test.fr")
    falsifie = t[:-2] + ("aa" if not t.endswith("aa") else "bb")
    assert U.parse_token(falsifie) is None


def test_unsubscribe_get_token_invalide():
    r = client.get("/public/unsubscribe", params={"token": "bidon"})
    assert r.status_code == 400
    assert "invalide" in r.text.lower()


def test_unsubscribe_get_token_valide():
    t = U.make_token("saint_francois", "personne-inexistante@test.fr")
    r = client.get("/public/unsubscribe", params={"token": t})
    assert r.status_code == 200
    assert "confirm" in r.text.lower()


def test_unsubscribe_post_one_click():
    t = U.make_token("saint_francois", "personne-inexistante@test.fr")
    r = client.post("/public/unsubscribe", params={"token": t})
    assert r.status_code == 200
    assert r.json() == {"ok": True}
