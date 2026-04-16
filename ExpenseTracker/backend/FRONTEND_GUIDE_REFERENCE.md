# Frontend Guide — Part 3: Running the App, Charts & Cheat Sheet

> This is a continuation of `FRONTEND_GUIDE.md` and `FRONTEND_GUIDE_PAGES.md`.

---

## 5. Running the App

You need **two terminals open at the same time**.

### Terminal 1 — Start the Python backend

```bash
cd c:\Users\I752228\Desktop\Python\Python\BudgetApp
venv\Scripts\activate
uvicorn api.main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
```

Test it: open `http://localhost:8000/docs` in your browser.
FastAPI auto-generates an interactive page where you can click every endpoint and test it.

### Terminal 2 — Start the React frontend

```bash
cd c:\Users\I752228\Desktop\Python\Python\budget-frontend
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in 300ms
  Local:   http://localhost:5173/
```

Open `http://localhost:5173` in your browser. Your app is running.

### How the two sides connect

```
Browser (localhost:5173)
    |
    |  User changes month filter
    v
React component calls getTransactions({ month: "2026-03" })
    |
    |  axios sends: GET http://localhost:8000/api/transactions?month=2026-03
    v
FastAPI receives the request
    |
    |  Reads CSV, filters by month, returns JSON array
    v
axios receives the response: { data: [...transactions] }
    |
    v
React calls setTransactions(data)
    |
    v
React re-renders the charts and table with the new data
```

The browser never touches the CSV file directly.
All data access goes through the FastAPI backend.

---

## 6. Charts & Visualisation Guide

### Charts included in this guide

| Chart | Recharts Component | What it shows | Why it is useful |
|---|---|---|---|
| Donut/Pie | `<PieChart>` + `<Pie innerRadius={50}>` | Category spending share | Immediately shows which category dominates your budget |
| Horizontal Bar | `<BarChart layout="vertical">` | Category totals ranked | Easy to compare amounts; labels are readable without rotation |
| Line Chart | `<LineChart>` + one `<Line>` per category | Monthly trend per category | Shows if spending is growing or shrinking over time |
| Progress Bars | Plain HTML divs with dynamic `width` | Budget used per category | Instant red/green status — no chart library needed |

### Why horizontal bars instead of vertical bars?

Your current matplotlib code uses vertical bars with `rotation=45` on the labels.
Horizontal bars are better for category names because:
- Labels sit on the Y axis and are fully readable without rotation
- The eye naturally reads left-to-right, matching the bar direction
- Ranking (longest bar = biggest expense) is immediately obvious

### Why a donut instead of a full pie?

- The hole in the center can display the total amount
- Research shows donut charts are easier to read than full pies because the eye
  compares arc lengths rather than areas
- `innerRadius={50}` creates the hole; set it to `0` for a full pie

### Suggested additional charts

#### Scatter plot — anomaly detection

Each transaction is a dot. Date on X axis, amount on Y axis.
Large dots stand out immediately as unusual transactions.

```jsx
import { ScatterChart, Scatter, ZAxis } from 'recharts';

const scatterData = transactions
  .filter(t => t.amount < 0)
  .map(t => ({
    date:   new Date(t.date).getTime(),  // convert date string to timestamp number
    amount: Math.abs(t.amount),
    name:   t.description
  }));

<ResponsiveContainer width="100%" height={250}>
  <ScatterChart>
    <XAxis
      dataKey="date"
      type="number"
      domain={['auto', 'auto']}
      tickFormatter={(v) => new Date(v).toLocaleDateString()}
    />
    <YAxis dataKey="amount" name="Amount" unit=" BGN" />
    <ZAxis dataKey="amount" range={[40, 400]} />
    {/* ZAxis controls the dot SIZE — larger amount = bigger dot
        range={[40, 400]} means dots range from 40px to 400px area */}
    <Tooltip
      cursor={{ strokeDasharray: '3 3' }}
      content={({ payload }) => {
        if (!payload || !payload.length) return null;
        const d = payload[0].payload;
        return (
          <div style={{ background: 'white', border: '1px solid #ddd', padding: '0.5rem' }}>
            <p>{new Date(d.date).toLocaleDateString()}</p>
            <p>{d.name}: {d.amount.toFixed(2)} BGN</p>
          </div>
        );
      }}
    />
    <Scatter data={scatterData} fill="#e94560" />
  </ScatterChart>
</ResponsiveContainer>
```

#### Stacked bar — income vs expenses per month

Shows net position visually — green bar for income, red bar for expenses, side by side.

```jsx
// First, build monthly summary data from the API
// Call GET /api/summary/2026-01, /api/summary/2026-02, etc. for each month
// Or add a new endpoint: GET /api/monthly-summary that returns all months at once

const monthlyData = [
  { month: '2026-01', income: 2500, expenses: 1200 },
  { month: '2026-02', income: 2500, expenses: 980 },
  { month: '2026-03', income: 2500, expenses: 1450 },
];

<ResponsiveContainer width="100%" height={300}>
  <BarChart data={monthlyData}>
    <XAxis dataKey="month" />
    <YAxis tickFormatter={(v) => `${v} BGN`} />
    <CartesianGrid strokeDasharray="3 3" />
    <Tooltip formatter={(value) => [`${value.toFixed(2)} BGN`, '']} />
    <Legend />
    <Bar dataKey="income"   fill="#2ecc71" name="Income" />
    <Bar dataKey="expenses" fill="#e94560" name="Expenses" />
  </BarChart>
</ResponsiveContainer>
```

