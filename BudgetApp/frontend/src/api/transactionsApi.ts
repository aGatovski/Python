import api from './client'
import { useAuthStore } from '../store/authStore'
import type { Transaction, TransactionCategory } from '../types/transaction'

const BASE_URL = 'http://localhost:8000'

// ─── Backend response shape ───────────────────────────────────────────────────
// Mirrors the TransactionOut schema returned by GET /api/transactions

interface BackendTransaction {
  id: number
  user_id: number
  date: string
  amount: number
  category: string
  description: string
  is_fixed: boolean
  is_recurring: boolean
  recurring_rule_id: number | null
  created_at: string
}

// ─── Category normaliser ──────────────────────────────────────────────────────
// The backend may return category names that differ slightly from the frontend
// TransactionCategory union. Map known variants; fall back to "Other".

const CATEGORY_MAP: Record<string, TransactionCategory> = {
  // Backend names → frontend TransactionCategory
  Groceries:     'Food & Dining',
  Dining:        'Food & Dining',
  'Food & Dining': 'Food & Dining',
  Transport:     'Transportation',
  Transportation: 'Transportation',
  Utilities:     'Utilities',
  Entertainment: 'Entertainment',
  Housing:       'Housing',
  Healthcare:    'Healthcare',
  Health:        'Healthcare',
  Shopping:      'Shopping',
  Salary:        'Salary',
  Freelance:     'Freelance',
  Investment:    'Investment',
  Transfer:      'Transfer',
  Other:         'Other',
}

function normaliseCategory(raw: string): TransactionCategory {
  return CATEGORY_MAP[raw] ?? 'Other'
}

// ─── Response mapper ──────────────────────────────────────────────────────────

function mapTransaction(raw: BackendTransaction): Transaction {
  return {
    id:          String(raw.id),           // backend uses numeric id
    date:        raw.date,
    amount:      raw.amount,
    category:    normaliseCategory(raw.category),
    description: raw.description,
  }
}

// ─── Public API functions ─────────────────────────────────────────────────────

/**
 * Fetches all transactions from GET /api/transactions and maps them to the
 * frontend Transaction shape.
 */
export async function fetchTransactions(): Promise<Transaction[]> {
  const raw = await api.get<BackendTransaction[]>('/api/transactions')
  return raw.map(mapTransaction)
}

/**
 * Imports transactions from a CSV file via POST /api/transactions/import.
 * Sends the file as multipart/form-data and returns the imported transactions
 * mapped to the frontend Transaction shape.
 *
 * Uses fetch directly (instead of the api client) so that the browser sets the
 * correct multipart/form-data Content-Type boundary automatically — the api
 * client always forces Content-Type: application/json.
 */
export async function importTransactions(file: File): Promise<Transaction[]> {
  const formData = new FormData()
  formData.append('file', file)

  // Read the JWT from the same store the api client uses
  const token = useAuthStore.getState().accessToken

  const response = await fetch(`${BASE_URL}/api/transactions/import`, {
    method: 'POST',
    // Do NOT set Content-Type — the browser will add the correct multipart boundary
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  if (!response.ok) {
    let detail = response.statusText
    try {
      const err = await response.json()
      detail = err?.detail ?? err?.message ?? detail
    } catch {
      // ignore parse errors
    }
    throw new Error(`Import failed (${response.status}): ${detail}`)
  }

  const raw: BackendTransaction[] = await response.json()
  return raw.map(mapTransaction)
}
