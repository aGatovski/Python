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
                    {t.amount >= 0 ? '+' : ''}{t.amount.toFixed(2)} EUR
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