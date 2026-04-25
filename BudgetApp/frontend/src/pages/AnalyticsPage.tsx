import { useState, useMemo, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { TimeRange, AnalyticsSummary, MonthlyDataPoint, CategoryDataPoint } from '../types/analytics'
import { fetchMonthlyData, fetchCategoryData } from '../api/analyticsApi'
import TimeRangeSelector from '../components/analytics/TimeRangeSelector'
import IncomeExpensesChart from '../components/analytics/IncomeExpensesChart'
import SpendingTrendChart from '../components/analytics/SpendingTrendChart'
import CategoryDonutChart from '../components/analytics/CategoryDonutChart'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(value: number): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string
  value: string
  sub?: string
  /** Controls the accent colour of the value text */
  variant: 'income' | 'expense' | 'savings' | 'neutral'
  icon: ReactNode
}

const METRIC_VARIANT_STYLES: Record<MetricCardProps['variant'], string> = {
  income:  'text-emerald-600',
  expense: 'text-red-500',
  savings: 'text-blue-600',
  neutral: 'text-slate-800',
}

const METRIC_ICON_BG: Record<MetricCardProps['variant'], string> = {
  income:  'bg-emerald-50 text-emerald-500',
  expense: 'bg-red-50 text-red-400',
  savings: 'bg-blue-50 text-blue-500',
  neutral: 'bg-slate-100 text-slate-500',
}

