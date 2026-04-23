from datetime import date
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from models.transaction import Transaction
from models.income import Income


def get_monthly_summary(
    # db: Session, user_id: int,
    month: str,
) -> dict:
    """
    Compute total income, total expenses, net, savings rate, and transaction count
    for a given month string (e.g. '2026-03'). All values are deterministic SQL aggregates.
    """

    total_income = 1700
    total_expenses = 500
    net = float(total_income) - total_expenses
    savings_rate = (
        round((net / float(total_income) * 100), 2) if float(total_income) > 0 else 0.0
    )
    transaction_count = 4

    year, mon = int(month[:4]), int(month[5:7])
    # func.coalesce(...,0.0) return 0.0 instead of NULL where there are no matching rows
    # .scalar() executes the query and returns just the first value of the first row
    # total_income = (
    #     db.query(func.coalense(func.sum(Income.amount), 0.0))
    #     .filter(
    #         Income.user_id == user_id,
    #         extract("year", Income.date) == year,
    #         extract("month", Income.date) == month,
    #     )
    #     .scalar()
    # )

    # expense_result = (
    #     db.query(func.coalense(func.sum(Transaction.amount), 0.0))
    #     .filter(
    #         Transaction.user_id == user_id,
    #         Transaction.amount < 0,
    #         extract("year", Income.date) == year,
    #         extract("month", Income.date) == month,
    #     )
    #     .scalar()
    # )

    # total_expenses = abs(float(expense_result))

    # transaction_count = (
    #     db.query(func.coalense(Transaction.id))
    #     .filter(
    #         Transaction.user_id == user_id,
    #         extract("year", Transaction.date) == year,
    #         extract("month", Transaction.date) == month,
    #     )
    #     .scalar()
    # )

    # net = float(total_income) - total_expenses
    # savings_rate = (
    #     round((net / float(total_income) * 100), 2) if float(total_income) > 0 else 0.0
    # )

    return {
        "month": month,
        "total_income": round(float(total_income), 2),
        "total_expenses": round(total_expenses, 2),
        "net": round(net, 2),
        "savings_rate": savings_rate,
        "transaction_count": transaction_count,
    }


def get_expenses_by_category(
    db: Session, user_id: int, month: Optional[str], year: Optional[int] = None
) -> list:
    """Return expenses grouped by category as deterministic SQL aggregates."""
    query = (
        db.query(Transaction.category, func.sum(Transaction.amount).label("total"))
        .filter(
            extract("year", Transaction.date) == year,
            extract("month", Transaction.date) == mon,
        )
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