/**
 * Core transaction data model.
 * Positive amounts represent income; negative amounts represent expenses.
 */
export interface Transaction {
  id: string
  /** ISO 8601 date string, e.g. "2024-03-15" */
  date: string
  /** Positive = income, negative = expense */
  amount: number
  category: string
  description: string
}

/** Fields used when creating or editing a transaction (id is auto-generated) */
export type TransactionFormData = Omit<Transaction, 'id'>

/** Sort field options */
export type SortField = 'date' | 'amount' | 'category'

/** Sort direction */
export type SortDirection = 'asc' | 'desc'

export interface SortConfig {
  field: SortField
  direction: SortDirection
}