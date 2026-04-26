from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class BudgetCreate(BaseModel):
    category: str
    limit: float


class BudgetUpdate(BaseModel):
    limit: Optional[float] = None


class BudgetOut(BaseModel):
    id: int
    user_id: int
    category: str
    limit: float


    model_config = {"from_attributes": True}


class BudgetStatus(BaseModel):
    category: str
    limit: float
    spent: float
    remaining: float
    percent_used: float