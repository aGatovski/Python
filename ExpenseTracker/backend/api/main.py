from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
from pathlib import Path

app = FastAPI(title="Budget Tracker API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server runs here
    allow_credentials=True,
    allow_methods=["*"],   # Allow GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],   # Allow all HTTP headers
)

CSV_PATH = Path(__file__).parent.parent / "src" / "expense_tracker" / "TRANSACTION_FILE.csv"

def load_df() -> pd.DataFrame:
    """Read the CSV file and return a clean DataFrame."""
    df = pd.read_csv(
        CSV_PATH,
        header=None,                                        
        names=["date", "category", "description", "amount"]  
    )

    df["amount"] = pd.to_numeric(df["amount"], errors="coerce")
    df["date"] = pd.to_datetime(df["date"]).dt.strftime("%Y-%m-%d")
    df = df.dropna(subset=["amount"])

    return df

class TransactionIn(BaseModel):
    date: str
    description: str
    amount: float
    category: str

@app.get("/api/transactions")
def get_transactions(
    month: str = Query(None, description="Filter by month, e.g. 2026-03"),
    category: str = Query(None, description="Filter by category"),
    search: str = Query(None, description="Search in description")
):
    """Return a list of transactions, with optional filters."""
    
    df = load_df()

    if month:
        df = df[df["date"].str.startswith(month)]
    
    if category:
        df = df[df["category"] == category]
    
    if search:
        df = df[df["description"].str.contains(search, case=False, na=False)]

    return df.to_dict(orient="records")

@app.get("/api/summary/{month}")
def get_summary(month: str):
    """Return income, expenses, and net balance for a given month."""

    df = load_df()
    df_month = df[df["date"].str.startswith(month)]

    if df_month.empty:
        raise HTTPException(status_code=404, detail=f"No data found for month: {month}")

    income   = float(df_month[df_month["amount"] > 0]["amount"].sum())
    expenses = float(df_month[df_month["amount"] < 0]["amount"].abs().sum())

    return {
        "month": month,
        "income": round(income, 2),
        "expenses": round(expenses, 2),
        "net": round(income - expenses, 2),
        "transaction_count": len(df_month)
    }

@app.get("/api/categories")
def get_categories():
    """Return the list of available categories."""
    
    df = load_df()
    categories = sorted(df["category"].dropna().unique().tolist())

    return {"categories" : categories}

@app.post("/api/transactions", status_code=201)
def add_transaction(transaction: TransactionIn):
    """Add a new transaction to the CSV file."""
    # status_code=201 means "Created" — the correct HTTP status for a successful POST
    # that creates a new resource. (200 means "OK" and is used for GET requests.)

    # transaction: TransactionIn tells FastAPI to:
    # 1. Read the JSON body from the request
    # 2. Validate it against the TransactionIn model
    # 3. Pass it as a TransactionIn object to this function
    # If validation fails, FastAPI returns 422 automatically.

    new_line = (
        f"{transaction.date},{transaction.category},"
        f"{transaction.description},{transaction.amount}\n"
    )
    with open(CSV_PATH, "a") as file:
        file.write(new_line)

    return {"message": "Transaction added successfully", "transaction": transaction}