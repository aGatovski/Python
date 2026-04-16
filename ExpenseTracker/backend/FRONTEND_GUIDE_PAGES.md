# Frontend Guide — Part 2: Page Components, Running & Reference

> This is a continuation of `FRONTEND_GUIDE.md`.
> It covers Dashboard.jsx, Transactions.jsx, Budget.jsx, how to run the app, and a cheat sheet.

---

## 4.6 Complete `Dashboard.jsx`

Create `budget-frontend/src/pages/Dashboard.jsx`:

```jsx
import { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line,
  ResponsiveContainer
} from 'recharts';
import { getTransactions, getSummary, getMonthlyTrend } from '../api';

const COLORS = ['#e94560', '#0f3460', '#533483', '#f5a623', '#16213e', '#2ecc71'];

const MONTHS = [
  { value: '2026-01', label: 'January 2026' },
  { value: '2026-02', label: 'February 2026' },
  { value: '2026-03', label: 'March 2026' },
  { value: '2026-04', label: 'April 2026' },
];

function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [summary,      setSummary]      = useState(null);
  const [trendData,    setTrendData]    = useState([]);
  const [month,        setMonth]        = useState('2026-03');
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    // useEffect runs this function after the component renders.
    // The [month] dependency array means: re-run whenever 'month' changes.
    setLoading(true);

    // Promise.all runs multiple async operations simultaneously and waits for ALL of them.
    // This is faster than running them one after another.
    Promise.all([
      getTransactions({ month }),  // fetch transactions for selected month
      getSummary(month),           // fetch income/expenses/net for selected month
      getMonthlyTrend(),           // fetch all-time trend data (not filtered by month)
    ])
      .then(([txRes, sumRes, trendRes]) => {
        // Destructuring: the array of results maps to [txRes, sumRes, trendRes]
        // txRes.data    = the transactions array from the API
        // sumRes.data   = { income, expenses, net, transaction_count }
        // trendRes.data = the monthly trend array
        setTransactions(txRes.data);
        setSummary(sumRes.data);
        setTrendData(trendRes.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load data:', err);
        setLoading(false);
      });
  }, [month]);
  // [month] is the dependency array. React watches this value.
  // When it changes, the effect runs again.

  // Compute category totals — JavaScript equivalent of pandas groupby("category").sum()
  const expenses = transactions.filter(t => t.amount < 0);
  // .filter() returns a new array containing only items where the condition is true

  const categoryTotals = Object.values(
    expenses.reduce((accumulator, transaction) => {
      // .reduce() iterates over the array and builds up a single result
      const cat = transaction.category;
      if (!accumulator[cat]) {
        accumulator[cat] = { category: cat, total: 0 };
      }
      accumulator[cat].total += Math.abs(transaction.amount);
      // Math.abs() gives the absolute value (removes the negative sign)
      return accumulator;
    }, {})
    // {} is the initial value of the accumulator (empty object)
  );
  // Object.values() extracts just the values from the object
  // Result: [{ category: "Groceries", total: 187.45 }, { category: "Gas", total: 16.16 }]

  if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>;
  // Conditional rendering: if loading is true, show a loading message.
  // This prevents errors from trying to render charts with no data.

  return (
    <div>
      <h1>Dashboard</h1>

      {/* MONTH SELECTOR */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label><strong>Select Month: </strong></label>
        <select value={month} onChange={e => setMonth(e.target.value)}>
          {/* e.target.value is the value of the selected option.
              setMonth(e.target.value) updates state, which triggers useEffect to re-fetch. */}
          {MONTHS.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
            // key={m.value} is required by React when rendering lists.
            // React uses it to track which items changed, added, or removed.
          ))}
        </select>
      </div>

      {/* KPI CARDS */}
      {summary && (
        // summary && (...) is short-circuit evaluation.
        // If summary is null (falsy), nothing renders.
        // If summary has data (truthy), the cards render.
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ background: '#e8f5e9', padding: '1rem', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.85rem', color: '#555' }}>Income</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#2e7d32' }}>
              {summary.income.toFixed(2)} BGN
              {/* .toFixed(2) formats to exactly 2 decimal places: 187.4 becomes "187.40" */}
            </div>
          </div>
          <div style={{ background: '#ffebee', padding: '1rem', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.85rem', color: '#555' }}>Expenses</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#c62828' }}>
              {summary.expenses.toFixed(2)} BGN
            </div>
          </div>
          <div style={{ background: summary.net >= 0 ? '#e8f5e9' : '#ffebee', padding: '1rem', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.85rem', color: '#555' }}>Net Balance</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: summary.net >= 0 ? '#2e7d32' : '#c62828' }}>
              {summary.net >= 0 ? '+' : ''}{summary.net.toFixed(2)} BGN
              {/* Ternary: condition ? valueIfTrue : valueIfFalse
                  If net >= 0, prepend '+'. Otherwise the number already has '-'. */}
            </div>
          </div>
          <div style={{ background: '#e3f2fd', padding: '1rem', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.85rem', color: '#555' }}>Transactions</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#1565c0' }}>
              {summary.transaction_count}
            </div>
          </div>
        </div>
      )}

      {/* PIE CHART + BAR CHART side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>

        <div>
          <h2>Spending by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            {/* ResponsiveContainer makes the chart fill 100% of its parent's width.
                height={300} sets a fixed height in pixels. */}
            <PieChart>
              <Pie
                data={categoryTotals}
                dataKey="total"
                nameKey="category"
                cx="50%" cy="50%"
                outerRadius={100}
                innerRadius={50}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {/* data={categoryTotals}  — the array of objects
                    dataKey="total"        — which field is the numeric value (slice size)
                    nameKey="category"     — which field is the label
                    outerRadius={100}      — outer edge of the pie in pixels
                    innerRadius={50}       — creates a donut hole (0 = full pie, no hole)
                    label={...}            — custom label: shows name + percentage */}
                {categoryTotals.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  // Cell sets the color for each individual slice.
                  // index % COLORS.length cycles through colors if there are more slices than colors.
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value.toFixed(2)} BGN`, 'Amount']} />
              {/* Tooltip formatter receives (value, name) and returns [formattedValue, label]
                  This shows "187.45 BGN" instead of just "187.45" in the hover popup. */}
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h2>Category Breakdown</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={[...categoryTotals].sort((a, b) => b.total - a.total)}
              layout="vertical"
              margin={{ left: 80 }}
            >
              {/* [...categoryTotals] creates a copy of the array (spread operator)
                  .sort((a, b) => b.total - a.total) sorts descending by total
                  layout="vertical" makes horizontal bars (category on Y axis)
                  margin={{ left: 80 }} adds space for category name labels */}
              <XAxis type="number" tickFormatter={(v) => `${v.toFixed(0)}`} />
              <YAxis type="category" dataKey="category" width={80} />
              {/* type="number" because X axis shows amounts
                  type="category" because Y axis shows category names */}
              <CartesianGrid strokeDasharray="3 3" />
              {/* strokeDasharray="3 3" makes dashed grid lines (3px dash, 3px gap) */}
              <Tooltip formatter={(value) => [`${value.toFixed(2)} BGN`, 'Spent']} />
              <Bar dataKey="total" fill="#e94560" radius={[0, 4, 4, 0]} />
              {/* radius={[0, 4, 4, 0]} — rounded corners on the right end of each bar
                  Array order: [top-left, top-right, bottom-right, bottom-left] */}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* MONTHLY TREND LINE CHART */}
      <div style={{ marginBottom: '2rem' }}>
        <h2>Monthly Spending Trend</h2>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart margin={{ bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" type="category" allowDuplicatedCategory={false} angle={-45} textAnchor="end" />
            {/* angle={-45} rotates the month labels 45 degrees to prevent overlap */}
            <YAxis tickFormatter={(v) => `${v} BGN`} />
            <Tooltip formatter={(value) => [`${value.toFixed(2)} BGN`, '']} />
            <Legend />
            {[...new Set(trendData.map(d => d.category))].map((cat, i) => (
              // new Set() removes duplicates from the array of category names
              // [...new Set(...)] converts the Set back to an array
              // .map() creates one Line component per category
              <Line
                key={cat}
                type="monotone"
                dataKey="total"
                data={trendData.filter(d => d.category === cat)}
                name={cat}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              // type="monotone" — smooth curved line
              // data={...} — filter the trend data to only this category's rows
              // dot={{ r: 4 }} — show dots at each data point, radius 4px
              // activeDot={{ r: 6 }} — larger dot when hovered
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default Dashboard;
```

---

## 4.7 Complete `Transactions.jsx`

Create `budget-frontend/src/pages/Transactions.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { getTransactions, addTransaction } from '../api';

const CATEGORIES = ['Groceries', 'Gas', 'Transport', 'Entertainment', 'Sport', 'Other'];

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [search,       setSearch]       = useState('');
  const [filterCat,    setFilterCat]    = useState('');
  const [filterMonth,  setFilterMonth]  = useState('');
  const [loading,      setLoading]      = useState(false);

  // Form state — one object holds all form fields
  const [form, setForm] = useState({ date: '', description: '', amount: '', category: 'Other' });
  // Storing all form fields in one object is cleaner than 4 separate useState calls.

  const [submitMsg, setSubmitMsg] = useState('');

  // Fetch transactions whenever any filter changes
  useEffect(() => {
    setLoading(true);
    const params = {};
    if (filterMonth) params.month    = filterMonth;
    if (filterCat)   params.category = filterCat;
    if (search)      params.search   = search;
    // Build the params object only with filters that have values.
    // Empty strings are falsy in JavaScript, so 'if (filterMonth)' skips it when empty.

    getTransactions(params)
      .then(res => { setTransactions(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [search, filterCat, filterMonth]);
  // Re-run whenever search, filterCat, or filterMonth changes.

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    // e.target is the input element that changed.
    // name is the input's 'name' attribute; value is what the user typed.
    setForm(prev => ({ ...prev, [name]: value }));
    // Spread operator: { ...prev } copies all existing form fields.
    // [name]: value uses the variable 'name' as the key (computed property name).
    // This updates only the changed field, leaving others unchanged.
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // e.preventDefault() stops the browser's default form submission (which reloads the page).
    try {
      await addTransaction({
        date:        form.date,
        description: form.description,
        amount:      parseFloat(form.amount),
        // parseFloat converts the string "-12.50" to the number -12.50
        category:    form.category,
      });
      setSubmitMsg('Transaction added!');
      setForm({ date: '', description: '', amount: '', category: 'Other' });
      // Reset the form fields after successful submission
      getTransactions({}).then(res => setTransactions(res.data));
      // Re-fetch all transactions to show the new one in the table
      setTimeout(() => setSubmitMsg(''), 3000);
      // Clear the success message after 3 seconds (3000 milliseconds)
    } catch (err) {
      setSubmitMsg('Failed to add transaction. Check all fields.');
    }
  };

  return (
    <div>
      <h1>Transactions</h1>

      {/* ADD TRANSACTION FORM — collapsible using native HTML details/summary */}
      <details style={{ marginBottom: '2rem', border: '1px solid #ddd', padding: '1rem', borderRadius: '8px' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Add New Transaction</summary>
        {/* details and summary are native HTML elements that create a collapsible section.
            No JavaScript needed — the browser handles the open/close toggle. */}
        <form
          onSubmit={handleSubmit}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}
        >
          {/* onSubmit={handleSubmit} calls our function when the form is submitted */}
          <div>
            <label>Date</label><br />
            <input type="date" name="date" value={form.date} onChange={handleFormChange} required />
            {/* type="date" renders a native date picker.
                name="date" matches the key in our form state object.
                value={form.date} makes this a controlled input — React controls its value.
                onChange={handleFormChange} updates state when the user changes the value.
                required means the form cannot be submitted if this field is empty. */}
          </div>
          <div>
            <label>Description</label><br />
            <input
              type="text" name="description" value={form.description}
              onChange={handleFormChange} required placeholder="e.g. Lidl"
            />
          </div>
          <div>
            <label>Amount (negative = expense)</label><br />
            <input
              type="number" name="amount" value={form.amount}
              onChange={handleFormChange} required step="0.01" placeholder="-12.50"
            />
            {/* step="0.01" allows decimal values with up to 2 decimal places */}
          </div>
          <div>
            <label>Category</label><br />
            <select name="category" value={form.category} onChange={handleFormChange}>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            {/* gridColumn: '1 / -1' makes this div span all columns */}
            <button type="submit">Add Transaction</button>
            {submitMsg && <span style={{ marginLeft: '1rem' }}>{submitMsg}</span>}
            {/* submitMsg && <span> only renders the span if submitMsg is not empty */}
          </div>
        </form>
      </details>

      {/* FILTERS */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search description..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '0.5rem', minWidth: '200px' }}
        />
        <input
          type="month"
          value={filterMonth}
          onChange={e => setFilterMonth(e.target.value)}
          style={{ padding: '0.5rem' }}
        />
        {/* type="month" renders a native month picker showing "2026-03" */}
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ padding: '0.5rem' }}>
          <option value="">All Categories</option>
          {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <button onClick={() => { setSearch(''); setFilterMonth(''); setFilterCat(''); }}>
          Clear Filters
        </button>
        {/* Setting all filters to empty strings resets them,
            which triggers useEffect to re-fetch all data. */}
      </div>

      {/* TRANSACTION TABLE */}
      {loading ? <p>Loading...</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          {/* borderCollapse: 'collapse' merges adjacent cell borders into one line */}
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Date</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Description</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Category</th>
              <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              // Sort by date descending: newest first.
              // new Date(string) converts "2026-03-15" to a Date object.
              // Subtracting two Date objects gives the difference in milliseconds.
              .map((t, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                  {/* Alternating row colors (zebra striping) for readability.
                      i % 2 === 0 is true for even rows (0, 2, 4...) */}
                  <td style={{ padding: '0.6rem', borderBottom: '1px solid #eee' }}>{t.date}</td>
                  <td style={{ padding: '0.6rem', borderBottom: '1px solid #eee' }}>{t.description}</td>
                  <td style={{ padding: '0.6rem', borderBottom: '1px solid #eee' }}>
                    <span style={{ background: '#e3f2fd', padding: '2px 8px', borderRadius: '12px', fontSize: '0.85rem' }}>
                      {t.category}
                    </span>
                  </td>
                  <td style={{
                    padding: '0.6rem', borderBottom: '1px solid #eee', textAlign: 'right',
                    color: t.amount < 0 ? '#c62828' : '#2e7d32', fontWeight: 'bold'
                  }}>
                    {t.amount >= 0 ? '+' : ''}{t.amount.toFixed(2)} BGN
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      )}
      <p style={{ color: '#888', marginTop: '0.5rem' }}>{transactions.length} transactions shown</p>
    </div>
  );
}

export default Transactions;
```

---

## 4.8 Complete `Budget.jsx`

Create `budget-frontend/src/pages/Budget.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { getTransactions } from '../api';

// Default budget limits per category (in BGN)
const DEFAULT_BUDGETS = {
  Groceries:     300,
  Gas:           100,
  Transport:      80,
  Entertainment:  50,
  Sport:          40,
  Other:         200,
};

function Budget() {
  const [spentByCategory, setSpentByCategory] = useState({});
  const [month, setMonth] = useState('2026-03');

  useEffect(() => {
    getTransactions({ month })
      .then(res => {
        const expenses = res.data.filter(t => t.amount < 0);

        // Build an object: { Groceries: 187.45, Gas: 16.16, ... }
        const spent = expenses.reduce((acc, t) => {
          const cat = t.category;
          acc[cat] = (acc[cat] || 0) + Math.abs(t.amount);
          // acc[cat] || 0 means: use the existing value, or 0 if not seen yet
          return acc;
        }, {});

        // Round all values to 2 decimal places
        Object.keys(spent).forEach(cat => {
          spent[cat] = Math.round(spent[cat] * 100) / 100;
          // Multiply by 100, round to integer, divide by 100 = 2 decimal places
          // This avoids floating point issues like 187.4500000001
        });

        setSpentByCategory(spent);
      });
  }, [month]);

  return (
    <div>
      <h1>Budget Status</h1>

      <div style={{ marginBottom: '1.5rem' }}>
        <label><strong>Month: </strong></label>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {/*
          repeat(auto-fill, minmax(300px, 1fr)):
          - auto-fill: create as many columns as fit in the available width
          - minmax(300px, 1fr): each column is at least 300px wide, at most 1 fraction of space
          This creates a responsive grid that adjusts to screen width automatically.
        */}

        {Object.entries(DEFAULT_BUDGETS).map(([category, limit]) => {
          // Object.entries() converts { Groceries: 300, Gas: 100 }
          // into [["Groceries", 300], ["Gas", 100]]
          // Destructuring [category, limit] unpacks each pair.

          const spent    = spentByCategory[category] || 0;
          const pct      = Math.min(spent / limit, 1);
          // Math.min caps the percentage at 1.0 (100%) so the bar does not overflow

          const isOver   = spent > limit;
          const isWarn   = pct >= 0.75 && !isOver;
          const barColor = isOver ? '#c62828' : isWarn ? '#f57c00' : '#2e7d32';
          // Red if over budget, orange if warning (75-100%), green if safe

          return (
            <div key={category} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <strong>
                  {isOver ? '🔴' : isWarn ? '🟡' : '🟢'} {category}
                </strong>
                <span style={{ color: isOver ? '#c62828' : '#333' }}>
                  {spent.toFixed(2)} / {limit} BGN
                </span>
              </div>

              {/* Progress bar — built from plain HTML divs, no library needed */}
              <div style={{ background: '#e0e0e0', borderRadius: '4px', height: '12px', overflow: 'hidden' }}>
                <div style={{
                  width: `${pct * 100}%`,
                  // Template literal: if pct = 0.62, width becomes "62%"
                  background: barColor,
                  height: '100%',
                  borderRadius: '4px',
                  transition: 'width 0.3s ease',
                  // CSS transition: animates the width change over 0.3 seconds
                }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', fontSize: '0.85rem', color: '#666' }}>
                <span>{(pct * 100).toFixed(0)}% used</span>
                <span>
                  {isOver
                    ? `Over by ${(spent - limit).toFixed(2)} BGN`
                    : `${(limit - spent).toFixed(2)} BGN remaining`}
                </span>
              </div>
            </div>
          );
        })}