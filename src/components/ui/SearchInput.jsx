import React, { forwardRef } from 'react'
import { Search } from 'lucide-react'
import clsx from 'clsx'

export const SearchInput = forwardRef(({
  placeholder = 'Search...',
  value,
  onChange,
  className,
  size = 'md',
  ...props
}, ref) => {
  const sizes = {
    sm: 'pl-7 pr-3 py-1.5 text-xs',
    md: 'pl-8 pr-4 py-2 text-sm',
  }

  const iconSizes = {
    sm: 12,
    md: 14,
  }

  return (
    <div className={clsx('relative', className)}>
      <Search
        size={iconSizes[size]}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
      />
      <input
        ref={ref}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={clsx(
          'w-full border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white placeholder:text-slate-400 transition-all duration-150',
          sizes[size]
        )}
        {...props}
      />
    </div>
  )
})

SearchInput.displayName = 'SearchInput'
