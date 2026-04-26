from sqlalchemy.orm import Session
from models import Category
from typing import List


def get_user_categories(db: Session, user_id: int) -> List[Category]:
    """Get all available categories for a user (defaults + user-defined)."""
    return (
        db.query(Category)
        .filter(Category.user_id == user_id)
        .order_by(Category.name.desc())
        .all()
    )
