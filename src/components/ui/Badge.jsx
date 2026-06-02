import React from 'react'
import clsx from 'clsx'

export function Badge({ status }) {
  const map = {
    active:      'bg-green-50 text-green-700',
    inactive:    'bg-slate-100 text-slate-500',
    superadmin:  'bg-purple-50 text-purple-700',
    partner:     'bg-blue-50 text-blue-700',
    admin:       'bg-orange-50 text-orange-700',
    online:      'bg-green-50 text-green-700',
    offline:     'bg-red-50 text-red-600',
  }
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize', map[status] || map.inactive)}>
      {status}
    </span>
  )
}
