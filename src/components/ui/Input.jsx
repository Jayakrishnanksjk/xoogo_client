import React, { forwardRef } from 'react'
import clsx from 'clsx'

export const Input = forwardRef(({
  label,
  error,
  className,
  containerClassName,
  suffix,
  startIcon: StartIcon,
  ...props
}, ref) => {
  return (
    <div className={containerClassName}>
      {label && (
        <label className="block text-xs font-medium text-slate-600 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {StartIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {typeof StartIcon === 'function' || (typeof StartIcon === 'object' && !React.isValidElement(StartIcon)) ? (
              <StartIcon size={14} className="shrink-0" />
            ) : StartIcon}
          </div>
        )}
        <input
          ref={ref}
          className={clsx(
            'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all duration-150 bg-white placeholder:text-slate-400',
            StartIcon && 'pl-8',
            suffix && 'pr-10',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          {...props}
        />
        {suffix && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {suffix}
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1">
          {error.message || error}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'
