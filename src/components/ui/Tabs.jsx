import React from 'react'
import clsx from 'clsx'

export function Tabs({ tabs, active, onChange, variant = 'pill', className }) {
  const variants = {
    pill: {
      wrapper: 'flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1',
      tab: (isActive) =>
        clsx(
          'px-4 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer',
          isActive
            ? 'bg-brand text-white'
            : 'text-slate-500 hover:text-slate-800'
        ),
    },
    underline: {
      wrapper: 'flex gap-0 border-b border-slate-200',
      tab: (isActive) =>
        clsx(
          'px-4 py-2.5 text-xs font-medium transition-colors cursor-pointer border-b-2 -mb-px',
          isActive
            ? 'text-brand border-brand'
            : 'text-slate-400 border-transparent hover:text-slate-700 hover:border-slate-300'
        ),
    },
  }

  const style = variants[variant] || variants.pill

  return (
    <div className={clsx(style.wrapper, className)}>
      {tabs.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={style.tab(active === value)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
