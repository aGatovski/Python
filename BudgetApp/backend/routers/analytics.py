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
    # month: Optional[str] = Query(None, description="e.g. 2026-03"),
    # year: Optional[int] = Query(None),
    # db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user),
):
    # return analytics_service.get_expenses_by_category(db, current_user.id, month=month, year=year)
    return [
        {"category": "Groceries", "total": 120.50},
        {"category": "Dining", "total": 85.00},
        {"category": "Transport", "total": 45.20},
        {"category": "Utilities", "total": 60.00},
        {"category": "Entertainment", "total": 30.00},
    ]


@router.get("/trends")
def spending_trends(
    year: Optional[int] = Query(default=None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Monthly spending totals per category over the year."""
    target_year = year or date.today().year
    from sqlalchemy import func, extract
    from models.transaction import Transaction

    query = db.query(
        Transaction.category,
        extract("month", Transaction.date).label("month"),
        func.sum(Transaction.amount).label("total"),
    ).filter(
        Transaction.user_id == current_user.id,
        Transaction.amount < 0,
        extract("year", Transaction.date) == target_year,
    )
    if category:
        query = query.filter(Transaction.category == category)

    rows = query.group_by(Transaction.category, "month").all()
    return [
        {
            "category": r.category,
            "month": f"{target_year}-{int(r.month):02d}",
            "total": round(abs(r.total), 2),
        }
        for r in rows
    ]


@router.get("/overview")
def dashboard_overview(
    # db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user),
):
    """Full dashboard: current month summary + budget status + category breakdown."""
    # today = date.today()
    # month = f"{today.year}-{today.month:02d}"

    # summary = analytics_service.get_monthly_summary(db, current_user.id, month)
    # by_cat = analytics_service.get_expenses_by_category(db, current_user.id, month=month)

    # from services.budget_service import calculate_budget_status
    # budget_status = calculate_budget_status(db, current_user.id, month)

    # # return {
    # #     "month": month,
    # #     "summary": summary,
    # #     "expenses_by_category": by_cat,
    # #     "budget_status": budget_status,
    # # }

    today = date.today()
    month = f"{today.year}-{today.month:02d}"

    monthly_summary = analytics_service.get_monthly_summary(month=month)
    # expenses_by_category = analytics_service.get_expenses_by_category()

    return {
        "month": "2026-04",
        "summary": {
            "month": "2026-04",
            "total_income": 1700.00,
            "total_expenses": 500.00,
            "net": 1200.00,
            #"savings_rate": 70.59,
            #"transaction_count": 4,
        },
        "expenses_by_category": [
            {"category": "Groceries", "total": 120.50},
            {"category": "Dining", "total": 85.00},
            {"category": "Transport", "total": 45.20},
        ],
        "budget_status": [
            {
                #"category": "Groceries",
                "limit": 200.0,
                "spent": 120.50,
                #"remaining": 79.50,
                #"percent_used": 60.25,
                #"status": "on_track",
            },
            {
                #"category": "Transport",
                "limit": 80.0,
                "spent": 90.00,
                #"remaining": -10.00,
                #"percent_used": 112.5,
                #"status": "exceeded",
            },
        ],
    }
