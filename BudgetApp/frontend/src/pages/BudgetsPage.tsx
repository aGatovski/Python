import React, { useState, useMemo } from 'react'
import type { BudgetCategory, BudgetFormData } from '../types/budget'
import { CATEGORY_META, DEFAULT_CATEGORY_META } from '../types/budget'
import { MOCK_BUDGETS } from '../data/mockBudgets'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import BudgetForm from '../components/BudgetForm'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(value: number): string {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(value)
}

function generateId(): string {
  return `bgt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function getUsageStyle(percent: number) {
  if (percent >= 90) {
    return {
      bar: 'bg-red-500',
      badgeBg: 'bg-red-50 border-red-100',
      badgeText: 'text-red-600',
      remainingText: 'text-red-500',
    }
  }
  if (percent >= 70) {
    return {
      bar: 'bg-amber-400',
      badgeBg: 'bg-amber-50 border-amber-100',
      badgeText: 'text-amber-600',
      remainingText: 'text-amber-600',
    }
  }
  return {
    bar: 'bg-emerald-500',
    badgeBg: 'bg-emerald-50 border-emerald-100',
    badgeText: 'text-emerald-600',
    remainingText: 'text-emerald-600',
  }
}

// ─── OverviewCard ─────────────────────────────────────────────────────────────

interface OverviewCardProps {
  label: string
  value: string
  subtext?: string
  iconBg: string
  iconColor: string
  icon: React.ReactNode
  valueColor?: string
}

function OverviewCard({
  label,
  value,
  subtext,
  iconBg,
  iconColor,
  icon,
  valueColor = 'text-slate-900',
}: OverviewCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-5 flex items-start gap-4">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}
        aria-hidden="true"
      >
        <span className={iconColor}>{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-bold mt-1 tabular-nums leading-none ${valueColor}`}>{value}</p>
        {subtext && <p className="mt-1.5 text-xs text-slate-400">{subtext}</p>}
      </div>
    </div>
  )
}

// ─── BudgetCategoryCard ───────────────────────────────────────────────────────

interface BudgetCategoryCardProps {
  budget: BudgetCategory
  onEdit: (budget: BudgetCategory) => void
  onDelete: (id: string) => void
}

