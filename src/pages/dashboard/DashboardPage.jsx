import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import AppLayout from '@/components/layout/AppLayout'
import { StatCard, LiveTrackingMap, Modal, AlertsPanel, StatCardSkeleton, MapSkeleton, AlertsPanelSkeleton } from '@/components/ui'
import { Bus, Wifi, WifiOff, Play, Maximize2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { busesApi } from '@/api'

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.07 } } },
  item: {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  },
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
      icon: Bus,     label: 'Total Buses',     theme: 'blue',
      value: loading ? '—' : String(totalBuses),
      sub:   loading ? 'Loading…' : `Across ${groupCount} group${groupCount !== 1 ? 's' : ''}`,
    },
    {
      icon: Wifi,    label: 'Online Buses',    theme: 'green',
      value: loading ? '—' : String(onlineBuses),
      sub:   loading ? 'Loading…' : `${onlinePct}% of fleet`,
      onClick: () => navigate('/fleet/buses?status=online'),
    },
    {
      icon: WifiOff, label: 'Offline Buses',   theme: 'red',
      value: loading ? '—' : String(offlineBuses),
      sub:   loading ? 'Loading…' : `${offlinePct}% of fleet`,
      onClick: () => navigate('/fleet/buses?status=offline'),
    },
    {
      icon: Play,    label: 'Ads Played Today', theme: 'purple',
      value: '45200',
      sub:   'Total plays today',
    },
  ]

  return (
    <AppLayout
      title="Dashboard"
      subtitle={`Welcome back, ${user?.full_name?.split(' ')[0] ?? 'there'}`}
    >
      <div className="p-6 max-w-screen-xl flex flex-col gap-6 flex-1 min-h-0">

        {/* ── Stat Cards ─────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
          </div>
        ) : (
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
        )}

        {/* ── Map + Alerts ────────────────────────────────────── */}
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
            <div className="flex items-center justify-between mb-4 shrink-0">
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
                className="flex items-center gap-1 text-xs text-brand font-medium hover:text-brand-dark transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Maximize2 size={11} />
                Full map
              </button>
            </div>

            {loading ? (
              <MapSkeleton />
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
            className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-card p-5 flex flex-col min-h-0"
          >
            {loading ? (
              <AlertsPanelSkeleton />
            ) : (
              <AlertsPanel onViewAll={() => {/* TODO: navigate to alerts page */}} />
            )}
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
