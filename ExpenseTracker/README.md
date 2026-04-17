<div align="center">

# 💸 Expense Tracker

**A full-stack personal finance application built with Python + FastAPI and React.**

![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115.0-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![pandas](https://img.shields.io/badge/pandas-3.0.2-150458?style=for-the-badge&logo=pandas&logoColor=white)
![pytest](https://img.shields.io/badge/pytest-9.0.3-0A9EDC?style=for-the-badge&logo=pytest&logoColor=white)
![React](https://img.shields.io/badge/React-Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)

</div>

## 📋 Table of Contents

- [Overview](#-overview)
- [Project Structure](#-project-structure)
- [Python Architecture](#-python-architecture)
  - [Transaction Class](#transaction-class)
  - [CLI Logic — expense_tracker.py](#cli-logic--expense_trackerpy)
  - [FastAPI Backend — main.py](#fastapi-backend--mainpy)
- [Libraries & Frameworks](#-libraries--frameworks)
- [Data Storage](#-data-storage)
- [Package Configuration](#-package-configuration)
- [Testing](#-testing)
- [How to Run the App](#-how-to-run-the-app)

---

## 🗺 Overview

The Expense Tracker allows users to:

- ✅ Record individual transactions (date, description, amount, category)
- ✅ Import bulk transactions from a CSV file
- ✅ View a monthly summary of income, expenses, and net balance
- ✅ Filter and search transactions by month, category, or description
- ✅ Visualise spending breakdowns via a React frontend

The backend is a **REST API** built with FastAPI that reads from and writes to a flat CSV file. The application started as a **CLI tool** and was later extended with a full HTTP API layer.

---

## 📁 Project Structure

```
ExpenseTracker/
├── backend/
│   ├── api/
│   │   ├── __init__.py             # Makes 'api' a Python package
│   │   └── main.py                 # All FastAPI routes and endpoints
│   ├── src/
│   │   └── expense_tracker/
│   │       ├── __init__.py
│   │       ├── transaction.py      # Transaction data model
│   │       ├── expense_tracker.py  # Original CLI logic
│   │       └── TRANSACTION_FILE.csv
│   ├── tests/
│   │   ├── test_transaction.py
│   │   └── test_expense_tracker.py
│   ├── pyproject.toml              # Build system & pytest config
│   └── requirements.txt            # Pinned Python dependencies
└── frontend/                       # React + Vite
```

---

## 🐍 Python Architecture

### Transaction Class

> **File:** `src/expense_tracker/transaction.py`

The `Transaction` class is the **core data model** of the application. Every piece of financial data is represented as a `Transaction` object before being written to or read from the CSV.

#### Date Validation

The constructor enforces the `YYYY-MM-DD` format using a compiled regular expression. Any date that does not match raises a `ValueError` immediately, preventing malformed data from ever reaching the CSV.

```python
DATE_PATTERN = re.compile(r"^20\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$")
```

The regex is compiled **once at class definition time** (not inside a method), so it is only compiled once for the lifetime of the process rather than on every call.

#### Automatic Categorisation

If no explicit `category` is passed, the constructor calls `getCategory(description)` to infer the category from the transaction description. This means imported bank-statement rows are categorised automatically without any manual input.

If a `category` argument **is** provided, it takes precedence over the description-based lookup — used by the API's manual add-transaction endpoint where the user selects a category directly.

#### Category Mapping

`getCategory` uses Python's **structural pattern matching** (`match` statement, Python 3.10+) to map known merchant names to categories:

```python
case "lidl" | "kaufland" | "billa" | "fantastico" | ...:
    category = "Groceries"
case "lukoil" | "lukoil bulgaria":
    category = "Gas"
case "bolt":
    category = "Transport"
case _:
    category = "Other"
```

Any description not matched falls through to `"Other"`. The six supported categories are defined as a class-level constant `TRANSACTION_CATEGORIES` — a **single source of truth** shared across the whole backend.

#### Class-Level Constants

| Constant | Purpose |
|---|---|
| `TRANSACTION_CATEGORIES` | Canonical list of category names |
| `TRANSACTION_CATEGORIES_LOWER` | Lowercase version for case-insensitive lookup |
| `DATE_PATTERN` | Compiled regex for date validation |

---

### CLI Logic — expense_tracker.py

> **File:** `src/expense_tracker/expense_tracker.py`

This is the **original CLI version** of the application, written before the API layer was added. It is not used by the API but documents the original design intent.

| Function | What it does |
|---|---|
| `get_user_input` | `while True` loop prompting for `"file"`, `"transaction"`, or `"end"` |
| `get_single_transaction` | Collects one transaction interactively; each field validated in its own retry loop |
| `get_file_transactions` | Reads a user-supplied CSV using `csv.DictReader` with flexible column detection |
| `store_input` | Appends one or more `Transaction` objects to the master CSV |
| `summarize_expenses` | Reads the CSV with pandas, groups by category, renders pie + bar charts via matplotlib |

**Flexible column detection** in `get_file_transactions` searches the header row for any column whose name *contains* `"date"`, `"description"`, or `"amount"` (case-insensitive), making the importer tolerant of different CSV formats from different banks.

**`store_input`** accepts either a single `Transaction` or a list, normalising the input with `isinstance` before iterating — so callers never need to wrap a single object in a list themselves.

---

### FastAPI Backend — main.py

> **File:** `api/main.py`

This is the live backend the React frontend communicates with.

#### Application Setup

```python
app = FastAPI(title="Budget Tracker API", version="1.0.0")
```

FastAPI automatically generates interactive API documentation at `/docs` (Swagger UI) and `/redoc` with no extra configuration.

#### CORS Middleware

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Browsers enforce the **Same-Origin Policy**, blocking JavaScript on one port from requesting a different port. Since the React dev server runs on `5173` and the API on `8000`, `CORSMiddleware` adds the required `Access-Control-Allow-Origin` headers so the browser permits the requests.

#### File-Level Caching

```python
_cache = {}
_cache_mtime = {}

def load_df() -> pd.DataFrame:
    mtime = os.path.getmtime(CSV_PATH)
    if CSV_PATH in _cache and _cache_mtime[CSV_PATH] == mtime:
        return _cache[CSV_PATH].copy()
    # ... read and parse CSV ...
    _cache[CSV_PATH] = df
    _cache_mtime[CSV_PATH] = mtime
    return df.copy()
```

Without caching, every GET request would re-read and re-parse the CSV from disk. The cache stores the parsed DataFrame in memory and only re-reads the file when its **modification time (`mtime`) has changed** — i.e. after a POST writes a new transaction. This avoids redundant I/O while staying consistent after writes.

#### Request Validation with Pydantic

```python
class TransactionIn(BaseModel):
    date: str
    description: str
    amount: float
    category: Literal["Groceries", "Gas", "Transport", "Entertainment", "Sport", "Other"]
```

When a `POST /api/transactions` request arrives, FastAPI automatically:
1. Parses the JSON request body
2. Validates each field against the declared types
3. Enforces that `category` is one of the six allowed literal values
4. Returns `422 Unprocessable Entity` with a detailed error message if validation fails

No manual validation code is needed in the route handler.

#### API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/transactions` | List transactions; optional `month`, `category`, `search` query params |
| `GET` | `/api/summary/{month}` | Income, expenses, net balance, and transaction count for a month |
| `GET` | `/api/categories` | All distinct categories present in the data |
| `POST` | `/api/transactions` | Add a single transaction (validated against `TransactionIn`) |
| `POST` | `/api/import` | Upload a CSV file and bulk-import its transactions |

#### CSV Import Endpoint

The import endpoint is `async` because it uses `await file.read()` to read the uploaded file without blocking the server:

```python
async def add_transactions(file: UploadFile = File(...)):
    content = await file.read()
    text = content.decode("utf-8-sig")  # strips Excel BOM
```

`utf-8-sig` decoding strips the **BOM (Byte Order Mark)** that Microsoft Excel adds to CSV exports, which would otherwise corrupt the first column name.

The endpoint uses the same flexible column detection as the CLI importer and passes each row through `Transaction.getCategory` for automatic categorisation. Rows that fail to parse are counted as `skipped`, and the response reports both `imported` and `skipped` counts.

#### Portable Path Construction

```python
CSV_PATH = Path(__file__).parent.parent / "src" / "expense_tracker" / "TRANSACTION_FILE.csv"
```

`pathlib.Path` is used throughout instead of string concatenation. `Path(__file__)` resolves to the absolute path of the current file at runtime, making all file references **portable** — the code works regardless of where the project is cloned.

---

## 📦 Libraries & Frameworks

| Library | Version | Role |
|---|---|---|
| **FastAPI** | 0.115.0 | Web framework — HTTP routes as decorated Python functions |
| **Uvicorn** | 0.31.0 | ASGI server — listens on a port and passes requests to FastAPI |
| **Pydantic** | 2.9.2 | Data validation — validates and parses request bodies via `BaseModel` |
| **pandas** | 3.0.2 | Data manipulation — reads CSV, filters rows, groups and aggregates |
| **matplotlib** | 3.10.8 | Charting — pie and bar charts in the original CLI version |
| **python-multipart** | 0.0.26 | Required by FastAPI to handle `multipart/form-data` file uploads |
| **httpx** | 0.27.2 | Async HTTP client (used with FastAPI's `TestClient`) |
| **pytest** | 9.0.3 | Test runner |
| **pytest-cov** | 7.1.0 | Test coverage reporting |
| **python-dotenv** | 1.0.1 | Loads environment variables from a `.env` file |
| **starlette** | 0.38.6 | ASGI toolkit FastAPI is built on (installed automatically) |

<details>
<summary><strong>Why FastAPI?</strong></summary>

- **Automatic validation** via Pydantic — no manual `if not isinstance(...)` checks in route handlers.
- **Automatic documentation** — `/docs` and `/redoc` are generated from the code with no extra work.
- **Type hints as the API contract** — Python type annotations on function parameters define both the expected input and the generated docs simultaneously.
- **Async support** — `async def` routes handle I/O-bound work (like file uploads) without blocking.

</details>

<details>
<summary><strong>Why pandas?</strong></summary>

The transaction data lives in a CSV. pandas makes it trivial to:
- Filter rows by date prefix: `df["date"].str.startswith(month)`
- Aggregate totals by category: `groupby("category")["amount"].sum()`
- Handle missing or malformed values gracefully: `errors="coerce"`, `dropna()`

All of this would require significantly more code with the standard `csv` module alone.

</details>

---

## 🗄 Data Storage

Transactions are stored in a **flat CSV file** at `src/expense_tracker/TRANSACTION_FILE.csv`.

Each row has four fields with **no header row**:

```
2026-03-15,Groceries,Lidl,-32.50
2026-03-01,Other,Salary,2500.00
```

| Field | Type | Notes |
|---|---|---|
| `date` | `YYYY-MM-DD` string | Validated on write |
| `category` | string | One of the six defined categories |
| `description` | string | Raw merchant name or label |
| `amount` | float | Negative = expense, Positive = income |

The file is **appended to** (never overwritten) by both the CLI and the API.

---

## ⚙️ Package Configuration

### pyproject.toml

```toml
[build-system]
requires = ["setuptools>=61.0"]
build-backend = "setuptools.build_meta"

[project]
name = "expense-tracker"
version = "0.1.0"

[tool.setuptools.packages.find]
where = ["src"]

[tool.pytest.ini_options]
testpaths = ["tests"]
pythonpath = ["src"]
```

- **`[tool.setuptools.packages.find]`** — Uses the **src layout** pattern: source code lives inside `src/`, keeping it separate from config files and preventing accidental imports of local source during testing.
- **`[tool.pytest.ini_options]`** — Adds `src/` to `sys.path` so test files can import `from expense_tracker.transaction import Transaction` without installing the package first.

### Editable Install

`requirements.txt` includes `-e .`, which installs the project in **editable mode**. Python resolves imports directly from the source files on disk — changes take effect immediately without reinstalling.

---

## 🧪 Testing

Tests live in `backend/tests/` and run with **pytest**.

### `test_transaction.py` — Unit tests for the `Transaction` class

| Test | What it verifies |
|---|---|
| `test_valid_transaction_creation` | A valid transaction is created with correct attributes |
| `test_invalid_date_format_raises` | `ValueError` raised for `DD-MM-YYYY` format |
| `test_invalid_date_month_raises` | `ValueError` raised for month `13` |
| `test_invalid_date_day_raises` | `ValueError` raised for day `35` |
| `test_explicit_category_overrides_description` | `category="Sport"` overrides the description-based lookup |

### `test_expense_tracker.py` — Tests for CLI functions

| Technique | How it's used |
|---|---|
| `monkeypatch.setattr("builtins.input", ...)` | Replaces `input()` with a controlled sequence of responses — no real terminal needed |
| `unittest.mock.patch` | Replaces `get_file_transactions`, `store_input`, and `Path.exists` with mocks to isolate the function under test |
| `capsys.readouterr()` | Captures `stdout` to assert correct error messages are printed for invalid input |
| `mock_open` | Simulates file I/O without touching the real filesystem |

### Run the tests

```bash
# From ExpenseTracker/backend/ with venv active
pytest

# With line-by-line coverage report
pytest --cov=src --cov-report=term-missing
```

---

## 🚀 How to Run the App

### Prerequisites

| Tool | Minimum version |
|---|---|
| Python | 3.10 |
| Node.js | 18 |

---

### Backend

**1. Create and activate a virtual environment**

```bash
cd ExpenseTracker/backend

# Create
python -m venv venv

# Activate — Windows (Command Prompt)
venv\Scripts\activate

# Activate — Windows (PowerShell)
venv\Scripts\Activate.ps1

# Activate — macOS / Linux
source venv/bin/activate
```

> You should see `(venv)` at the start of your terminal prompt.

**2. Install dependencies**

```bash
pip install -r requirements.txt
```

**3. Start the server**

```bash
uvicorn api.main:app --reload --port 8000
```

| URL | What's there |
|---|---|
| `http://localhost:8000/docs` | Interactive Swagger UI — test every endpoint in the browser |
| `http://localhost:8000/redoc` | Alternative API reference docs |

> `--reload` restarts the server automatically on file save. Remove it in production.

---

### Frontend

Open a **second terminal** (keep the backend running):

```bash
cd ExpenseTracker/frontend
npm install
npm run dev
```

Open **`http://localhost:5173`** in your browser to use the full application.

---

### Quick-Start Summary

```bash
# Terminal 1 — Backend
cd ExpenseTracker/backend
venv\Scripts\activate          # or: source venv/bin/activate
pip install -r requirements.txt
uvicorn api.main:app --reload --port 8000

# Terminal 2 — Frontend
cd ExpenseTracker/frontend
npm install
npm run dev
```

| Service | URL |
|---|---|
| Full app | http://localhost:5173 |
| API explorer | http://localhost:8000/docs |