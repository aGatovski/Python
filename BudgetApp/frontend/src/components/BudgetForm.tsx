import React, { useState, useEffect } from 'react'
import type { BudgetCategory, BudgetFormData } from '../types/budget'
import { BUDGET_CATEGORIES } from '../types/budget'

// ─── Props ────────────────────────────────────────────────────────────────────

interface BudgetFormProps {
  /** When provided the form operates in edit mode with pre-filled values */
  initialData?: BudgetCategory
  /** Categories already in use — excluded from the dropdown when adding */
  usedCategories?: string[]
  onSubmit: (data: BudgetFormData) => void
  onCancel: () => void
}

interface FormErrors {
  category?: string
  monthlyLimit?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Controlled form for creating and editing a budget category.
 * Validates that a category is selected and the monthly limit is a positive number.
 */
export default function BudgetForm({
  initialData,
  usedCategories = [],
  onSubmit,
  onCancel,
}: BudgetFormProps) {
  const isEditing = Boolean(initialData)

  const [category, setCategory] = useState<BudgetFormData['category']>(
    initialData?.category ?? 'Housing'
  )
  const [limitRaw, setLimitRaw] = useState<string>(
    initialData ? String(initialData.monthlyLimit) : ''
  )
  const [errors, setErrors] = useState<FormErrors>({})

  // Sync when initialData changes (e.g. opening a different item for edit)
  useEffect(() => {
    if (initialData) {
      setCategory(initialData.category)
      setLimitRaw(String(initialData.monthlyLimit))
    } else {
      // Default to first available category
      const available = BUDGET_CATEGORIES.filter((c) => !usedCategories.includes(c))
      setCategory(available[0] ?? 'Housing')
      setLimitRaw('')
    }
    setErrors({})
  }, [initialData]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Validation ──────────────────────────────────────────────────────────────

  function validate(): boolean {
    const newErrors: FormErrors = {}

    if (!category) {
      newErrors.category = 'Please select a category.'
    }

    const parsed = parseFloat(limitRaw)
    if (limitRaw.trim() === '' || isNaN(parsed)) {
      newErrors.monthlyLimit = 'Enter a valid amount (e.g. 500).'
    } else if (parsed <= 0) {
      newErrors.monthlyLimit = 'Monthly limit must be greater than zero.'
    } else if (parsed > 1_000_000) {
      newErrors.monthlyLimit = 'Monthly limit seems unrealistically high.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    onSubmit({ category, monthlyLimit: parseFloat(limitRaw) })
  }

  // Categories available in the dropdown:
  // - In edit mode: show all (the current category must remain selectable)
  // - In add mode: exclude already-used categories
  const availableCategories = isEditing
    ? BUDGET_CATEGORIES
    : BUDGET_CATEGORIES.filter((c) => !usedCategories.includes(c))

  const allCategoriesUsed = !isEditing && availableCategories.length === 0

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">

      {/* Category select */}
      <div>
        <label htmlFor="budget-category" className="block text-sm font-medium text-slate-700 mb-1.5">
          Category
        </label>

        {allCategoriesUsed ? (
          <p className="text-sm text-slate-500 italic py-2">
            All expense categories already have a budget set.
          </p>
        ) : (
          <div className="relative">
            <select
              id="budget-category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value as BudgetFormData['category'])
                if (errors.category) setErrors((prev) => ({ ...prev, category: undefined }))
              }}
              disabled={isEditing}
              className={[
                'w-full appearance-none pl-3 pr-8 py-2 text-sm bg-white border rounded-lg',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors',
                isEditing
                  ? 'cursor-not-allowed bg-slate-50 text-slate-500 border-slate-200'
                  : 'text-slate-900 cursor-pointer hover:border-slate-300',
                errors.category ? 'border-red-400' : 'border-slate-200',
              ].join(' ')}
              aria-describedby={errors.category ? 'budget-category-error' : undefined}
              aria-invalid={Boolean(errors.category)}
            >
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {/* Chevron icon */}
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
        )}

        {isEditing && (
          <p className="mt-1 text-xs text-slate-400">
            Category cannot be changed after creation.
          </p>
        )}
        {errors.category && (
          <p id="budget-category-error" className="mt-1 text-xs text-red-600" role="alert">
            {errors.category}
          </p>
        )}
      </div>

      {/* Monthly limit */}
      <div>
        <label htmlFor="budget-limit" className="block text-sm font-medium text-slate-700 mb-1.5">
          Monthly Limit
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 select-none pointer-events-none">
            €
          </span>
          <input
            id="budget-limit"
            type="number"
            min="1"
            step="1"
            placeholder="e.g. 500"
            value={limitRaw}
            onChange={(e) => {
              setLimitRaw(e.target.value)
              if (errors.monthlyLimit) setErrors((prev) => ({ ...prev, monthlyLimit: undefined }))
            }}
            className={[
              'w-full pl-7 pr-3 py-2 text-sm text-slate-900 bg-white border rounded-lg',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors',
              errors.monthlyLimit ? 'border-red-400' : 'border-slate-200 hover:border-slate-300',
            ].join(' ')}
            aria-describedby={errors.monthlyLimit ? 'budget-limit-error' : 'budget-limit-hint'}
            aria-invalid={Boolean(errors.monthlyLimit)}
          />
        </div>
        {errors.monthlyLimit ? (
          <p id="budget-limit-error" className="mt-1 text-xs text-red-600" role="alert">
            {errors.monthlyLimit}
          </p>
        ) : (
          <p id="budget-limit-hint" className="mt-1 text-xs text-slate-400">
            Maximum amount you plan to spend in this category per month.
          </p>
        )}
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
          disabled={allCategoriesUsed}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        >
          {isEditing ? 'Save Changes' : 'Add Budget'}
        </button>
      </div>
    </form>
  )
}