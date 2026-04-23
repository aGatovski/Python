import React, { useState, useMemo } from 'react'
import type { SavingsGoal, SavingsGoalWithProgress, GoalFormData, GoalStatus } from '../types/savings'
import { MOCK_SAVINGS_GOALS } from '../data/mockSavings'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import GoalCard from '../components/savings/GoalCard'
import GoalForm from '../components/savings/GoalForm'
import ProgressBar from '../components/savings/ProgressBar'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(value: number): string {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(value)
}

function generateId(): string {
  return `goal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

/**
 * Derives progress fields from a raw SavingsGoal.
 * - completed : currentAmount >= targetAmount
 * - no-date   : no targetDate set
 * - on-track  : progress >= expected linear progress (10% tolerance)
 * - at-risk   : progress lagging or target date has passed
 */
function enrichGoal(goal: SavingsGoal): SavingsGoalWithProgress {
  const progressPercentage =
    goal.targetAmount > 0
      ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
      : 0

  const remainingAmount = Math.max(goal.targetAmount - goal.currentAmount, 0)

  let status: GoalStatus
  let daysRemaining: number | undefined

  if (goal.currentAmount >= goal.targetAmount) {
    status = 'completed'
  } else if (!goal.targetDate) {
    status = 'no-date'
  } else {
    const now = new Date()
    const target = new Date(goal.targetDate)
    const created = new Date(goal.createdAt)

    daysRemaining = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (target <= now) {
      status = 'at-risk'
    } else {
      const totalMs = target.getTime() - created.getTime()
      const elapsedMs = now.getTime() - created.getTime()
      const expectedProgress = totalMs > 0 ? (elapsedMs / totalMs) * 100 : 0
      status = progressPercentage >= expectedProgress - 10 ? 'on-track' : 'at-risk'
    }
  }

  return { ...goal, progressPercentage, remainingAmount, status, daysRemaining }
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string
  subtext?: string
  iconBg: string
  iconColor: string
  icon: React.ReactNode
  valueColor?: string
}

function StatCard({ label, value, subtext, iconBg, iconColor, icon, valueColor = 'text-slate-900' }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`} aria-hidden="true">
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

// ─── Empty State ──────────────────────────────────────────────────────────────

function GoalsEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-8 py-16 flex flex-col items-center text-center col-span-full">
      <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
        <svg className="w-7 h-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-slate-800 mb-1">No savings goals yet</h3>
      <p className="text-sm text-slate-500 max-w-xs mb-6">
        Create your first savings goal to start tracking your progress toward what matters most.
      </p>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add First Goal
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type ModalMode = 'add' | 'edit' | null

/**
 * Savings Goals page.
 * Lets users define savings goals, track progress, and manage them
 * through add / edit / delete flows. All state is local (mock data only).
 */
