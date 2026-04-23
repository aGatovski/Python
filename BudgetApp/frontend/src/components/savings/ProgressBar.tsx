// ─── Props ────────────────────────────────────────────────────────────────────

interface ProgressBarProps {
  /** 0–100 percentage value (will be clamped automatically) */
  percentage: number
  /** Tailwind class for the filled portion of the bar */
  barColor: string
  /** Tailwind class for the unfilled track */
  trackColor: string
  /** Tailwind height class — defaults to h-2 */
  height?: string
  /** Accessible label for screen readers */
  label?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Accessible, animated progress bar.
 * Used across savings goal cards to visualise progress toward a target amount.
 */
export default function ProgressBar({
  percentage,
  barColor,
  trackColor,
  height = 'h-2',
  label,
}: ProgressBarProps) {
  // Clamp to [0, 100] and round to avoid sub-pixel jitter
  const clamped = Math.min(Math.max(Math.round(percentage), 0), 100)

  return (
    <div
      className={`w-full ${height} ${trackColor} rounded-full overflow-hidden`}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? `Progress: ${clamped}%`}
    >
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}