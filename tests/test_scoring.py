"""
Tests du scoring objectif Python — sans appel Claude
"""
import pytest
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from scoring import calculer_score_objectif, trier_biens_par_score_objectif


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


def test_budget_nettement_sous_budget_moins_bien_note_que_proche_budget():
    """Un bien à 60% du budget ne doit plus scorer identique à un bien à 99%."""
    score_bas, detail_bas = calculer_score_objectif(
        prospect_base(budget_max=275000),
        bien_base(prix=165000)  # ratio 0.60
    )
    score_proche, detail_proche = calculer_score_objectif(
        prospect_base(budget_max=275000),
        bien_base(prix=274300)  # ratio 0.997
    )
    assert detail_bas["budget"]["points"] < detail_proche["budget"]["points"]


def test_budget_tres_en_dessous_score_plancher():
    score, detail = calculer_score_objectif(
        prospect_base(budget_max=275000),
        bien_base(prix=94900)  # ratio 0.345, sous le plancher 50%
    )
    assert detail["budget"]["points"] == 15


def test_budget_proche_du_max_reste_quasi_maximal():
    """Un bien à 99% du budget doit rester tout en haut de l'échelle, comme avant ce fix."""
    score, detail = calculer_score_objectif(
        prospect_base(budget_max=275000),
        bien_base(prix=274300)  # ratio 0.997
    )
    assert detail["budget"]["points"] >= 24


def test_budget_non_renseigne():
    score, detail = calculer_score_objectif(
        prospect_base(budget_max=None),
        bien_base()
    )
    assert detail["budget"]["points"] == 8  # Score neutre bas (profil incomplet)


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
    assert detail["type"]["points"] == 8  # Score neutre bas (profil incomplet)


def test_type_code_pieces_implique_appartement():
    """'T3' seul doit être reconnu comme une recherche d'appartement."""
    score, detail = calculer_score_objectif(
        prospect_base(bien="T3"),
        bien_base(type="Appartement")
    )
    assert detail["type"]["points"] == 20


def test_type_code_pieces_multi_implique_appartement():
    """'T3, T2' (multi-types) doit aussi matcher un appartement."""
    score, detail = calculer_score_objectif(
        prospect_base(bien="T3, T2"),
        bien_base(type="Appartement")
    )
    assert detail["type"]["points"] == 20


def test_type_code_pieces_ne_matche_pas_maison():
    """'T3' ne doit pas donner un bon score de type face à une maison."""
    score, detail = calculer_score_objectif(
        prospect_base(bien="T3"),
        bien_base(type="Maison/villa")
    )
    assert detail["type"]["points"] == 0


# ── Tests pièces ──────────────────────────────────────────────────────────────

def test_pieces_suffisantes():
    score, detail = calculer_score_objectif(
        prospect_base(criteres="Pièces min: 2"),
        bien_base(pieces=3)
    )
    assert detail["pieces"]["points"] == 0


def test_pieces_insuffisantes():
    """Un studio (1 pièce) doit être pénalisé si le prospect exige 2 pièces min."""
    score, detail = calculer_score_objectif(
        prospect_base(criteres="Pièces min: 2"),
        bien_base(pieces=1)
    )
    assert detail["pieces"]["points"] == -8


def test_pieces_non_exigees():
    score, detail = calculer_score_objectif(
        prospect_base(criteres=""),
        bien_base(pieces=1)
    )
    assert detail["pieces"]["points"] == 0


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


# ── Tests départage à score objectif égal ──────────────────────────────────────

def test_tiebreak_prefere_le_bien_le_plus_proche_du_budget():
    """
    Deux biens identiques à part le prix, tous deux dans la même tranche de score
    budget (>=90% du budget) : ils sont à égalité parfaite sur calculer_score_objectif.
    trier_biens_par_score_objectif doit départager en faveur du plus proche du budget,
    pas laisser l'ordre de la liste décider arbitrairement.
    """
    prospect = prospect_base(budget_max=275000)
    bien_loin = bien_base(prix=261000)   # ratio 0.949
    bien_proche = bien_base(prix=274300)  # ratio 0.997

    # Vérifie d'abord qu'ils sont bien à égalité sans le départage
    s1, _ = calculer_score_objectif(prospect, bien_loin)
    s2, _ = calculer_score_objectif(prospect, bien_proche)
    assert s1 == s2

    top1 = trier_biens_par_score_objectif(prospect, [bien_loin, bien_proche], 1)
    assert top1[0]["prix"] == 274300

    # Résultat inchangé si les biens sont fournis dans l'ordre inverse
    top1_inverse = trier_biens_par_score_objectif(prospect, [bien_proche, bien_loin], 1)
    assert top1_inverse[0]["prix"] == 274300