function BudgetCategoryCard({ budget, onEdit, onDelete }: BudgetCategoryCardProps) {
  const { category, monthlyLimit, amountSpent } = budget
  const remaining = monthlyLimit - amountSpent
  const usagePercent = monthlyLimit > 0 ? Math.round((amountSpent / monthlyLimit) * 100) : 0
  const barWidth = Math.min(usagePercent, 100)
  const isOverBudget = amountSpent > monthlyLimit

  const meta = CATEGORY_META[category] ?? DEFAULT_CATEGORY_META
  const usageStyle = getUsageStyle(usagePercent)

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">

      {/* Header: icon + name + badge + actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-lg ${meta.iconBg}`}
            aria-hidden="true"
          >
            {meta.emoji}
          </div>
          <div className="min-w-0">
            <h3 className={`text-sm font-semibold truncate ${meta.textColor}`}>{category}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Limit: {fmt(monthlyLimit)} / mo</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Usage % badge */}
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${usageStyle.badgeBg} ${usageStyle.badgeText}`}
          >
            {usagePercent}%
          </span>

          {/* Edit */}
          <button
            onClick={() => onEdit(budget)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={`Edit ${category} budget`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(budget.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label={`Delete ${category} budget`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="w-full h-2 bg-slate-100 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={barWidth}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${category} budget: ${usagePercent}% used`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${usageStyle.bar}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>

      {/* Stats: spent / limit / remaining */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-50">
        <div className="text-center">
          <p className="text-xs text-slate-400 mb-0.5">Spent</p>
          <p className="text-sm font-bold tabular-nums text-slate-800">{fmt(amountSpent)}</p>
        </div>
        <div className="text-center border-x border-slate-50">
          <p className="text-xs text-slate-400 mb-0.5">Limit</p>
          <p className="text-sm font-bold tabular-nums text-slate-500">{fmt(monthlyLimit)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400 mb-0.5">Remaining</p>
          <p className={`text-sm font-bold tabular-nums ${usageStyle.remainingText}`}>
            {remaining >= 0 ? fmt(remaining) : `-${fmt(Math.abs(remaining))}`}
          </p>
        </div>
      </div>

      {/* Over-budget alert banner */}
      {isOverBudget && (
        <div className="flex items-center gap-1.5 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
          <svg
            className="w-3.5 h-3.5 text-red-500 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-xs font-medium text-red-600">
            Over budget by {fmt(Math.abs(remaining))}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function BudgetEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-8 py-16 flex flex-col items-center text-center col-span-full">
      <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
        <svg
          className="w-7 h-7 text-violet-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-slate-800 mb-1">No budgets set</h3>
      <p className="text-sm text-slate-500 max-w-xs mb-6">
        Create spending limits for your expense categories to start tracking your monthly budget.
      </p>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add First Budget
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type ModalMode = 'add' | 'edit' | null

/**
 * Budget management page.
 * Lets users set monthly spending limits per category, track real-time
 * progress against those limits, and add / edit / delete budget categories.
 */
export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<BudgetCategory[]>(MOCK_BUDGETS)
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [editingBudget, setEditingBudget] = useState<BudgetCategory | undefined>(undefined)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  // ── Derived totals ──────────────────────────────────────────────────────────

  const totals = useMemo(() => {
    const totalBudget = budgets.reduce((sum, b) => sum + b.monthlyLimit, 0)
    const totalSpent = budgets.reduce((sum, b) => sum + b.amountSpent, 0)
    const totalRemaining = totalBudget - totalSpent
    const overallPercent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0
    const overBudgetCount = budgets.filter((b) => b.amountSpent > b.monthlyLimit).length
    return { totalBudget, totalSpent, totalRemaining, overallPercent, overBudgetCount }
  }, [budgets])

  // Categories already assigned — prevents duplicates in the add form
  const usedCategories = useMemo(() => budgets.map((b) => b.category), [budgets])

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleAddNew() {
    setEditingBudget(undefined)
    setModalMode('add')
  }

  function handleEdit(budget: BudgetCategory) {
    setEditingBudget(budget)
    setModalMode('edit')
  }

  function handleDeleteRequest(id: string) {
    setDeleteTargetId(id)
  }

  function handleDeleteConfirm() {
    if (!deleteTargetId) return
    setBudgets((prev) => prev.filter((b) => b.id !== deleteTargetId))
    setDeleteTargetId(null)
  }

  function handleFormSubmit(data: BudgetFormData) {
    if (modalMode === 'add') {
      const newBudget: BudgetCategory = {
        id: generateId(),
        category: data.category,
        monthlyLimit: data.monthlyLimit,
        amountSpent: 0,
      }
      setBudgets((prev) => [...prev, newBudget])
    } else if (modalMode === 'edit' && editingBudget) {
      setBudgets((prev) =>
        prev.map((b) =>
          b.id === editingBudget.id ? { ...b, monthlyLimit: data.monthlyLimit } : b
        )
      )
    }
    setModalMode(null)
    setEditingBudget(undefined)
  }

  function handleFormCancel() {
    setModalMode(null)
    setEditingBudget(undefined)
  }

  const deleteTarget = budgets.find((b) => b.id === deleteTargetId)

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Budget</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Monthly spending limits &middot;{' '}
            <span className="font-medium text-slate-700">April 2026</span>
          </p>
        </div>

        <button
          onClick={handleAddNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Budget
        </button>
      </div>

      {/* ── Overview cards ────────────────────────────────────────────────── */}
      <section aria-labelledby="overview-heading">
        <h2
          id="overview-heading"
          className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3"
        >
          Monthly Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Budget */}
          <OverviewCard
            label="Total Budget"
            value={fmt(totals.totalBudget)}
            subtext={`${budgets.length} ${budgets.length === 1 ? 'category' : 'categories'}`}
            iconBg="bg-violet-50"
            iconColor="text-violet-500"
            valueColor="text-slate-900"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
            }
          />

          {/* Total Spent */}
          <OverviewCard
            label="Total Spent"
            value={fmt(totals.totalSpent)}
            subtext={`${totals.overallPercent}% of total budget used`}
            iconBg="bg-red-50"
            iconColor="text-red-400"
            valueColor={totals.overallPercent >= 90 ? 'text-red-600' : totals.overallPercent >= 70 ? 'text-amber-600' : 'text-slate-900'}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" />
              </svg>
            }
          />

          {/* Remaining */}
          <OverviewCard
            label="Remaining"
            value={fmt(Math.abs(totals.totalRemaining))}
            subtext={
              totals.totalRemaining < 0
                ? `Over budget by ${fmt(Math.abs(totals.totalRemaining))}`
                : totals.overBudgetCount > 0
                ? `${totals.overBudgetCount} ${totals.overBudgetCount === 1 ? 'category' : 'categories'} over limit`
                : 'On track this month'
            }
            iconBg={totals.totalRemaining >= 0 ? 'bg-emerald-50' : 'bg-red-50'}
            iconColor={totals.totalRemaining >= 0 ? 'text-emerald-500' : 'text-red-400'}
            valueColor={totals.totalRemaining >= 0 ? 'text-emerald-600' : 'text-red-600'}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>
      </section>

      {/* ── Overall progress bar ──────────────────────────────────────────── */}
      {budgets.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-700">Overall Budget Usage</p>
            <span
              className={`text-sm font-bold tabular-nums ${
                totals.overallPercent >= 90
                  ? 'text-red-600'
                  : totals.overallPercent >= 70
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              }`}
            >
              {totals.overallPercent}%
            </span>
          </div>
          <div
            className="w-full h-3 bg-slate-100 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.min(totals.overallPercent, 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Overall budget usage: ${totals.overallPercent}%`}
          >
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                totals.overallPercent >= 90
                  ? 'bg-red-500'
                  : totals.overallPercent >= 70
                  ? 'bg-amber-400'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(totals.overallPercent, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <p className="text-xs text-slate-400">
              {fmt(totals.totalSpent)} spent
            </p>
            <p className="text-xs text-slate-400">
              {fmt(totals.totalBudget)} total
            </p>
          </div>
        </div>
      )}

      {/* ── Budget categories grid ────────────────────────────────────────── */}
      <section aria-labelledby="categories-heading">
        <div className="flex items-center justify-between mb-3">
          <h2
            id="categories-heading"
            className="text-xs font-semibold text-slate-500 uppercase tracking-widest"
          >
            Categories
            {budgets.length > 0 && (
              <span className="ml-2 text-slate-400 font-normal normal-case tracking-normal">
                ({budgets.length})
              </span>
            )}
          </h2>

          {/* Alert badge if any categories are over budget */}
          {totals.overBudgetCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-100">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {totals.overBudgetCount} over limit
            </span>
          )}
        </div>

        {budgets.length === 0 ? (
          <BudgetEmptyState onAdd={handleAddNew} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {budgets.map((budget) => (
              <BudgetCategoryCard
                key={budget.id}
                budget={budget}
                onEdit={handleEdit}
                onDelete={handleDeleteRequest}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Add / Edit modal ──────────────────────────────────────────────── */}
      <Modal
        isOpen={modalMode !== null}
        onClose={handleFormCancel}
        title={modalMode === 'edit' ? 'Edit Budget' : 'Add Budget Category'}
        maxWidth="max-w-md"
      >
        <BudgetForm
          initialData={editingBudget}
          usedCategories={usedCategories}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      </Modal>

      {/* ── Delete confirmation ───────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={deleteTargetId !== null}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
        title="Delete Budget"
        message={
          deleteTarget
            ? `Remove the "${deleteTarget.category}" budget? This will delete the spending limit but won't affect your transactions.`
            : 'Are you sure you want to delete this budget?'
        }
        confirmLabel="Delete"
        confirmVariant="danger"
      />
    </div>
  )
}