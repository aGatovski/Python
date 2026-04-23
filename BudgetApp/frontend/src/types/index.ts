// ── Auth ──────────────────────────────────────────────────────────────────────

export interface User {
  id: number
  email: string
  full_name: string | null
  bio: string | null
  budgets_public: boolean
  goals_public: boolean
  created_at: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

// ── Transactions ───────────────────────────────────────────────────────────────

export interface Transaction {
  id: number
  user_id: number
  date: string
  amount: number
  category: string
  description: string | null
  is_fixed: boolean
  is_recurring: boolean
  recurring_rule_id: number | null
  created_at: string
}

export interface TransactionCreate {
  date: string
  amount: number
  category: string
  description?: string
  is_fixed?: boolean
  is_recurring?: boolean
}

// ── Income ─────────────────────────────────────────────────────────────────────

export interface Income {
  id: number
  user_id: number
  date: string
  amount: number
  source: string
  description: string | null
  is_recurring: boolean
  recurring_rule_id: number | null
  created_at: string
}

export interface IncomeCreate {
  date: string
  amount: number
  source: string
  description?: string
  is_recurring?: boolean
}

export interface IncomeSummary {
  total_monthly: number
  total_yearly: number
  by_month: Record<string, number>
}

// ── Categories ─────────────────────────────────────────────────────────────────

export interface Category {
  id: number
  user_id: number | null
  name: string
  is_default: boolean
  created_at: string
}

// ── Budgets ────────────────────────────────────────────────────────────────────

export interface Budget {
  id: number
  user_id: number
  category: string
  limit: number
  period: string
  created_at: string
}

export interface BudgetCreate {
  category: string
  limit: number
  period?: string
}

export interface BudgetStatus {
  category: string
  limit: number
  spent: number
  remaining: number
  percent_used: number
  status: 'on_track' | 'warning' | 'exceeded'
}

// ── Goals ──────────────────────────────────────────────────────────────────────

export interface Goal {
  id: number
  user_id: number
  name: string
  target_amount: number
  current_amount: number
  deadline: string | null
  priority: 'low' | 'medium' | 'high'
  is_completed: boolean
  created_at: string
}

export interface GoalCreate {
  name: string
  target_amount: number
  deadline?: string
  priority?: 'low' | 'medium' | 'high'
}

export interface GoalForecast {
  goal_id: number
  name: string
  target_amount: number
  current_amount: number
  deadline: string | null
  monthly_savings_needed: number
  projected_completion_date: string | null
  on_track: boolean
  shortfall: number
}

// ── Analytics ──────────────────────────────────────────────────────────────────

export interface MonthlySummary {
  month: string
  total_income: number
  total_expenses: number
  net: number
  savings_rate: number
  transaction_count: number
}

export interface CategoryTotal {
  category: string
  total: number
}

export interface CashflowEntry {
  month: string
  income: number
  expenses: number
}

// ── Alerts ─────────────────────────────────────────────────────────────────────

export interface Alert {
  id: number
  user_id: number
  rule_id: number | null
  type: string
  message: string
  is_dismissed: boolean
  created_at: string
}

// ── Recurring ──────────────────────────────────────────────────────────────────

export interface RecurringRule {
  id: number
  user_id: number
  type: string
  amount: number
  category: string
  description: string | null
  frequency: string
  start_date: string
  end_date: string | null
  is_fixed: boolean
  is_paused: boolean
  created_at: string
}