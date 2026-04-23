from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import Optional, List
from datetime import date

from database import get_db
from models.user import User
from models.income import Income
from schemas.income import IncomeCreate, IncomeUpdate, IncomeOut, IncomeSummary
from utils.auth import get_current_user

router = APIRouter()


@router.get("", response_model=List[IncomeOut])
def list_income(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Income).filter(Income.user_id == current_user.id).order_by(Income.date.desc()).all()


@router.post("", response_model=IncomeOut, status_code=status.HTTP_201_CREATED)
def create_income(
    payload: IncomeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = Income(**payload.model_dump(), user_id=current_user.id)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/summary", response_model=IncomeSummary)
def income_summary(
    month: Optional[str] = Query(None, description="e.g. 2026-03"),
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = date.today()
    current_year = year or today.year
    current_month_str = month or f"{today.year}-{today.month:02d}"
    yr, mo = int(current_month_str[:4]), int(current_month_str[5:7])

    total_monthly = (
        db.query(func.coalesce(func.sum(Income.amount), 0.0))
        .filter(
            Income.user_id == current_user.id,
            extract("year", Income.date) == yr,
            extract("month", Income.date) == mo,
        )
        .scalar()
    )

    total_yearly = (
        db.query(func.coalesce(func.sum(Income.amount), 0.0))
        .filter(
            Income.user_id == current_user.id,
            extract("year", Income.date) == current_year,
        )
        .scalar()
    )

    rows = (
        db.query(
            extract("year", Income.date).label("yr"),
            extract("month", Income.date).label("mo"),
            func.sum(Income.amount).label("total"),
        )
        .filter(Income.user_id == current_user.id)
        .group_by("yr", "mo")
        .all()
    )
    by_month = {f"{int(r.yr)}-{int(r.mo):02d}": round(float(r.total), 2) for r in rows}

    return IncomeSummary(
        total_monthly=round(float(total_monthly), 2),
        total_yearly=round(float(total_yearly), 2),
        by_month=by_month,
    )


@router.get("/{income_id}", response_model=IncomeOut)
def get_income(
    income_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = db.query(Income).filter(Income.id == income_id, Income.user_id == current_user.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Income entry not found")
    return entry


@router.put("/{income_id}", response_model=IncomeOut)
def update_income(
    income_id: int,
    payload: IncomeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = db.query(Income).filter(Income.id == income_id, Income.user_id == current_user.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Income entry not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(entry, field, value)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{income_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_income(
    income_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = db.query(Income).filter(Income.id == income_id, Income.user_id == current_user.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Income entry not found")
    db.delete(entry)
    db.commit()