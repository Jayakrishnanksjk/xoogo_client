import AppLayout from '@/components/layout/AppLayout'
import { StatCard } from '@/components/ui'
import { Bus, Wifi, WifiOff, Play, AlertTriangle, Bell } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

// Placeholder stat data — replace with real API calls using useQuery
const STATS = [
  { icon: Bus,    iconBg: 'bg-blue-50',   iconColor: 'text-blue-500',  label: 'Total Buses',    value: '120', sub: 'Across 8 groups' },
  { icon: Wifi,   iconBg: 'bg-green-50',  iconColor: 'text-green-500', label: 'Online Buses',   value: '98',  sub: '81.7% of total' },
  { icon: WifiOff,iconBg: 'bg-red-50',    iconColor: 'text-red-500',   label: 'Offline Buses',  value: '22',  sub: '18.3% of total' },
  { icon: Play,   iconBg: 'bg-purple-50', iconColor: 'text-purple-500',label: 'Ads Played Today',value: '45,200', sub: 'Total plays' },
]

const ALERTS = [
  { icon: AlertTriangle, color: 'text-amber-500 bg-amber-50', title: 'Playlist Expiring Soon', desc: '5 playlist(s) will expire in next 2 days', time: '10m ago', dot: 'bg-red-500' },
  { icon: WifiOff,       color: 'text-red-500 bg-red-50',    title: 'Bus Offline',             desc: 'KL-13-5678 has gone offline',            time: '25m ago', dot: 'bg-red-500' },
  { icon: AlertTriangle, color: 'text-amber-500 bg-amber-50', title: 'Storage Full',           desc: '3 buses have low storage',              time: '1h ago',  dot: 'bg-amber-500' },
  { icon: Bell,          color: 'text-blue-500 bg-blue-50',  title: 'SIM Data Low',            desc: '2 buses have low data balance',          time: '2h ago',  dot: 'bg-blue-500' },
]

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <AppLayout title="Dashboard" subtitle={`Welcome back, ${user?.full_name?.split(' ')[0]}`}>
      <div className="p-6 max-w-screen-xl">

        {/* Stat row */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {STATS.map(s => <StatCard key={s.label} {...s} />)}
        </div>

        {/* Bottom: Map placeholder + Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Live tracking map placeholder */}
          <div className="lg:col-span-3 bg-white rounded-xl shadow-card border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900">Live Bus Tracking</h3>
              <button className="text-xs text-brand hover:underline">View full map ↗</button>
            </div>
            <div className="rounded-xl bg-slate-100 h-64 flex items-center justify-center text-slate-400 text-sm">
              Map component will render here
              <br />
              <span className="text-xs">(integrate Leaflet/Google Maps)</span>
            </div>
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
    </AppLayout>
  )
}
