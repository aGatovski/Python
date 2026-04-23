import type { BudgetStatus } from '../types/dashboard'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(value: number): string {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(value)
}

/** Returns colour classes based on how much of the budget has been used */
function getUsageStyle(percent: number): {
  bar: string
  text: string
  badge: string
  badgeText: string
} {
  if (percent >= 90) {
    return {
      bar: 'bg-red-500',
      text: 'text-red-600',
      badge: 'bg-red-50 border-red-100',
      badgeText: 'text-red-600',
    }
  }
  if (percent >= 70) {
    return {
      bar: 'bg-amber-400',
      text: 'text-amber-600',
      badge: 'bg-amber-50 border-amber-100',
      badgeText: 'text-amber-600',
    }
  }
  return {
    bar: 'bg-emerald-500',
    text: 'text-emerald-600',
    badge: 'bg-emerald-50 border-emerald-100',
    badgeText: 'text-emerald-600',
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface BudgetCardProps {
  budget: BudgetStatus
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Displays the monthly budget status: total budget, amount spent,
 * remaining balance, and a colour-coded progress bar.
 */
export default function BudgetCard({ budget }: BudgetCardProps) {
  const { monthlyBudget, amountSpent, remaining, usagePercent } = budget
  const styles = getUsageStyle(usagePercent)

  // Clamp bar width to 100% to avoid overflow on over-budget scenarios
  const barWidth = Math.min(usagePercent, 100)

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Monthly Budget</h3>
            <p className="text-xs text-slate-500">April 2026</p>
          </div>
        </div>

        {/* Usage badge */}
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles.badge} ${styles.badgeText}`}
        >
          {usagePercent}% used
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div
          className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={usagePercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Budget usage: ${usagePercent}%`}
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ${styles.bar}`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <BudgetStat label="Budget" value={fmt(monthlyBudget)} valueClass="text-slate-800" />
        <BudgetStat label="Spent" value={fmt(amountSpent)} valueClass={styles.text} />
        <BudgetStat
          label="Remaining"
          value={fmt(remaining)}
          valueClass={remaining >= 0 ? 'text-emerald-600' : 'text-red-500'}
        />
      </div>
    </div>
  )
}

// ─── BudgetStat ───────────────────────────────────────────────────────────────

interface BudgetStatProps {
  label: string
  value: string
  valueClass: string
}

function BudgetStat({ label, value, valueClass }: BudgetStatProps) {
  return (
    <div className="text-center">
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className={`text-sm font-bold tabular-nums ${valueClass}`}>{value}</p>
    </div>
  )
}