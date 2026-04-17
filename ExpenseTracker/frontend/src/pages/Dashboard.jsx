import { useEffect, useState } from "react";
import { getTransactions, getSummary } from "../api";

export default function Dashboard() {
	const [transactions, setTransactions] = useState([]);
	const [summary, setSummary] = useState(null);

	const currentMonth = (() => {
		const now = new Date();
		return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
	})();

	useEffect(() => {
		getTransactions({ month: currentMonth }).then(res => setTransactions(res.data));
		getSummary(currentMonth)
			.then(res => setSummary(res.data))
			.catch(() => setSummary(null));
	}, []);

	return (
		<div style={{ padding: '1.5rem' }}>
			<h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Monthly Dashboard</h1>

			{/* Summary cards */}
			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
				<div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', padding: '1rem' }}>
					<p style={{ color: '#6b7280', margin: 0 }}>Net Balance</p>
					<p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
						{summary ? `$${summary.net.toFixed(2)}` : "—"}
					</p>
				</div>
				<div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', padding: '1rem' }}>
					<p style={{ color: '#6b7280', margin: 0 }}>Total Income</p>
					<p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a', margin: 0 }}>
						{summary ? `$${summary.income.toFixed(2)}` : "—"}
					</p>
				</div>
				<div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', padding: '1rem' }}>
					<p style={{ color: '#6b7280', margin: 0 }}>Total Expenses</p>
					<p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626', margin: 0 }}>
						{summary ? `$${summary.expenses.toFixed(2)}` : "—"}
					</p>
				</div>
			</div>

			{/* Recent transactions */}
			<h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>Monthly Transactions</h2>
			{transactions.length === 0 ? (
				<p style={{ color: '#9ca3af' }}>No transactions yet.</p>
			) : (
				<ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
					{transactions.reverse().map((t, i) => (
						<li key={i} style={{ borderBottom: '1px solid #e5e7eb', padding: '0.5rem 0', display: 'flex', justifyContent: 'space-between' }}>
							<span>
								{t.description}{' '}
								<span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>({t.category})</span>
							</span>
							<span style={{ color: t.amount >= 0 ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>
								{t.amount >= 0 ? "+" : "-"}${Math.abs(t.amount).toFixed(2)}
							</span>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}