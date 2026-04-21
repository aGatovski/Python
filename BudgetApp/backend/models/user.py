from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, func
from sqlalchemy.orm import Mapped, mapped_column
from ..database import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(nullable=True) 
    is_active: Mapped[bool] = mapped_column(default=True)
    budgets_public: Mapped[bool] = mapped_column(default=False)
    goals_public: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(default=func.now(), server_default=func.now())
    updated_at: Mapped[Optional[datetime]] = mapped_column(nullable=True, onupdate=func.now())