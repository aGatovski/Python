import type { SavingsGoalWithProgress } from '../../types/savings'
import { GOAL_COLOR_META } from '../../types/savings'
import ProgressBar from './ProgressBar'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(value: number): string {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(value)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

interface StatusBadgeProps {
  status: SavingsGoalWithProgress['status']
}

function StatusBadge({ status }: StatusBadgeProps) {
  const config: Record<
    SavingsGoalWithProgress['status'],
    { bg: string; text: string; label: string }
  > = {
    completed:  { bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700', label: '✓ Completed'    },
    'on-track': { bg: 'bg-blue-50 border-blue-100',       text: 'text-blue-700',    label: 'On Track'       },
    'at-risk':  { bg: 'bg-amber-50 border-amber-100',     text: 'text-amber-700',   label: 'At Risk'        },
    'no-date':  { bg: 'bg-slate-50 border-slate-200',     text: 'text-slate-500',   label: 'No Target Date' },
  }

  const { bg, text, label } = config[status]

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${bg} ${text}`}
    >
      {label}
    </span>
  )
}

// ─── Days Remaining Pill ──────────────────────────────────────────────────────

function DaysRemainingPill({ daysRemaining }: { daysRemaining: number }) {
  if (daysRemaining > 0) {
    return (
      <span className="text-xs text-slate-400">
        {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
      </span>
    )
  }
  return <span className="text-xs font-medium text-red-500">Overdue</span>
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface GoalCardProps {
  goal: SavingsGoalWithProgress
  onEdit: (goal: SavingsGoalWithProgress) => void
  onDelete: (id: string) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Card displaying a single savings goal with progress bar, amounts,
 * status badge, and edit / delete actions.
 *
 * Completed goals are visually distinguished with a green progress bar
 * and an emerald border to signal achievement.
 */
export default function GoalCard({ goal, onEdit, onDelete }: GoalCardProps) {
  const {
    name,
    icon,
    color,
    targetAmount,
    currentAmount,
    targetDate,
    progressPercentage,
    remainingAmount,
    status,
    daysRemaining,
  } = goal

  const meta = GOAL_COLOR_META[color]
  const isCompleted = status === 'completed'

  // Completed goals use a solid emerald bar regardless of their theme color
  const barColor = isCompleted ? 'bg-emerald-500' : meta.bar
  const trackColor = isCompleted ? 'bg-emerald-100' : meta.barBg

  return (
    <div
      className={[
        'bg-white rounded-xl border shadow-sm p-5 flex flex-col gap-4',
        'hover:shadow-md transition-shadow',
        isCompleted ? 'border-emerald-100' : 'border-slate-100',
      ].join(' ')}
    >
      {/* ── Header: icon + name + status + actions ─────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Emoji icon container */}
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl ${
              isCompleted ? 'bg-emerald-50' : meta.iconBg
            }`}
            aria-hidden="true"
          >
            {icon}
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-800 truncate">{name}</h3>
            <div className="mt-0.5">
              <StatusBadge status={status} />
            </div>
          </div>
        </div>

        {/* Edit / Delete action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(goal)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={`Edit ${name}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </button>

          <button
            onClick={() => onDelete(goal.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label={`Delete ${name}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Progress bar + percentage ───────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-slate-500">Progress</span>
          <span
            className={`text-xs font-bold tabular-nums ${
              isCompleted ? 'text-emerald-600' : 'text-slate-700'
            }`}
          >
            {Math.round(progressPercentage)}%
          </span>
        </div>
        <ProgressBar
          percentage={progressPercentage}
          barColor={barColor}
          trackColor={trackColor}
          height="h-2.5"
          label={`${name} savings progress: ${Math.round(progressPercentage)}%`}
        />
      </div>

      {/* ── Amount stats: saved / target / remaining ────────────────────── */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-50">
        <div className="text-center">
          <p className="text-xs text-slate-400 mb-0.5">Saved</p>
          <p className="text-sm font-bold tabular-nums text-slate-800">{fmt(currentAmount)}</p>
        </div>
        <div className="text-center border-x border-slate-50">
          <p className="text-xs text-slate-400 mb-0.5">Target</p>
          <p className="text-sm font-bold tabular-nums text-slate-500">{fmt(targetAmount)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400 mb-0.5">Remaining</p>
          <p
            className={`text-sm font-bold tabular-nums ${
              isCompleted ? 'text-emerald-600' : 'text-slate-800'
            }`}
          >
            {isCompleted ? '—' : fmt(remainingAmount)}
          </p>
        </div>
      </div>

      {/* ── Target date row ─────────────────────────────────────────────── */}
      {targetDate && !isCompleted && (
        <div className="flex items-center justify-between pt-1 border-t border-slate-50">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
            </svg>
            <span>Target: {formatDate(targetDate)}</span>
          </div>
          {daysRemaining !== undefined && (
            <DaysRemainingPill daysRemaining={daysRemaining} />
          )}
        </div>
      )}

      {/* ── Completed celebration banner ────────────────────────────────── */}
      {isCompleted && (
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-lg">
          <svg
            className="w-4 h-4 text-emerald-500 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs font-medium text-emerald-700">
            Goal reached{targetDate ? ` · ${formatDate(targetDate)}` : ''}
          </p>
        </div>
      )}
    </div>
  )
}