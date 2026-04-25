from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List
from datetime import date

from database import get_db
from models.user import User
from models.budget import Budget
from schemas.budget import BudgetCreate, BudgetUpdate, BudgetOut, BudgetStatus
from utils.auth import get_current_user
from services.budget_service import calculate_budget_status

router = APIRouter()


@router.get("", response_model=List[BudgetOut])
def list_budgets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Budget).filter(Budget.user_id == current_user.id).all()


@router.post("", response_model=BudgetOut, status_code=status.HTTP_201_CREATED)
def create_budget(
    payload: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.category == payload.category,
        #Budget.period == payload.period,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Budget for this category already exists")
    budget = Budget(**payload.model_dump(), user_id=current_user.id)
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget


@router.get("/status", response_model=List[BudgetStatus])
def get_budget_status(
    month: str = Query(default=None, description="e.g. 2026-03"),
    #db: Session = Depends(get_db),
    #current_user: User = Depends(get_current_user),
):
    today = date.today()
    target_month = month or f"{today.year}-{today.month:02d}"
    return calculate_budget_status(
        #db, current_user.id, 
        target_month)


@router.get("/{budget_id}", response_model=BudgetOut)
def get_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == current_user.id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    return budget


@router.put("/{budget_id}", response_model=BudgetOut)
def update_budget(
    budget_id: int,
    payload: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == current_user.id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(budget, field, value)
    db.commit()
    db.refresh(budget)
    return budget


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == current_user.id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    db.delete(budget)
    db.commit()