export default function GoalsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>(MOCK_SAVINGS_GOALS)
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | undefined>(undefined)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  // Enrich all goals with computed progress fields
  const enrichedGoals = useMemo<SavingsGoalWithProgress[]>(() => goals.map(enrichGoal), [goals])

  // Summary totals derived from enriched goals
  const totals = useMemo(() => {
    const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0)
    const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0)
    const completedCount = enrichedGoals.filter((g) => g.status === 'completed').length
    const atRiskCount = enrichedGoals.filter((g) => g.status === 'at-risk').length
    const overallPercent = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0
    return { totalSaved, totalTarget, completedCount, atRiskCount, overallPercent }
  }, [goals, enrichedGoals])

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleAddNew() {
    setEditingGoal(undefined)
    setModalMode('add')
  }

  function handleEdit(goal: SavingsGoalWithProgress) {
    // Strip derived fields — form only needs the base SavingsGoal shape
    const { progressPercentage: _p, remainingAmount: _r, status: _s, daysRemaining: _d, ...base } = goal
    setEditingGoal(base)
    setModalMode('edit')
  }

  function handleDeleteRequest(id: string) {
    setDeleteTargetId(id)
  }

  function handleDeleteConfirm() {
    if (!deleteTargetId) return
    setGoals((prev) => prev.filter((g) => g.id !== deleteTargetId))
    setDeleteTargetId(null)
  }

  function handleFormSubmit(data: GoalFormData) {
    if (modalMode === 'add') {
      const newGoal: SavingsGoal = {
        id: generateId(),
        createdAt: new Date().toISOString().split('T')[0],
        ...data,
      }
      setGoals((prev) => [...prev, newGoal])
    } else if (modalMode === 'edit' && editingGoal) {
      setGoals((prev) => prev.map((g) => (g.id === editingGoal.id ? { ...g, ...data } : g)))
    }
    setModalMode(null)
    setEditingGoal(undefined)
  }

  function handleFormCancel() {
    setModalMode(null)
    setEditingGoal(undefined)
  }

  const deleteTarget = goals.find((g) => g.id === deleteTargetId)

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Savings Goals</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Track your progress toward the things that matter most
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Goal
        </button>
      </div>

      {/* ── Overview stat cards ───────────────────────────────────────────── */}
      <section aria-labelledby="overview-heading">
        <h2 id="overview-heading" className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
          Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Total Saved */}
          <StatCard
            label="Total Saved"
            value={fmt(totals.totalSaved)}
            subtext={`across ${goals.length} ${goals.length === 1 ? 'goal' : 'goals'}`}
            iconBg="bg-blue-50"
            iconColor="text-blue-500"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />

          {/* Total Target */}
          <StatCard
            label="Total Target"
            value={fmt(totals.totalTarget)}
            subtext={`${Math.round(totals.overallPercent)}% saved overall`}
            iconBg="bg-violet-50"
            iconColor="text-violet-500"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            }
          />

          {/* Goals Completed */}
          <StatCard
            label="Completed"
            value={String(totals.completedCount)}
            subtext={totals.completedCount === 1 ? '1 goal reached' : `${totals.completedCount} goals reached`}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-500"
            valueColor="text-emerald-600"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />

          {/* At Risk */}
          <StatCard
            label="At Risk"
            value={String(totals.atRiskCount)}
            subtext={totals.atRiskCount === 0 ? 'All goals on track' : 'Need attention'}
            iconBg={totals.atRiskCount > 0 ? 'bg-amber-50' : 'bg-slate-50'}
            iconColor={totals.atRiskCount > 0 ? 'text-amber-500' : 'text-slate-400'}
            valueColor={totals.atRiskCount > 0 ? 'text-amber-600' : 'text-slate-500'}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            }
          />
        </div>
      </section>

      {/* ── Overall progress bar ──────────────────────────────────────────── */}
      {goals.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-700">Overall Savings Progress</p>
            <span className="text-sm font-bold tabular-nums text-slate-700">
              {Math.round(totals.overallPercent)}%
            </span>
          </div>
          <ProgressBar
            percentage={totals.overallPercent}
            barColor="bg-blue-500"
            trackColor="bg-blue-100"
            height="h-3"
            label={`Overall savings progress: ${Math.round(totals.overallPercent)}%`}
          />
          <div className="flex justify-between mt-2">
            <p className="text-xs text-slate-400">{fmt(totals.totalSaved)} saved</p>
            <p className="text-xs text-slate-400">{fmt(totals.totalTarget)} target</p>
          </div>
        </div>
      )}

      {/* ── Goals grid ───────────────────────────────────────────────────── */}
      <section aria-labelledby="goals-heading">
        <div className="flex items-center justify-between mb-3">
          <h2 id="goals-heading" className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
            Goals
            {goals.length > 0 && (
              <span className="ml-2 text-slate-400 font-normal normal-case tracking-normal">
                ({goals.length})
              </span>
            )}
          </h2>

          {/* At-risk alert badge */}
          {totals.atRiskCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {totals.atRiskCount} at risk
            </span>
          )}
        </div>

        {goals.length === 0 ? (
          <GoalsEmptyState onAdd={handleAddNew} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {enrichedGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
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
        title={modalMode === 'edit' ? 'Edit Goal' : 'Add Savings Goal'}
        maxWidth="max-w-lg"
      >
        <GoalForm
          initialData={editingGoal}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      </Modal>

      {/* ── Delete confirmation ───────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={deleteTargetId !== null}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
        title="Delete Goal"
        message={
          deleteTarget
            ? `Remove "${deleteTarget.name}"? Your saved progress data will be lost.`
            : 'Are you sure you want to delete this goal?'
        }
        confirmLabel="Delete"
        confirmVariant="danger"
      />
    </div>
  )
}