function MetricCard({ label, value, sub, variant, icon }: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-5 flex items-start gap-4">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${METRIC_ICON_BG[variant]}`}
        aria-hidden="true"
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-bold mt-1 tabular-nums leading-none ${METRIC_VARIANT_STYLES[variant]}`}>
          {value}
        </p>
        {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Skeleton loader for metric cards ────────────────────────────────────────

function MetricCardSkeleton() {
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

// ─── Section Card wrapper ─────────────────────────────────────────────────────

interface SectionCardProps {
  title: string
  description?: string
  children: ReactNode
  /** Optional right-side slot (e.g. a badge or secondary label) */
  aside?: ReactNode
}

function SectionCard({ title, description, children, aside }: SectionCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-5">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
          {description && (
            <p className="text-xs text-slate-400 mt-0.5">{description}</p>
          )}
        </div>
        {aside && <div className="flex-shrink-0 ml-4">{aside}</div>}
      </div>
      {children}
    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconIncome() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  )
}

function IconExpense() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" />
    </svg>
  )
}

function IconSavings() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function IconAvg() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
    </svg>
  )
}

// ─── AnalyticsPage ────────────────────────────────────────────────────────────

/**
 * Analytics page — insights and trend analysis for the user's finances.
 *
 * Sections:
 *  1. Summary metrics (income, expenses, savings, avg monthly spend)
 *  2. Income vs Expenses grouped bar chart
 *  3. Spending trend line chart + Category donut chart (side by side)
 *
 * Data is fetched from the backend analytics API and filtered by the selected
 * time range. All visuals are pure SVG — no external chart library.
 */
export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('6m')

  // Async data state
  const [monthlyData, setMonthlyData] = useState<MonthlyDataPoint[]>([])
  const [categoryData, setCategoryData] = useState<CategoryDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Re-fetch whenever the time range changes
  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        // Fetch both datasets in parallel
        const [monthly, category] = await Promise.all([
          fetchMonthlyData(timeRange),
          fetchCategoryData(timeRange),
        ])
        if (!cancelled) {
          setMonthlyData(monthly)
          setCategoryData(category)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load analytics data.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    // Cleanup: ignore stale responses if the component unmounts or range changes
    return () => { cancelled = true }
  }, [timeRange])

  // Compute summary metrics from the fetched monthly data
  const summary = useMemo<AnalyticsSummary>(() => {
    const totalIncome   = monthlyData.reduce((s, d) => s + d.income, 0)
    const totalExpenses = monthlyData.reduce((s, d) => s + d.expenses, 0)
    const netSavings    = totalIncome - totalExpenses
    const savingsRate   = totalIncome > 0 ? Math.max((netSavings / totalIncome) * 100, 0) : 0
    const avgMonthlyExpenses = monthlyData.length > 0 ? totalExpenses / monthlyData.length : 0

    // Month-over-month expense change (last vs second-to-last month)
    const expenseTrend =
      monthlyData.length >= 2
        ? ((monthlyData[monthlyData.length - 1].expenses -
            monthlyData[monthlyData.length - 2].expenses) /
            monthlyData[monthlyData.length - 2].expenses) *
          100
        : 0

    const topCategory = categoryData.length > 0 ? categoryData[0].category : '—'

    return {
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate,
      avgMonthlyExpenses,
      topCategory,
      expenseTrend,
    }
  }, [monthlyData, categoryData])

  // Human-readable period label for section descriptions
  const periodLabel =
    timeRange === '3m' ? 'last 3 months' :
    timeRange === '6m' ? 'last 6 months' :
    'last 12 months'

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Analytics</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Insights and trends for your finances — {periodLabel}
          </p>
        </div>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>

      {/* ── Error banner ─────────────────────────────────────────────────── */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-sm text-red-700"
        >
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <span><strong>Could not load analytics:</strong> {error}</span>
        </div>
      )}

      {/* ── Summary metrics ──────────────────────────────────────────────── */}
      <section aria-labelledby="metrics-heading">
        <h2 id="metrics-heading" className="sr-only">Summary metrics</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            // Show skeleton cards while data is loading
            Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)
          ) : (
            <>
              <MetricCard
                label="Total Income"
                value={fmt(summary.totalIncome)}
                sub={`Across ${monthlyData.length} months`}
                variant="income"
                icon={<IconIncome />}
              />
              <MetricCard
                label="Total Expenses"
                value={fmt(summary.totalExpenses)}
                sub={
                  summary.expenseTrend >= 0
                    ? `+${summary.expenseTrend.toFixed(1)}% last month`
                    : `${summary.expenseTrend.toFixed(1)}% last month`
                }
                variant="expense"
                icon={<IconExpense />}
              />
              <MetricCard
                label="Net Savings"
                value={fmt(summary.netSavings)}
                sub={`${summary.savingsRate.toFixed(1)}% savings rate`}
                variant="savings"
                icon={<IconSavings />}
              />
              <MetricCard
                label="Avg Monthly Spend"
                value={fmt(summary.avgMonthlyExpenses)}
                sub={`Top: ${summary.topCategory}`}
                variant="neutral"
                icon={<IconAvg />}
              />
            </>
          )}
        </div>
      </section>

      {/* ── Income vs Expenses chart ──────────────────────────────────────── */}
      <section aria-labelledby="income-expenses-heading">
        <SectionCard
          title="Income vs Expenses"
          description={`Monthly comparison — ${periodLabel}`}
          aside={
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                <span className="text-xs text-slate-500">Income</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" />
                <span className="text-xs text-slate-500">Expenses</span>
              </div>
            </div>
          }
        >
          {loading ? (
            <div className="h-56 bg-slate-50 rounded-lg animate-pulse" />
          ) : (
            <IncomeExpensesChart data={monthlyData} />
          )}
        </SectionCard>
      </section>

      {/* ── Spending Trend + Category Breakdown ──────────────────────────── */}
      <section
        aria-labelledby="trend-category-heading"
        className="grid grid-cols-1 lg:grid-cols-5 gap-6"
      >
        {/* Spending trend — takes 3/5 of the row on large screens */}
        <div className="lg:col-span-3">
          <SectionCard
            title="Spending Trend"
            description={`How your expenses have moved — ${periodLabel}`}
          >
            {loading ? (
              <div className="h-56 bg-slate-50 rounded-lg animate-pulse" />
            ) : (
              <SpendingTrendChart data={monthlyData} />
            )}
          </SectionCard>
        </div>

        {/* Category breakdown — takes 2/5 of the row on large screens */}
        <div className="lg:col-span-2">
          <SectionCard
            title="Spending by Category"
            description={`Where your money goes — ${periodLabel}`}
          >
            {loading ? (
              <div className="h-56 bg-slate-50 rounded-lg animate-pulse" />
            ) : (
              <CategoryDonutChart data={categoryData} />
            )}
          </SectionCard>
        </div>
      </section>

      {/* ── Insights callout ─────────────────────────────────────────────── */}
      {!loading && !error && (
        <section aria-labelledby="insights-heading">
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                </svg>
              </div>
              <div>
                <h2 id="insights-heading" className="text-sm font-semibold text-blue-900">
                  Key Insight
                </h2>
                <p className="mt-1 text-sm text-blue-700 leading-relaxed">
                  {summary.savingsRate >= 20
                    ? `You're saving ${summary.savingsRate.toFixed(1)}% of your income — great work! Your top spending category is ${summary.topCategory}.`
                    : summary.savingsRate >= 10
                    ? `Your savings rate is ${summary.savingsRate.toFixed(1)}%. Consider reducing ${summary.topCategory} spend to push above 20%.`
                    : `Your savings rate is ${summary.savingsRate.toFixed(1)}% — below the recommended 20%. ${summary.topCategory} is your largest expense category.`
                  }
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

    </main>
  )
}