from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    budgets_public: Optional[bool] = None
    goals_public: Optional[bool] = None


class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str]
    bio: Optional[str]
    budgets_public: bool
    goals_public: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"