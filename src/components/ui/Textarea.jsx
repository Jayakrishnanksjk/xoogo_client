import React, { forwardRef } from 'react'
import clsx from 'clsx'

export const Textarea = forwardRef(({
  label,
  error,
  className,
  containerClassName,
  rows = 3,
  ...props
}, ref) => {
  return (
    <div className={containerClassName}>
      {label && (
        <label className="block text-xs font-medium text-slate-600 mb-1">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={clsx(
          'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all duration-150 bg-white placeholder:text-slate-400 resize-none',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-500 mt-1">
          {error.message || error}
        </p>
      )}
    </div>
  )
})

Textarea.displayName = 'Textarea'
