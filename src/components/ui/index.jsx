import { X } from 'lucide-react'
import clsx from 'clsx'

// ── Modal ─────────────────────────────────────────────────
export function Modal({ open, onClose, title, subtitle, children, width = 'max-w-lg' }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={clsx('relative bg-white rounded-2xl shadow-xl w-full', width)}>
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

// ── Stepper ───────────────────────────────────────────────
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

// ── Badge ─────────────────────────────────────────────────
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

// ── StatCard ──────────────────────────────────────────────
export function StatCard({ icon: Icon, iconColor, iconBg, label, value, sub }) {
  return (
    <div className="bg-white rounded-xl shadow-card border border-slate-100 p-4 flex items-center gap-4">
      <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
        <Icon size={18} className={iconColor} />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-xl font-semibold text-slate-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ── Spinner ───────────────────────────────────────────────
export function Spinner({ size = 'md' }) {
  const s = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }[size]
  return <div className={clsx(s, 'border-2 border-brand border-t-transparent rounded-full animate-spin')} />
}

// ── EmptyState ────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
          <Icon size={22} className="text-slate-400" />
        </div>
      )}
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {description && <p className="text-xs text-slate-400 mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ── ConfirmDialog ─────────────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false }) {
  if (!open) return null
  return (
    <Modal open={open} onClose={onClose} title={title} width="max-w-sm">
      <p className="text-sm text-slate-600 mb-5">{message}</p>
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-700 text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors duration-150">Cancel</button>
        <button
          onClick={() => { onConfirm(); onClose() }}
          className={danger 
            ? 'inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg border border-red-100 hover:bg-red-100 transition-colors duration-150' 
            : 'inline-flex items-center gap-2 px-4 py-2 bg-brand text-white text-sm font-medium rounded-lg hover:bg-brand-dark transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed'
          }
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}

// ── SlidePanel ────────────────────────────────────────────
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
