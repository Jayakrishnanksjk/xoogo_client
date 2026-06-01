import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { StatCard, LiveTrackingMap, Modal } from '@/components/ui'
import { Bus, Wifi, WifiOff, Play, AlertTriangle, Bell, Maximize2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { busesApi } from '@/api'

const ALERTS = [
  { icon: AlertTriangle, color: 'text-amber-500 bg-amber-50', title: 'Playlist Expiring Soon', desc: '5 playlist(s) will expire in next 2 days', time: '10m ago', dot: 'bg-red-500' },
  { icon: WifiOff,       color: 'text-red-500 bg-red-50',    title: 'Bus Offline',             desc: 'KL-13-5678 has gone offline',            time: '25m ago', dot: 'bg-red-500' },
  { icon: AlertTriangle, color: 'text-amber-500 bg-amber-50', title: 'Storage Full',           desc: '3 buses have low storage',              time: '1h ago',  dot: 'bg-amber-500' },
  { icon: Bell,          color: 'text-blue-500 bg-blue-50',  title: 'SIM Data Low',            desc: '2 buses have low data balance',          time: '2h ago',  dot: 'bg-blue-500' },
]

export default function DashboardPage() {
  const { user } = useAuth()
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

  // Calculate dynamic stats
  const totalBuses = buses.length
  const onlineBuses = buses.filter(b => b.status === 'online').length
  const offlineBuses = totalBuses - onlineBuses
  const onlinePct = totalBuses > 0 ? ((onlineBuses / totalBuses) * 100).toFixed(1) : '0'
  const offlinePct = totalBuses > 0 ? ((offlineBuses / totalBuses) * 100).toFixed(1) : '0'
  const groupCount = new Set(buses.map(b => b.groupId).filter(Boolean)).size

  const stats = [
    { icon: Bus,     iconBg: 'bg-blue-50',   iconColor: 'text-blue-500',  label: 'Total Buses',     value: loading ? '...' : String(totalBuses), sub: loading ? 'Loading...' : `Across ${groupCount} groups` },
    { icon: Wifi,    iconBg: 'bg-green-50',  iconColor: 'text-green-500', label: 'Online Buses',    value: loading ? '...' : String(onlineBuses), sub: loading ? 'Loading...' : `${onlinePct}% of total` },
    { icon: WifiOff, iconBg: 'bg-red-50',    iconColor: 'text-red-500',   label: 'Offline Buses',   value: loading ? '...' : String(offlineBuses), sub: loading ? 'Loading...' : `${offlinePct}% of total` },
    { icon: Play,    iconBg: 'bg-purple-50', iconColor: 'text-purple-500',label: 'Ads Played Today', value: '45,200', sub: 'Total plays' },
  ]

  return (
    <AppLayout title="Dashboard" subtitle={`Welcome back, ${user?.full_name?.split(' ')[0]}`}>
      <div className="p-6 max-w-screen-xl">

        {/* Stat row */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {stats.map(s => <StatCard key={s.label} {...s} />)}
        </div>

        {/* Bottom: Map + Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Live tracking map */}
          <div className="lg:col-span-3 bg-white rounded-xl shadow-card border border-slate-100 p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <h3 className="text-sm font-semibold text-slate-900">Live Bus Tracking</h3>
              </div>
              <button 
                onClick={() => setIsFullMapOpen(true)}
                className="text-xs text-brand hover:underline flex items-center gap-1"
                disabled={loading || buses.length === 0}
              >
                <Maximize2 size={12} /> View full map
              </button>
            </div>
            
            {loading ? (
              <div className="rounded-xl bg-slate-50 h-72 flex items-center justify-center border border-slate-100">
                <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
              </div>
            ) : buses.length === 0 ? (
              <div className="rounded-xl bg-slate-50 h-72 flex flex-col items-center justify-center border border-slate-100 text-slate-400 text-sm p-6 text-center">
                <Bus size={32} className="text-slate-350 mb-2" />
                No bus screens registered yet to track.
              </div>
            ) : (
              <div className="rounded-xl overflow-hidden border border-slate-100 h-72">
                <LiveTrackingMap buses={buses} height="100%" />
              </div>
            )}
          </div>

          {/* Alerts panel */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-card border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900">Alerts</h3>
              <button className="text-xs text-brand hover:underline">View all</button>
            </div>
            <div className="space-y-3">
              {ALERTS.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${a.color}`}>
                    <a.icon size={13} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800">{a.title}</p>
                    <p className="text-xs text-slate-400 truncate">{a.desc}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs text-slate-400">{a.time}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${a.dot}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Full Screen Live Fleet Map Modal */}
      <Modal
        open={isFullMapOpen}
        onClose={() => setIsFullMapOpen(false)}
        title="Live Fleet Tracking Map"
        subtitle={`Currently tracking ${buses.filter(b => b.status === 'online').length} online screens across ${groupCount} groups.`}
        width="max-w-5xl"
      >
        <div className="h-[550px] overflow-hidden -mx-5 -mb-5 border-t border-slate-100">
          <LiveTrackingMap buses={buses} height="550px" />
        </div>
      </Modal>
    </AppLayout>
  )
}

