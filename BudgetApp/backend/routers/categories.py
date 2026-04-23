from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models.user import User
from models.category import Category
from schemas.category import CategoryCreate, CategoryUpdate, CategoryOut
from utils.auth import get_current_user

router = APIRouter()

DEFAULT_CATEGORIES = [
    "Groceries", "Rent", "Utilities", "Transport", "Dining",
    "Entertainment", "Health", "Clothing", "Education", "Savings",
    "Subscriptions", "Travel", "Insurance", "Other",
]


@router.get("", response_model=List[CategoryOut])
def list_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return default categories plus user-defined ones."""
    return (
        db.query(Category)
        .filter((Category.is_default == True) | (Category.user_id == current_user.id))
        .order_by(Category.is_default.desc(), Category.name)
        .all()
    )


@router.post("", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = (
        db.query(Category)
        .filter(Category.name == payload.name, Category.user_id == current_user.id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")
    cat = Category(name=payload.name, user_id=current_user.id, is_default=False)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.put("/{cat_id}", response_model=CategoryOut)
def rename_category(
    cat_id: int,
    payload: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cat = db.query(Category).filter(Category.id == cat_id, Category.user_id == current_user.id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found or not editable")
    cat.name = payload.name
    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/{cat_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    cat_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cat = db.query(Category).filter(Category.id == cat_id, Category.user_id == current_user.id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found or not deletable")
    db.delete(cat)
    db.commit()