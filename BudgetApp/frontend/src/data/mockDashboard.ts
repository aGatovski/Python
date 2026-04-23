import type { DashboardData, NavItem } from '../types/dashboard';

// ─── Mock Dashboard Data ─────────────────────────────────────────────────────
// Realistic personal finance figures for April 2026

export const mockDashboardData: DashboardData = {
  summary: {
    month: 'April 2026',
    totalIncome: 4_850.00,
    totalExpenses: 3_124.75,
    netBalance: 1_725.25,
  },

  budget: {
    monthlyBudget: 3_500.00,
    amountSpent: 3_124.75,
    remaining: 375.25,
    // Derived: (3124.75 / 3500) * 100 ≈ 89.3%
    usagePercent: Math.round((3_124.75 / 3_500.00) * 100),
  },

  categoryExpenses: [
    { category: 'Housing',       amount: 1_200.00, color: '#6366f1', icon: '🏠' },
    { category: 'Food & Dining', amount:   620.50, color: '#f59e0b', icon: '🍽️' },
    { category: 'Transport',     amount:   310.00, color: '#10b981', icon: '🚗' },
    { category: 'Utilities',     amount:   215.25, color: '#3b82f6', icon: '⚡' },
    { category: 'Entertainment', amount:   189.00, color: '#ec4899', icon: '🎬' },
    { category: 'Health',        amount:   340.00, color: '#14b8a6', icon: '💊' },
    { category: 'Shopping',      amount:   250.00, color: '#f97316', icon: '🛍️' },
  ],
};

// ─── Navigation Items ─────────────────────────────────────────────────────────

export const navItems: NavItem[] = [
  { id: 'dashboard',    label: 'Dashboard',    icon: '⊞' },
  { id: 'transactions', label: 'Transactions', icon: '↕' },
  { id: 'budget',       label: 'Budget',       icon: '◎' },
  { id: 'goals',        label: 'Goals',        icon: '◈' },
  { id: 'analytics',    label: 'Analytics',    icon: '▦' },
  { id: 'ai-chat',      label: 'AI Chat',      icon: '✦' },
];