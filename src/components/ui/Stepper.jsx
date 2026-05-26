import React from 'react'
import clsx from 'clsx'

export function Stepper({ steps, current }) {
  return (
    <div className="flex items-center gap-0 mb-6">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex items-center gap-2 shrink-0">
            <div className={clsx(
              'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors',
              i < current ? 'bg-green-500 text-white' :
              i === current ? 'bg-brand text-white' :
              'bg-slate-100 text-slate-400'
            )}>
              {i < current ? '✓' : i + 1}
            </div>
            <span className={clsx(
              'text-xs font-medium hidden sm:block',
              i === current ? 'text-slate-900' : 'text-slate-400'
            )}>
              {step}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={clsx(
              'h-px flex-1 mx-3 transition-colors',
              i < current ? 'bg-green-400' : 'bg-slate-200'
            )} />
          )}
        </div>
      ))}
    </div>
  )
}
