import api from './client'
import type { SavingsGoal, GoalColor } from '../types/savings'

// ─── Backend response shapes ──────────────────────────────────────────────────

/** Raw shape returned by GET /api/goals and POST /api/goals */
interface GoalOut {
  id: number
  user_id: number
  name: string
  target_amount: number
  current_amount: number
  deadline: string | null   // "YYYY-MM-DD" or null
}

// ─── Request payload types ────────────────────────────────────────────────────

export interface CreateGoalPayload {
  name: string
  target_amount: number
  deadline?: string         // "YYYY-MM-DD"
}

export interface UpdateGoalPayload {
  name?: string
  target_amount?: number
  current_amount?: number
  deadline?: string | null  // null clears the deadline
}

// ─── UI-only metadata not persisted by the backend ───────────────────────────

/** Icon + color chosen in the form — kept in frontend state only */
export interface GoalUIMeta {
  icon: string
  color: GoalColor
}

const DEFAULT_ICON = '🎯'
const DEFAULT_COLOR: GoalColor = 'blue'

// ─── Response mapper ──────────────────────────────────────────────────────────

/**
 * Converts a raw GoalOut from the backend into the frontend SavingsGoal shape.
 *
 * Field renames / transforms:
 *   id             (number) → id (string)
 *   target_amount         → targetAmount
 *   current_amount        → currentAmount
 *   deadline              → targetDate  (null → undefined)
 *   icon / color          → supplied via uiMeta or defaults
 *   createdAt             → today's date (backend doesn't expose it in GoalOut)
 */
function mapGoalOutToSavingsGoal(
  raw: GoalOut,
  uiMeta?: Partial<GoalUIMeta>,
): SavingsGoal {
  return {
    id:            String(raw.id),
    name:          raw.name,
    targetAmount:  raw.target_amount,
    currentAmount: raw.current_amount,
    targetDate:    raw.deadline ?? undefined,
    icon:          uiMeta?.icon  ?? DEFAULT_ICON,
    color:         uiMeta?.color ?? DEFAULT_COLOR,
    // Backend doesn't return createdAt in GoalOut; fall back to today
    createdAt:     new Date().toISOString().split('T')[0],
  }
}

// ─── Public API functions ─────────────────────────────────────────────────────

/**
 * Fetches all goals for the current user.
 * GET /api/goals
 *
 * Icon and color are not stored by the backend, so all goals loaded from the
 * server receive the default values. They can be changed locally via the form.
 */
export async function fetchGoals(): Promise<SavingsGoal[]> {
  const goals = await api.get<GoalOut[]>('/api/goals')
  return goals.map((g) => mapGoalOutToSavingsGoal(g))
}

/**
 * Creates a new goal via POST /api/goals.
 * Returns the full SavingsGoal with the server-assigned id merged with the
 * caller-supplied UI metadata (icon, color).
 */
export async function createGoal(
  payload: CreateGoalPayload,
  uiMeta?: GoalUIMeta,
): Promise<SavingsGoal> {
  const raw = await api.post<GoalOut>('/api/goals', payload)
  return mapGoalOutToSavingsGoal(raw, uiMeta)
}

/**
 * Updates an existing goal via PUT /api/goals/{id}.
 * Returns the raw GoalOut; the caller is responsible for merging UI metadata.
 */
export async function updateGoal(
  id: string,
  payload: UpdateGoalPayload,
): Promise<GoalOut> {
  return api.put<GoalOut>(`/api/goals/${id}`, payload)
}

/**
 * Deletes a goal via DELETE /api/goals/{id}.
 * The backend returns 204 No Content on success.
 */
export async function deleteGoal(id: string): Promise<void> {
  return api.delete<void>(`/api/goals/${id}`)
}