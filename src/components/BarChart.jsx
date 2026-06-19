// Simple horizontal bar chart (SVG, no deps)
import { clampPct } from '../lib/utils.js'

export default function BarChart({ data = [], height = 220, color = '#2fa295' }) {
  if (!data.length) return <p className="text-sm text-slate-500">Belum ada data.</p>
  const max = 100
  const pad = { l: 130, r: 16, t: 8, b: 8 }
  const rowH = 26
  const innerH = data.length * rowH
  const totalH = innerH + pad.t + pad.b
  const totalW = 640
  const innerW = totalW - pad.l - pad.r

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${totalW} ${Math.max(totalH, height)}`} width="100%" className="font-sans">
        {data.map((item, i) => {
          const pct = clampPct(item.value)
          const w = (pct / max) * innerW
          const y = pad.t + i * rowH + 4
          return (
            <g key={item.label + i}>
              <text x={pad.l - 8} y={y + 14} textAnchor="end" fontSize="11" fill="#475569">
                {truncate(item.label, 26)}
              </text>
              <rect x={pad.l} y={y} width={innerW} height={18} rx="6" fill="#f1f5f9" />
              <rect x={pad.l} y={y} width={Math.max(2, w)} height={18} rx="6" fill={item.color || color} />
              <text x={pad.l + Math.max(8, w) + 6} y={y + 13} fontSize="11" fill="#0f172a">
                {pct.toFixed(1)}%
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function truncate(s, n) {
  if (!s) return ''
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}
