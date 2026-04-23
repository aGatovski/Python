import React, { useState, useEffect } from 'react'
import type { SavingsGoal, GoalFormData, GoalColor } from '../../types/savings'
import { GOAL_ICONS, GOAL_COLORS, COLOR_SWATCH_CLASS } from '../../types/savings'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormErrors {
  name?: string
  targetAmount?: string
  currentAmount?: string
  targetDate?: string
}

interface GoalFormProps {
  initialData?: SavingsGoal
  onSubmit: (data: GoalFormData) => void
  onCancel: () => void
}

const DEFAULT_ICON = '🎯'
const DEFAULT_COLOR: GoalColor = 'blue'

// ─── Component ────────────────────────────────────────────────────────────────

export default function GoalForm({ initialData, onSubmit, onCancel }: GoalFormProps) {
  const [name, setName] = useState(initialData?.name ?? '')
  const [targetRaw, setTargetRaw] = useState(initialData ? String(initialData.targetAmount) : '')
  const [currentRaw, setCurrentRaw] = useState(initialData ? String(initialData.currentAmount) : '0')
  const [targetDate, setTargetDate] = useState(initialData?.targetDate ?? '')
  const [icon, setIcon] = useState<string>(initialData?.icon ?? DEFAULT_ICON)
  const [color, setColor] = useState<GoalColor>(initialData?.color ?? DEFAULT_COLOR)
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (initialData) {
      setName(initialData.name)
      setTargetRaw(String(initialData.targetAmount))
      setCurrentRaw(String(initialData.currentAmount))
      setTargetDate(initialData.targetDate ?? '')
      setIcon(initialData.icon)
      setColor(initialData.color)
    } else {
      setName('')
      setTargetRaw('')
      setCurrentRaw('0')
      setTargetDate('')
      setIcon(DEFAULT_ICON)
      setColor(DEFAULT_COLOR)
    }
    setErrors({})
  }, [initialData]) // eslint-disable-line react-hooks/exhaustive-deps

  function validate(): boolean {
    const newErrors: FormErrors = {}

    if (name.trim().length === 0) {
      newErrors.name = 'Goal name is required.'
    } else if (name.trim().length > 60) {
      newErrors.name = 'Goal name must be 60 characters or fewer.'
    }

    const parsedTarget = parseFloat(targetRaw)
    if (targetRaw.trim() === '' || isNaN(parsedTarget)) {
      newErrors.targetAmount = 'Enter a valid target amount (e.g. 5000).'
    } else if (parsedTarget <= 0) {
      newErrors.targetAmount = 'Target amount must be greater than zero.'
    } else if (parsedTarget > 10_000_000) {
      newErrors.targetAmount = 'Target amount seems unrealistically high.'
    }

    const parsedCurrent = parseFloat(currentRaw)
    if (currentRaw.trim() === '' || isNaN(parsedCurrent)) {
      newErrors.currentAmount = 'Enter a valid saved amount (use 0 if starting fresh).'
    } else if (parsedCurrent < 0) {
      newErrors.currentAmount = 'Saved amount cannot be negative.'
    } else if (!isNaN(parsedTarget) && parsedCurrent > parsedTarget) {
      newErrors.currentAmount = 'Saved amount cannot exceed the target amount.'
    }

    if (targetDate) {
      const dateVal = new Date(targetDate)
      if (isNaN(dateVal.getTime())) {
        newErrors.targetDate = 'Enter a valid date.'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    onSubmit({
      name: name.trim(),
      targetAmount: parseFloat(targetRaw),
      currentAmount: parseFloat(currentRaw),
      targetDate: targetDate || undefined,
      icon,
      color,
    })
  }

  function inputCls(hasError: boolean): string {
    return [
      'w-full px-3 py-2 text-sm text-slate-900 bg-white border rounded-lg',
      'focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors',
      hasError ? 'border-red-400' : 'border-slate-200 hover:border-slate-300',
    ].join(' ')
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">

      {/* Goal name */}
      <div>
        <label htmlFor="goal-name" className="block text-sm font-medium text-slate-700 mb-1.5">
          Goal Name
        </label>
        <input
          id="goal-name"
          type="text"
          placeholder="e.g. Emergency Fund"
          value={name}
          maxLength={60}
          onChange={(e) => {
            setName(e.target.value)
            if (errors.name) setErrors((p) => ({ ...p, name: undefined }))
          }}
          className={inputCls(Boolean(errors.name))}
          aria-describedby={errors.name ? 'goal-name-error' : undefined}
          aria-invalid={Boolean(errors.name)}
        />
        {errors.name && (
          <p id="goal-name-error" className="mt-1 text-xs text-red-600" role="alert">
            {errors.name}
          </p>
        )}
      </div>

      {/* Target amount */}
      <div>
        <label htmlFor="goal-target" className="block text-sm font-medium text-slate-700 mb-1.5">
          Target Amount
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 select-none pointer-events-none">
            €
          </span>
          <input
            id="goal-target"
            type="number"
            min="1"
            step="any"
            placeholder="e.g. 10000"
            value={targetRaw}
            onChange={(e) => {
              setTargetRaw(e.target.value)
              if (errors.targetAmount) setErrors((p) => ({ ...p, targetAmount: undefined }))
            }}
            className={inputCls(Boolean(errors.targetAmount)) + ' pl-7'}
            aria-describedby={errors.targetAmount ? 'goal-target-error' : undefined}
            aria-invalid={Boolean(errors.targetAmount)}
          />
        </div>
        {errors.targetAmount && (
          <p id="goal-target-error" className="mt-1 text-xs text-red-600" role="alert">
            {errors.targetAmount}
          </p>
        )}
      </div>

      {/* Current saved amount */}
      <div>
        <label htmlFor="goal-current" className="block text-sm font-medium text-slate-700 mb-1.5">
          Already Saved
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 select-none pointer-events-none">
            €
          </span>
          <input
            id="goal-current"
            type="number"
            min="0"
            step="any"
            placeholder="0"
            value={currentRaw}
            onChange={(e) => {
              setCurrentRaw(e.target.value)
              if (errors.currentAmount) setErrors((p) => ({ ...p, currentAmount: undefined }))
            }}
            className={inputCls(Boolean(errors.currentAmount)) + ' pl-7'}
            aria-describedby={errors.currentAmount ? 'goal-current-error' : 'goal-current-hint'}
            aria-invalid={Boolean(errors.currentAmount)}
          />
        </div>
        {errors.currentAmount ? (
          <p id="goal-current-error" className="mt-1 text-xs text-red-600" role="alert">
            {errors.currentAmount}
          </p>
        ) : (
          <p id="goal-current-hint" className="mt-1 text-xs text-slate-400">
            Enter 0 if you are starting from scratch.
          </p>
        )}
      </div>

      {/* Target date (optional) */}
      <div>
        <label htmlFor="goal-date" className="block text-sm font-medium text-slate-700 mb-1.5">
          Target Date <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <input
          id="goal-date"
          type="date"
          value={targetDate}
          onChange={(e) => {
            setTargetDate(e.target.value)
            if (errors.targetDate) setErrors((p) => ({ ...p, targetDate: undefined }))
          }}
          className={inputCls(Boolean(errors.targetDate))}
          aria-describedby={errors.targetDate ? 'goal-date-error' : 'goal-date-hint'}
          aria-invalid={Boolean(errors.targetDate)}
        />
        {errors.targetDate ? (
          <p id="goal-date-error" className="mt-1 text-xs text-red-600" role="alert">
            {errors.targetDate}
          </p>
        ) : (
          <p id="goal-date-hint" className="mt-1 text-xs text-slate-400">
            Setting a date enables on-track / at-risk status tracking.
          </p>
        )}
      </div>

      {/* Icon picker */}
      <div>
        <p className="text-sm font-medium text-slate-700 mb-2">Icon</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose an icon">
          {GOAL_ICONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setIcon(emoji)}
              className={[
                'w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all',
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
                icon === emoji
                  ? 'bg-blue-50 ring-2 ring-blue-400 scale-110'
                  : 'bg-slate-50 hover:bg-slate-100 border border-slate-200',
              ].join(' ')}
              aria-label={`Select icon ${emoji}`}
              aria-pressed={icon === emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Color picker */}
      <div>
        <p className="text-sm font-medium text-slate-700 mb-2">Color</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a color">
          {GOAL_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={[
                'w-7 h-7 rounded-full transition-all',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
                COLOR_SWATCH_CLASS[c],
                color === c
                  ? 'ring-2 ring-offset-2 ring-slate-400 scale-110'
                  : 'opacity-70 hover:opacity-100',
              ].join(' ')}
              aria-label={`Select color ${c}`}
              aria-pressed={color === c}
            />
          ))}
        </div>
      </div>

      {/* Form actions */}
      <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        >
          {initialData ? 'Save Changes' : 'Add Goal'}
        </button>
      </div>
    </form>
  )
}