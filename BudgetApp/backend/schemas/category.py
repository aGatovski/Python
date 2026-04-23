from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class CategoryCreate(BaseModel):
    name: str


class CategoryUpdate(BaseModel):
    name: str


class CategoryOut(BaseModel):
    id: int
    user_id: Optional[int]
    name: str
    is_default: bool
    created_at: datetime

    model_config = {"from_attributes": True}