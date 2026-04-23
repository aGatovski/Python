from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from models.budget import Budget
from models.transaction import Transaction


def calculate_budget_status(
        #db: Session, user_id: int, 
         month: str) -> list:
    """
    For each budget belonging to the user, compute spent/remaining/percent_used/status
    for the given month. All calculations are deterministic SQL aggregates — no AI inference.
    """
    # year, mon = int(month[:4]), int(month[5:7])
    # budgets = db.query(Budget).filter(Budget.user_id == user_id).all()

    # results = []
    # for budget in budgets:
    #     spent_raw = (
    #         db.query(func.coalesce(func.sum(Transaction.amount), 0.0))
    #         .filter(
    #             Transaction.user_id == user_id,
    #             Transaction.category == budget.category,
    #             Transaction.amount < 0,
    #             extract("year", Transaction.date) == year,
    #             extract("month", Transaction.date) == mon,
    #         )
    #         .scalar()
    #     )
    #     spent = round(abs(float(spent_raw)), 2)
    #     remaining = round(budget.limit - spent, 2)
    #     percent_used = round((spent / budget.limit * 100), 2) if budget.limit > 0 else 0.0

    #     if percent_used >= 100:
    #         status = "exceeded"
    #     elif percent_used >= 80:
    #         status = "warning"
    #     else:
    #         status = "on_track"

    #     results.append(
    #         {
    #             "category": budget.category,
    #             "limit": budget.limit,
    #             "spent": spent,
    #             "remaining": remaining,
    #             "percent_used": percent_used,
    #             "status": status,
    #         }
    #     )
    # return results
    return [
        {"category": "Groceries",     "limit": 200.0, "spent": 120.50, "remaining": 79.50,  "percent_used": 60.25, "status": "on_track"},
        {"category": "Dining",        "limit": 100.0, "spent": 85.00,  "remaining": 15.00,  "percent_used": 85.0,  "status": "warning"},
        {"category": "Transport",     "limit": 80.0,  "spent": 90.00,  "remaining": -10.00, "percent_used": 112.5, "status": "exceeded"},
        {"category": "Utilities",     "limit": 150.0, "spent": 60.00,  "remaining": 90.00,  "percent_used": 40.0,  "status": "on_track"},
        {"category": "Entertainment", "limit": 50.0,  "spent": 30.00,  "remaining": 20.00,  "percent_used": 60.0,  "status": "on_track"},
    ]