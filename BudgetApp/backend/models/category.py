from datetime import datetime
from typing import Optional
from sqlalchemy import String, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column
from database import Base

class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    # user_id is NULL for default/system categories
    name: Mapped[str] = mapped_column(String)
    #is_default: Mapped[bool] = mapped_column(default=False)
    #created_at: Mapped[datetime] = mapped_column(server_default=func.now())