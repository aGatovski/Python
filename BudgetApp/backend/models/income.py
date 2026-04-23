import datetime
from typing import Optional
from sqlalchemy import String, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column
from database import Base

class Income(Base):
    __tablename__ = "income"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    date: Mapped[datetime.date] = mapped_column()
    amount: Mapped[float] = mapped_column()
    source: Mapped[str] = mapped_column(String)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    #is_recurring: Mapped[bool] = mapped_column(default=False)
    #recurring_rule_id: Mapped[Optional[int]] = mapped_column(ForeignKey("recurring_rules.id", ondelete="SET NULL"), nullable=True)
    #created_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now())
    #updated_at: Mapped[Optional[datetime.datetime]] = mapped_column(nullable=True, onupdate=func.now())
