from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional


class GoalCreate(BaseModel):
    name: str
    target_amount: float
    deadline: Optional[date] = None
    priority: str = "medium"  # "low" | "medium" | "high"


class GoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[float] = None
    current_amount: Optional[float] = None
    deadline: Optional[date] = None
    # priority: Optional[str] = None
    # is_completed: Optional[bool] = None


class GoalOut(BaseModel):
    id: int
    user_id: int
    name: str
    target_amount: float
    current_amount: float
    deadline: Optional[date]
    # priority: str
    # is_completed: bool
    # created_at: datetime

    model_config = {"from_attributes": True}


class GoalForecast(BaseModel):
    goal_id: int
    name: str
    target_amount: float
    current_amount: float
    deadline: Optional[date]
    monthly_savings_needed: float
    projected_completion_date: Optional[date]
    on_track: bool
    shortfall: float