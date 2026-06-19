export default function PageHeader({ title, description, actions, icon }) {
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
