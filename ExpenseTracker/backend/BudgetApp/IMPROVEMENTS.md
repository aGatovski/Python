# Expense Tracker — Full Improvement Guide

> **How to use this document**
> Work through the sections in order. Each section is self-contained and builds on the previous one.
> Priority labels: 🔴 Critical (bugs) → 🟠 Must-Have → 🟡 High Value → 🟢 Nice to Have / AI / Frontend

---

## Table of Contents

1. [Current State Summary](#1-current-state-summary)
2. [Bugs to Fix First (🔴 Critical)](#2-bugs-to-fix-first)
3. [Must-Have Features Missing (🟠)](#3-must-have-features-missing)
4. [Code Quality & Architecture Improvements (🟠)](#4-code-quality--architecture-improvements)
5. [AI / Smart Features (🟡)](#5-ai--smart-features)
6. [Frontend Improvements (🟡)](#6-frontend-improvements)
7. [Step-by-Step Implementation Roadmap](#7-step-by-step-implementation-roadmap)
8. [Recommended Tech Stack](#8-recommended-tech-stack)

---

## 1. Current State Summary

### What exists today

| File | What it does |
|---|---|
| `transaction.py` | `Transaction` class — validation, 6 hardcoded categories, brittle merchant→category mapping |
| `expense_tracker.py` | CLI loop — accepts file or single transaction, appends to CSV, shows pie+bar chart |
| `TRANSACTION_FILE.csv` | Flat CSV, no header, format: `date,category,description,amount` |

### What works well
- Basic CSV import from bank exports (auto-detects column names)
- Matplotlib pie + bar chart for category breakdown
- Regex validation for date and amount
- `pd.to_datetime()` handles various date formats from bank files

### What is broken or incomplete
See Section 2 below.

---

## 2. Bugs to Fix First


### Bug 4 — `TRANSACTION_FILE` path is inconsistent


## 3. Must-Have Features Missing

These are features that every serious expense tracker needs. Without them the app is a toy.

---

### 3.1 Monthly Budget Limits per Category

**What it is:** Set a spending cap per category per month (e.g. Groceries: 300 BGN/month).
**Why it matters:** The core value of a budget app is telling you when you are overspending.

**Implementation sketch:**

```python
# budgets.json
{
  "Groceries": 300,
  "Gas": 100,
  "Transport": 80,
  "Entertainment": 50,
  "Sport": 40,
  "Other": 200
}
```

```python
def check_budget_status(df, budgets: dict, month: str):
    """
    month: "2026-03"
    Returns a dict: {category: {"spent": X, "budget": Y, "remaining": Z, "over": bool}}
    """
    monthly = df[df["date"].str.startswith(month) & (df["amount"] < 0)].copy()
    monthly["abs_amount"] = monthly["amount"].abs()
    spent = monthly.groupby("category")["abs_amount"].sum()

    status = {}
    for cat, limit in budgets.items():
        s = spent.get(cat, 0)
        status[cat] = {
            "spent": round(s, 2),
            "budget": limit,
            "remaining": round(limit - s, 2),
            "over": s > limit
        }
    return status
```

**CLI output example:**
```
=== Budget Status — March 2026 ===
Groceries    : 187.45 / 300.00  ✅  (112.55 remaining)
Gas          : 16.16  / 100.00  ✅  (83.84 remaining)
Transport    : 19.93  / 80.00   ✅  (60.07 remaining)
Entertainment: 9.00   / 50.00   ✅  (41.00 remaining)
Sport        : 5.00   / 40.00   ✅  (35.00 remaining)
Other        : 312.00 / 200.00  🔴  OVER BUDGET by 112.00
```

---

### 3.2 Income vs. Expense Separation + Net Balance

**What it is:** Clearly separate money coming in (income) from money going out (expenses).
Show net balance = total income − total expenses.

**Why it matters:** Right now `summarize_expenses()` silently ignores all positive amounts.
You cannot see your net position.

```python
def summarize_full(df, month=None):
    if month:
        df = df[df["date"].str.startswith(month)]

    income = df[df["amount"] > 0]["amount"].sum()
    expenses = df[df["amount"] < 0]["amount"].abs().sum()
    net = income - expenses

    print(f"Income  : +{income:.2f}")
    print(f"Expenses: -{expenses:.2f}")
    print(f"Net     :  {net:+.2f}  {'✅' if net >= 0 else '🔴'}")
```

---

### 3.3 Date Range Filtering

**What it is:** Filter the summary to a specific month, quarter, or custom date range.

```python
# CLI usage examples:
# python expense_tracker.py --month 2026-03
# python expense_tracker.py --from 2026-01-01 --to 2026-03-31
```

**Implementation:** Use `argparse` to accept `--month`, `--from`, `--to` flags.

```python
import argparse

parser = argparse.ArgumentParser()
parser.add_argument("--month", help="Filter by month, e.g. 2026-03")
parser.add_argument("--from", dest="date_from", help="Start date YYYY-MM-DD")
parser.add_argument("--to", dest="date_to", help="End date YYYY-MM-DD")
args = parser.parse_args()
```

---

### 3.4 View / Edit / Delete Transactions

**What it is:** The ability to list all transactions, correct a wrong category, or remove a duplicate.

**Why it matters:** Currently there is no way to fix a mistake without manually editing the CSV.

**Minimum viable CLI commands to add:**

| Command | What it does |
|---|---|
| `list` | Print all transactions (paginated) |
| `search <keyword>` | Filter by description keyword |
| `edit <row_id>` | Change category/amount/date of a row |
| `delete <row_id>` | Remove a row |

**Implementation note:** To support row IDs, the CSV needs a header and an `id` column, OR you switch to SQLite (recommended — see Section 4).

---

### 3.5 Duplicate Transaction Detection

**What it is:** When importing a bank CSV, detect rows that are already in the database.

**Why it matters:** If you import the same bank export twice, you get doubled data.

```python
def is_duplicate(existing_df, new_transaction):
    """
    A transaction is a duplicate if date + description + amount all match.
    """
    mask = (
        (existing_df["date"] == new_transaction.date) &
        (existing_df["description"] == new_transaction.description) &
        (existing_df["amount"].astype(str) == str(new_transaction.amount))
    )
    return mask.any()
```

---

### 3.6 Recurring Transactions

**What it is:** Mark a transaction as recurring (e.g. monthly gym fee, rent, subscription).
The app can then remind you or auto-create it each period.

**Data model addition:**

```
date, category, description, amount, is_recurring, recurrence_period
2026-01-09, Sport, athletics-bg, -2.80, True, monthly
```

---

### 3.7 Data Export

**What it is:** Export a filtered summary to Excel or PDF for sharing/archiving.

```python
# Excel export (requires openpyxl)
df.to_excel("report_march_2026.xlsx", index=False)

# PDF export (requires reportlab or weasyprint)
# Easiest: generate HTML then convert with weasyprint
```

---

### 3.8 Multi-Currency Support

**What it is:** Store the currency alongside the amount. Convert to a base currency for summaries.

**Why it matters:** The existing data already has BGN→EUR exchange adjustments, meaning the user
operates in multiple currencies.

```python
# Transaction model addition
self.currency = currency  # "BGN", "EUR", "USD"
self.amount_base = convert_to_base(amount, currency)  # always in BGN for display
```

Use `forex-python` or a free exchange rate API (e.g. `exchangerate.host`) for conversion.

---

### 3.9 Category Management (Add / Rename / Delete)

**What it is:** Let the user add custom categories without editing source code.

**Why it matters:** The current 6 categories are hardcoded. "Velion 22 Ood" (a coffee shop appearing
30+ times in the data) is stuck in "Other" with no way to create a "Coffee" category.

```python
# categories.json — user-editable
{
  "categories": ["Groceries", "Gas", "Transport", "Entertainment", "Sport", "Coffee", "Health", "Other"],
  "merchant_map": {
    "velion 22 ood": "Coffee",
    "dandi 2 ood": "Coffee",
    "propolis": "Health",
    "ulen ski": "Entertainment"
  }
}
```

---

### 3.10 Monthly Trend Report

**What it is:** Show how spending per category changes month over month.

```
Category     | Jan 2026 | Feb 2026 | Mar 2026 | Trend
-------------|----------|----------|----------|-------
Groceries    |  148.00  |   52.00  |  101.00  |  ↑
Transport    |   19.93  |    0.00  |    0.00  |  ↓
Other        |  512.00  |  248.00  |  289.00  |  ↑
```

---

## 4. Code Quality & Architecture Improvements

### 4.1 Switch from CSV to SQLite

**Why:** CSV has no schema, no indexing, no transactions, no deduplication support.
SQLite is a single file, zero-config, and supports full SQL queries.

```python
# schema.sql
CREATE TABLE IF NOT EXISTS transactions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    date        TEXT NOT NULL,
    category    TEXT NOT NULL,
    description TEXT NOT NULL,
    amount      REAL NOT NULL,
    currency    TEXT DEFAULT 'BGN',
    is_recurring INTEGER DEFAULT 0,
    created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS budgets (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    month    TEXT NOT NULL,   -- "2026-03" or "default"
    limit    REAL NOT NULL
);
```

**Migration path:**
1. Write a one-time `migrate_csv_to_sqlite.py` script
2. Read existing `TRANSACTION_FILE.csv`
3. Insert all rows into the new SQLite DB
4. Update `expense_tracker.py` to use SQLite going forward

---

### 4.2 Proper Project Structure

```
BudgetApp/
├── main.py                  # entry point
├── config.json              # categories, budgets, currency, DB path
├── db/
│   ├── database.py          # SQLite connection + helpers
│   └── schema.sql
├── models/
│   └── transaction.py       # Transaction dataclass
├── services/
│   ├── importer.py          # CSV import logic
│   ├── categorizer.py       # rule-based + ML categorization
│   ├── reporter.py          # summaries, charts, exports
│   └── budget.py            # budget tracking logic
├── cli/
│   └── commands.py          # argparse CLI commands
├── tests/
│   ├── test_transaction.py
│   ├── test_categorizer.py
│   └── test_reporter.py
└── requirements.txt
```

---

### 4.3 Replace `print()` with `logging`

```python
import logging
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

# Instead of print("File exists")
logger.info("File loaded: %s (%d transactions)", file_path, len(transactions_list))
```

---

### 4.4 Use a `dataclass` for Transaction

```python
from dataclasses import dataclass, field
from datetime import date

@dataclass
class Transaction:
    date: str
    description: str
    amount: float
    category: str = field(default="Other")
    currency: str = field(default="BGN")
    is_recurring: bool = field(default=False)
```

---

### 4.5 Add Unit Tests

Minimum test coverage needed:

```python
# tests/test_transaction.py
def test_valid_transaction():
    t = Transaction(date="2026-03-01", description="Lidl", amount="-12.50")
    assert t.category == "Groceries"

def test_invalid_date_raises():
    with pytest.raises(ValueError):
        Transaction(date="01-03-2026", description="Lidl", amount="-12.50")

def test_duplicate_detection():
    ...

def test_budget_over_limit():
    ...
```

---

### 4.6 Config File Instead of Hardcoded Values

```json
// config.json
{
  "db_path": "budget.db",
  "base_currency": "BGN",
  "categories": ["Groceries", "Gas", "Transport", "Entertainment", "Sport", "Coffee", "Health", "Other"],
  "default_budgets": {
    "Groceries": 300,
    "Gas": 100,
    "Transport": 80,
    "Entertainment": 50,
    "Sport": 40,
    "Coffee": 60,
    "Health": 80,
    "Other": 200
  },
  "merchant_map": {
    "lidl": "Groceries",
    "kaufland": "Groceries",
    "billa": "Groceries",
    "fantastico": "Groceries",
    "food zone eood": "Groceries",
    "32 market food": "Groceries",
    "best market limited": "Groceries",
    "lukoil": "Gas",
    "lukoil bulgaria": "Gas",
    "bolt": "Transport",
    "cine grand ring mall": "Entertainment",
    "athletics-bg": "Sport",
    "velion 22 ood": "Coffee",
    "dandi 2 ood": "Coffee",
    "propolis": "Health",
    "ulen ski": "Entertainment"
  }
}
```

---

## 5. AI / Smart Features

### 5.1 ML-Based Auto-Categorization (Replace Hardcoded `match/case`)

**Problem:** The current `getCategory()` uses a hardcoded `match/case` with exact merchant names.
Any new merchant goes to "Other". This is not scalable.

**Solution:** Train a simple text classifier on your existing labeled data.

```python
# services/categorizer.py
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
import joblib

class MLCategorizer:
    def __init__(self, model_path="categorizer.pkl"):
        self.model_path = model_path
        self.model = None

    def train(self, descriptions: list[str], categories: list[str]):
        self.model = Pipeline([
            ("tfidf", TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 4))),
            ("clf", LogisticRegression(max_iter=1000))
        ])
        self.model.fit(descriptions, categories)
        joblib.dump(self.model, self.model_path)

    def predict(self, description: str) -> str:
        if self.model is None:
            self.model = joblib.load(self.model_path)
        return self.model.predict([description])[0]

    def predict_with_confidence(self, description: str) -> tuple[str, float]:
        if self.model is None:
            self.model = joblib.load(self.model_path)
        proba = self.model.predict_proba([description])[0]
        idx = proba.argmax()
        return self.model.classes_[idx], proba[idx]
```

**Training data:** Your existing `TRANSACTION_FILE.csv` already has 193 labeled rows — enough to
train a basic classifier. Retrain whenever you add new labeled data.

**Confidence threshold:** If confidence < 0.6, fall back to "Other" and ask the user to confirm.

```python
category, confidence = categorizer.predict_with_confidence(description)
if confidence < 0.6:
    print(f"Low confidence ({confidence:.0%}) for '{description}' → '{category}'")
    confirm = input("Accept? (y/n): ")
    if confirm.lower() != "y":
        # show category picker
```

**Required packages:** `scikit-learn`, `joblib`

---

### 5.2 Anomaly Detection — Flag Unusual Transactions

**What it does:** Automatically flag transactions that are unusually large for their category.

```python
# services/anomaly.py
import numpy as np

def detect_anomalies(df, z_threshold=2.5):
    """
    Flag transactions where the amount is more than z_threshold
    standard deviations above the category mean.
    """
    anomalies = []
    for category, group in df[df["amount"] < 0].groupby("category"):
        amounts = group["amount"].abs()
        mean, std = amounts.mean(), amounts.std()
        if std == 0:
            continue
        for _, row in group.iterrows():
            z = (abs(row["amount"]) - mean) / std
            if z > z_threshold:
                anomalies.append({
                    "date": row["date"],
                    "description": row["description"],
                    "amount": row["amount"],
                    "category": category,
                    "z_score": round(z, 2)
                })
    return anomalies
```

**Example output:**
```
⚠️  Anomaly detected:
   2026-01-19 | Other | Ilusion | -212.94 BGN  (z=3.8 — unusually large for 'Other')
```

---

### 5.3 Monthly Spend Forecasting

**What it does:** Given spending in the first N days of a month, predict end-of-month total.

```python
def forecast_month_end(df, month: str) -> dict:
    """
    Simple linear extrapolation based on daily spend rate so far this month.
    """
    from datetime import date, timedelta

    monthly = df[df["date"].str.startswith(month) & (df["amount"] < 0)].copy()
    if monthly.empty:
        return {}

    today = date.today()
    days_elapsed = today.day
    days_in_month = (date(today.year, today.month % 12 + 1, 1) - timedelta(days=1)).day

    spent_so_far = monthly["amount"].abs().sum()
    daily_rate = spent_so_far / days_elapsed
    projected_total = daily_rate * days_in_month

    return {
        "spent_so_far": round(spent_so_far, 2),
        "days_elapsed": days_elapsed,
        "days_remaining": days_in_month - days_elapsed,
        "projected_total": round(projected_total, 2),
        "daily_rate": round(daily_rate, 2)
    }
```

**Output:**
```
📊 Forecast for April 2026:
   Spent so far (14 days): 89.50 BGN
   Daily rate: 6.39 BGN/day
   Projected month-end total: ~191.70 BGN
   Budget: 200.00 BGN → On track ✅
```

---

### 5.4 Natural Language Query (LLM-Powered)

**What it does:** Let the user ask questions in plain English about their spending.

```python
# Example queries:
# "How much did I spend on food last month?"
# "What was my biggest expense in January?"
# "Am I spending more on coffee than last month?"
# "Show me all transactions over 50 BGN"
```

**Implementation options (cheapest to most powerful):**

| Option | How | Cost |
|---|---|---|
| Rule-based NLP | `spaCy` + regex patterns for dates/categories | Free |
| Local LLM | `ollama` with `llama3` or `mistral` | Free (local GPU) |
| OpenAI API | GPT-4o with function calling + your data as context | ~$0.01/query |

**Recommended approach — pandas-ai (simplest):**

```python
# pip install pandasai
from pandasai import SmartDataframe
from pandasai.llm import OpenAI

llm = OpenAI(api_token="YOUR_KEY")
sdf = SmartDataframe(df, config={"llm": llm})

response = sdf.chat("How much did I spend on groceries in January 2026?")
print(response)  # → "You spent 148.32 BGN on Groceries in January 2026."
```

---

### 5.5 Smart Budget Recommendations

**What it does:** Analyze 3+ months of history and suggest realistic budget limits.

```python
def recommend_budgets(df, months_history=3) -> dict:
    """
    Recommend budgets as: average monthly spend × 1.1 (10% buffer)
    """
    df["month"] = df["date"].str[:7]
    recent_months = sorted(df["month"].unique())[-months_history:]
    recent = df[df["month"].isin(recent_months) & (df["amount"] < 0)].copy()
    recent["abs_amount"] = recent["amount"].abs()

    monthly_by_cat = recent.groupby(["month", "category"])["abs_amount"].sum().unstack(fill_value=0)
    avg_monthly = monthly_by_cat.mean()

    recommendations = {}
    for cat, avg in avg_monthly.items():
        recommendations[cat] = round(avg * 1.1, 0)  # 10% buffer

    return recommendations
```

**Output:**
```
💡 Recommended budgets based on last 3 months:
   Groceries    : 165 BGN/month  (avg: 150)
   Gas          :  18 BGN/month  (avg:  16)
   Transport    :  22 BGN/month  (avg:  20)
   Entertainment:  10 BGN/month  (avg:   9)
   Sport        :   6 BGN/month  (avg:   5)
   Other        : 330 BGN/month  (avg: 300)
```

---

### 5.6 Merchant Name Normalization

**What it is:** "LIDL", "Lidl", "LIDL BULGARIA" should all map to the same merchant.

```python
import re

def normalize_merchant(name: str) -> str:
    name = name.strip().lower()
    name = re.sub(r'\s+(eood|ood|ad|ltd|gmbh|inc|llc)$', '', name)  # strip legal suffixes
    name = re.sub(r'\s+', ' ', name)
    return name.title()
```

---

## 6. Frontend Improvements

### 6.1 Option A — Streamlit Dashboard (Fastest, ~1 day of work)

**Best for:** Personal use, quick iteration, no JS required.

```python
# dashboard.py
import streamlit as st
import pandas as pd
import plotly.express as px

st.set_page_config(page_title="Budget Tracker", layout="wide")
st.title("💰 Personal Budget Tracker")

df = pd.read_csv("TRANSACTION_FILE.csv", header=None,
                 names=["date", "category", "description", "amount"])
df["date"] = pd.to_datetime(df["date"])
df["month"] = df["date"].dt.to_period("M").astype(str)

# Sidebar filters
months = sorted(df["month"].unique(), reverse=True)
selected_month = st.sidebar.selectbox("Month", ["All"] + months)
if selected_month != "All":
    df = df[df["month"] == selected_month]

# KPI row
col1, col2, col3 = st.columns(3)
income = df[df["amount"] > 0]["amount"].sum()
expenses = df[df["amount"] < 0]["amount"].abs().sum()
col1.metric("Income", f"{income:.2f} BGN", delta=None)
col2.metric("Expenses", f"{expenses:.2f} BGN", delta=None)
col3.metric("Net Balance", f"{income - expenses:+.2f} BGN",
            delta_color="normal" if income >= expenses else "inverse")

# Charts
df_exp = df[df["amount"] < 0].copy()
df_exp["abs_amount"] = df_exp["amount"].abs()
cat_totals = df_exp.groupby("category")["abs_amount"].sum().reset_index()

col4, col5 = st.columns(2)
with col4:
    fig = px.pie(cat_totals, values="abs_amount", names="category",
                 title="Spending by Category")
    st.plotly_chart(fig, use_container_width=True)

with col5:
    fig2 = px.bar(cat_totals.sort_values("abs_amount", ascending=False),
                  x="category", y="abs_amount", title="Category Breakdown",
                  color="category")
    st.plotly_chart(fig2, use_container_width=True)

# Monthly trend
monthly_exp = df[df["amount"] < 0].copy()
monthly_exp["abs_amount"] = monthly_exp["amount"].abs()
trend = monthly_exp.groupby(["month", "category"])["abs_amount"].sum().reset_index()
fig3 = px.line(trend, x="month", y="abs_amount", color="category",
               title="Monthly Spending Trend")
st.plotly_chart(fig3, use_container_width=True)

# Transaction table
st.subheader("Transactions")
search = st.text_input("Search description")
if search:
    df = df[df["description"].str.contains(search, case=False)]
st.dataframe(df.sort_values("date", ascending=False), use_container_width=True)
```

**Run with:** `streamlit run dashboard.py`

---

### 6.2 Option B — FastAPI + React (Production-Grade, ~1–2 weeks)

**Best for:** If you want to host it, share it, or add user accounts.

**Backend (FastAPI):**

```python
# api/main.py
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd

app = FastAPI(title="Budget Tracker API")
app.add_middleware(CORSMiddleware, allow_origins=["*"])

@app.get("/transactions")
def get_transactions(month: str = Query(None), category: str = Query(None)):
    df = load_df()
    if month:
        df = df[df["date"].str.startswith(month)]
    if category:
        df = df[df["category"] == category]
    return df.to_dict(orient="records")

@app.get("/summary/{month}")
def get_summary(month: str):
    df = load_df()
    df_month = df[df["date"].str.startswith(month)]
    income = df_month[df_month["amount"] > 0]["amount"].sum()
    expenses = df_month[df_month["amount"] < 0]["amount"].abs().sum()
    return {"income": income, "expenses": expenses, "net": income - expenses}

@app.post("/transactions")
def add_transaction(transaction: dict):
    # validate + append to DB
    ...
```

**Frontend pages to build:**

| Page | Components |
|---|---|
| Dashboard | KPI cards, pie chart, bar chart, recent transactions list |
| Transactions | Sortable/filterable table, edit/delete buttons, add form |
| Budget | Progress bars per category, set/edit limits |
| Reports | Monthly trend chart, export to Excel/PDF button |
| Settings | Category management, merchant mapping, currency |