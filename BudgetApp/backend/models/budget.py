from datetime import datetime
from typing import Optional
from sqlalchemy import String, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column
from database import Base

class Budget(Base):
    __tablename__ = "budgets"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    category: Mapped[str] = mapped_column(String)
    limit: Mapped[float] = mapped_column()
    period: Mapped[str] = mapped_column(String, default="monthly")  # "monthly" | "yearly"
    #created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    #updated_at: Mapped[Optional[datetime]] = mapped_column(nullable=True, onupdate=func.now())