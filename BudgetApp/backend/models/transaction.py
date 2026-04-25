import datetime
from typing import Optional
from sqlalchemy import String, ForeignKey, func, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    date: Mapped[datetime.date] = mapped_column()
    amount: Mapped[float] = mapped_column()  # negative = expense, positive = income
    category: Mapped[str] = mapped_column(String)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)

