import React from 'react'

// ─── Props ────────────────────────────────────────────────────────────────────

interface SummaryCardProps {
  /** Card label shown above the value */
  label: string
  /** Pre-formatted currency string */
  value: string
  /** Optional percentage change vs previous period */
  trend?: number
  /** Controls accent colour scheme */
  variant: 'income' | 'expense' | 'balance'
  icon: React.ReactNode
}

// ─── Variant styles ───────────────────────────────────────────────────────────

const VARIANT_STYLES = {
  income: {
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
    valueColor: 'text-emerald-600',
    trendUp: 'text-emerald-600',
    trendDown: 'text-red-500',
  },
  expense: {
    iconBg: 'bg-red-50',
    iconColor: 'text-red-400',
    valueColor: 'text-red-500',
    trendUp: 'text-red-500',   // more spending = bad
    trendDown: 'text-emerald-600',
  },
  balance: {
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-500',
    valueColor: 'text-blue-600',
    trendUp: 'text-emerald-600',
    trendDown: 'text-red-500',
  },
} as const

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Displays a single financial metric (income, expenses, or net balance)
 * in a card with an icon, formatted value, and optional trend indicator.
 */
export default function SummaryCard({ label, value, trend, variant, icon }: SummaryCardProps) {
  const styles = VARIANT_STYLES[variant]
  const hasTrend = trend !== undefined

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-5 flex items-start gap-4">
      {/* Icon */}
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${styles.iconBg}`}
        aria-hidden="true"
      >
        <span className={styles.iconColor}>{icon}</span>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-bold mt-1 tabular-nums leading-none ${styles.valueColor}`}>
          {value}
        </p>

        {/* Trend badge */}
        {hasTrend && (
          <p
            className={`mt-1.5 text-xs font-medium flex items-center gap-0.5 ${
              trend >= 0 ? styles.trendUp : styles.trendDown
            }`}
          >
            {trend >= 0 ? (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
              </svg>
            )}
            {Math.abs(trend)}% vs last month
          </p>
        )}
      </div>
    </div>
  )
}