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
    