---

## 7. Quick Reference Cheat Sheet

### Python commands

```bash
# Create virtual environment (once per project)
python -m venv venv

# Activate virtual environment (every new terminal — Windows CMD)
venv\Scripts\activate

# Activate virtual environment (every new terminal — PowerShell)
venv\Scripts\Activate.ps1

# Install a package
pip install fastapi

# Save all installed packages to requirements.txt
pip freeze > requirements.txt

# Install all packages from requirements.txt (on a new machine)
pip install -r requirements.txt

# Deactivate virtual environment
deactivate

# Start the FastAPI backend
uvicorn api.main:app --reload --port 8000
```

### npm / Node commands

```bash
# Create a new React app with Vite
npm create vite@latest my-app -- --template react

# Install all packages listed in package.json
npm install

# Install a specific package (adds it to package.json automatically)
npm install axios

# Start the React development server
npm run dev

# Build for production (creates dist/ folder)
npm run build
```

### API endpoints summary

| Method | URL | What it does | Query params |
|---|---|---|---|
| GET | `/api/transactions` | List transactions | `month`, `category`, `search` |
| GET | `/api/summary/{month}` | Income/expenses/net for a month | none |
| GET | `/api/categories` | List all categories | none |
| GET | `/api/monthly-trend` | Spending per category per month | none |
| POST | `/api/transactions` | Add a new transaction | JSON body |

### React concepts summary

| Concept | What it does | Example |
|---|---|---|
| `useState` | Stores data in a component | `const [count, setCount] = useState(0)` |
| `useEffect` | Runs code after render | `useEffect(() => { fetchData(); }, [month])` |
| `props` | Pass data from parent to child | `<Chart data={myData} />` |
| JSX | HTML-like syntax in JavaScript | `return <div>Hello</div>` |
| Arrow function | Short function syntax | `(x) => x * 2` |
| Ternary | Inline if/else | `condition ? 'yes' : 'no'` |
| Short-circuit | Conditional render | `isLoaded && <Chart />` |
| Spread operator | Copy an object/array | `{ ...prev, name: 'new' }` |
| `.map()` | Transform array | `items.map(i => <li>{i}</li>)` |
| `.filter()` | Filter array | `items.filter(i => i.amount < 0)` |
| `.reduce()` | Aggregate array | `items.reduce((acc, i) => acc + i, 0)` |

### Library summary

| Library | Language | Install | Purpose |
|---|---|---|---|
| `fastapi` | Python | `pip install fastapi` | Define HTTP routes as Python functions |
| `uvicorn` | Python | `pip install uvicorn` | Run the FastAPI server |
| `pydantic` | Python | auto with fastapi | Validate incoming JSON request bodies |
| `pandas` | Python | `pip install pandas` | Read CSV, filter/group/aggregate data |
| `react` | JavaScript | auto with vite | UI component framework |
| `vite` | JavaScript | `npm create vite@latest` | Build tool + dev server |
| `axios` | JavaScript | `npm install axios` | Make HTTP requests from React to FastAPI |
| `recharts` | JavaScript | `npm install recharts` | Chart components (Pie, Bar, Line, Scatter) |
| `react-router-dom` | JavaScript | `npm install react-router-dom` | Multi-page navigation without page reloads |

---

## 8. File Checklist — What to Create

Work through this list in order:

### Python backend

- [ ] `BudgetApp/venv/` — create with `python -m venv venv`
- [ ] `BudgetApp/.gitignore` — copy from Section 2.3
- [ ] `BudgetApp/api/__init__.py` — empty file
- [ ] `BudgetApp/api/main.py` — copy from Section 3.3
- [ ] `BudgetApp/requirements.txt` — generate with `pip freeze > requirements.txt`

### React frontend

- [ ] `budget-frontend/` — create with `npm create vite@latest budget-frontend -- --template react`
- [ ] Run `npm install` inside `budget-frontend/`
- [ ] Run `npm install axios recharts react-router-dom`
- [ ] `budget-frontend/.gitignore` — copy from Section 2.4
- [ ] `budget-frontend/src/api.js` — copy from Section 4.4
- [ ] `budget-frontend/src/App.jsx` — copy from Section 4.5
- [ ] `budget-frontend/src/pages/` — create this folder
- [ ] `budget-frontend/src/pages/Dashboard.jsx` — copy from FRONTEND_GUIDE_PAGES.md Section 4.6
- [ ] `budget-frontend/src/pages/Transactions.jsx` — copy from FRONTEND_GUIDE_PAGES.md Section 4.7
- [ ] `budget-frontend/src/pages/Budget.jsx` — copy from FRONTEND_GUIDE_PAGES.md Section 4.8

### Verify it works

- [ ] Start backend: `uvicorn api.main:app --reload --port 8000`
- [ ] Open `http://localhost:8000/docs` — you should see the Swagger UI
- [ ] Start frontend: `npm run dev`
- [ ] Open `http://localhost:5173` — you should see the Dashboard