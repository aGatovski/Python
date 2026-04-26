from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date

from database import get_db
from models.user import User
from utils.auth import get_current_user
from services import analytics_service

router = APIRouter()


@router.get("/summary/{month}")
def monthly_summary(
    month: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return analytics_service.get_monthly_summary(db, current_user.id, month)


@router.get("/by-category")
def by_category(
    month: Optional[str] = Query(None, description="e.g. 2026-03"),
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return analytics_service.get_expenses_by_category(
        db, current_user.id, month=month, year=year
    )


@router.get("/overview")
def dashboard_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Full dashboard: current month summary + budget status + category breakdown."""
    today = date.today()
    month = f"{today.year}-{today.month:02d}"

    monthly_summary = analytics_service.get_monthly_summary(
        month=month, db=db, user_id=current_user.id
    )
    expenses_by_category = analytics_service.get_expenses_by_category(
        db=db, user_id=current_user.id, month=month
    )

    from services.budget_service import calculate_budget_status

    budget_status = calculate_budget_status(db, current_user.id, month)

    return {
        "month": month,
        "summary": monthly_summary,
        "expenses_by_category": expenses_by_category,
        "budget_status": budget_status,
    }
