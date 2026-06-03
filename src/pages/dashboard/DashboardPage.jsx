import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import AppLayout from '@/components/layout/AppLayout'
import { StatCard, LiveTrackingMap, Modal } from '@/components/ui'
import { Bus, Wifi, WifiOff, Play, AlertTriangle, Bell, Maximize2, ChevronRight } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { busesApi } from '@/api'

const ALERTS = [
  { icon: AlertTriangle, theme: 'amber',  title: 'Playlist Expiring Soon', desc: '5 playlist(s) will expire in next 2 days', time: '10m ago', dot: 'bg-red-500' },
  { icon: WifiOff,       theme: 'red',    title: 'Bus Offline',             desc: 'KL-13-5678 has gone offline',            time: '25m ago', dot: 'bg-red-500' },
  { icon: AlertTriangle, theme: 'amber',  title: 'Storage Full',            desc: '3 buses have low storage',              time: '1h ago',  dot: 'bg-amber-500' },
  { icon: Bell,          theme: 'blue',   title: 'SIM Data Low',            desc: '2 buses have low data balance',          time: '2h ago',  dot: 'bg-blue-500' },
]

const ALERT_ICON_STYLES = {
  amber: 'bg-amber-50 text-amber-500',
  red:   'bg-red-50 text-red-500',
  blue:  'bg-blue-50 text-blue-500',
}

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.07 } } },
  item: { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } },
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [buses, setBuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [isFullMapOpen, setIsFullMapOpen] = useState(false)

  useEffect(() => {
    const fetchBuses = async () => {
      try {
        setLoading(true)
        const res = await busesApi.list()
        setBuses(res.data)
      } catch (err) {
        console.error('Failed to fetch buses for dashboard:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchBuses()
  }, [])

  const totalBuses   = buses.length
  const onlineBuses  = buses.filter(b => b.status === 'online').length
  const offlineBuses = totalBuses - onlineBuses
  const onlinePct    = totalBuses > 0 ? ((onlineBuses  / totalBuses) * 100).toFixed(1) : '0'
  const offlinePct   = totalBuses > 0 ? ((offlineBuses / totalBuses) * 100).toFixed(1) : '0'
  const groupCount   = new Set(buses.map(b => b.groupId).filter(Boolean)).size

  const stats = [
    {
      icon: Bus,    label: 'Total Buses',    theme: 'blue',
      value: loading ? '—' : String(totalBuses),
      sub:   loading ? 'Loading…' : `Across ${groupCount} group${groupCount !== 1 ? 's' : ''}`,
    },
    {
      icon: Wifi,   label: 'Online Buses',   theme: 'green',
      value: loading ? '—' : String(onlineBuses),
      sub:   loading ? 'Loading…' : `${onlinePct}% of fleet`,
      onClick: () => navigate('/fleet/buses?status=online'),
    },
    {
      icon: WifiOff, label: 'Offline Buses', theme: 'red',
      value: loading ? '—' : String(offlineBuses),
      sub:   loading ? 'Loading…' : `${offlinePct}% of fleet`,
      onClick: () => navigate('/fleet/buses?status=offline'),
    },
    {
      icon: Play,   label: 'Ads Played Today', theme: 'purple',
      value: '45200',
      sub:   'Total plays today',
    },
  ]

  return (
    <AppLayout title="Dashboard" subtitle={`Welcome back, ${user?.full_name?.split(' ')[0] ?? 'there'} 👋`}>
      <div className="p-6 max-w-screen-xl flex flex-col gap-6 flex-1 min-h-0">

        {/* Stat Cards */}
        <motion.div
          className="grid grid-cols-2 xl:grid-cols-4 gap-4"
          variants={stagger.container}
          initial="hidden"
          animate="show"
        >
          {stats.map(s => (
            <motion.div key={s.label} variants={stagger.item}>
              <StatCard {...s} />
            </motion.div>
          ))}
        </motion.div>

        {/* Map + Alerts */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-5 gap-4 flex-1 min-h-0"
          variants={stagger.container}
          initial="hidden"
          animate="show"
        >
          {/* Live tracking map */}
          <motion.div
            variants={stagger.item}
            className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-card p-5 flex flex-col min-h-0"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <h3 className="text-sm font-semibold text-slate-900">Live Bus Tracking</h3>
              </div>
              <button
                onClick={() => setIsFullMapOpen(true)}
                disabled={loading || buses.length === 0}
                className="flex items-center gap-1 text-xs text-brand font-medium hover:underline disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                <Maximize2 size={11} />
                Full map
              </button>
            </div>

            {loading ? (
              <div className="flex-1 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                <div className="w-7 h-7 border-2 border-brand border-t-transparent rounded-full animate-spin" />
              </div>
            ) : buses.length === 0 ? (
              <div className="flex-1 rounded-xl bg-slate-50 flex flex-col items-center justify-center border border-slate-100 text-slate-400 text-sm p-6 text-center gap-2">
                <Bus size={30} className="text-slate-300" />
                No bus screens registered yet.
              </div>
            ) : (
              <div className="rounded-xl overflow-hidden border border-slate-100 flex-1 min-h-0">
                <LiveTrackingMap buses={buses} height="100%" />
              </div>
            )}
          </motion.div>

          {/* Alerts panel */}
          <motion.div
            variants={stagger.item}
            className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-card p-5 flex flex-col min-h-0 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900">Alerts</h3>
              <button className="text-xs text-brand font-medium hover:underline flex items-center gap-0.5">
                View all <ChevronRight size={10} />
              </button>
            </div>

            <div className="space-y-3 flex-1">
              {ALERTS.map((a, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.07, duration: 0.35, ease: 'easeOut' }}
                  className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-default group"
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${ALERT_ICON_STYLES[a.theme]}`}>
                    <a.icon size={13} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 leading-tight">{a.title}</p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{a.desc}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[10px] text-slate-400">{a.time}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${a.dot}`} />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Full Screen Map Modal */}
      <Modal
        open={isFullMapOpen}
        onClose={() => setIsFullMapOpen(false)}
        title="Live Fleet Tracking Map"
        subtitle={`Tracking ${buses.filter(b => b.status === 'online').length} online screens across ${groupCount} group${groupCount !== 1 ? 's' : ''}.`}
        width="max-w-5xl"
      >
        <div className="h-[550px] overflow-hidden -mx-5 -mb-5 border-t border-slate-100">
          <LiveTrackingMap buses={buses} height="550px" />
        </div>
      </Modal>
    </AppLayout>
  )
}
