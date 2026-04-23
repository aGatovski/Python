import React from 'react'
import { SortConfig, SortDirection, SortField } from '../types/transaction'

interface SortControlsProps {
  sortConfig: SortConfig
  onSortChange: (config: SortConfig) => void
}

const SORT_FIELD_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'date', label: 'Date' },
  { value: 'amount', label: 'Amount' },
  { value: 'category', label: 'Category' },
]

const SORT_DIRECTION_OPTIONS: { value: SortDirection; label: string }[] = [
  { value: 'desc', label: 'Descending' },
  { value: 'asc', label: 'Ascending' },
]

/**
 * Compact sort controls rendered as two labelled dropdowns.
 * Kept as a standalone component so it can be reused across list views.
 */
export default function SortControls({ sortConfig, onSortChange }: SortControlsProps) {
  const handleFieldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSortChange({ ...sortConfig, field: e.target.value as SortField })
  }

  const handleDirectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSortChange({ ...sortConfig, direction: e.target.value as SortDirection })
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Sort by</span>

      {/* Sort field */}
      <div className="relative">
        <select
          id="sort-field"
          value={sortConfig.field}
          onChange={handleFieldChange}
          aria-label="Sort field"
          className="appearance-none pl-3 pr-8 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
        >
          {SORT_FIELD_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
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

      {/* Sort direction */}
      <div className="relative">
        <select
          id="sort-direction"
          value={sortConfig.direction}
          onChange={handleDirectionChange}
          aria-label="Sort direction"
          className="appearance-none pl-3 pr-8 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
        >
          {SORT_DIRECTION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
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
    </div>
  )
}