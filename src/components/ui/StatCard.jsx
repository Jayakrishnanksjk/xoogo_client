import React from 'react'
import clsx from 'clsx'

export function StatCard({ icon: Icon, iconColor, iconBg, label, value, sub, onClick }) {
  const Component = onClick ? 'button' : 'div'
  return (
    <Component
      onClick={onClick}
      className={clsx(
        'bg-white rounded-xl shadow-card border border-slate-100 p-4 flex items-center gap-4',
        onClick && 'cursor-pointer hover:shadow-card-md transition-shadow'
      )}
    >
      <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
        <Icon size={18} className={iconColor} />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-xl font-semibold text-slate-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </Component>
  )
}
