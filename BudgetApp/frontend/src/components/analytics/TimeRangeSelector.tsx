import type { TimeRange } from '../../types/analytics'
import { TIME_RANGE_OPTIONS } from '../../types/analytics'

// ─── Props ────────────────────────────────────────────────────────────────────

interface TimeRangeSelectorProps {
  value: TimeRange
  onChange: (range: TimeRange) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Pill-style toggle for selecting the analytics time range.
 * Keyboard-accessible: each option is a focusable button.
 */
export default function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <div
      role="group"
      aria-label="Select time range"
      className="inline-flex items-center bg-slate-100 rounded-lg p-0.5 gap-0.5"
    >
      {TIME_RANGE_OPTIONS.map((opt) => {
        const isActive = opt.value === value
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            aria-pressed={isActive}
            className={[
              'px-3.5 py-1.5 text-xs font-medium rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
              isActive
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700',
            ].join(' ')}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}