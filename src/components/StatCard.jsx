export default function StatCard({ icon, label, value, hint, tone = 'navy' }) {
  const tones = {
    navy: 'bg-navy-50 text-navy-700 ring-navy-100',
    toska: 'bg-toska-50 text-toska-700 ring-toska-100',
    gold: 'bg-gold-50 text-gold-700 ring-gold-100',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    rose: 'bg-rose-50 text-rose-700 ring-rose-100'
  }
  return (
    <div className="stat-card">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ring-1 ${tones[tone] || tones.navy}`}>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="flex-1">
        <p className="text-xs uppercase tracking-wide text-slate-500 font-medium">{label}</p>
        <p className="text-2xl font-semibold text-navy-900 mt-0.5">{value}</p>
        {hint ? <p className="text-xs text-slate-500 mt-1">{hint}</p> : null}
      </div>
    </div>
  )
}
