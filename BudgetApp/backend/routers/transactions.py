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
    # month: Optional[str] = Query(None, description="e.g. 2026-03"),
    # category: Optional[str] = Query(None),
    # type: Optional[str] = Query(None, description="income or expense"),
    # search: Optional[str] = Query(None),
    # fixed: Optional[bool] = Query(None),
    # db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user),
):
    # query = db.query(Transaction).filter(Transaction.user_id == current_user.id)

    # if month:
    #     yr, mo = int(month[:4]), int(month[5:7])
    #     query = query.filter(
    #         extract("year", Transaction.date) == yr,
    #         extract("month", Transaction.date) == mo,
    #     )
    # if category:
    #     query = query.filter(Transaction.category == category)
    # if type == "income":
    #     query = query.filter(Transaction.amount > 0)
    # elif type == "expense":
    #     query = query.filter(Transaction.amount < 0)
    # if search:
    #     query = query.filter(Transaction.description.ilike(f"%{search}%"))
    # if fixed is not None:
    #     query = query.filter(Transaction.is_fixed == fixed)

    # return query.order_by(Transaction.date.desc()).all()
    return [
    {"id": 1, "user_id": 1, "date": "2026-04-01", "amount": -120.50, "category": "Groceries",     "description": "Supermarket",    "is_fixed": False, "is_recurring": False, "recurring_rule_id": None, "created_at": "2026-04-01T10:00:00"},
    {"id": 2, "user_id": 1, "date": "2026-04-03", "amount": -45.20,  "category": "Transport",     "description": "Monthly pass",   "is_fixed": True,  "is_recurring": True,  "recurring_rule_id": None, "created_at": "2026-04-03T09:00:00"},
    {"id": 3, "user_id": 1, "date": "2026-04-05", "amount": -85.00,  "category": "Dining",        "description": "Restaurant",     "is_fixed": False, "is_recurring": False, "recurring_rule_id": None, "created_at": "2026-04-05T20:00:00"},
    {"id": 4, "user_id": 1, "date": "2026-04-10", "amount": -60.00,  "category": "Utilities",     "description": "Electricity",    "is_fixed": True,  "is_recurring": True,  "recurring_rule_id": None, "created_at": "2026-04-10T08:00:00"},
    {"id": 5, "user_id": 1, "date": "2026-04-15", "amount": -30.00,  "category": "Entertainment", "description": "Netflix + Gym",  "is_fixed": True,  "is_recurring": True,  "recurring_rule_id": None, "created_at": "2026-04-15T12:00:00"},
]

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
            "is_fixed": t.is_fixed,
            "is_recurring": t.is_recurring,
        }
        for t in txs
    ]
    return export_transactions_csv(rows)


@router.post("/import", response_model=List[TransactionOut], status_code=status.HTTP_201_CREATED)
def import_transactions(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = parse_transactions_csv(file)
    created = []
    for row in rows:
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