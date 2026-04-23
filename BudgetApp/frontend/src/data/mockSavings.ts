import type { SavingsGoal } from '../types/savings'

/**
 * Realistic mock savings goals for development and demo purposes.
 * Covers a range of statuses: completed, on-track, at-risk, and no-date.
 */
export const MOCK_SAVINGS_GOALS: SavingsGoal[] = [
  {
    id: 'goal-1',
    name: 'Emergency Fund',
    targetAmount: 10_000,
    currentAmount: 8_500,
    targetDate: '2026-06-30',
    icon: '🛡️',
    color: 'blue',
    createdAt: '2025-01-15',
  },
  {
    id: 'goal-2',
    name: 'Japan Vacation',
    targetAmount: 4_500,
    currentAmount: 2_200,
    targetDate: '2026-09-01',
    icon: '✈️',
    color: 'violet',
    createdAt: '2025-03-01',
  },
  {
    id: 'goal-3',
    name: 'New MacBook Pro',
    targetAmount: 2_499,
    currentAmount: 1_800,
    targetDate: '2026-07-15',
    icon: '💻',
    color: 'indigo',
    createdAt: '2025-06-01',
  },
  {
    id: 'goal-4',
    name: 'House Down Payment',
    targetAmount: 50_000,
    currentAmount: 15_000,
    targetDate: '2028-12-31',
    icon: '🏠',
    color: 'emerald',
    createdAt: '2024-01-01',
  },
  {
    id: 'goal-5',
    name: 'Wedding Fund',
    targetAmount: 20_000,
    currentAmount: 20_000,
    targetDate: '2026-05-20',
    icon: '💍',
    color: 'rose',
    createdAt: '2024-06-01',
  },
  {
    id: 'goal-6',
    name: 'New Car',
    targetAmount: 15_000,
    currentAmount: 3_200,
    // No target date — open-ended goal
    icon: '🚗',
    color: 'amber',
    createdAt: '2025-09-01',
  },
]