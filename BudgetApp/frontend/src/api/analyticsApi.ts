import api from './client'
import type { MonthlyDataPoint, CategoryDataPoint, TimeRange } from '../types/analytics'

// ─── Backend response shapes ──────────────────────────────────────────────────

interface BackendMonthlySummary {
  month: string          // e.g. "2026-03"
  total_income: number
  total_expenses: number
  net: number
  savings_rate: number
}

interface BackendCategoryExpense {
  category: string
  total: number          // positive magnitude (expenses stored as negatives in DB)
}

// ─── Category colour + icon metadata ─────────────────────────────────────────
// Mirrors the map in dashboardApi.ts so both pages use consistent visuals.

const CATEGORY_META: Record<string, { color: string; icon: string }> = {
  Groceries:       { color: '#f59e0b', icon: '🛒' },
  Dining:          { color: '#f97316', icon: '🍽️' },
  Transport:       { color: '#10b981', icon: '🚗' },
  Utilities:       { color: '#3b82f6', icon: '⚡' },
  Entertainment:   { color: '#ec4899', icon: '🎬' },
  Housing:         { color: '#6366f1', icon: '🏠' },
  'Food & Dining': { color: '#f59e0b', icon: '🍽️' },
  Transportation:  { color: '#10b981', icon: '🚗' },
  Healthcare:      { color: '#14b8a6', icon: '💊' },
  Health:          { color: '#14b8a6', icon: '💊' },
  Shopping:        { color: '#f97316', icon: '🛍️' },
  Salary:          { color: '#22c55e', icon: '💼' },
  Freelance:       { color: '#a855f7', icon: '💻' },
  Investment:      { color: '#0ea5e9', icon: '📈' },
  Rent:            { color: '#6366f1', icon: '🏠' },
  Gas:             { color: '#10b981', icon: '⛽' },
  Activity:        { color: '#8b5cf6', icon: '🏃' },
  Other:           { color: '#94a3b8', icon: '📦' },
}

const DEFAULT_META = { color: '#94a3b8', icon: '💰' }

// ─── Month range helpers ──────────────────────────────────────────────────────

/**
 * Returns an array of ISO month strings (e.g. ["2026-01", "2026-02", ...])
 * for the last N months ending at the current month, sorted chronologically.
 */
function getMonthsInRange(timeRange: TimeRange): string[] {
  const count = timeRange === '3m' ? 3 : timeRange === '6m' ? 6 : 12
  const months: string[] = []
  const now = new Date()

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    months.push(key)
  }

  return months
}

/**
 * Converts an ISO month key (e.g. "2026-03") to a short label ("Mar")
 * and a full label ("March 2026").
 */
function parseMonthKey(key: string): { month: string; fullLabel: string; year: number } {
  const [yearStr, monthStr] = key.split('-')
  const year = Number(yearStr)
  const monthIndex = Number(monthStr) - 1
  const d = new Date(year, monthIndex, 1)
  return {
    month:     d.toLocaleDateString('en-IE', { month: 'short' }),
    fullLabel: d.toLocaleDateString('en-IE', { month: 'long', year: 'numeric' }),
    year,
  }
}

// ─── Public API functions ─────────────────────────────────────────────────────

/**
 * Fetches monthly income/expense summaries for the selected time range.
 * Calls GET /api/analytics/summary/{month} for each month in parallel and
 * maps the results to the MonthlyDataPoint shape used by the analytics charts.
 */
export async function fetchMonthlyData(timeRange: TimeRange): Promise<MonthlyDataPoint[]> {
  const months = getMonthsInRange(timeRange)

  const results = await Promise.all(
    months.map((m) =>
      api.get<BackendMonthlySummary>(`/api/analytics/summary/${m}`)
    )
  )

  return results.map((raw) => {
    const { month, fullLabel, year } = parseMonthKey(raw.month)
    return {
      key:      raw.month,
      month,
      fullLabel,
      year,
      income:   raw.total_income,
      expenses: raw.total_expenses,
      net:      raw.net,
    }
  })
}

/**
 * Fetches per-category expense totals for the selected time range.
 * Calls GET /api/analytics/by-category?month=YYYY-MM for each month in
 * parallel, aggregates totals across months, then computes percentages and
 * attaches colour/icon metadata.
 */
export async function fetchCategoryData(timeRange: TimeRange): Promise<CategoryDataPoint[]> {
  const months = getMonthsInRange(timeRange)

  const perMonthResults = await Promise.all(
    months.map((m) =>
      api.get<BackendCategoryExpense[]>(`/api/analytics/by-category?month=${m}`)
    )
  )

  // Aggregate totals across all months in the range
  const totalsMap = new Map<string, number>()
  for (const monthRows of perMonthResults) {
    for (const row of monthRows) {
      totalsMap.set(row.category, (totalsMap.get(row.category) ?? 0) + row.total)
    }
  }

  const grandTotal = Array.from(totalsMap.values()).reduce((s, v) => s + v, 0)

  return Array.from(totalsMap.entries())
    .map(([category, amount]) => {
      const meta = CATEGORY_META[category] ?? DEFAULT_META
      return {
        category,
        amount:     Math.round(amount * 100) / 100,
        percentage: grandTotal > 0 ? (amount / grandTotal) * 100 : 0,
        color:      meta.color,
        icon:       meta.icon,
      }
    })
    .sort((a, b) => b.amount - a.amount)
}