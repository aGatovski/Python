import { useState } from 'react'
import type { CategoryDataPoint } from '../../types/analytics'

// ─── Props ────────────────────────────────────────────────────────────────────

interface CategoryDonutChartProps {
  data: CategoryDataPoint[]
}

// ─── SVG Geometry ─────────────────────────────────────────────────────────────

const CX = 110       // donut centre X
const CY = 110       // donut centre Y
const OUTER_R = 88   // outer radius
const INNER_R = 56   // inner radius (hole)
const VIEW_W = 220
const VIEW_H = 220

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert polar coordinates to Cartesian, with 0° at the top (12 o'clock) */
function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

/**
 * Build an SVG arc path for a donut segment.
 * @param startAngle - start angle in degrees (0 = top)
 * @param endAngle   - end angle in degrees
 */
function donutArc(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number,
): string {
  // Clamp to avoid degenerate arcs at exactly 360°
  const sweep = Math.min(endAngle - startAngle, 359.99)
  const largeArc = sweep > 180 ? 1 : 0

  const o1 = polar(cx, cy, outerR, startAngle)
  const o2 = polar(cx, cy, outerR, startAngle + sweep)
  const i1 = polar(cx, cy, innerR, startAngle + sweep)
  const i2 = polar(cx, cy, innerR, startAngle)

  return [
    `M ${o1.x.toFixed(2)} ${o1.y.toFixed(2)}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${o2.x.toFixed(2)} ${o2.y.toFixed(2)}`,
    `L ${i1.x.toFixed(2)} ${i1.y.toFixed(2)}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${i2.x.toFixed(2)} ${i2.y.toFixed(2)}`,
    'Z',
  ].join(' ')
}

function fmtCurrency(value: number): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Donut chart showing spending breakdown by category.
 * - Hover a segment to highlight it and show the exact amount.
 * - Centre label shows total spending.
 * - Legend list is rendered below the SVG for full readability.
 */
export default function CategoryDonutChart({ data }: CategoryDonutChartProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)

  if (data.length === 0) return null

  const total = data.reduce((s, d) => s + d.amount, 0)

  // Build cumulative angle segments (360° total)
  let cursor = 0
  const segments = data.map(d => {
    const startAngle = cursor
    const sweep = (d.amount / total) * 360
    cursor += sweep
    return { ...d, startAngle, endAngle: startAngle + sweep }
  })

  const hoveredSegment = segments.find(s => s.category === hoveredCategory) ?? null

  return (
    <div className="flex flex-col items-center gap-4">
      {/* ── Donut SVG ──────────────────────────────────────────────────────── */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          width={VIEW_W}
          height={VIEW_H}
          role="img"
          aria-label="Donut chart: spending by category"
          className="overflow-visible"
        >
          {segments.map(seg => {
            const isHovered = hoveredCategory === seg.category
            const path = donutArc(CX, CY, OUTER_R, INNER_R, seg.startAngle, seg.endAngle)

            return (
              <path
                key={seg.category}
                d={path}
                fill={seg.color}
                opacity={
                  hoveredCategory === null
                    ? 0.88
                    : isHovered
                    ? 1
                    : 0.3
                }
                stroke="white"
                strokeWidth={2}
                style={{
                  cursor: 'default',
                  transform: isHovered
                    ? `translate(${(polar(CX, CY, 6, (seg.startAngle + seg.endAngle) / 2).x - CX) * 0.1}px, ${(polar(CX, CY, 6, (seg.startAngle + seg.endAngle) / 2).y - CY) * 0.1}px)`
                    : 'none',
                  transition: 'opacity 0.15s, transform 0.15s',
                }}
                onMouseEnter={() => setHoveredCategory(seg.category)}
                onMouseLeave={() => setHoveredCategory(null)}
                aria-label={`${seg.category}: ${fmtCurrency(seg.amount)} (${seg.percentage.toFixed(1)}%)`}
              />
            )
          })}

          {/* ── Centre label ─────────────────────────────────────────────── */}
          {hoveredSegment ? (
            <>
              <text
                x={CX} y={CY - 10}
                textAnchor="middle"
                fontSize={11}
                fill="#64748b"
                fontWeight="500"
              >
                {hoveredSegment.icon} {hoveredSegment.category}
              </text>
              <text
                x={CX} y={CY + 10}
                textAnchor="middle"
                fontSize={15}
                fontWeight="700"
                fill="#1e293b"
              >
                {fmtCurrency(hoveredSegment.amount)}
              </text>
              <text
                x={CX} y={CY + 26}
                textAnchor="middle"
                fontSize={10}
                fill="#94a3b8"
              >
                {hoveredSegment.percentage.toFixed(1)}% of total
              </text>
            </>
          ) : (
            <>
              <text
                x={CX} y={CY - 6}
                textAnchor="middle"
                fontSize={11}
                fill="#64748b"
              >
                Total spent
              </text>
              <text
                x={CX} y={CY + 14}
                textAnchor="middle"
                fontSize={16}
                fontWeight="700"
                fill="#1e293b"
              >
                {fmtCurrency(total)}
              </text>
            </>
          )}
        </svg>
      </div>

      {/* ── Legend list ────────────────────────────────────────────────────── */}
      <ul className="w-full space-y-2" role="list" aria-label="Category legend">
        {segments.map(seg => {
          const isHovered = hoveredCategory === seg.category
          return (
            <li
              key={seg.category}
              className={[
                'flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors cursor-default',
                isHovered ? 'bg-slate-50' : 'hover:bg-slate-50',
              ].join(' ')}
              onMouseEnter={() => setHoveredCategory(seg.category)}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              {/* Colour swatch */}
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: seg.color }}
                aria-hidden="true"
              />
              {/* Icon + name */}
              <span className="text-xs text-slate-600 flex-1 truncate">
                <span className="mr-1" aria-hidden="true">{seg.icon}</span>
                {seg.category}
              </span>
              {/* Percentage */}
              <span className="text-xs text-slate-400 tabular-nums">
                {seg.percentage.toFixed(1)}%
              </span>
              {/* Amount */}
              <span className="text-xs font-semibold text-slate-700 tabular-nums">
                {fmtCurrency(seg.amount)}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}