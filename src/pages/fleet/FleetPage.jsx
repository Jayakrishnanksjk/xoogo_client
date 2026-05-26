import { useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { Badge, EmptyState, StatCard } from '@/components/ui'
import { Bus, Plus, Users, MapPin, Wifi, WifiOff, MoreVertical } from 'lucide-react'
import clsx from 'clsx'

// Placeholder group data
const MOCK_GROUPS = [
  { id: 1, name: 'Ave Maria', status: 'active', buses: 12, online: 9, offline: 3 },
  { id: 2, name: 'Madhavi Travels', status: 'active', buses: 18, online: 14, offline: 4 },
  { id: 3, name: 'Galaxy Travels', status: 'active', buses: 15, online: 11, offline: 4 },
  { id: 4, name: 'Starline Travels', status: 'active', buses: 10, online: 7, offline: 3 },
  { id: 5, name: 'Kerala Lines', status: 'active', buses: 8, online: 6, offline: 2 },
  { id: 6, name: 'Malabar Express', status: 'inactive', buses: 5, online: 1, offline: 4 },
]

function GroupCard({ group }) {
  return (
    <div className="card hover:shadow-card-md transition-shadow cursor-pointer group">
      {/* Image placeholder */}
      <div className="h-32 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
        <Bus size={32} className="text-slate-300" />
        <div className="absolute top-2 right-2">
          <button className="p-1 bg-white/80 hover:bg-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical size={14} className="text-slate-500" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-900">{group.name}</h3>
        <Badge status={group.status} />
      </div>

      <p className="text-xs text-slate-500 mb-3">{group.buses} Bus Screens</p>

      <div className="flex items-center gap-3 text-xs mb-3">
        <span className="flex items-center gap-1">
          <span className="dot-online" /> <span className="text-slate-600">{group.online} Online</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="dot-offline" /> <span className="text-slate-600">{group.offline} Offline</span>
        </span>
      </div>

      <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
        <button className="flex items-center gap-1 text-xs text-brand hover:underline">
          <Bus size={12} /> View Screens
        </button>
        <button className="flex items-center gap-1 text-xs text-slate-500 hover:text-brand hover:underline">
          <MapPin size={12} /> Live Tracking
        </button>
      </div>
    </div>
  )
}

function ByGroupsTab() {
  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users}  iconBg="bg-blue-50"  iconColor="text-blue-500"  label="Total Groups"        value="12" sub="All bus groups" />
        <StatCard icon={Bus}    iconBg="bg-slate-50" iconColor="text-slate-500" label="Total Bus Screens"    value="98" sub="Across all groups" />
        <StatCard icon={Wifi}   iconBg="bg-green-50" iconColor="text-green-500" label="Online Screens"       value="72 (73.5%)" sub="Currently online" />
        <StatCard icon={WifiOff}iconBg="bg-red-50"   iconColor="text-red-500"   label="Offline Screens"      value="26 (26.5%)" sub="Currently offline" />
      </div>

      {/* Group grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {MOCK_GROUPS.map(g => <GroupCard key={g.id} group={g} />)}
      </div>
    </div>
  )
}

function ByRoutesTab() {
  return (
    <div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard icon={MapPin} iconBg="bg-blue-50"   iconColor="text-blue-500"   label="Total Routes"         value="18" sub="All routes" />
        <StatCard icon={Bus}    iconBg="bg-green-50"  iconColor="text-green-500"  label="Active Routes"         value="14 (77.8%)" sub="Currently active" />
        <StatCard icon={Wifi}   iconBg="bg-purple-50" iconColor="text-purple-500" label="Routes in Operation"   value="12 (66.7%)" sub="Currently running" />
        <StatCard icon={WifiOff}iconBg="bg-red-50"    iconColor="text-red-500"    label="Inactive Routes"       value="4 (22.2%)" sub="Currently inactive" />
      </div>

      <EmptyState
        icon={MapPin}
        title="Route list coming soon"
        description="This tab will show buses grouped by their assigned routes."
      />
    </div>
  )
}

export default function FleetPage() {
  const [tab, setTab] = useState('groups')

  return (
    <AppLayout title="Fleet" subtitle="Manage all bus screens by groups or routes">
      <div className="page-container">
        {/* Tab bar + action */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
            {[['groups', 'By Groups'], ['routes', 'By Routes']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setTab(val)}
                className={clsx(
                  'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
                  tab === val
                    ? 'bg-brand text-white'
                    : 'text-slate-500 hover:text-slate-800'
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <button className="btn-primary">
            <Plus size={15} />
            Add Group
          </button>
        </div>

        {tab === 'groups' ? <ByGroupsTab /> : <ByRoutesTab />}
      </div>
    </AppLayout>
  )
}
