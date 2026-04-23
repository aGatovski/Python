import { useState } from 'react'
import type { MonthlyDataPoint } from '../../types/analytics'

// ─── Props ────────────────────────────────────────────────────────────────────

interface SpendingTrendChartProps {
  data: MonthlyDataPoint[]
}

// ─── SVG Layout Constants ─────────────────────────────────────────────────────

const VIEW_W = 640
const VIEW_H = 220
const PAD = { top: 24, right: 20, bottom: 44, left: 62 }
const CHART_W = VIEW_W - PAD.left - PAD.right // 558
const CHART_H = VIEW_H - PAD.top - PAD.bottom // 152

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Simple ordinary-least-squares linear regression.
 * Returns slope and intercept for y = slope * x + intercept.
 */
function linearRegression(ys: number[]): { slope: number; intercept: number } {
  const n = ys.length
  if (n < 2) return { slope: 0, intercept: ys[0] ?? 0 }
  const xs = ys.map((_, i) => i)
  const meanX = xs.reduce((s, x) => s + x, 0) / n
  const meanY = ys.reduce((s, y) => s + y, 0) / n
  const num = xs.reduce((s, x, i) => s + (x - meanX) * (ys[i] - meanY), 0)
  const den = xs.reduce((s, x) => s + (x - meanX) ** 2, 0)
  const slope = den === 0 ? 0 : num / den
  const intercept = meanY - slope * meanX
  return { slope, intercept }
}

function fmtCurrency(value: number): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

