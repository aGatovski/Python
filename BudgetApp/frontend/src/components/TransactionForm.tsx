import React, { useState, useEffect } from 'react'
import { Transaction, TransactionFormData } from '../types/transaction'

interface TransactionFormProps {
  /** When provided the form operates in edit mode with pre-filled values */
  initialData?: Transaction
  /** Available categories from the backend */
  categories: string[]
  onSubmit: (data: TransactionFormData) => void
  onCancel: () => void
}

interface FormErrors {
  date?: string
  amount?: string
  category?: string
  description?: string
}

/**
 * Controlled form for creating and editing transactions.
 * Performs client-side validation before calling onSubmit.
 */
export default function TransactionForm({ initialData, categories, onSubmit, onCancel }: TransactionFormProps) {
  const [formData, setFormData] = useState<TransactionFormData>(
    initialData
      ? { date: initialData.date, amount: initialData.amount, category: initialData.category, description: initialData.description }
      : { date: new Date().toISOString().split('T')[0], amount: 0, category: categories[0] || 'Other', description: '' }
  )
  const [errors, setErrors] = useState<FormErrors>({})
  // Raw string for the amount input so the user can type freely (e.g. "-" prefix)
  const [amountRaw, setAmountRaw] = useState<string>(
    initialData ? String(initialData.amount) : ''
  )

  // Sync form when initialData changes (e.g. opening a different transaction for edit)
  useEffect(() => {
    if (initialData) {
      setFormData({
        date: initialData.date,
        amount: initialData.amount,
        category: initialData.category,
        description: initialData.description,
      })
      setAmountRaw(String(initialData.amount))
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        category: categories[0] || 'Other',
        description: '',
      })
      setAmountRaw('')
    }
    setErrors({})
  }, [initialData, categories])

  // ── Validation ──────────────────────────────────────────────────────────────
  function validate(): boolean {
    const newErrors: FormErrors = {}

    if (!formData.date) {
      newErrors.date = 'Date is required.'
    }

    const parsedAmount = parseFloat(amountRaw)
    if (amountRaw.trim() === '' || isNaN(parsedAmount)) {
      newErrors.amount = 'Enter a valid number (e.g. -45.00 or 1200).'
    } else if (parsedAmount === 0) {
      newErrors.amount = 'Amount cannot be zero.'
    }

    if (!formData.category) {
      newErrors.category = 'Select a category.'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required.'
    } else if (formData.description.trim().length > 120) {
      newErrors.description = 'Description must be 120 characters or fewer.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    onSubmit({ ...formData, amount: parseFloat(amountRaw) })
  }

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAmountRaw(e.target.value)
    if (errors.amount) setErrors((prev) => ({ ...prev, amount: undefined }))
  }

  function handleFieldChange<K extends keyof TransactionFormData>(
    field: K,
    value: TransactionFormData[K]
  ) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const isEditing = Boolean(initialData)

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">

      {/* Date */}
      <div>
        <label htmlFor="txn-date" className="block text-sm font-medium text-slate-700 mb-1.5">
          Date
        </label>
        <input
          id="txn-date"
          type="date"
          value={formData.date}
          onChange={(e) => handleFieldChange('date', e.target.value)}
          className={`w-full px-3 py-2 text-sm text-slate-900 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
            errors.date ? 'border-red-400' : 'border-slate-200 hover:border-slate-300'
          }`}
          aria-describedby={errors.date ? 'txn-date-error' : undefined}
          aria-invalid={Boolean(errors.date)}
        />
        {errors.date && (
          <p id="txn-date-error" className="mt-1 text-xs text-red-600" role="alert">
            {errors.date}
          </p>
        )}
      </div>

      {/* Amount */}
      <div>
        <label htmlFor="txn-amount" className="block text-sm font-medium text-slate-700 mb-1.5">
          Amount
          <span className="ml-1 text-xs font-normal text-slate-400">(negative = expense)</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 select-none">
            €
          </span>
          <input
            id="txn-amount"
            type="number"
            step="0.01"
            placeholder="e.g. -45.00"
            value={amountRaw}
            onChange={handleAmountChange}
            className={`w-full pl-7 pr-3 py-2 text-sm text-slate-900 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              errors.amount ? 'border-red-400' : 'border-slate-200 hover:border-slate-300'
            }`}
            aria-describedby={errors.amount ? 'txn-amount-error' : undefined}
            aria-invalid={Boolean(errors.amount)}
          />
        </div>
        {errors.amount && (
          <p id="txn-amount-error" className="mt-1 text-xs text-red-600" role="alert">
            {errors.amount}
          </p>
        )}
      </div>

      {/* Category */}
      <div>
        <label htmlFor="txn-category" className="block text-sm font-medium text-slate-700 mb-1.5">
          Category
        </label>
        <div className="relative">
          <select
            id="txn-category"
            value={formData.category}
            onChange={(e) =>
              handleFieldChange('category', e.target.value as TransactionFormData['category'])
            }
            className={`w-full appearance-none pl-3 pr-8 py-2 text-sm text-slate-900 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer ${
              errors.category ? 'border-red-400' : 'border-slate-200 hover:border-slate-300'
            }`}
            aria-describedby={errors.category ? 'txn-category-error' : undefined}
            aria-invalid={Boolean(errors.category)}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
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
        {errors.category && (
          <p id="txn-category-error" className="mt-1 text-xs text-red-600" role="alert">
            {errors.category}
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="txn-description" className="block text-sm font-medium text-slate-700 mb-1.5">
          Description
        </label>
        <input
          id="txn-description"
          type="text"
          placeholder="e.g. Weekly grocery run"
          value={formData.description}
          onChange={(e) => handleFieldChange('description', e.target.value)}
          maxLength={120}
          className={`w-full px-3 py-2 text-sm text-slate-900 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
            errors.description ? 'border-red-400' : 'border-slate-200 hover:border-slate-300'
          }`}
          aria-describedby={errors.description ? 'txn-description-error' : undefined}
          aria-invalid={Boolean(errors.description)}
        />
        <div className="mt-1 flex justify-between items-start">
          {errors.description ? (
            <p id="txn-description-error" className="text-xs text-red-600" role="alert">
              {errors.description}
            </p>
          ) : (
            <span />
          )}
          {/* Character counter */}
          <span className="text-xs text-slate-400 ml-auto">
            {formData.description.length}/120
          </span>
        </div>
      </div>

      {/* Form actions */}
      <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        >
          {isEditing ? 'Save Changes' : 'Add Transaction'}
        </button>
      </div>
    </form>
  )
}