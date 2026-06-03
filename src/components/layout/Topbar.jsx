import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Search, AlertTriangle, WifiOff, HardDrive, Signal, X, ArrowRight } from 'lucide-react'
import clsx from 'clsx'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

// ─── Alert data & config ────────────────────────────────────────────────────

const SEVERITY = {
  critical: {
    dot: 'bg-red-500',
    border: 'border-l-red-500',
    icon: 'bg-red-50 text-red-500',
    badgeClass: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-50',
    label: 'Critical',
    hover: 'hover:bg-red-50/40',
  },
  warning: {
    dot: 'bg-amber-400',
    border: 'border-l-amber-400',
    icon: 'bg-amber-50 text-amber-500',
    badgeClass: 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-50',
    label: 'Warning',
    hover: 'hover:bg-amber-50/40',
  },
  info: {
    dot: 'bg-blue-500',
    border: 'border-l-blue-400',
    icon: 'bg-blue-50 text-blue-500',
    badgeClass: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-50',
    label: 'Info',
    hover: 'hover:bg-amber-50/40', // preserve hover styling matching layout
  },
}

const DEFAULT_ALERTS = [
  { id: 1, icon: AlertTriangle, severity: 'warning',  title: 'Playlist Expiring Soon', desc: '5 playlist(s) will expire in the next 2 days',       time: '10m ago', unread: true },
  { id: 2, icon: WifiOff,       severity: 'critical', title: 'Bus Offline',             desc: 'KL-13-5678 has gone offline',                        time: '25m ago', unread: true },
  { id: 3, icon: HardDrive,     severity: 'warning',  title: 'Storage Full',            desc: '3 buses have critically low storage remaining',       time: '1h ago',  unread: true },
  { id: 4, icon: Signal,        severity: 'info',     title: 'SIM Data Low',            desc: '2 buses have low data balance this month',            time: '2h ago',  unread: false },
]

// ─── Single alert row ────────────────────────────────────────────────────────

function AlertRow({ alert, index, onDismiss }) {
  const s = SEVERITY[alert.severity]
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 12, scale: 0.97, transition: { duration: 0.15 } }}
      transition={{ delay: index * 0.04, duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className={clsx(
        'group relative flex items-start gap-2.5',
        'border-l-2 pl-3 pr-2 py-2.5 rounded-r-xl',
        'transition-colors duration-150',
        s.border, s.hover,
      )}
    >
      {/* Icon */}
      <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5', s.icon)}>
        <alert.icon size={12} strokeWidth={2.3} />
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="text-xs font-semibold text-slate-800 leading-snug truncate">{alert.title}</p>
          <Badge
            variant="outline"
            className={clsx('shrink-0 h-4 text-[9px] font-semibold px-1.5 py-0 rounded-full', s.badgeClass)}
          >
            {s.label}
          </Badge>
        </div>
        <p className="text-[11px] text-slate-400 leading-snug line-clamp-1">{alert.desc}</p>
      </div>

      {/* Right: time + dot + dismiss */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-400 tabular-nums">{alert.time}</span>
          {alert.unread && <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', s.dot)} />}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(alert.id) }}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          aria-label={`Dismiss: ${alert.title}`}
        >
          <X size={10} />
        </button>
      </div>
    </motion.div>
  )
}

// ─── Alerts dropdown content ─────────────────────

function AlertsDropdown({ alerts, onDismiss, unreadCount, onMarkAllRead }) {
  return (
    <div className="w-[420px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">Alerts</span>
          <AnimatePresence mode="popLayout">
            {unreadCount > 0 && (
              <motion.div
                key={unreadCount}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 20 }}
              >
                <Badge className="min-w-5 h-5 text-[10px] font-bold bg-red-500 hover:bg-red-500 text-white border-transparent rounded-full flex items-center justify-center px-1.5">
                  {unreadCount}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* <button className="flex items-center gap-0.5 text-xs text-brand hover:text-brand font-medium hover:underline cursor-pointer">
          View all <ArrowRight size={10} />
        </button> */}
      </div>

      <Separator />

      {/* List */}
      <ScrollArea className="max-h-[340px]">
        <div className="flex flex-col gap-0.5 p-2">
          <AnimatePresence mode="popLayout">
            {alerts.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center gap-2 py-8"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                  <AlertTriangle size={16} className="text-slate-300" />
                </div>
                <p className="text-xs text-slate-400 font-medium">All clear — no alerts</p>
              </motion.div>
            ) : (
              alerts.map((alert, i) => (
                <AlertRow key={alert.id} alert={alert} index={i} onDismiss={onDismiss} />
              ))
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Footer */}
      {alerts.length > 0 && (
        <>
          <Separator />
          <div className="px-4 py-2.5">
            <button
              onClick={onMarkAllRead}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors cursor-pointer"
            >
              Mark all as read
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Topbar ──────────────────────────────────────────────────────────────────

export default function Topbar({ title, subtitle }) {
  const [alerts, setAlerts] = useState(DEFAULT_ALERTS)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  const unreadCount = alerts.filter(a => a.unread).length
  const dismiss = (id) => setAlerts(prev => prev.filter(a => a.id !== id))
  const markAllRead = () => {
    setAlerts(prev => prev.map(a => ({ ...a, unread: false })))
  }

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center px-6 gap-4 fixed top-0 right-0 left-[220px] z-20">
      {/* Page title */}
      <div className="flex-1 text-left">
        {title && <h1 className="text-sm font-semibold text-slate-900 leading-none">{title}</h1>}
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>

      {/* Search */}
      <div className="relative hidden md:block">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand w-64 placeholder:text-slate-400 transition-all text-slate-700"
          placeholder="Search anything..."
        />
      </div>

      {/* ── Alerts Bell Dropdown ────────────────────────── */}
      <div className="relative" ref={dropdownRef}>
        {/* Bell Trigger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={clsx(
            "relative p-2 h-9 w-9 flex items-center justify-center bg-transparent text-slate-500",
            "hover:text-slate-900 hover:bg-slate-50 rounded-lg border border-transparent",
            "hover:border-slate-100 cursor-pointer transition-all duration-150",
            isOpen && "bg-slate-50 border-slate-100 text-slate-900"
          )}
          aria-label="Notifications"
        >
          <Bell size={15} />
          {/* Unread badge on the bell */}
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                key="dot"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                className="absolute top-1 right-1 min-w-[14px] h-[14px] bg-red-500 rounded-full
                           flex items-center justify-center text-[8px] font-bold text-white leading-none px-0.5"
              >
                {unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Dropdown Panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-0 top-full mt-2 rounded-xl shadow-xl border border-slate-100 bg-white overflow-hidden z-50 w-[420px]"
            >
              <AlertsDropdown
                alerts={alerts}
                onDismiss={dismiss}
                unreadCount={unreadCount}
                onMarkAllRead={markAllRead}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
