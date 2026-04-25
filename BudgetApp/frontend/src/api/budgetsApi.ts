import api from './client'
import type { BudgetCategory } from '../types/budget'

// ─── Backend response shapes ──────────────────────────────────────────────────

/** Raw shape returned by GET /api/budgets */
interface BudgetOut {
  id: number
  user_id: number
  category: string
  limit: number          // backend uses "limit"; frontend uses "monthlyLimit"
  period?: string
  created_at?: string
}

/**
 * Raw shape returned by GET /api/budgets/status?month=YYYY-MM.
 * The backend keys each entry by category name, not by budget id.
 */
interface BudgetStatusItem {
  category: string
  limit: number
  spent: number
  remaining?: number
  percent_used?: number
  status?: string
}

// ─── Request payload types ────────────────────────────────────────────────────

export interface CreateBudgetPayload {
  category: string
  limit: number
}

export interface UpdateBudgetPayload {
  limit: number
}

// ─── Response mapper ──────────────────────────────────────────────────────────

/**
 * Converts a raw BudgetOut from the list endpoint into the frontend
 * BudgetCategory shape, merging the spent amount from the status endpoint.
 *
 * Field renames:
 *   limit  → monthlyLimit
 *   spent  → amountSpent  (looked up from statusMap by category name)
 */
function mapBudgetOutToCategory(
  raw: BudgetOut,
  statusMap: Map<string, number>,
): BudgetCategory {
  return {
    id:           String(raw.id),
    // Cast to the union type that BudgetCategory.category expects
    category:     raw.category as BudgetCategory['category'],
    monthlyLimit: raw.limit,
    amountSpent:  statusMap.get(raw.category) ?? 0,
  }
}

// ─── Public API functions ─────────────────────────────────────────────────────

/**
 * Fetches the budget list and the month's spending status in parallel,
 * then merges them into the frontend BudgetCategory shape.
 *
 * GET /api/budgets
 * GET /api/budgets/status?month=YYYY-MM
 */
export async function fetchBudgetsWithStatus(month: string): Promise<BudgetCategory[]> {
  const [budgets, statusItems] = await Promise.all([
    api.get<BudgetOut[]>('/api/budgets'),
    api.get<BudgetStatusItem[]>(`/api/budgets/status?month=${month}`),
  ])

  // Build a lookup: category name → amount spent this month
  const statusMap = new Map<string, number>(
    statusItems.map((s) => [s.category, s.spent]),
  )

  return budgets.map((b) => mapBudgetOutToCategory(b, statusMap))
}

/**
 * Creates a new budget via POST /api/budgets.
 * The caller should re-fetch the full list (with status) after this resolves
 * to get the server-assigned id and the correct amountSpent.
 */
export async function createBudget(payload: CreateBudgetPayload): Promise<BudgetOut> {
  return api.post<BudgetOut>('/api/budgets', payload)
}

/**
 * Updates the spending limit of an existing budget via PUT /api/budgets/{id}.
 */
export async function updateBudget(id: string, payload: UpdateBudgetPayload): Promise<BudgetOut> {
  return api.put<BudgetOut>(`/api/budgets/${id}`, payload)
}

/**
 * Deletes a budget via DELETE /api/budgets/{id}.
 * The backend returns 204 No Content on success.
 */
export async function deleteBudget(id: string): Promise<void> {
  return api.delete<void>(`/api/budgets/${id}`)
}