from datetime import date
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from models.transaction import Transaction

#OK
def get_monthly_summary(
    db: Session, user_id: int,
    month: str,
) -> dict:
    """
    Compute total income, total expenses, net, savings rate, and transaction count
    for a given month string (e.g. '2026-03'). All values are deterministic SQL aggregates.
    """
    year, mon = int(month[:4]), int(month[5:7])

    total_income = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0.0))
        .filter(
            Transaction.user_id == user_id,
            Transaction.amount > 0,
            extract("year", Transaction.date) == year,
            extract("month", Transaction.date) == mon,
        )
        .scalar()
    )

    expense_result = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0.0))
        .filter(
            Transaction.user_id == user_id,
            Transaction.amount < 0,
            extract("year", Transaction.date) == year,
            extract("month", Transaction.date) == mon,
        )
        .scalar()
    )

    total_expenses = abs(float(expense_result))
   
    net = float(total_income) - total_expenses

    savings_rate = (
        round((net / float(total_income) * 100), 2) if float(total_income) > 0 else 0.0
    )

    return {
        "month": month,
        "total_income": round(float(total_income), 2),
        "total_expenses": round(total_expenses, 2),
        "net": round(net, 2),
        "savings_rate": savings_rate,
    }


#OK
def get_expenses_by_category(
    db: Session, user_id: int, month: Optional[str], year: Optional[int] = None
) -> list:
    """Return expenses grouped by category as deterministic SQL aggregates."""
    query = (
        db.query(Transaction.category, func.sum(Transaction.amount).label("total"))
        .filter(Transaction.user_id == user_id, Transaction.amount < 0)
    )

    if month:
        yr, mo = int(month[:4]), int(month[5:7])
        query = query.filter(
            extract("year", Transaction.date) == yr,
            extract("month", Transaction.date) == mo,
        )
    elif year:
        query = query.filter(extract("year", Transaction.date) == yr)

    rows = query.group_by(Transaction.category).all()

    return [
        {"category": row.category, "total": round(abs(row.total), 2)} for row in rows
    ]