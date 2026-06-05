import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  WifiOff,
  HardDrive,
  Signal,
  ArrowRight,
  X,
} from 'lucide-react'
import clsx from 'clsx'

// Shadcn components
import { Badge } from '@/components/ui/Badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/Button'

// ─── Severity config ────────────────────────────────────────────────────────

const SEVERITY = {
  critical: {
    label: 'Critical',
    dot: 'bg-red-500',
    border: 'border-l-red-500',
    icon: 'bg-red-50 text-red-500',
    badgeClass: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-50',
    hover: 'hover:bg-red-50/40',
  },
  warning: {
    label: 'Warning',
    dot: 'bg-amber-400',
    border: 'border-l-amber-400',
    icon: 'bg-amber-50 text-amber-500',
    badgeClass: 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-50',
    hover: 'hover:bg-amber-50/40',
  },
  info: {
    label: 'Info',
    dot: 'bg-blue-500',
    border: 'border-l-blue-400',
    icon: 'bg-blue-50 text-blue-500',
    badgeClass: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-50',
    hover: 'hover:bg-blue-50/40',
  },
}

// ─── Default data ────────────────────────────────────────────────────────────

const DEFAULT_ALERTS = [
  {
    id: 1,
    icon: AlertTriangle,
    severity: 'warning',
    title: 'Playlist Expiring Soon',
    desc: '5 playlist(s) will expire in the next 2 days',
    time: '10m ago',
    unread: true,
  },
  {
    id: 2,
    icon: WifiOff,
    severity: 'critical',
    title: 'Bus Offline',
    desc: 'KL-13-5678 has gone offline',
    time: '25m ago',
    unread: true,
  },
  {
    id: 3,
    icon: HardDrive,
    severity: 'warning',
    title: 'Storage Full',
    desc: '3 buses have critically low storage remaining',
    time: '1h ago',
    unread: true,
  },
  {
    id: 4,
    icon: Signal,
    severity: 'info',
    title: 'SIM Data Low',
    desc: '2 buses have low data balance this month',
    time: '2h ago',
    unread: true,
  },
]

// ─── Single alert row ─────────────────────────────────────────────────────────

function AlertRow({ alert, index, onDismiss }) {
  const s = SEVERITY[alert.severity]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 16, scale: 0.97, transition: { duration: 0.18 } }}
      transition={{ delay: index * 0.055, duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      className={clsx(
        'group relative flex items-start gap-3',
        'border-l-2 pl-3 pr-2 py-3 rounded-r-xl',
        'transition-colors duration-200',
        s.border,
        s.hover,
      )}
    >
      {/* Icon */}
      <div
        className={clsx(
          'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
          s.icon,
        )}
        aria-hidden="true"
      >
        <alert.icon size={14} strokeWidth={2.2} />
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-xs font-semibold text-slate-800 leading-snug truncate">
            {alert.title}
          </p>
          {/* shadcn Badge — outline variant with severity colour override */}
          <Badge
            variant="outline"
            className={clsx('hidden sm:inline-flex shrink-0 h-4 text-[10px] font-semibold px-1.5 py-0 rounded-full', s.badgeClass)}
          >
            {s.label}
          </Badge>
        </div>
        <p className="text-[11px] text-slate-400 leading-snug line-clamp-1">
          {alert.desc}
        </p>
      </div>

      {/* Right: time + unread dot + dismiss */}
      <div className="flex flex-col items-end gap-1.5 shrink-0 ml-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400 tabular-nums">{alert.time}</span>
          {alert.unread && (
            <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', s.dot)} aria-label="Unread" />
          )}
        </div>
        {/* Dismiss button — ghost variant from shadcn Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDismiss(alert.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 h-5 w-5 rounded-md text-slate-400 hover:text-slate-700 cursor-pointer"
          aria-label={`Dismiss: ${alert.title}`}
        >
          <X size={11} />
        </Button>
      </div>
    </motion.div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyAlerts() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="flex-1 flex flex-col items-center justify-center gap-2 py-10"
    >
      <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
        <AlertTriangle size={18} className="text-slate-300" />
      </div>
      <p className="text-xs font-medium text-slate-400">All clear — no alerts</p>
    </motion.div>
  )
}

// ─── Alerts Panel (main export) ───────────────────────────────────────────────

export function AlertsPanel({ alerts: externalAlerts, onViewAll }) {
  const [alerts, setAlerts] = useState(externalAlerts ?? DEFAULT_ALERTS)
  const unreadCount = alerts.filter(a => a.unread).length

  const dismiss = (id) => setAlerts(prev => prev.filter(a => a.id !== id))

  return (
    <div className="flex flex-col h-full min-h-0">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900">Alerts</h3>

          {/* shadcn Badge for unread count */}
          <AnimatePresence mode="popLayout">
            {unreadCount > 0 && (
              <motion.div
                key={unreadCount}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 20 }}
              >
                <Badge className="size-5 leading-[77%] text-[10px] font-bold bg-red-500 hover:bg-red-500 text-white border-transparent rounded-full flex items-center justify-center">
                  {unreadCount}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* shadcn ghost Button for "View all" */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewAll}
          className="h-7 px-2 text-xs text-brand hover:text-brand-dark hover:bg-brand/5 font-medium gap-0.5 cursor-pointer"
        >
          View all
          <ArrowRight size={11} className="transition-transform duration-150 group-hover:translate-x-0.5" />
        </Button>
      </div>

      {/* shadcn Separator */}
      <Separator className="mb-3 shrink-0" />

      {/* ── List — wrapped in shadcn ScrollArea ────────────── */}
      <ScrollArea className="flex-1 min-h-0 -mr-1 pr-1">
        <div className="flex flex-col gap-0.5">
          <AnimatePresence mode="popLayout">
            {alerts.length === 0 ? (
              <EmptyAlerts key="empty" />
            ) : (
              alerts.map((alert, i) => (
                <AlertRow
                  key={alert.id}
                  alert={alert}
                  index={i}
                  onDismiss={dismiss}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  )
}
