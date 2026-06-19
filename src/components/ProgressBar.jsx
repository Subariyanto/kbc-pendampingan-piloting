import { clampPct } from '../lib/utils.js'

export default function ProgressBar({ value = 0, label, sublabel, tone = 'toska', showValue = true }) {
  const pct = clampPct(value)
  const tones = {
    toska: 'bg-toska-500',
    navy: 'bg-navy-700',
    gold: 'bg-gold-400',
    emerald: 'bg-emerald-500',
    rose: 'bg-rose-500'
  }
  return (
    <div>
      {(label || showValue) && (
        <div className="flex items-end justify-between gap-3 mb-1">
          {label && <span className="text-sm font-medium text-slate-700">{label}</span>}
          {showValue && <span className="text-xs text-slate-500 font-medium">{pct.toFixed(1)}%</span>}
        </div>
      )}
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={`${tones[tone] || tones.toska} h-full rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      {sublabel && <p className="text-xs text-slate-500 mt-1">{sublabel}</p>}
    </div>
  )
}
