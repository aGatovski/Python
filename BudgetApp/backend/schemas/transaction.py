from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional


class TransactionCreate(BaseModel):
    date: date
    amount: float
    category: str
    description: Optional[str] = None
    is_fixed: bool = False
    is_recurring: bool = False


class TransactionUpdate(BaseModel):
    date: Optional[date] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    description: Optional[str] = None
    # is_fixed: Optional[bool] = None
    # is_recurring: Optional[bool] = None


class TransactionOut(BaseModel):
    id: int
    user_id: int
    date: date
    amount: float
    category: str
    description: Optional[str]
    # is_fixed: bool
    # is_recurring: bool
    # recurring_rule_id: Optional[int]
    # created_at: datetime

    model_config = {"from_attributes": True}