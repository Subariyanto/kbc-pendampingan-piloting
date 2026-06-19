// Simple radar chart for KBC aspect comparison
import { clampPct } from '../lib/utils.js'

export default function RadarChart({ data = [], size = 320, color = '#2fa295' }) {
  if (!data.length) return <p className="text-sm text-slate-500">Belum ada data.</p>
  const cx = size / 2
  const cy = size / 2
  const radius = size * 0.36
  const angleStep = (Math.PI * 2) / data.length

  const point = (i, value) => {
    const a = -Math.PI / 2 + i * angleStep
    const r = (clampPct(value) / 100) * radius
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r }
  }
  const axisPoint = (i) => {
    const a = -Math.PI / 2 + i * angleStep
    return { x: cx + Math.cos(a) * radius, y: cy + Math.sin(a) * radius }
  }

  const polygon = data.map((d, i) => point(i, d.value)).map((p) => `${p.x},${p.y}`).join(' ')

  const grids = [0.25, 0.5, 0.75, 1].map((g) => {
    const pts = data
      .map((_, i) => {
        const a = -Math.PI / 2 + i * angleStep
        const r = radius * g
        return `${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`
      })
      .join(' ')
    return <polygon key={g} points={pts} fill="none" stroke="#e2e8f0" strokeWidth="1" />
  })

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" className="max-w-md mx-auto">
      {grids}
      {data.map((_, i) => {
        const p = axisPoint(i)
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#e2e8f0" strokeWidth="1" />
      })}
      <polygon points={polygon} fill={color} fillOpacity="0.18" stroke={color} strokeWidth="2" />
      {data.map((d, i) => {
        const p = point(i, d.value)
        return <circle key={i} cx={p.x} cy={p.y} r="4" fill={color} />
      })}
      {data.map((d, i) => {
        const a = -Math.PI / 2 + i * angleStep
        const r = radius + 18
        const x = cx + Math.cos(a) * r
        const y = cy + Math.sin(a) * r
        return (
          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill="#0f172a">
            {d.label}
          </text>
        )
      })}
    </svg>
  )
}
