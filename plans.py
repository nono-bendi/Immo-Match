from fastapi import HTTPException, status

PLANS: dict[str, dict] = {
    "agence": {
        "plan_id": "agence",
        "plan_name": "Plan Agence",
        "price_eur_month": 49,
        "max_agents": 1,
        "max_biens": 50,
        "max_matchings_mois": 20,
        "max_emails_mois": 20,
        "max_questions_ia_mois": 30,
        "sync_interval_minutes": 360,
        "sync_prioritaire": False,
        "rapport_pdf": False,
        "rapport_excel": False,
        "multi_bureaux": False,
        "max_bureaux": 1,
        "dashboard_multi_agences": False,
        "support_delai_heures": 48,
        "support_type": "email",
        "onboarding_dedie": False,
    },
    "cabinet": {
        "plan_id": "cabinet",
        "plan_name": "Plan Cabinet",
        "price_eur_month": 89,
        "max_agents": 3,
        "max_biens": 200,
        "max_matchings_mois": None,
        "max_emails_mois": 80,
        "max_questions_ia_mois": 200,
        "sync_interval_minutes": 360,
        "sync_prioritaire": False,
        "rapport_pdf": True,
        "rapport_excel": False,
        "multi_bureaux": False,
        "max_bureaux": 1,
        "dashboard_multi_agences": False,
        "support_delai_heures": 24,
        "support_type": "email",
        "onboarding_dedie": False,
    },
    "reseau": {
        "plan_id": "reseau",
        "plan_name": "Plan Réseau",
        "price_eur_month": 179,
        "max_agents": 10,
        "max_biens": None,
        "max_matchings_mois": None,
        "max_emails_mois": None,
        "max_questions_ia_mois": None,
        "sync_interval_minutes": 120,
        "sync_prioritaire": True,
        "rapport_pdf": True,
        "rapport_excel": True,
        "multi_bureaux": True,
        "max_bureaux": 3,
        "dashboard_multi_agences": True,
        "support_delai_heures": 12,
        "support_type": "prioritaire",
        "onboarding_dedie": True,
    },
}


def get_plan(plan_id: str) -> dict:
    return PLANS.get(plan_id) or PLANS["agence"]


def check_quota(agency_plan_id: str, resource: str, current_count: int) -> None:
    """Lève HTTP 429 si le quota mensuel est atteint. None = illimité."""
    plan = PLANS.get(agency_plan_id) or PLANS["agence"]
    limit = plan[resource]
    if limit is not None and current_count >= limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "code": "QUOTA_EXCEEDED",
                "resource": resource,
                "limit": limit,
                "plan": agency_plan_id,
            },
        )


def check_feature(agency_plan_id: str, feature: str) -> None:
    """Lève HTTP 403 si la fonctionnalité n'est pas incluse dans le plan."""
    plan = PLANS.get(agency_plan_id) or PLANS["agence"]
    if not plan.get(feature):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "FEATURE_NOT_IN_PLAN",
                "feature": feature,
                "plan": agency_plan_id,
            },
        )
