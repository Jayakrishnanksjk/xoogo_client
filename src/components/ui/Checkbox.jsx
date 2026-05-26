import React from 'react'
import clsx from 'clsx'

export function Checkbox({ label, checked, onChange, className, disabled = false }) {
  return (
    <label className={clsx('flex items-center gap-2.5 cursor-pointer select-none', disabled && 'opacity-50 cursor-not-allowed', className)}>
      <div className="relative flex items-center justify-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only peer"
        />
        <div className={clsx(
          'w-4.5 h-4.5 rounded border-2 flex items-center justify-center transition-all duration-150',
          checked
            ? 'bg-brand border-brand'
            : 'border-slate-300 bg-white peer-hover:border-slate-400'
        )}>
          {checked && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none" className="text-white">
              <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>
      {label && (
        <span className="text-sm text-slate-700">{label}</span>
      )}
    </label>
  )
}
