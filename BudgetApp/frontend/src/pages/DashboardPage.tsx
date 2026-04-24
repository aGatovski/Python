import React, { useEffect, useState } from 'react'
import type { NavPage } from '../types/dashboard'
import type { DashboardData } from '../types/dashboard'
import type { Transaction } from '../types/index'
import { fetchDashboardOverview, fetchRecentTransactions } from '../api/dashboardApi'
import SummaryCard from '../components/SummaryCard'
import BudgetCard from '../components/BudgetCard'
import CategoryBreakdown from '../components/CategoryBreakdown'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(value: number): string {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(value)
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IE', { day: 'numeric', month: 'short' })
}

// ─── Recent Transactions ──────────────────────────────────────────────────────
// Show the 5 most recent transactions as a quick preview.
// These still come from mock data — a separate GET /api/transactions?limit=5
// call will replace this once the transactions endpoint is wired up.


// ─── Props ────────────────────────────────────────────────────────────────────

interface DashboardPageProps {
  onNavigate: (page: NavPage) => void
}

interface QuickNavCardProps {
  label: string
  description: string
  color: string
  iconColor: string
  icon: React.ReactNode
  onClick: () => void
}

// ─── Small icon components ────────────────────────────────────────────────────

function IncomeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  )
}

function ExpenseIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" />
    </svg>
  )
}

function BalanceIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

// ─── QuickNavCard ─────────────────────────────────────────────────────────────

function QuickNavCard({ label, description, color, iconColor, icon, onClick }: QuickNavCardProps) {
  return (
    <button
      onClick={onClick}
      className={`${color} rounded-xl p-4 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 border border-transparent hover:border-slate-200`}
    >
      <span className={`${iconColor} block mb-2`} aria-hidden="true">{icon}</span>
      <p className="text-sm font-semibold text-slate-800">{label}</p>
      <p className="text-xs text-slate-500 mt-0.5">{description}</p>
    </button>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function SummaryCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-5 flex items-start gap-4 animate-pulse">
      <div className="w-10 h-10 rounded-lg bg-slate-100 flex-shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-3 bg-slate-100 rounded w-24" />
        <div className="h-7 bg-slate-100 rounded w-32" />
        <div className="h-3 bg-slate-100 rounded w-20" />
      </div>
    </div>
  )
}

function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-5 animate-pulse space-y-3">
      <div className="h-4 bg-slate-100 rounded w-1/3" />
      <div className="h-2.5 bg-slate-100 rounded w-full" />
      <div className="grid grid-cols-3 gap-3 pt-1">
        <div className="h-8 bg-slate-100 rounded" />
        <div className="h-8 bg-slate-100 rounded" />
        <div className="h-8 bg-slate-100 rounded" />
      </div>
    </div>
  )
}

// ─── DashboardPage ────────────────────────────────────────────────────────────

/**
 * Main dashboard landing page.
 * Fetches live data from GET /api/analytics/overview on mount and renders:
 * - Monthly summary metrics (income, expenses, net balance)
 * - Budget status card
 * - Spending by category breakdown
 * - Recent transactions preview (fetched from GET /api/transactions?limit=5)
 */
