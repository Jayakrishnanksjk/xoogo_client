import React, { forwardRef } from 'react'
import clsx from 'clsx'

export const Button = forwardRef(({
  className,
  variant = 'primary',
  size = 'md',
  label,
  startIcon: StartIcon,
  endIcon: EndIcon,
  loading = false,
  disabled = false,
  children,
  ...props
}, ref) => {
  const baseStyle = 'inline-flex items-center gap-2 font-medium transition-colors duration-150 justify-center'
  
  const variants = {
    primary: 'bg-brand text-white hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed',
    secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed',
    danger: 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed'
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-md',
    md: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-5 py-2.5 text-base rounded-lg'
  }

  const iconSize = size === 'sm' ? 13 : size === 'lg' ? 17 : 14

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(baseStyle, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      )}
      {!loading && StartIcon && (
        typeof StartIcon === 'function' || typeof StartIcon === 'object' ? (
          <StartIcon size={iconSize} className="shrink-0" />
        ) : StartIcon
      )}
      {(label || children) && (
        <span>{label || children}</span>
      )}
      {!loading && EndIcon && (
        typeof EndIcon === 'function' || typeof EndIcon === 'object' ? (
          <EndIcon size={iconSize} className="shrink-0" />
        ) : EndIcon
      )}
    </button>
  )
})

Button.displayName = 'Button'