function fmtAxisLabel(value: number): string {
  return value >= 1000 ? `€${(value / 1000).toFixed(1)}k` : `€${value.toFixed(0)}`
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Line chart showing monthly expense trend over the selected period.
 * Includes:
 *  - Filled area under the line for visual weight
 *  - Dashed linear-regression trend line (red = rising, green = falling)
 *  - Hover dots with tooltip
 */
export default function SpendingTrendChart({ data }: SpendingTrendChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (data.length === 0) return null

  const expenses = data.map(d => d.expenses)
  const rawMax = Math.max(...expenses)
  const rawMin = Math.min(...expenses)
  // Add 15% headroom above and below so the line doesn't hug the edges
  const padding = (rawMax - rawMin) * 0.2 || rawMax * 0.15
  const yMax = rawMax + padding
  const yMin = Math.max(rawMin - padding, 0)
  const yRange = yMax - yMin

  const Y_TICKS = 4

  function xPos(i: number): number {
    if (data.length === 1) return PAD.left + CHART_W / 2
    return PAD.left + (i / (data.length - 1)) * CHART_W
  }

  function yPos(value: number): number {
    return PAD.top + CHART_H - ((value - yMin) / yRange) * CHART_H
  }

  // SVG polyline path for the expense line
  const linePath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xPos(i).toFixed(1)} ${yPos(d.expenses).toFixed(1)}`)
    .join(' ')

  // Filled area under the line
  const areaPath = [
    `M ${xPos(0).toFixed(1)} ${(PAD.top + CHART_H).toFixed(1)}`,
    ...data.map((d, i) => `L ${xPos(i).toFixed(1)} ${yPos(d.expenses).toFixed(1)}`),
    `L ${xPos(data.length - 1).toFixed(1)} ${(PAD.top + CHART_H).toFixed(1)}`,
    'Z',
  ].join(' ')

  // Trend line via linear regression on expense values
  const { slope, intercept } = linearRegression(expenses)
  const trendIsRising = slope > 0
  const trendColor = trendIsRising ? '#f87171' : '#10b981'
  const trendX1 = xPos(0)
  const trendY1 = yPos(slope * 0 + intercept)
  const trendX2 = xPos(data.length - 1)
  const trendY2 = yPos(slope * (data.length - 1) + intercept)

  // Month-over-month change for the last two data points
  const momChange =
    data.length >= 2
      ? ((data[data.length - 1].expenses - data[data.length - 2].expenses) /
          data[data.length - 2].expenses) *
        100
      : 0

  return (
    <div>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full"
        role="img"
        aria-label="Line chart: monthly spending trend"
      >
        <defs>
          {/* Gradient fill under the line */}
          <linearGradient id="spendAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f87171" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#f87171" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* ── Y-axis grid lines & labels ──────────────────────────────────── */}
        {Array.from({ length: Y_TICKS + 1 }, (_, i) => {
          const value = yMin + (i / Y_TICKS) * yRange
          const y = yPos(value)
          return (
            <g key={i}>
              <line
                x1={PAD.left} y1={y}
                x2={PAD.left + CHART_W} y2={y}
                stroke="#e2e8f0" strokeWidth={1}
              />
              <text
                x={PAD.left - 8} y={y + 4}
                textAnchor="end" fontSize={10} fill="#94a3b8"
              >
                {fmtAxisLabel(value)}
              </text>
            </g>
          )
        })}

        {/* ── Area fill ──────────────────────────────────────────────────── */}
        <path d={areaPath} fill="url(#spendAreaGrad)" />

        {/* ── Trend line (dashed) ─────────────────────────────────────────── */}
        <line
          x1={trendX1} y1={trendY1}
          x2={trendX2} y2={trendY2}
          stroke={trendColor}
          strokeWidth={1.5}
          strokeDasharray="5 4"
          opacity={0.55}
        />

        {/* ── Expense line ────────────────────────────────────────────────── */}
        <path
          d={linePath}
          fill="none"
          stroke="#f87171"
          strokeWidth={2.2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* ── Data-point dots & tooltips ──────────────────────────────────── */}
        {data.map((d, i) => {
          const x = xPos(i)
          const y = yPos(d.expenses)
          const isHovered = hoveredIndex === i

          const tooltipW = 148
          const tooltipX = Math.min(x - tooltipW / 2, VIEW_W - PAD.right - tooltipW)
          // Flip tooltip below the dot if it would clip the top
          const tooltipY = y - 58 < PAD.top ? y + 12 : y - 58

          return (
            <g key={d.key}>
              {/* Invisible wider hit area for easier hover */}
              <circle
                cx={x} cy={y} r={12}
                fill="transparent"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ cursor: 'default' }}
              />
              {/* Visible dot */}
              <circle
                cx={x} cy={y}
                r={isHovered ? 5.5 : 3.5}
                fill={isHovered ? '#dc2626' : '#f87171'}
                stroke="white"
                strokeWidth={2}
                style={{ pointerEvents: 'none' }}
              />

              {/* X-axis label */}
              <text
                x={x} y={PAD.top + CHART_H + 16}
                textAnchor="middle" fontSize={10}
                fill={isHovered ? '#334155' : '#94a3b8'}
                fontWeight={isHovered ? '600' : '400'}
              >
                {d.month}
              </text>

              {/* Tooltip */}
              {isHovered && (
                <g>
                  <rect
                    x={tooltipX} y={tooltipY}
                    width={tooltipW} height={52}
                    fill="white" stroke="#e2e8f0" strokeWidth={1}
                    rx={6}
                    style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.08))' }}
                  />
                  <text
                    x={tooltipX + 10} y={tooltipY + 18}
                    fontSize={11} fontWeight="600" fill="#1e293b"
                  >
                    {d.fullLabel}
                  </text>
                  <circle cx={tooltipX + 14} cy={tooltipY + 34} r={4} fill="#f87171" />
                  <text x={tooltipX + 24} y={tooltipY + 38} fontSize={10} fill="#475569">
                    {`Expenses: ${fmtCurrency(d.expenses)}`}
                  </text>
                </g>
              )}
            </g>
          )
        })}

        {/* ── X-axis baseline ────────────────────────────────────────────── */}
        <line
          x1={PAD.left} y1={PAD.top + CHART_H}
          x2={PAD.left + CHART_W} y2={PAD.top + CHART_H}
          stroke="#cbd5e1" strokeWidth={1}
        />
      </svg>

      {/* ── Trend summary row ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mt-2 px-1">
        <div className="flex items-center gap-3">
          {/* Trend direction badge */}
          <span
            className={[
              'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
              trendIsRising
                ? 'bg-red-50 text-red-600'
                : 'bg-emerald-50 text-emerald-700',
            ].join(' ')}
          >
            {trendIsRising ? (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
              </svg>
            )}
            {trendIsRising ? 'Spending rising' : 'Spending falling'}
          </span>

          {/* Month-over-month change */}
          {data.length >= 2 && (
            <span className="text-xs text-slate-400">
              {momChange >= 0 ? '+' : ''}
              {momChange.toFixed(1)}% vs prev month
            </span>
          )}
        </div>

        {/* Trend line legend */}
        <div className="flex items-center gap-1.5">
          <svg width="20" height="8" aria-hidden="true">
            <line x1="0" y1="4" x2="20" y2="4" stroke={trendColor} strokeWidth="1.5" strokeDasharray="4 3" />
          </svg>
          <span className="text-xs text-slate-400">Trend</span>
        </div>
      </div>
    </div>
  )
}