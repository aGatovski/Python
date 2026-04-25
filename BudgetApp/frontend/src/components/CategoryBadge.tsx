import { TransactionCategory } from '../types/transaction'

interface CategoryBadgeProps {
  category: TransactionCategory
}

/**
 * Maps each category to a distinct color pair (background + text).
 * Colors are chosen for WCAG AA contrast on white backgrounds.
 */
const CATEGORY_COLORS: Record<TransactionCategory, string> = {
  Housing:         'bg-violet-100 text-violet-700',
  'Food & Dining': 'bg-orange-100 text-orange-700',
  Transportation:  'bg-sky-100 text-sky-700',
  Activity:      'bg-green-100 text-green-700',
  Entertainment:   'bg-pink-100 text-pink-700',
  Shopping:        'bg-yellow-100 text-yellow-700',
  Utilities:       'bg-slate-100 text-slate-600',
  Income:          'bg-emerald-100 text-emerald-700',
  Groceries:       'bg-teal-100 text-teal-700',
  Loan:      'bg-blue-100 text-blue-700',
  Gas:        'bg-indigo-100 text-indigo-700',
  Other:           'bg-gray-100 text-gray-600',
}

/**
 * Pill badge that visually identifies a transaction category.
 */
export default function CategoryBadge({ category }: CategoryBadgeProps) {
  const colorClass = CATEGORY_COLORS[category] ?? 'bg-gray-100 text-gray-600'

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${colorClass}`}
    >
      {category}
    </span>
  )
}