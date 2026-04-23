// ─── Analytics Data Types ─────────────────────────────────────────────────────

/** Time range options for filtering analytics views */
export type TimeRange = '3m' | '6m' | '12m'

export const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: '3m',  label: 'Last 3 months'  },
  { value: '6m',  label: 'Last 6 months'  },
  { value: '12m', label: 'Last 12 months' },
]

/** Aggregated financial data for a single calendar month */
export interface MonthlyDataPoint {
  /** Short label used on chart axes, e.g. "Jan" */
  month: string
  /** Full human-readable label, e.g. "January 2024" */
  fullLabel: string
  year: number
  /** ISO month key for sorting/filtering, e.g. "2024-01" */
  key: string
  /** Total income for the month (positive) */
  income: number
  /** Total expenses for the month (positive magnitude) */
  expenses: number
  /** income − expenses */
  net: number
}

/** Spending breakdown for a single expense category over a period */
export interface CategoryDataPoint {
  category: string
  /** Total amount spent in the period */
  amount: number
  /** Share of total spending, 0–100 */
  percentage: number
  /** Hex colour for visual indicators */
  color: string
  /** Emoji icon */
  icon: string
}

/** High-level summary metrics computed for the selected time range */
export interface AnalyticsSummary {
  totalIncome: number
  totalExpenses: number
  netSavings: number
  /** (netSavings / totalIncome) × 100, clamped to 0 */
  savingsRate: number
  /** Mean monthly expense across the selected period */
  avgMonthlyExpenses: number
  /** Category with the highest total spending */
  topCategory: string
  /**
   * Month-over-month expense change for the most recent month,
   * expressed as a percentage. Positive = spending went up.
   */
  expenseTrend: number
}