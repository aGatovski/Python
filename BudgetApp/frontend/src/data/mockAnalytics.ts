import type { MonthlyDataPoint, CategoryDataPoint, TimeRange } from '../types/analytics'

// ─── Raw Monthly Data ─────────────────────────────────────────────────────────
// 12 months of realistic personal-finance figures for 2024.
// Income includes salary + occasional freelance; expenses reflect real-world
// seasonal patterns (higher in summer/December, lower in Q1).

const ALL_MONTHLY_DATA: MonthlyDataPoint[] = [
  {
    key: '2024-01', month: 'Jan', fullLabel: 'January 2024',  year: 2024,
    income: 4_500, expenses: 2_780, net:  1_720,
  },
  {
    key: '2024-02', month: 'Feb', fullLabel: 'February 2024', year: 2024,
    income: 4_500, expenses: 3_050, net:  1_450,
  },
  {
    key: '2024-03', month: 'Mar', fullLabel: 'March 2024',    year: 2024,
    income: 5_350, expenses: 2_640, net:  2_710,  // freelance boost
  },
  {
    key: '2024-04', month: 'Apr', fullLabel: 'April 2024',    year: 2024,
    income: 5_700, expenses: 3_180, net:  2_520,
  },
  {
    key: '2024-05', month: 'May', fullLabel: 'May 2024',      year: 2024,
    income: 4_500, expenses: 2_920, net:  1_580,
  },
  {
    key: '2024-06', month: 'Jun', fullLabel: 'June 2024',     year: 2024,
    income: 4_500, expenses: 3_410, net:  1_090,  // summer spending uptick
  },
  {
    key: '2024-07', month: 'Jul', fullLabel: 'July 2024',     year: 2024,
    income: 4_500, expenses: 3_870, net:    630,  // summer holiday
  },
  {
    key: '2024-08', month: 'Aug', fullLabel: 'August 2024',   year: 2024,
    income: 4_500, expenses: 3_120, net:  1_380,
  },
  {
    key: '2024-09', month: 'Sep', fullLabel: 'September 2024', year: 2024,
    income: 5_200, expenses: 2_850, net:  2_350,  // freelance project
  },
  {
    key: '2024-10', month: 'Oct', fullLabel: 'October 2024',  year: 2024,
    income: 4_500, expenses: 3_010, net:  1_490,
  },
  {
    key: '2024-11', month: 'Nov', fullLabel: 'November 2024', year: 2024,
    income: 4_500, expenses: 3_540, net:    960,  // Black Friday shopping
  },
  {
    key: '2024-12', month: 'Dec', fullLabel: 'December 2024', year: 2024,
    income: 4_500, expenses: 4_230, net:    270,  // Christmas & year-end
  },
]

// ─── Category Breakdown Data ──────────────────────────────────────────────────
// Per-category spending totals for the full 12-month period.
// Percentages are pre-computed from the total; they are recalculated at
// runtime when a shorter time range is selected.

const FULL_YEAR_CATEGORY_TOTALS: Omit<CategoryDataPoint, 'percentage'>[] = [
  { category: 'Housing',       amount: 15_000, color: '#6366f1', icon: '🏠' },
  { category: 'Food & Dining', amount:  5_240, color: '#f59e0b', icon: '🍽️' },
  { category: 'Transportation',amount:  2_160, color: '#10b981', icon: '🚗' },
  { category: 'Utilities',     amount:  1_680, color: '#3b82f6', icon: '⚡' },
  { category: 'Entertainment', amount:  1_920, color: '#ec4899', icon: '🎬' },
  { category: 'Healthcare',    amount:  1_440, color: '#14b8a6', icon: '💊' },
  { category: 'Shopping',      amount:  3_120, color: '#f97316', icon: '🛍️' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the last N months of data from the full dataset.
 * The dataset is already sorted chronologically.
 */
export function getMonthlyData(range: TimeRange): MonthlyDataPoint[] {
  const count = range === '3m' ? 3 : range === '6m' ? 6 : 12
  return ALL_MONTHLY_DATA.slice(-count)
}

/**
 * Returns category breakdown data scaled to the selected time range.
 * For simplicity, we scale the full-year totals proportionally by the
 * number of months selected — a realistic approximation for mock data.
 */
export function getCategoryData(range: TimeRange): CategoryDataPoint[] {
  const months = range === '3m' ? 3 : range === '6m' ? 6 : 12
  const scale = months / 12

  const scaled = FULL_YEAR_CATEGORY_TOTALS.map(c => ({
    ...c,
    amount: Math.round(c.amount * scale),
  }))

  const total = scaled.reduce((sum, c) => sum + c.amount, 0)

  return scaled
    .map(c => ({
      ...c,
      percentage: total > 0 ? (c.amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
}