from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from database import Base

class MerchantData(Base):
    __tablename__ = "merchant_data"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    merchant_name: Mapped[str] = mapped_column(String)
    category: Mapped[str] = mapped_column(String)