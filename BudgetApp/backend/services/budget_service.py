from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from models.budget import Budget
from models.transaction import Transaction


def calculate_budget_status(db: Session, user_id: int, month: str) -> list:
    """
    For each budget belonging to the user, compute spent/remaining/percent_used/status
    for the given month. All calculations are deterministic SQL aggregates — no AI inference.
    """
    year, mon = int(month[:4]), int(month[5:7])
    budgets = db.query(Budget).filter(Budget.user_id == user_id).all()

    results = []  # [limit: , amount spent: ]
    for budget in budgets:
        spent_raw = (
            db.query(func.coalesce(func.sum(Transaction.amount), 0.0))
            .filter(
                Transaction.user_id == user_id,
                Transaction.category == budget.category,
                Transaction.amount < 0,
                extract("year", Transaction.date) == year,
                extract("month", Transaction.date) == mon,
            )
            .scalar()
        )
        spent = round(abs(float(spent_raw)), 2)
        remaining = round(budget.limit - spent, 2)
        percent_used = (
            round((spent / budget.limit * 100), 2) if budget.limit > 0 else 0.0
        )

        results.append(
            {
                "category": budget.category,
                "limit": budget.limit,
                "spent": spent,
                "remaining": remaining,
                "percent_used": percent_used,
            }
        )

    return results

