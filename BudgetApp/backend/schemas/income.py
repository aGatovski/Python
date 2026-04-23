from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional


class IncomeCreate(BaseModel):
    date: date
    amount: float
    source: str
    description: Optional[str] = None
    is_recurring: bool = False


class IncomeUpdate(BaseModel):
    date: Optional[date] = None
    amount: Optional[float] = None
    source: Optional[str] = None
    description: Optional[str] = None
    is_recurring: Optional[bool] = None


class IncomeOut(BaseModel):
    id: int
    user_id: int
    date: date
    amount: float
    source: str
    description: Optional[str]
    is_recurring: bool
    recurring_rule_id: Optional[int]
    created_at: datetime

    model_config = {"from_attributes": True}


class IncomeSummary(BaseModel):
    total_monthly: float
    total_yearly: float
    by_month: dict[str, float]