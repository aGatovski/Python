from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional


class TransactionCreate(BaseModel):
    date: date
    amount: float
    category: str
    description: Optional[str] = None


class TransactionUpdate(BaseModel):
    date: Optional[date] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    description: Optional[str] = None


class TransactionOut(BaseModel):
    id: int
    user_id: int
    date: date
    amount: float
    category: str
    description: Optional[str]

    model_config = {"from_attributes": True}