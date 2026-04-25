from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from sqlalchemy import extract
from typing import Optional, List

from database import get_db
from models.user import User
from models.transaction import Transaction
from schemas.transaction import TransactionCreate, TransactionUpdate, TransactionOut
from utils.auth import get_current_user
from utils.csv_handler import parse_transactions_csv, export_transactions_csv

router = APIRouter()


@router.get("", response_model=List[TransactionOut])
def list_transactions(
    month: Optional[str] = Query(None, description="e.g. 2026-03"),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)

    if month:
        yr, mo = int(month[:4]), int(month[5:7])
        query = query.filter(
            extract("year", Transaction.date) == yr,
            extract("month", Transaction.date) == mo,
        )
    if category:
        query = query.filter(Transaction.category == category)
    if search:
        query = query.filter(Transaction.description.ilike(f"%{search}%"))

    query = query.order_by(Transaction.date.desc())

    if limit:
        query = query.limit(limit)

    return query.all()

# response_model converts the return(tx) to schema TransactionOut JSON
@router.post("", response_model=TransactionOut, status_code=status.HTTP_201_CREATED)
def create_transaction(
    payload: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tx = Transaction(**payload.model_dump(), user_id=current_user.id)
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


@router.get("/export", response_class=PlainTextResponse)
def export_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    txs = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
    rows = [
        {
            "id": t.id,
            "date": str(t.date),
            "amount": t.amount,
            "category": t.category,
            "description": t.description,
        }
        for t in txs
    ]
    return export_transactions_csv(rows)


@router.post("/import", response_model=List[TransactionOut], status_code=status.HTTP_201_CREATED)
async def import_transactions(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = await parse_transactions_csv(file, db)
    created = []

    for row in rows:
        # Check if transaction already exists (duplicate detection)
        # Use date, amount, description, and category as duplicate key
        existing = db.query(Transaction).filter(
            Transaction.user_id == current_user.id,
            Transaction.date == row["date"],
            Transaction.amount == row["amount"],
            Transaction.description == row["description"],
            Transaction.category == row["category"],
        ).first()

        if existing:
            # Skip duplicate transaction
            continue

        tx = Transaction(**row, user_id=current_user.id)
        db.add(tx)
        created.append(tx)

    db.commit()
    for tx in created:
        db.refresh(tx)
    return created


@router.get("/{tx_id}", response_model=TransactionOut)
def get_transaction(
    tx_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tx = db.query(Transaction).filter(Transaction.id == tx_id, Transaction.user_id == current_user.id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return tx


@router.put("/{tx_id}", response_model=TransactionOut)
def update_transaction(
    tx_id: int,
    payload: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tx = db.query(Transaction).filter(Transaction.id == tx_id, Transaction.user_id == current_user.id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(tx, field, value)
    db.commit()
    db.refresh(tx)
    return tx


@router.delete("/{tx_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    tx_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tx = db.query(Transaction).filter(Transaction.id == tx_id, Transaction.user_id == current_user.id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(tx)
    db.commit()