export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch dashboard overview and recent transactions on mount
  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [overview, transactions] = await Promise.all([
          fetchDashboardOverview(),
          fetchRecentTransactions(5),
        ])
        if (!cancelled) {
          setData(overview)
          setRecentTransactions(transactions)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard data.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    // Cleanup: ignore stale responses if the component unmounts mid-fetch
    return () => { cancelled = true }
  }, [])

  const summary = data?.summary
  const budget = data?.budget
  const categoryExpenses = data?.categoryExpenses ?? []

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

      {/* ── Page heading ───────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Good morning &#128075;
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Here&apos;s your financial overview
            {summary && (
              <> for <span className="font-medium text-slate-700">{summary.month}</span></>
            )}
          </p>
        </div>
        <button
          onClick={() => onNavigate('transactions')}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Transaction
        </button>
      </div>

      {/* ── Error banner ───────────────────────────────────────────────── */}
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-4 rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700"
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span>{error}</span>
          </div>
          <button
            onClick={() => {
              setError(null)
              setLoading(true)
              fetchDashboardOverview()
                .then(setData)
                .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load.'))
                .finally(() => setLoading(false))
            }}
            className="text-xs font-semibold text-red-700 underline hover:text-red-800 focus:outline-none whitespace-nowrap"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Monthly Summary Cards ──────────────────────────────────────── */}
      <section aria-labelledby="summary-heading">
        <h2 id="summary-heading" className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
          Monthly Summary
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {loading ? (
            <>
              <SummaryCardSkeleton />
              <SummaryCardSkeleton />
              <SummaryCardSkeleton />
            </>
          ) : summary ? (
            <>
              <SummaryCard
                label="Total Income"
                value={fmt(summary.totalIncome)}
                variant="income"
                icon={<IncomeIcon />}
              />
              <SummaryCard
                label="Total Expenses"
                value={fmt(summary.totalExpenses)}
                variant="expense"
                icon={<ExpenseIcon />}
              />
              <SummaryCard
                label="Net Balance"
                value={fmt(summary.netBalance)}
                variant="balance"
                icon={<BalanceIcon />}
              />
            </>
          ) : null}
        </div>
      </section>

      {/* ── Budget + Category (side by side on wider screens) ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section aria-labelledby="budget-heading">
          <h2 id="budget-heading" className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
            Budget Status
          </h2>
          {loading ? <CardSkeleton /> : budget ? <BudgetCard budget={budget} /> : null}
        </section>

        <section aria-labelledby="category-heading">
          <h2 id="category-heading" className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
            Spending by Category
          </h2>
          {loading ? (
            <CardSkeleton />
          ) : categoryExpenses.length > 0 ? (
            <CategoryBreakdown categories={categoryExpenses} />
          ) : (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-10 text-center text-sm text-slate-400">
              No category data available.
            </div>
          )}
        </section>
      </div>

      {/* ── Recent Transactions Preview ────────────────────────────────── */}
      <section aria-labelledby="recent-heading">
        <div className="flex items-center justify-between mb-3">
          <h2 id="recent-heading" className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
            Recent Transactions
          </h2>
          <button
            onClick={() => onNavigate('transactions')}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors focus:outline-none focus:underline"
          >
            View all
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          {recentTransactions.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-400">
              No transactions yet this month.
            </div>
          ) : (
            <ul role="list" className="divide-y divide-slate-50">
              {recentTransactions.map((txn) => {
                const isIncome = txn.amount >= 0
                return (
                  <li
                    key={txn.id}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isIncome ? 'bg-emerald-50' : 'bg-red-50'}`}
                      aria-hidden="true"
                    >
                      {isIncome ? (
                        <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                        </svg>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 truncate">{txn.description}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{txn.category}</p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-semibold tabular-nums ${isIncome ? 'text-emerald-600' : 'text-slate-800'}`}>
                        {isIncome ? '+' : ''}{fmt(txn.amount)}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{fmtDate(txn.date)}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          <div className="border-t border-slate-50 px-5 py-3">
            <button
              onClick={() => onNavigate('transactions')}
              className="w-full text-center text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors focus:outline-none focus:underline py-0.5"
            >
              View all transactions &rarr;
            </button>
          </div>
        </div>
      </section>

      {/* ── Quick Navigation Cards ─────────────────────────────────────── */}
      <section aria-labelledby="quicknav-heading">
        <h2 id="quicknav-heading" className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
          Quick Access
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickNavCard
            label="Transactions"
            description="View & manage"
            color="bg-blue-50 hover:bg-blue-100"
            iconColor="text-blue-500"
            onClick={() => onNavigate('transactions')}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
            }
          />
          <QuickNavCard
            label="Budget"
            description="Track limits"
            color="bg-violet-50 hover:bg-violet-100"
            iconColor="text-violet-500"
            onClick={() => onNavigate('budget')}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
            }
          />
          <QuickNavCard
            label="Goals"
            description="Savings targets"
            color="bg-emerald-50 hover:bg-emerald-100"
            iconColor="text-emerald-500"
            onClick={() => onNavigate('goals')}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            }
          />
          <QuickNavCard
            label="AI Chat"
            description="Ask anything"
            color="bg-pink-50 hover:bg-pink-100"
            iconColor="text-pink-500"
            onClick={() => onNavigate('ai-chat')}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
              </svg>
            }
          />
        </div>
      </section>
    </main>
  )
}