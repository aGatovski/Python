import { useEffect, useState } from 'react';
import { getTransactions } from '../api';

// Default budget limits per category (in BGN)
const DEFAULT_BUDGETS = {
  Groceries: 300,
  Gas: 100,
  Transport: 80,
  Entertainment: 50,
  Sport: 40,
  Other: 200,
};

function Budget() {
  const [spentByCategory, setSpentByCategory] = useState({});
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [month, setMonth] = useState(currentMonth);

  useEffect(() => {
    getTransactions({ month })
      .then(res => {
        const expenses = res.data.filter(t => t.amount < 0);

        // Build an object: { Groceries: 187.45, Gas: 16.16, ... }
        const spent = expenses.reduce((acc, t) => {
          const cat = t.category;
          acc[cat] = (acc[cat] || 0) + Math.abs(t.amount);
          return acc;
        }, {});

        // Round all values to 2 decimal places
        Object.keys(spent).forEach(cat => {
          spent[cat] = Math.round(spent[cat] * 100) / 100;
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
        {Object.entries(DEFAULT_BUDGETS).map(([category, limit]) => {
          const spent = spentByCategory[category] || 0;
          const pct = Math.min(spent / limit, 1);

          const isOver = spent > limit;
          const isWarn = pct >= 0.75 && !isOver;
          const barColor = isOver ? '#c62828' : isWarn ? '#f57c00' : '#2e7d32';

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

              {/* Progress bar */}
              <div style={{ background: '#e0e0e0', borderRadius: '4px', height: '12px', overflow: 'hidden' }}>
                <div style={{
                  width: `${pct * 100}%`,
                  background: barColor,
                  height: '100%',
                  borderRadius: '4px',
                  transition: 'width 0.3s ease',
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
      </div>
    </div>
  );
}

export default Budget;