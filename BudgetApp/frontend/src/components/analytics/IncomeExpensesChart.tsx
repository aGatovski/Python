import { useState } from 'react'
import type { MonthlyDataPoint } from '../../types/analytics'

// ─── Props ────────────────────────────────────────────────────────────────────

interface IncomeExpensesChartProps {
  data: MonthlyDataPoint[]
}

// ─── SVG Layout Constants ─────────────────────────────────────────────────────

const VIEW_W = 640
const VIEW_H = 280
const PAD = { top: 24, right: 20, bottom: 52, left: 62 }
const CHART_W = VIEW_W - PAD.left - PAD.right // 558
const CHART_H = VIEW_H - PAD.top - PAD.bottom // 204

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Round up to the nearest "nice" number for a clean Y-axis ceiling */
function niceMax(value: number): number {
  if (value <= 0) return 1000
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)))
  const normalised = value / magnitude
  const nice = normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10
  return nice * magnitude
}

function fmtCurrency(value: number): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

function fmtAxisLabel(value: number): string {
  return value >= 1000 ? `€${(value / 1000).toFixed(0)}k` : `€${value}`
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Grouped bar chart comparing monthly income (emerald) vs expenses (red).
 * Built with pure SVG — no chart library dependency.
 * Hover a bar group to reveal a tooltip with exact figures.
 */
export default function IncomeExpensesChart({ data }: IncomeExpensesChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (data.length === 0) return null

  const maxValue = niceMax(Math.max(...data.map(d => Math.max(d.income, d.expenses))))
  const Y_TICKS = 5

  const groupWidth = CHART_W / data.length
  // Cap bar width at 20px so 12-month view stays readable
  const barWidth = Math.min(groupWidth * 0.33, 20)
  const barGap = 3

  function yPos(value: number): number {
    return PAD.top + CHART_H - (value / maxValue) * CHART_H
  }

  return (
    <div>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full"
        role="img"
        aria-label="Grouped bar chart: monthly income vs expenses"
      >
        {/* ── Y-axis grid lines & labels ──────────────────────────────────── */}
        {Array.from({ length: Y_TICKS + 1 }, (_, i) => {
          const value = (i / Y_TICKS) * maxValue
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

        {/* ── Bar groups ─────────────────────────────────────────────────── */}
        {data.map((d, i) => {
          const groupX = PAD.left + i * groupWidth
          const centerX = groupX + groupWidth / 2
          const incomeX = centerX - barWidth - barGap / 2
          const expenseX = centerX + barGap / 2

          const incomeH = Math.max((d.income / maxValue) * CHART_H, 2)
          const expenseH = Math.max((d.expenses / maxValue) * CHART_H, 2)

          const isHovered = hoveredIndex === i

          // Clamp tooltip so it never overflows the right edge
          const tooltipW = 152
          const tooltipX = Math.min(centerX - tooltipW / 2, VIEW_W - PAD.right - tooltipW)
          const tooltipY = PAD.top + 4

          return (
            <g
              key={d.key}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ cursor: 'default' }}
              aria-label={`${d.fullLabel}: income ${fmtCurrency(d.income)}, expenses ${fmtCurrency(d.expenses)}`}
            >
              {/* Hover column highlight */}
              {isHovered && (
                <rect
                  x={groupX + 2} y={PAD.top}
                  width={groupWidth - 4} height={CHART_H}
                  fill="#f8fafc" rx={4}
                />
              )}

              {/* Income bar */}
              <rect
                x={incomeX}
                y={yPos(d.income)}
                width={barWidth}
                height={incomeH}
                fill={isHovered ? '#059669' : '#10b981'}
                rx={3}
                opacity={isHovered ? 1 : 0.82}
              />

              {/* Expense bar */}
              <rect
                x={expenseX}
                y={yPos(d.expenses)}
                width={barWidth}
                height={expenseH}
                fill={isHovered ? '#dc2626' : '#f87171'}
                rx={3}
                opacity={isHovered ? 1 : 0.82}
              />

              {/* X-axis month label */}
              <text
                x={centerX}
                y={PAD.top + CHART_H + 18}
                textAnchor="middle"
                fontSize={10}
                fill={isHovered ? '#334155' : '#94a3b8'}
                fontWeight={isHovered ? '600' : '400'}
              >
                {d.month}
              </text>

              {/* ── Tooltip ──────────────────────────────────────────────── */}
              {isHovered && (
                <g>
                  <rect
                    x={tooltipX} y={tooltipY}
                    width={tooltipW} height={72}
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
                  <circle cx={tooltipX + 14} cy={tooltipY + 34} r={4} fill="#10b981" />
                  <text x={tooltipX + 24} y={tooltipY + 38} fontSize={10} fill="#475569">
                    {`Income: ${fmtCurrency(d.income)}`}
                  </text>
                  <circle cx={tooltipX + 14} cy={tooltipY + 52} r={4} fill="#f87171" />
                  <text x={tooltipX + 24} y={tooltipY + 56} fontSize={10} fill="#475569">
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

      {/* ── Legend ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-6 mt-1">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" aria-hidden="true" />
          <span className="text-xs text-slate-500">Income</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-red-400 inline-block" aria-hidden="true" />
          <span className="text-xs text-slate-500">Expenses</span>
        </div>
      </div>
    </div>
  )
}