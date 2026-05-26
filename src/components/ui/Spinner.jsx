import React from 'react'
import clsx from 'clsx'

export function Spinner({ size = 'md' }) {
  const s = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }[size]
  return <div className={clsx(s, 'border-2 border-brand border-t-transparent rounded-full animate-spin')} />
}
