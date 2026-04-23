from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from schemas.user import UserOut
from utils.auth import get_current_user

router = APIRouter()

@router.get("/{user_id}", response_model=UserOut)
def get_user_profile(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/{user_id}/shared")
def get_shared_items(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Return budgets and goals that the target user has made public.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    result: dict = {}

    if user.budgets_public:
        from models.budget import Budget
        budgets = db.query(Budget).filter(Budget.user_id == user_id).all()
        result["budgets"] = [{"id": b.id, "category": b.category, "limit": b.limit, "period": b.period} for b in budgets]

    if user.goals_public:
        from models.goal import Goal
        goals = db.query(Goal).filter(Goal.user_id == user_id).all()
        result["goals"] = [
            {"id": g.id, "name": g.name, "target_amount": g.target_amount, "current_amount": g.current_amount}
            for g in goals
        ]

    return result