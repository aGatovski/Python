// ─── Savings Goal Data Model ──────────────────────────────────────────────────

/**
 * Status of a savings goal.
 * - completed : currentAmount >= targetAmount
 * - on-track  : has a target date and progress is on pace
 * - at-risk   : has a target date but progress is lagging or date has passed
 * - no-date   : no target date set (progress-only tracking)
 */
export type GoalStatus = 'on-track' | 'completed' | 'at-risk' | 'no-date'

/** Color theme key for a goal card */
export type GoalColor =
  | 'blue'
  | 'emerald'
  | 'violet'
  | 'amber'
  | 'rose'
  | 'indigo'
  | 'teal'
  | 'orange'

/** Core savings goal entity stored in state */
export interface SavingsGoal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  /** ISO date string (YYYY-MM-DD), optional */
  targetDate?: string
  /** Emoji icon for visual identity */
  icon: string
  /** Color theme key */
  color: GoalColor
  /** ISO date string (YYYY-MM-DD) when the goal was created */
  createdAt: string
}

/** Fields submitted via the add / edit form */
export type GoalFormData = Omit<SavingsGoal, 'id' | 'createdAt'>

/** SavingsGoal enriched with derived progress fields */
export interface SavingsGoalWithProgress extends SavingsGoal {
  /** 0–100, clamped */
  progressPercentage: number
  remainingAmount: number
  status: GoalStatus
  /** Days until targetDate (negative = overdue) */
  daysRemaining?: number
}

// ─── UI Metadata ──────────────────────────────────────────────────────────────

/** Tailwind class bundles for each color theme */
export interface GoalColorMeta {
  /** Progress bar fill */
  bar: string
  /** Progress bar track */
  barBg: string
  /** Status badge background + border */
  badgeBg: string
  /** Status badge text */
  badgeText: string
  /** Icon container background */
  iconBg: string
}

export const GOAL_COLOR_META: Record<GoalColor, GoalColorMeta> = {
  blue:    { bar: 'bg-blue-500',    barBg: 'bg-blue-100',    badgeBg: 'bg-blue-50 border-blue-100',       badgeText: 'text-blue-700',    iconBg: 'bg-blue-50'    },
  emerald: { bar: 'bg-emerald-500', barBg: 'bg-emerald-100', badgeBg: 'bg-emerald-50 border-emerald-100', badgeText: 'text-emerald-700', iconBg: 'bg-emerald-50' },
  violet:  { bar: 'bg-violet-500',  barBg: 'bg-violet-100',  badgeBg: 'bg-violet-50 border-violet-100',   badgeText: 'text-violet-700',  iconBg: 'bg-violet-50'  },
  amber:   { bar: 'bg-amber-500',   barBg: 'bg-amber-100',   badgeBg: 'bg-amber-50 border-amber-100',     badgeText: 'text-amber-700',   iconBg: 'bg-amber-50'   },
  rose:    { bar: 'bg-rose-500',    barBg: 'bg-rose-100',    badgeBg: 'bg-rose-50 border-rose-100',       badgeText: 'text-rose-700',    iconBg: 'bg-rose-50'    },
  indigo:  { bar: 'bg-indigo-500',  barBg: 'bg-indigo-100',  badgeBg: 'bg-indigo-50 border-indigo-100',   badgeText: 'text-indigo-700',  iconBg: 'bg-indigo-50'  },
  teal:    { bar: 'bg-teal-500',    barBg: 'bg-teal-100',    badgeBg: 'bg-teal-50 border-teal-100',       badgeText: 'text-teal-700',    iconBg: 'bg-teal-50'    },
  orange:  { bar: 'bg-orange-500',  barBg: 'bg-orange-100',  badgeBg: 'bg-orange-50 border-orange-100',   badgeText: 'text-orange-700',  iconBg: 'bg-orange-50'  },
}

/** Ordered list of available color options for the goal form */
export const GOAL_COLORS: GoalColor[] = [
  'blue', 'emerald', 'violet', 'amber', 'rose', 'indigo', 'teal', 'orange',
]

/** Tailwind background class for each color swatch in the picker */
export const COLOR_SWATCH_CLASS: Record<GoalColor, string> = {
  blue:    'bg-blue-500',
  emerald: 'bg-emerald-500',
  violet:  'bg-violet-500',
  amber:   'bg-amber-500',
  rose:    'bg-rose-500',
  indigo:  'bg-indigo-500',
  teal:    'bg-teal-500',
  orange:  'bg-orange-500',
}

/** Predefined emoji icons available in the goal form */
export const GOAL_ICONS: string[] = [
  '🛡️', '✈️', '💻', '🚗', '💍', '🎓',
  '🏠', '💰', '🏖️', '🎯', '🌍', '🏋️',
  '📱', '🎸', '🐾', '🎁',
]