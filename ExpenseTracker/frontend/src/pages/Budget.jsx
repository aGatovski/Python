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

                    const spent = spentByCategory[category] || 0;
                    const pct = Math.min(spent / limit, 1);
                    // Math.min caps the percentage at 1.0 (100%) so the bar does not overflow

                    const isOver = spent > limit;
                    const isWarn = pct >= 0.75 && !isOver;
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
            </div>
        </div>
    );
}

export default Budget;
