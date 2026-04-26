import React, { useState, useMemo, useEffect, useRef } from 'react'
import {
  Transaction,
  TransactionFormData,
  SortConfig,
} from '../types/transaction'
import { fetchTransactions, importTransactions, createTransaction, updateTransaction, fetchCategories, deleteTransaction } from '../api/transactionsApi'
import TransactionTable from '../components/TransactionTable'
import TransactionForm from '../components/TransactionForm'
import SortControls from '../components/SortControls'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'

// ── Pure helpers ──────────────────────────────────────────────────────────────

function generateId(): string {
  return `txn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function sortTransactions(txns: Transaction[], config: SortConfig): Transaction[] {
  return [...txns].sort((a, b) => {
    let cmp = 0
    if (config.field === 'date') cmp = a.date.localeCompare(b.date)
    else if (config.field === 'amount') cmp = a.amount - b.amount
    else if (config.field === 'category') cmp = a.category.localeCompare(b.category)
    return config.direction === 'asc' ? cmp : -cmp
  })
}

function filterTransactions(txns: Transaction[], search: string, category: string): Transaction[] {
  const q = search.toLowerCase().trim()
  return txns.filter((t) => {
    const matchSearch =
      q === '' ||
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
    const matchCategory = category === '' || t.category === category
    return matchSearch && matchCategory
  })
}

interface Summary {
  totalIncome: number
  totalExpenses: number
  netBalance: number
}

function computeSummary(txns: Transaction[]): Summary {
  return txns.reduce(
    (acc, t) => {
      if (t.amount >= 0) acc.totalIncome += t.amount
      else acc.totalExpenses += t.amount
      acc.netBalance += t.amount
      return acc
    },
    { totalIncome: 0, totalExpenses: 0, netBalance: 0 }
  )
}

function fmt(value: number): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface SummaryCardProps {
  label: string
  value: string
  valueClass: string
  iconBg: string
  icon: React.ReactNode
}

function SummaryCard({ label, value, valueClass, iconBg, icon }: SummaryCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        <p className={`text-xl font-bold mt-0.5 tabular-nums ${valueClass}`}>{value}</p>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

type ModalMode = 'add' | 'edit' | null

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'date', direction: 'desc' })
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState<string | null>(null)

  // Ref for the hidden CSV file input
  const csvInputRef = useRef<HTMLInputElement>(null)

  // Fetch categories and transactions from the API on mount
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([fetchCategories(), fetchTransactions()])
      .then(([cats, txns]) => {
        if (!cancelled) {
          setCategories(cats)
          setTransactions(txns)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load data.')
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [])

  // Derived: filter then sort
  const filteredAndSorted = useMemo(() => {
    const filtered = filterTransactions(transactions, searchQuery, categoryFilter)
    return sortTransactions(filtered, sortConfig)
  }, [transactions, searchQuery, categoryFilter, sortConfig])

  // Summary always reflects the full unfiltered list
  const summary = useMemo(() => computeSummary(transactions), [transactions])

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleAddNew() {
    setEditingTransaction(undefined)
    setModalMode('add')
  }

  function handleEdit(txn: Transaction) {
    setEditingTransaction(txn)
    setModalMode('edit')
  }

  function handleDeleteRequest(id: string) {
    setDeleteTargetId(id)
  }

  async function handleDeleteConfirm() {
    if (!deleteTargetId) return
    try {
      // Persist the deletion on the server before updating local state;
      // if the request fails the transaction remains visible and an error
      // banner is shown — preventing silent data-integrity divergence.
      await deleteTransaction(deleteTargetId)
      setTransactions((prev) => prev.filter((t) => t.id !== deleteTargetId))
      setDeleteTargetId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete transaction.')
      setDeleteTargetId(null)
    }
  }

  async function handleFormSubmit(data: TransactionFormData) {
    try {
      if (modalMode === 'add') {
        const created = await createTransaction(data)
        setTransactions((prev) => [created, ...prev])
      } else if (modalMode === 'edit' && editingTransaction) {
        // Persist the update on the server; only update local state on success
        // to prevent the UI from diverging from the backend on failure.
        const updated = await updateTransaction(editingTransaction.id, data)
        setTransactions((prev) =>
          prev.map((t) => (t.id === editingTransaction.id ? updated : t))
        )
      }
      setModalMode(null)
      setEditingTransaction(undefined)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save transaction.')
    }
  }

  function handleFormCancel() {
    setModalMode(null)
    setEditingTransaction(undefined)
  }

  // Trigger the hidden file input when the Import CSV button is clicked
  function handleImportClick() {
    setImportError(null)
    setImportSuccess(null)
    csvInputRef.current?.click()
  }

  // Called when the user selects a CSV file; uploads it to POST /api/transactions/import
  async function handleCsvFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset the input so the same file can be re-selected if needed
    e.target.value = ''

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setImportError('Please select a valid CSV file.')
      return
    }

    setImporting(true)
    setImportError(null)
    setImportSuccess(null)

    try {
      const imported = await importTransactions(file)
      // Prepend imported rows, deduplicating by id against the existing list
      setTransactions((prev) => {
        const existingIds = new Set(prev.map((t) => t.id))
        const newOnes = imported.filter((t) => !existingIds.has(t.id))
        return [...newOnes, ...prev]
      })
      setImportSuccess(
        `Successfully imported ${imported.length} transaction${imported.length !== 1 ? 's' : ''}.`
      )
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'CSV import failed.')
    } finally {
      setImporting(false)
    }
  }

  const deleteTarget = transactions.find((t) => t.id === deleteTargetId)

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* Error banner */}
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-4 rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700"
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span>{error}</span>
          </div>
          <button
            onClick={() => {
              setError(null)
              setLoading(true)
              Promise.all([fetchCategories(), fetchTransactions()])
                .then(([cats, txns]) => { setCategories(cats); setTransactions(txns); setLoading(false) })
                .catch((err) => { setError(err instanceof Error ? err.message : 'Failed to load.'); setLoading(false) })
            }}
            className="text-xs font-semibold text-red-700 underline hover:text-red-800 focus:outline-none whitespace-nowrap"
          >
            Retry
          </button>
        </div>
      )}

      {/* Import error banner */}
      {importError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-4 rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700"
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span>{importError}</span>
          </div>
          <button
            onClick={() => setImportError(null)}
            className="text-xs font-semibold text-red-700 underline hover:text-red-800 focus:outline-none whitespace-nowrap"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Import success banner */}
      {importSuccess && (
        <div
          role="status"
          className="flex items-center justify-between gap-4 rounded-xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm text-emerald-700"
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{importSuccess}</span>
          </div>
          <button
            onClick={() => setImportSuccess(null)}
            className="text-xs font-semibold text-emerald-700 underline hover:text-emerald-800 focus:outline-none whitespace-nowrap"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Transactions</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {loading ? 'Loading…' : `${transactions.length} total · ${filteredAndSorted.length} shown`}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Hidden file input — triggered programmatically */}
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            aria-hidden="true"
            onChange={handleCsvFileChange}
          />

          {/* Import CSV button */}
          <button
            onClick={handleImportClick}
            disabled={importing}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Import transactions from CSV"
          >
            {importing ? (
              /* Spinner while uploading */
              <svg className="w-4 h-4 animate-spin text-slate-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            )}
            {importing ? 'Importing…' : 'Import CSV'}
          </button>

          {/* Add Transaction button */}
          <button
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Transaction
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          label="Total Income"
          value={fmt(summary.totalIncome)}
          valueClass="text-emerald-600"
          iconBg="bg-emerald-50"
          icon={
            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
          }
        />
        <SummaryCard
          label="Total Expenses"
          value={fmt(Math.abs(summary.totalExpenses))}
          valueClass="text-red-500"
          iconBg="bg-red-50"
          icon={
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" />
            </svg>
          }
        />
        <SummaryCard
          label="Net Balance"
          value={fmt(summary.netBalance)}
          valueClass={summary.netBalance >= 0 ? 'text-blue-600' : 'text-red-500'}
          iconBg="bg-blue-50"
          icon={
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Filters & sort toolbar */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between flex-wrap">

          {/* Search */}
          <div className="relative flex-1 min-w-0 max-w-sm">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="search"
              placeholder="Search description or category…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              aria-label="Search transactions"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Category filter */}
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label="Filter by category"
                className="appearance-none pl-3 pr-8 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px h-5 bg-slate-200" aria-hidden="true" />

            {/* Sort controls */}
            <SortControls sortConfig={sortConfig} onSortChange={setSortConfig} />
          </div>
        </div>

        {/* Active filter chips */}
        {(searchQuery || categoryFilter) && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500">Filters:</span>
            {searchQuery && (
              <FilterChip
                label={`"${searchQuery}"`}
                onRemove={() => setSearchQuery('')}
              />
            )}
            {categoryFilter && (
              <FilterChip
                label={categoryFilter}
                onRemove={() => setCategoryFilter('')}
              />
            )}
            <button
              onClick={() => { setSearchQuery(''); setCategoryFilter('') }}
              className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2 transition-colors"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Transaction table card */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="animate-pulse divide-y divide-slate-50">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-48" />
                  <div className="h-3 bg-slate-100 rounded w-24" />
                </div>
                <div className="space-y-2 text-right">
                  <div className="h-3 bg-slate-100 rounded w-20" />
                  <div className="h-3 bg-slate-100 rounded w-14" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <TransactionTable
            transactions={filteredAndSorted}
            onEdit={handleEdit}
            onDelete={handleDeleteRequest}
            onAddNew={handleAddNew}
          />
        )}
      </div>

      {/* Add / Edit modal */}
      <Modal
        isOpen={modalMode !== null}
        onClose={handleFormCancel}
        title={modalMode === 'edit' ? 'Edit Transaction' : 'Add Transaction'}
      >
        <TransactionForm
          initialData={editingTransaction}
          categories={categories}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      </Modal>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteTargetId !== null}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
        title="Delete Transaction"
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.description}"? This action cannot be undone.`
            : 'Are you sure you want to delete this transaction?'
        }
        confirmLabel="Delete"
        confirmVariant="danger"
      />
    </div>
  )
}

// ── FilterChip ────────────────────────────────────────────────────────────────

interface FilterChipProps {
  label: string
  onRemove: () => void
}

function FilterChip({ label, onRemove }: FilterChipProps) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
      {label}
      <button
        onClick={onRemove}
        className="ml-0.5 text-blue-400 hover:text-blue-600 focus:outline-none"
        aria-label={`Remove filter: ${label}`}
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  )
}