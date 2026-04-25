from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models.user import User
from models.goal import Goal
from schemas.goal import GoalCreate, GoalUpdate, GoalOut, GoalForecast
from utils.auth import get_current_user
from services.goal_service import compute_goal_forecast

router = APIRouter()


@router.get("", response_model=List[GoalOut])
def list_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Goal).filter(Goal.user_id == current_user.id).all()
    return [
    {"id": 1, "user_id": 1, "name": "Holiday Fund",       "target_amount": 3000.0, "current_amount": 1200.0, "deadline": "2026-12-01", "priority": "high",   "is_completed": False, "created_at": "2026-01-01T00:00:00"},
    {"id": 2, "user_id": 1, "name": "Emergency Fund",     "target_amount": 5000.0, "current_amount": 4800.0, "deadline": None,         "priority": "high",   "is_completed": False, "created_at": "2026-01-01T00:00:00"},
    {"id": 3, "user_id": 1, "name": "New Laptop",         "target_amount": 1500.0, "current_amount": 1500.0, "deadline": "2026-04-01", "priority": "medium", "is_completed": True,  "created_at": "2026-01-01T00:00:00"},
    {"id": 4, "user_id": 1, "name": "Car Down Payment",   "target_amount": 8000.0, "current_amount": 950.0,  "deadline": "2027-06-01", "priority": "low",    "is_completed": False, "created_at": "2026-01-01T00:00:00"},
    ]

@router.post("", response_model=GoalOut, status_code=status.HTTP_201_CREATED)
def create_goal(
    payload: GoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = Goal(**payload.model_dump(), user_id=current_user.id)
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


@router.get("/{goal_id}", response_model=GoalOut)
def get_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal


@router.put("/{goal_id}", response_model=GoalOut)
def update_goal(
    goal_id: int,
    payload: GoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(goal, field, value)
    db.commit()
    db.refresh(goal)
    return goal


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(goal)
    db.commit()


@router.get("/{goal_id}/forecast", response_model=GoalForecast)
def get_goal_forecast(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return compute_goal_forecast(db, current_user.id, goal)