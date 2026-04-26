from datetime import date
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from models.goal import Goal
from models.transaction import Transaction


def compute_goal_forecast(db: Session, user_id: int, goal: Goal) -> dict:
    """
    Forecast goal success/shortfall based on the user's average monthly net savings.
    All values are computed deterministically — no AI inference.
    """
    # Average monthly net savings over the last 3 months
    today = date.today()
    monthly_nets = []
    for offset in range(1, 4):
        mo = today.month - offset
        yr = today.year
        if mo <= 0:
            mo += 12
            yr -= 1

        income = (
            db.query(func.coalesce(func.sum(Transaction.amount), 0.0))
            .filter(
                Transaction.user_id == user_id,
                extract("year", Transaction.date) == yr,
                extract("month", Transaction.date) == mo,
            )
            .scalar()
        )
        expenses = (
            db.query(func.coalesce(func.sum(Transaction.amount), 0.0))
            .filter(
                Transaction.user_id == user_id,
                Transaction.amount < 0,
                extract("year", Transaction.date) == yr,
                extract("month", Transaction.date) == mo,
            )
            .scalar()
        )
        monthly_nets.append(float(income) + float(expenses))  # expenses are negative

    avg_monthly_savings = sum(monthly_nets) / len(monthly_nets) if monthly_nets else 0.0
    remaining = goal.target_amount - goal.current_amount

    if avg_monthly_savings > 0 and remaining > 0:
        months_needed = remaining / avg_monthly_savings
        from dateutil.relativedelta import relativedelta
        projected_date = today + relativedelta(months=int(months_needed) + 1)
    else:
        projected_date = None

    on_track = False
    shortfall = 0.0
    if goal.deadline:
        months_left = (
            (goal.deadline.year - today.year) * 12 + (goal.deadline.month - today.month)
        )
        needed_per_month = remaining / months_left if months_left > 0 else remaining
        on_track = avg_monthly_savings >= needed_per_month
        shortfall = round(max(0.0, needed_per_month - avg_monthly_savings), 2)

    return {
        "goal_id": goal.id,
        "name": goal.name,
        "target_amount": goal.target_amount,
        "current_amount": goal.current_amount,
        "deadline": goal.deadline,
        "monthly_savings_needed": round(max(0.0, remaining / max(1, (
            (goal.deadline.year - today.year) * 12 + (goal.deadline.month - today.month)
        ))) if goal.deadline else 0.0, 2),
        "projected_completion_date": projected_date,
        "on_track": on_track,
        "shortfall": shortfall,
    }

def goal_summary(db: Session, user_id: int) -> dict:
    goals = db.query(Goal).filter(Goal.id == user_id).all()

    results = []
    for goal in goals:
        goal_name = goal.name
        current_amount = goal.current_amount
        target_amount = goal.target_amount
        deadline = goal.deadline if goal.deadline is not None else "No deadline"

        results.append({
            "name": goal_name,
            "current_amount": current_amount,
            "target_amount": target_amount,
            "deadline": deadline,
        })

    return results
        