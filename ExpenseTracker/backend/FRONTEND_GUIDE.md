# Expense Tracker — Frontend Build Guide (FastAPI + React)

> **How to use this document**
> Read it top to bottom the first time. Every command and every line of code is explained.
> Come back to specific sections as a reference while you build.

---

## Table of Contents

1. [File Structure — Where Everything Lives](#1-file-structure)
2. [Dependency Management — pip, venv, requirements.txt, npm](#2-dependency-management)
3. [Backend Setup — FastAPI](#3-backend-setup-fastapi)
4. [Frontend Setup — React + Vite](#4-frontend-setup-react--vite)
5. [Running the App](#5-running-the-app)
6. [Charts & Visualisation Guide](#6-charts--visualisation-guide)
7. [Quick Reference Cheat Sheet](#7-quick-reference-cheat-sheet)

---

## 1. File Structure

This is the complete folder tree for the project after you finish building everything.
Every file is listed with a short explanation of what it does and why it exists.

```
BudgetApp/                          <- Root of the Python project
|
|-- venv/                           <- Virtual environment (DO NOT edit manually, DO NOT commit to git)
|                                      Contains all pip-installed packages isolated to this project only.
|
|-- requirements.txt                <- List of all Python packages this project needs.
|                                      Generated with: pip freeze > requirements.txt
|                                      Used by others to install: pip install -r requirements.txt
|
|-- pyproject.toml                  <- Project metadata (name, version, build system). Already exists.
|
|-- .gitignore                      <- Tells git which files/folders to ignore
|
|-- api/                            <- NEW: The FastAPI backend lives here
|   |-- __init__.py                 <- Makes 'api' a Python package (can be empty)
|   `-- main.py                     <- All API routes/endpoints defined here
|
|-- src/
|   `-- expense_tracker/
|       |-- __init__.py
|       |-- transaction.py          <- Transaction class (already exists)
|       |-- expense_tracker.py      <- Original CLI logic (already exists)
|       `-- TRANSACTION_FILE.csv    <- Your data file (already exists)
|
|-- tests/
|   |-- test_transaction.py         <- Already exists
|   `-- test_expense_tracker.py     <- Already exists
|
`-- user_data/                      <- Already exists


budget-frontend/                    <- NEW: The React app (separate folder, same level as BudgetApp)
|
|-- node_modules/                   <- All npm packages (DO NOT edit, DO NOT commit to git)
|                                      Can be 200MB+. Recreated with: npm install
|
|-- package.json                    <- Lists all JavaScript dependencies (like requirements.txt for npm)
|                                      Automatically created and updated by npm commands.
|
|-- package-lock.json               <- Exact version lock of every npm package (commit this to git)
|
|-- vite.config.js                  <- Vite build tool configuration
|
|-- index.html                      <- The single HTML file React injects itself into
|
`-- src/
    |-- main.jsx                    <- Entry point: mounts the React app into index.html
    |-- App.jsx                     <- Root component: sets up page routing
    |-- App.css                     <- Global styles
    |-- api.js                      <- All HTTP calls to FastAPI in one place
    `-- pages/
        |-- Dashboard.jsx           <- KPI cards + pie chart + bar chart + trend line
        |-- Transactions.jsx        <- Searchable/filterable table + add transaction form
        `-- Budget.jsx              <- Budget progress bars per category
```

### Rules for the file structure

1. **Never manually edit `venv/` or `node_modules/`** — these are managed by pip and npm respectively.
2. **Never commit `venv/` or `node_modules/` to git** — they are huge and can be recreated from `requirements.txt` / `package.json`.
3. **Always commit `requirements.txt` and `package-lock.json`** — these let anyone recreate the exact same environment.
4. **`api/` must have an `__init__.py`** — this empty file tells Python to treat the folder as a package, which is required for imports to work.
5. **`budget-frontend/` is a completely separate project** — it has its own `package.json` and its own `node_modules/`. It communicates with the Python backend only via HTTP.

---

## 2. Dependency Management

This is one of the most important things to understand before you write any code.

---

### 2.1 Python — Virtual Environments (`venv`)

#### The problem without venv

When you run `pip install fastapi`, it installs FastAPI into your **global Python installation**.
If you have two projects that need different versions of the same library, they will conflict.
Also, when you share your project, there is no record of which packages are needed.

#### The solution: `venv`

A virtual environment is a **self-contained copy of Python** just for your project.
Packages installed inside it do not affect any other project or your global Python.

#### How to create and use it

```bash
# Step 1: Navigate to your project folder
cd c:\Users\I752228\Desktop\Python\Python\BudgetApp

# Step 2: Create the virtual environment
# This creates a folder called 'venv' inside BudgetApp/
python -m venv venv

# Step 3: Activate it (Windows — Command Prompt)
venv\Scripts\activate

# Step 3 (alternative — Windows PowerShell)
venv\Scripts\Activate.ps1

# You will see (venv) appear at the start of your terminal prompt:
# (venv) C:\Users\I752228\Desktop\Python\Python\BudgetApp>
# This means the virtual environment is active.

# Step 4: Now install packages — they go into venv/, not global Python
pip install fastapi uvicorn pandas

# Step 5: When you are done working, deactivate it
deactivate
```

**Important:** Every time you open a new terminal to work on this project, you must activate
the venv again (Step 3). The `(venv)` prefix in your prompt tells you it is active.

---

### 2.2 Python — `requirements.txt`

`requirements.txt` is a plain text file that lists every Python package your project needs,
with exact version numbers. It is the standard way to share Python dependencies.

#### How to create it

After you have installed all your packages with pip, run:

```bash
# Make sure your venv is active first (you should see (venv) in your prompt)
pip freeze > requirements.txt
```

`pip freeze` lists every installed package and its version.
`>` redirects that output into the file `requirements.txt`.

The file will look like this:

```
annotated-types==0.7.0
anyio==4.9.0
fastapi==0.115.12
pandas==2.2.3
pydantic==2.11.3
uvicorn==0.34.0
```

#### How to install from it

When someone else clones your project (or when you set it up on a new machine):

```bash
# Create and activate a fresh venv first
python -m venv venv
venv\Scripts\activate

# Install everything listed in requirements.txt
pip install -r requirements.txt
# The -r flag means "read from file"
```

#### When to update it

Run `pip freeze > requirements.txt` again every time you install a new package.

---

### 2.3 Python — `.gitignore`

Create a file called `.gitignore` in `BudgetApp/` with this content:

```
# Virtual environment — never commit this
venv/

# Python cache files — auto-generated, not needed
__pycache__/
*.pyc
*.pyo

# Test coverage reports
.coverage
htmlcov/

# IDE files
.vscode/
.idea/

# Data files you don't want public
user_data/
```

Git will now completely ignore these folders/files.

---

### 2.4 JavaScript — `package.json` and `npm`

The JavaScript/React world uses **npm** (Node Package Manager) instead of pip.
`package.json` is the equivalent of `requirements.txt` — it lists all JavaScript dependencies.

Unlike `requirements.txt`, you **never edit `package.json` manually** for adding packages.
Instead, you use `npm install <package-name>` and npm updates `package.json` automatically.

```bash
# Install a package and automatically add it to package.json
npm install axios

# Install all packages listed in package.json (like pip install -r requirements.txt)
npm install

# Install a package only for development (not needed in production)
npm install --save-dev eslint
```

#### `package-lock.json`

This file is automatically created by npm. It records the **exact version** of every package
(including dependencies of dependencies). Always commit this file to git — it ensures everyone
gets the exact same versions.

#### `.gitignore` for the React project

Create `budget-frontend/.gitignore`:

```
# npm packages — never commit this (can be 200MB+)
node_modules/

# Build output
dist/

# Environment variables (may contain secrets)
.env
.env.local
```

---

## 3. Backend Setup (FastAPI)

FastAPI is a Python web framework for building APIs. An API (Application Programming Interface)
is a server that listens for HTTP requests and returns data as JSON.

Your React frontend will send requests like:
- "Give me all transactions for March 2026" -> `GET /api/transactions?month=2026-03`
- "Add this new transaction" -> `POST /api/transactions`

FastAPI handles these requests and responds with JSON data.

---

### 3.1 Install the packages

```bash
# Make sure you are in BudgetApp/ and your venv is active
cd c:\Users\I752228\Desktop\Python\Python\BudgetApp
venv\Scripts\activate

pip install fastapi uvicorn pandas
```

**What each package does:**

- **`fastapi`** — The web framework. You define URL routes as Python functions decorated
  with `@app.get(...)` or `@app.post(...)`. FastAPI handles all the HTTP parsing,
  validation, and response formatting.

- **`uvicorn`** — The ASGI server. FastAPI is just a framework — it defines what to do
  when a request arrives, but it cannot listen for network connections by itself.
  Uvicorn is the actual server process that listens on a port (e.g. port 8000) and
  passes incoming requests to FastAPI. Think of FastAPI as the recipe and uvicorn as
  the kitchen.

- **`pandas`** — You already use this. It reads your CSV file and lets you
  filter/group/aggregate data with simple method calls.

After installing, save the dependency list:

```bash
pip freeze > requirements.txt
```

---

### 3.2 Create `api/__init__.py`

Create an empty file at `BudgetApp/api/__init__.py`:

```python
# This file is intentionally empty.
# Its presence tells Python that 'api' is a package,
# which allows other files to import from it with: from api.main import app
```

Without this file, Python will not recognize `api/` as a package and imports will fail.

---

### 3.3 Create `api/main.py`

This is the entire backend. Create `BudgetApp/api/main.py`:

```python
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
from pathlib import Path

# ─────────────────────────────────────────────
# APP SETUP
# ─────────────────────────────────────────────

app = FastAPI(title="Budget Tracker API", version="1.0.0")
# FastAPI() creates the application object.
# title= and version= appear in the auto-generated docs at /docs

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server runs here
    allow_credentials=True,
    allow_methods=["*"],   # Allow GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],   # Allow all HTTP headers
)
# CORS (Cross-Origin Resource Sharing) is a browser security rule.
# Your React app runs on localhost:5173 and your API runs on localhost:8000.
# Browsers block requests between different ports by default.
# CORSMiddleware tells the browser: "requests from localhost:5173 are allowed".
# Without this, every API call from React would be blocked with a CORS error.

# ─────────────────────────────────────────────
# DATA LOADING
# ─────────────────────────────────────────────

CSV_PATH = Path(__file__).parent.parent / "src" / "expense_tracker" / "TRANSACTION_FILE.csv"
# Path(__file__) = the path to this file (api/main.py)
# .parent        = the api/ folder
# .parent        = the BudgetApp/ folder
# / "src" / ...  = navigate down to the CSV file
# Using Path() instead of a hardcoded string means this works on any machine
# regardless of where the project is stored.

def load_df() -> pd.DataFrame:
    """Read the CSV file and return a clean DataFrame."""
    df = pd.read_csv(
        CSV_PATH,
        header=None,                                          # CSV has no header row
        names=["date", "category", "description", "amount"]  # assign column names manually
    )
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce")
    # pd.to_numeric converts the amount column to numbers.
    # errors="coerce" means: if a value cannot be converted (e.g. a typo),
    # replace it with NaN instead of crashing.

    df["date"] = pd.to_datetime(df["date"]).dt.strftime("%Y-%m-%d")
    # pd.to_datetime parses the date strings into proper date objects.
    # .dt.strftime("%Y-%m-%d") converts them back to strings in a consistent format.
    # This ensures all dates look like "2026-03-15" regardless of how they were stored.

    df = df.dropna(subset=["amount"])
    # Remove any rows where amount could not be parsed (the NaN values from above).

    return df

# ─────────────────────────────────────────────
# REQUEST/RESPONSE MODELS
# ─────────────────────────────────────────────

class TransactionIn(BaseModel):
    date: str
    description: str
    amount: float
    category: str
# BaseModel is from Pydantic (installed automatically with FastAPI).
# It defines the shape of the JSON body that the client must send for POST requests.
# FastAPI automatically validates incoming requests against this model.
# If 'amount' is missing or not a number, FastAPI returns a 422 error with a clear message.
# You get free validation without writing any validation code yourself.

# ─────────────────────────────────────────────
# ROUTES (ENDPOINTS)
# ─────────────────────────────────────────────

@app.get("/api/transactions")
def get_transactions(
    month: str = Query(None, description="Filter by month, e.g. 2026-03"),
    category: str = Query(None, description="Filter by category"),
    search: str = Query(None, description="Search in description")
):
    """Return a list of transactions, with optional filters."""
    # @app.get("/api/transactions") registers this function as the handler for
    # GET requests to the URL /api/transactions.
    # When React calls: axios.get('/api/transactions?month=2026-03')
    # FastAPI calls this function with month="2026-03", category=None, search=None.

    # Query(None) declares an optional URL query parameter.
    # The None is the default value when the parameter is not provided.
    # description= appears in the auto-generated /docs page.

    df = load_df()

    if month:
        df = df[df["date"].str.startswith(month)]
        # .str.startswith(month) keeps only rows where the date starts with "2026-03"
        # e.g. "2026-03-01", "2026-03-15" both start with "2026-03"

    if category:
        df = df[df["category"] == category]

    if search:
        df = df[df["description"].str.contains(search, case=False, na=False)]
        # case=False makes the search case-insensitive ("lidl" matches "Lidl", "LIDL")
        # na=False prevents crashes on empty/null description values

    return df.to_dict(orient="records")
    # .to_dict(orient="records") converts the DataFrame to a Python list of dicts:
    # [{"date": "2026-03-01", "category": "Groceries", "description": "Lidl", "amount": -12.5}]
    # FastAPI automatically serializes this list to JSON and sends it as the response body.


@app.get("/api/summary/{month}")
def get_summary(month: str):
    """Return income, expenses, and net balance for a given month."""
    # {month} in the path is a path parameter.
    # When React calls: axios.get('/api/summary/2026-03')
    # FastAPI extracts "2026-03" and passes it as the month argument.
    # Path parameters are part of the URL itself (vs query parameters which come after ?).

    df = load_df()
    df_month = df[df["date"].str.startswith(month)]

    if df_month.empty:
        raise HTTPException(status_code=404, detail=f"No data found for month: {month}")
    # HTTPException sends an HTTP error response.
    # status_code=404 means "Not Found".
    # detail= is the error message the client receives.

    income   = float(df_month[df_month["amount"] > 0]["amount"].sum())
    expenses = float(df_month[df_month["amount"] < 0]["amount"].abs().sum())
    # float() converts numpy float64 to a plain Python float.
    # FastAPI can serialize Python floats to JSON, but not numpy types directly.

    return {
        "month": month,
        "income": round(income, 2),
        "expenses": round(expenses, 2),
        "net": round(income - expenses, 2),
        "transaction_count": len(df_month)
    }
    # Returning a dict from a FastAPI route automatically converts it to a JSON response.


@app.get("/api/categories")
def get_categories():
    """Return the list of available categories."""
    df = load_df()
    categories = sorted(df["category"].dropna().unique().tolist())
    # .unique() returns an array of unique values (no duplicates)
    # .tolist() converts numpy array to a plain Python list (required for JSON serialization)
    return {"categories": categories}


@app.get("/api/monthly-trend")
def get_monthly_trend():
    """Return spending per category per month for the trend chart."""
    df = load_df()
    df_exp = df[df["amount"] < 0].copy()
    df_exp["abs_amount"] = df_exp["amount"].abs()
    df_exp["month"] = df_exp["date"].str[:7]
    # str[:7] slices the first 7 characters: "2026-03-15" -> "2026-03"

    trend = (
        df_exp.groupby(["month", "category"])["abs_amount"]
        .sum()
        .reset_index()
        # groupby(["month", "category"]) groups by both month AND category simultaneously.
        # For each unique (month, category) pair, it sums the amounts.
        # reset_index() turns the grouped index back into regular columns.
    )
    trend.columns = ["month", "category", "total"]
    trend["total"] = trend["total"].round(2)
    return trend.to_dict(orient="records")


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
    with open(CSV_PATH, "a") as f:
        f.write(new_line)
    # "a" mode = append. Opens the file and adds to the end without overwriting existing data.

    return {"message": "Transaction added successfully", "transaction": transaction}
```

---

### 3.4 Run the backend

```bash
# Make sure you are in BudgetApp/ and venv is active
cd c:\Users\I752228\Desktop\Python\Python\BudgetApp
venv\Scripts\activate

uvicorn api.main:app --reload --port 8000
```

**Breaking down this command:**
- `uvicorn` — the server program
- `api.main` — the Python module path: the file `api/main.py` (dots instead of slashes, no `.py`)
- `:app` — the name of the FastAPI object inside that file (`app = FastAPI(...)`)
- `--reload` — automatically restart the server when you save any Python file (development mode only)
- `--port 8000` — listen on port 8000

**Test it:** Open your browser and go to `http://localhost:8000/docs`
FastAPI automatically generates an interactive Swagger UI where you can test every endpoint
by clicking "Try it out" — no React needed yet.

---

## 4. Frontend Setup (React + Vite)

React is a JavaScript library for building user interfaces. You write components — reusable
pieces of UI that manage their own data (state) and update automatically when data changes.

Vite is the build tool that bundles your JavaScript files and runs a development server.

---

### 4.1 Prerequisites

You need Node.js installed. Check if you have it:

```bash
node --version    # should print v18.x.x or higher
npm --version     # should print 9.x.x or higher
```

If not installed, download from: https://nodejs.org (choose the LTS version)

---

### 4.2 Create the React app

```bash
# Navigate to the parent folder (one level above BudgetApp)
cd c:\Users\I752228\Desktop\Python\Python

# Create the React app using Vite
npm create vite@latest budget-frontend -- --template react
# npm create vite@latest  = use the latest version of the Vite project creator
# budget-frontend         = the name of the folder to create
# --                      = separator between npm arguments and Vite arguments
# --template react        = use the React template (creates .jsx files)

# Move into the new folder
cd budget-frontend

# Install all default dependencies listed in package.json
npm install
# This downloads React, ReactDOM, and Vite into node_modules/
```

---

### 4.3 Install additional libraries

```bash
# Make sure you are in budget-frontend/
cd c:\Users\I752228\Desktop\Python\Python\budget-frontend

npm install axios recharts react-router-dom
```

**What each library does:**

- **`axios`** — Makes HTTP requests from JavaScript to your FastAPI backend.
  Cleaner than the built-in `fetch` API. Automatically parses JSON responses.
  `axios.get('http://localhost:8000/api/transactions')` returns a Promise
  that resolves to `{ data: [...transactions] }`.

- **`recharts`** — A React chart library. You write charts as React components:
  `<PieChart>`, `<BarChart>`, `<LineChart>`. Each chart accepts your data as a prop.
  Built on top of D3 but much easier to use.

- **`react-router-dom`** — Enables multi-page navigation in a React app without
  full page reloads. When the user clicks "Transactions", the URL changes to
  `/transactions` and React swaps the component — the page does not reload.

After installing, npm automatically updates `package.json` with the new dependencies.

---

### 4.4 Create `src/api.js`

This file centralizes all HTTP calls to the backend. Create `budget-frontend/src/api.js`:

```javascript
import axios from 'axios';
// import brings in the axios library so we can use it in this file.
// This is JavaScript's module system — similar to Python's 'import'.

const BASE_URL = 'http://localhost:8000/api';
// const declares a constant — a variable that cannot be reassigned.
// All API calls use this base URL. If you deploy the backend to a different server,
// you only change this one line.

export const getTransactions = (params = {}) =>
    axios.get(`${BASE_URL}/transactions`, { params });
// export makes this function available to other files that import from api.js.
// Arrow function: (params) => expression  is the same as  function(params) { return expression; }
// Template literal: `${BASE_URL}/transactions` = "http://localhost:8000/api/transactions"
// { params } tells axios to convert the params object to URL query parameters:
//   { month: "2026-03", category: "Groceries" }  becomes  ?month=2026-03&category=Groceries
// axios.get() returns a Promise — an object representing a future value.
// You use .then(response => ...) or await to get the actual data.

export const getSummary = (month) =>
    axios.get(`${BASE_URL}/summary/${month}`);
// Template literal inserts the month variable into the URL:
//   getSummary("2026-03") calls: GET /api/summary/2026-03

export const getCategories = () =>
    axios.get(`${BASE_URL}/categories`);

export const getMonthlyTrend = () =>
    axios.get(`${BASE_URL}/monthly-trend`);

export const addTransaction = (data) =>
    axios.post(`${BASE_URL}/transactions`, data);
// axios.post(url, data) sends a POST request with 'data' as the JSON body.
// FastAPI receives this and validates it against the TransactionIn model.
```

---

### 4.5 Create `src/App.jsx`

Replace the contents of `budget-frontend/src/App.jsx`:

```jsx
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
// BrowserRouter  — wraps the app and enables URL-based navigation
// Routes         — container for all Route definitions
// Route          — maps a URL path to a component
// NavLink        — like <a> but adds an 'active' CSS class when the URL matches

import Dashboard    from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budget       from './pages/Budget';
// './pages/Dashboard' means: look for Dashboard.jsx in the pages/ subfolder.

function App() {
  return (
    <BrowserRouter>
      <nav style={{ display: 'flex', gap: '1rem', padding: '1rem', background: '#1a1a2e' }}>
        {/*
          style={{ ... }} passes a JavaScript object as inline CSS.
          The outer {} is JSX expression syntax (embed JS inside JSX).
          The inner {} is the JavaScript object literal.
          CSS property names use camelCase: 'background-color' becomes 'backgroundColor'.
        */}
        <NavLink to="/"             style={({ isActive }) => ({ color: isActive ? '#e94560' : 'white' })}>
          Dashboard
        </NavLink>
        <NavLink to="/transactions" style={({ isActive }) => ({ color: isActive ? '#e94560' : 'white' })}>
          Transactions
        </NavLink>
        <NavLink to="/budget"       style={({ isActive }) => ({ color: isActive ? '#e94560' : 'white' })}>
          Budget
        </NavLink>
        {/*
          NavLink passes { isActive } to the style function.
          isActive is true when the current URL matches the 'to' prop.
          Ternary operator: condition ? valueIfTrue : valueIfFalse
          So: active link is red (#e94560), inactive links are white.
        */}
      </nav>

      <main style={{ padding: '1.5rem' }}>
        <Routes>
          <Route path="/"             element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/budget"       element={<Budget />} />
        </Routes>
        {/*
          Routes looks at the current URL and renders the matching element.
          element={<Dashboard />} means: render the Dashboard component.
          Only one Route renders at a time.
        */}
      </main>
    </BrowserRouter>
  );
}

export default App;
// export default makes App the default export of this file.
// main.jsx imports it with: import App from './App'
```

---

### 4.6 Create `src/pages/Dashboard.jsx`

Create the folder `budget-frontend/src/pages/` and then create `Dashboard.jsx`:

```jsx
import { useEffect, useState } from 'react';
// React Hooks — functions that add features to components.
// useState  — lets a component remember data between renders
// useEffect — lets a component run code after rendering (e.g. fetch data from API)

import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line,
  ResponsiveContainer
} from 'recharts';
// Recharts components — each is a React component you use like HTML tags.
// PieChart         — container for a pie chart
// Pie              — the actual pie/donut shape inside PieChart
// Cell             — one slice of the pie (lets you set individual colors)
// BarChart         — container for a bar chart
// Bar              — the bars inside BarChart
// XAxis / YAxis    — the axes
// CartesianGrid    — background grid lines
// Tooltip          — popup that appears when you hover over a data point
// Legend           — the color key
// LineChart        — container for a line chart
// Line             — one line inside LineChart
// ResponsiveContainer — makes the chart fill its parent's width automatically

import { getTransactions, getSummary, getMonthlyTrend } from '../api';
// '../api' means: go up one folder (from pages/ to src/) then find api.js

const COLORS = ['#e94560', '#0f3460', '#533483', '#f5a623', '#16213e', '#2ecc71'];
// Hex color codes for pie chart slices.
// Each slice gets the color at its index: slice 0 gets COLORS[0], etc.

const MONTHS = [
  { value: '2026-01', label: 'January 2026' },
  { value: '2026-02', label: 'February 2026' },
  { value: '2026-03', label: 'March 2026' },
  { value: '2026-04', label: 'April 2026' },
];

function Dashboard() {
  // useState(initialValue) returns [currentValue, setterFunction]
  // When you call the setter, React re-renders the component with the new value.
  const [transactions, setTransactions] = useState([]);   // starts as empty array
  const [summary,      setSummary]      = useState(null); // starts as null (no data yet)
  const [trendData,    setTrendData]    = useState([]);   // starts as empty array
  const [month,        setMonth]        = useState('2026-03'); // default: March 2026
  const [loading,      setLoading]      = useState(true);