export default function PageHeader({ title, description, actions, icon, compact }) {
  if (compact) {
    return (
      <div className="flex items-center gap-3 mb-6">
        {icon && (
          <div className="w-9 h-9 rounded-lg bg-navy-900 text-white flex items-center justify-center text-base shadow-soft flex-shrink-0">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold text-navy-900 truncate">{title}</h1>
        </div>
        {actions && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="w-11 h-11 rounded-xl bg-navy-900 text-white flex items-center justify-center text-xl shadow-soft">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-navy-900">{title}</h1>
          {description && <p className="text-sm text-slate-500 mt-1 max-w-2xl">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
