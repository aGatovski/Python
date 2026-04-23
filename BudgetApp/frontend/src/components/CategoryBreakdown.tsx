import type { CategoryExpense } from '../types/dashboard'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(value: number): string {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(value)
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CategoryBreakdownProps {
  categories: CategoryExpense[]
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Renders a ranked list of expense categories with:
 * - Colour-coded dot indicator
 * - Category name and emoji icon
 * - Amount spent
 * - Proportional bar showing share of total spending
 */
export default function CategoryBreakdown({ categories }: CategoryBreakdownProps) {
  // Sort descending by amount for visual clarity
  const sorted = [...categories].sort((a, b) => b.amount - a.amount)
  const total = sorted.reduce((sum, c) => sum + c.amount, 0)

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Expenses by Category</h3>
            <p className="text-xs text-slate-500">April 2026 · {fmt(total)} total</p>
          </div>
        </div>
      </div>

      {/* Category rows */}
      <ul className="space-y-3" role="list" aria-label="Expense categories">
        {sorted.map((item) => {
          const percent = total > 0 ? (item.amount / total) * 100 : 0

          return (
            <li key={item.category} className="group">
              {/* Label row */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  {/* Colour dot */}
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                    aria-hidden="true"
                  />
                  {/* Icon + name */}
                  <span className="text-sm text-slate-700 font-medium truncate">
                    <span className="mr-1" aria-hidden="true">{item.icon}</span>
                    {item.category}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                  <span className="text-xs text-slate-400 tabular-nums">
                    {percent.toFixed(1)}%
                  </span>
                  <span className="text-sm font-semibold text-slate-800 tabular-nums">
                    {fmt(item.amount)}
                  </span>
                </div>
              </div>

              {/* Proportional bar */}
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${percent}%`,
                    backgroundColor: item.color,
                  }}
                  role="presentation"
                />
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}