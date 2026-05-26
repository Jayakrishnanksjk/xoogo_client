import React from 'react'
import { X } from 'lucide-react'
import clsx from 'clsx'

export function SlidePanel({ open, onClose, title, subtitle, children, width = 'w-[480px]' }) {
  return (
    <>
      {open && <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />}
      <div className={clsx(
        'fixed top-0 right-0 h-full bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300',
        width,
        open ? 'translate-x-0' : 'translate-x-full'
      )}>
        <div className="flex items-start justify-between p-5 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </>
  )
}
