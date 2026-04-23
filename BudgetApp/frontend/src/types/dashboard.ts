// ─── Dashboard Data Types ────────────────────────────────────────────────────

/** A single financial summary metric (income, expenses, net balance) */
export interface SummaryMetric {
  label: string;
  amount: number;
  /** Optional trend vs previous period, expressed as a percentage */
  trend?: number;
  /** Whether the metric is positive (income) or negative (expense) */
  variant: 'income' | 'expense' | 'balance';
}

/** Monthly financial summary */
export interface MonthlySummary {
  month: string; // e.g. "April 2026"
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
}

/** Budget status for the current month */
export interface BudgetStatus {
  monthlyBudget: number;
  amountSpent: number;
  /** Derived: monthlyBudget - amountSpent */
  remaining: number;
  /** Derived: (amountSpent / monthlyBudget) * 100 */
  usagePercent: number;
}

/** A single expense category with its spending amount */
export interface CategoryExpense {
  category: string;
  amount: number;
  /** Hex or Tailwind-compatible color for the visual indicator */
  color: string;
  icon: string;
}

/** Full dashboard data shape */
export interface DashboardData {
  summary: MonthlySummary;
  budget: BudgetStatus;
  categoryExpenses: CategoryExpense[];
}

/** Navigation page identifiers */
export type NavPage =
  | 'dashboard'
  | 'transactions'
  | 'budget'
  | 'goals'
  | 'analytics'
  | 'ai-chat';

export interface NavItem {
  id: NavPage;
  label: string;
  icon: string;
}