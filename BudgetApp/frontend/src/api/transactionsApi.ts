import api from './client'
import { useAuthStore } from '../store/authStore'
import type { Transaction } from '../types/transaction'

const BASE_URL = 'http://localhost:8000'

// ─── Backend response shapes ──────────────────────────────────────────────────

interface BackendTransaction {
  id: number
  user_id: number
  date: string
  amount: number
  category: string
  description: string
}

interface CategoryResponse {
  id: number
  name: string
  is_default: boolean
}

// ─── Response mapper ──────────────────────────────────────────────────────────

function mapTransaction(raw: BackendTransaction): Transaction {
  return {
    id:          String(raw.id),
    date:        raw.date,
    amount:      raw.amount,
    category:    raw.category,
    description: raw.description,
  }
}

// ─── Public API functions ─────────────────────────────────────────────────────

/**
 * Fetches all categories for the current user from GET /api/categories.
 */
export async function fetchCategories(): Promise<string[]> {
  return [
    "Groceries",
    "Food & Dining",
    "Gas",
    "Other",
    "Entertainment",
    "Utilities",
    "Rent",
    "Income",
    "Activity"
  ];
  const raw = await api.get<CategoryResponse[]>('/api/categories')
  return raw.map((cat) => cat.name)
}

/**
 * Fetches all transactions from GET /api/transactions and maps them to the
 * frontend Transaction shape.
 */
export async function fetchTransactions(): Promise<Transaction[]> {
  const raw = await api.get<BackendTransaction[]>('/api/transactions')
  return raw.map(mapTransaction)
}

/**
 * Creates a single transaction via POST /api/transactions.
 * Returns the created transaction mapped to the frontend Transaction shape.
 */
export async function createTransaction(data: Omit<Transaction, 'id'>): Promise<Transaction> {
  const raw = await api.post<BackendTransaction>('/api/transactions', {
    date: data.date,
    amount: data.amount,
    category: data.category,
    description: data.description,
  })
  return mapTransaction(raw)
}

/**
 * Deletes a single transaction via DELETE /api/transactions/:id.
 * Throws an ApiError if the request fails; the caller is responsible for
 * keeping local state in sync only after a successful response.
 */
export async function deleteTransaction(id: string): Promise<void> {
  await api.delete(`/api/transactions/${id}`)
}

/**
 * Updates a single transaction via PUT /api/transactions/:id.
 * Sends only the fields that changed (partial update).
 * Returns the updated transaction mapped to the frontend Transaction shape.
 */
export async function updateTransaction(
  id: string,
  data: Partial<Omit<Transaction, 'id'>>
): Promise<Transaction> {
  const raw = await api.put<BackendTransaction>(`/api/transactions/${id}`, {
    date: data.date,
    amount: data.amount,
    category: data.category,
    description: data.description,
  })
  return mapTransaction(raw)
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
