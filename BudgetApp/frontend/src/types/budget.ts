import type { TransactionCategory } from './transaction'

// ─── Budget Data Model ────────────────────────────────────────────────────────

/** A single budget category with its monthly spending limit and current usage */
export interface BudgetCategory {
  id: string
  category: TransactionCategory
  monthlyLimit: number
  /** Amount spent this month — derived from transactions or predefined in mock data */
  amountSpent: number
}

/** Fields used when creating or editing a budget category (id and amountSpent are managed separately) */
export type BudgetFormData = Pick<BudgetCategory, 'category' | 'monthlyLimit'>

/** Expense-oriented categories that make sense for budget tracking (excludes income types) */
export const BUDGET_CATEGORIES: TransactionCategory[] = [
  'Housing',
  'Food & Dining',
  'Transportation',
  'Healthcare',
  'Entertainment',
  'Shopping',
  'Utilities',
  'Other',
]

/** Visual metadata per category — used for icons and colour accents */
export interface CategoryMeta {
  emoji: string
  /** Tailwind text colour class for the category label */
  textColor: string
  /** Tailwind background class for the icon container */
  iconBg: string
  /** Tailwind background class for the progress bar fill */
  barColor: string
}

export const CATEGORY_META: Record<string, CategoryMeta> = {
  'Housing':        { emoji: '🏠', textColor: 'text-blue-700',   iconBg: 'bg-blue-50',   barColor: 'bg-blue-500'   },
  'Food & Dining':  { emoji: '🍽️', textColor: 'text-orange-700', iconBg: 'bg-orange-50', barColor: 'bg-orange-500' },
  'Transportation': { emoji: '🚗', textColor: 'text-indigo-700', iconBg: 'bg-indigo-50', barColor: 'bg-indigo-500' },
  'Healthcare':     { emoji: '💊', textColor: 'text-rose-700',   iconBg: 'bg-rose-50',   barColor: 'bg-rose-500'   },
  'Entertainment':  { emoji: '🎬', textColor: 'text-violet-700', iconBg: 'bg-violet-50', barColor: 'bg-violet-500' },
  'Shopping':       { emoji: '🛍️', textColor: 'text-teal-700',   iconBg: 'bg-teal-50',   barColor: 'bg-teal-500'   },
  'Utilities':      { emoji: '⚡', textColor: 'text-amber-700',  iconBg: 'bg-amber-50',  barColor: 'bg-amber-500'  },
  'Other':          { emoji: '📦', textColor: 'text-slate-700',  iconBg: 'bg-slate-100', barColor: 'bg-slate-500'  },
}

/** Fallback meta for categories not in the map */
export const DEFAULT_CATEGORY_META: CategoryMeta = {
  emoji: '💰',
  textColor: 'text-slate-700',
  iconBg: 'bg-slate-100',
  barColor: 'bg-slate-500',
}