import type { BudgetCategory } from '../types/budget'

/**
 * Mock budget categories for April 2026.
 * amountSpent values are pre-seeded to demonstrate a realistic mix of
 * on-track (green), approaching-limit (amber), and over-limit (red) states.
 */
export const MOCK_BUDGETS: BudgetCategory[] = [
  {
    id: 'bgt-1',
    category: 'Housing',
    monthlyLimit: 1500,
    amountSpent: 1200, // 80% — amber
  },
  {
    id: 'bgt-2',
    category: 'Food & Dining',
    monthlyLimit: 400,
    amountSpent: 218, // 55% — green
  },
  {
    id: 'bgt-3',
    category: 'Transportation',
    monthlyLimit: 200,
    amountSpent: 145, // 73% — amber
  },
  {
    id: 'bgt-4',
    category: 'Healthcare',
    monthlyLimit: 150,
    amountSpent: 45, // 30% — green
  },
  {
    id: 'bgt-5',
    category: 'Entertainment',
    monthlyLimit: 100,
    amountSpent: 97, // 97% — red (critical)
  },
  {
    id: 'bgt-6',
    category: 'Shopping',
    monthlyLimit: 300,
    amountSpent: 178, // 59% — green
  },
  {
    id: 'bgt-7',
    category: 'Utilities',
    monthlyLimit: 180,
    amountSpent: 162, // 90% — red
  },
  {
    id: 'bgt-8',
    category: 'Other',
    monthlyLimit: 100,
    amountSpent: 34, // 34% — green
  },
]