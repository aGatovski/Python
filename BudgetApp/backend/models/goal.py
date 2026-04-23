from datetime import date, datetime
from typing import Optional
from sqlalchemy import String, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column
from database import Base

class Goal(Base):
    __tablename__ = "goals"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String)
    target_amount: Mapped[float] = mapped_column()
    current_amount: Mapped[float] = mapped_column(default=0.0)
    deadline: Mapped[Optional[date]] = mapped_column(nullable=True)
    priority: Mapped[str] = mapped_column(String, default="medium")  # "low" | "medium" | "high"
    # is_completed: Mapped[bool] = mapped_column(default=False)
    # created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    # updated_at: Mapped[Optional[datetime]] = mapped_column(nullable=True, onupdate=func.now())