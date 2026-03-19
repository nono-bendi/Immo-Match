"""
Tests du scoring objectif Python — sans appel Claude
"""
import pytest
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from scoring import calculer_score_objectif


# ── Fixtures ──────────────────────────────────────────────────────────────────

def prospect_base(**kwargs):
    base = {
        "budget_max": 200000,
        "bien": "Appartement",
        "villes": "Fréjus",
        "criteres": "",
        "etat": "",
        "expo": "",
        "stationnement": "",
        "exterieur": "",
        "etage": "",
    }
    base.update(kwargs)
    return base


def bien_base(**kwargs):
    base = {
        "prix": 190000,
        "type": "Appartement",
        "ville": "Fréjus",
        "surface": 60,
        "pieces": 3,
        "etat": "",
        "exposition": "",
        "stationnement": "",
        "exterieur": "",
        "etage": None,
        "description": "Bel appartement en centre-ville.",
        "dpe_lettre": "C",
    }
    base.update(kwargs)
    return bien_base_dict(base)


def bien_base_dict(d):
    return d


# ── Tests budget ──────────────────────────────────────────────────────────────

def test_budget_dans_budget():
    score, detail = calculer_score_objectif(prospect_base(), bien_base())
    assert detail["budget"]["points"] == 25


def test_budget_depasse_10_pct():
    score, detail = calculer_score_objectif(
        prospect_base(budget_max=200000),
        bien_base(prix=215000)
    )
    assert detail["budget"]["points"] == 18


def test_budget_depasse_20_pct():
    score, detail = calculer_score_objectif(
        prospect_base(budget_max=200000),
        bien_base(prix=235000)  # 17.5% → seuil 10-20%
    )
    assert detail["budget"]["points"] == 10


def test_budget_hors_budget():
    score, detail = calculer_score_objectif(
        prospect_base(budget_max=200000),
        bien_base(prix=300000)
    )
    assert detail["budget"]["points"] == 0


def test_budget_non_renseigne():
    score, detail = calculer_score_objectif(
        prospect_base(budget_max=None),
        bien_base()
    )
    assert detail["budget"]["points"] == 15  # Score neutre


# ── Tests type de bien ────────────────────────────────────────────────────────

def test_type_exact():
    score, detail = calculer_score_objectif(
        prospect_base(bien="Appartement"),
        bien_base(type="Appartement")
    )
    assert detail["type"]["points"] == 20


def test_type_incompatible():
    score, detail = calculer_score_objectif(
        prospect_base(bien="Maison"),
        bien_base(type="Appartement")
    )
    assert detail["type"]["points"] == 0


def test_type_non_renseigne():
    score, detail = calculer_score_objectif(
        prospect_base(bien=""),
        bien_base(type="Appartement")
    )
    assert detail["type"]["points"] == 15  # Score neutre


# ── Tests ville ───────────────────────────────────────────────────────────────

def test_ville_exacte():
    score, detail = calculer_score_objectif(
        prospect_base(villes="Fréjus"),
        bien_base(ville="Fréjus")
    )
    assert detail["ville"]["points"] == 15


def test_ville_differente():
    score, detail = calculer_score_objectif(
        prospect_base(villes="Fréjus"),
        bien_base(ville="Nice")
    )
    assert detail["ville"]["points"] == 0


def test_tout_secteur():
    score, detail = calculer_score_objectif(
        prospect_base(villes="Tout secteur"),
        bien_base(ville="Nice")
    )
    assert detail["ville"]["points"] > 0  # Pas pénalisé


# ── Tests score global ────────────────────────────────────────────────────────

def test_score_parfait_dans_les_60():
    """Un matching idéal doit scorer haut sur les 60 pts objectifs"""
    score, _ = calculer_score_objectif(prospect_base(), bien_base())
    assert score >= 40  # Au moins 40/60 sur un bon match


def test_score_mauvais_match():
    """Un mauvais match doit scorer bas"""
    score, _ = calculer_score_objectif(
        prospect_base(budget_max=150000, bien="Maison", villes="Paris"),
        bien_base(prix=400000, type="Appartement", ville="Fréjus")
    )
    assert score <= 20
