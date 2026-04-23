import api from './client'
import type { DashboardData, MonthlySummary, BudgetStatus, CategoryExpense } from '../types/dashboard'

// ─── Backend response shapes ──────────────────────────────────────────────────
// These mirror the JSON returned by GET /api/analytics/overview

interface BackendSummary {
  month: string
  total_income: number
  total_expenses: number
  net: number
  savings_rate?: number
  transaction_count?: number
}

interface BackendCategoryExpense {
  category: string
  total: number
}

interface BackendBudgetEntry {
  category?: string
  limit: number
  spent: number
  remaining?: number
  percent_used?: number
  status?: 'on_track' | 'warning' | 'exceeded'
}

interface BackendOverviewResponse {
  month: string
  summary: BackendSummary
  expenses_by_category: BackendCategoryExpense[]
  budget_status: BackendBudgetEntry[]
}

// ─── Category colour + icon metadata ─────────────────────────────────────────
// Maps category names (from both backend and frontend) to visual metadata.
// Backend currently returns: Groceries, Dining, Transport, Utilities, Entertainment

const CATEGORY_META: Record<string, { color: string; icon: string }> = {
  // Backend category names
  Groceries:     { color: '#f59e0b', icon: '🛒' },
  Dining:        { color: '#f97316', icon: '🍽️' },
  Transport:     { color: '#10b981', icon: '🚗' },
  Utilities:     { color: '#3b82f6', icon: '⚡' },
  Entertainment: { color: '#ec4899', icon: '🎬' },
  // Frontend / transaction category names
  Housing:          { color: '#6366f1', icon: '🏠' },
  'Food & Dining':  { color: '#f59e0b', icon: '🍽️' },
  Transportation:   { color: '#10b981', icon: '🚗' },
  Healthcare:       { color: '#14b8a6', icon: '💊' },
  Health:           { color: '#14b8a6', icon: '💊' },
  Shopping:         { color: '#f97316', icon: '🛍️' },
  Salary:           { color: '#22c55e', icon: '💼' },
  Freelance:        { color: '#a855f7', icon: '💻' },
  Investment:       { color: '#0ea5e9', icon: '📈' },
  Transfer:         { color: '#64748b', icon: '↔️' },
  Other:            { color: '#94a3b8', icon: '📦' },
}

const DEFAULT_META = { color: '#94a3b8', icon: '💰' }

// ─── Month label formatter ────────────────────────────────────────────────────
// Converts "2026-04" → "April 2026"

function formatMonthLabel(isoMonth: string): string {
  const [year, month] = isoMonth.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('en-IE', {
    month: 'long',
    year: 'numeric',
  })
}

// ─── Response mappers ─────────────────────────────────────────────────────────

function mapSummary(raw: BackendSummary): MonthlySummary {
  return {
    month: formatMonthLabel(raw.month),
    totalIncome: raw.total_income,
    totalExpenses: raw.total_expenses,
    netBalance: raw.net,
  }
}

/**
 * Aggregates the per-category budget entries into a single overall BudgetStatus.
 * Falls back to zero values if the array is empty.
 */
function mapBudgetStatus(entries: BackendBudgetEntry[]): BudgetStatus {
  if (entries.length === 0) {
    return { monthlyBudget: 0, amountSpent: 0, remaining: 0, usagePercent: 0 }
  }

  const monthlyBudget = entries.reduce((sum, e) => sum + e.limit, 0)
  const amountSpent   = entries.reduce((sum, e) => sum + e.spent, 0)
  const remaining     = monthlyBudget - amountSpent
  const usagePercent  = monthlyBudget > 0
    ? Math.round((amountSpent / monthlyBudget) * 100)
    : 0

  return { monthlyBudget, amountSpent, remaining, usagePercent }
}

function mapCategoryExpenses(raw: BackendCategoryExpense[]): CategoryExpense[] {
  return raw.map((item) => {
    const meta = CATEGORY_META[item.category] ?? DEFAULT_META
    return {
      category: item.category,
      amount: item.total,
      color: meta.color,
      icon: meta.icon,
    }
  })
}

// ─── Public API function ──────────────────────────────────────────────────────

/**
 * Fetches the dashboard overview from GET /api/analytics/overview and maps
 * the snake_case backend response to the camelCase DashboardData shape used
 * by DashboardPage and its child components.
 */
export async function fetchDashboardOverview(): Promise<DashboardData> {
  const raw = await api.get<BackendOverviewResponse>('/api/analytics/overview')

  return {
    summary:          mapSummary(raw.summary),
    budget:           mapBudgetStatus(raw.budget_status),
    categoryExpenses: mapCategoryExpenses(raw.expenses_by_category),
  }
}