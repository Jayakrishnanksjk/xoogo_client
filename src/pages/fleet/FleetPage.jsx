import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import { Badge, EmptyState, StatCard, Button, DataCard, Pagination, SearchInput, Select } from '@/components/ui'
import { Bus, Plus, Users, MapPin, Wifi, WifiOff, MoreVertical, SlidersHorizontal, LayoutGrid, List } from 'lucide-react'
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

// Placeholder routes data
const MOCK_ROUTES = [
  { id: 1, title: 'Kannur ➔ Kasaragod', status: 'active', stats: ['6 stops', '3 buses'], startPoint: 'Kannur (Start)', endPoint: 'Kasaragod (End)' },
  { id: 2, title: 'Kozhikode ➔ Payyanur', status: 'active', stats: ['6 stops', '4 buses'], startPoint: 'Kozhikode (Start)', endPoint: 'Payyanur (End)' },
  { id: 3, title: 'Ernakulam ➔ Kottayam', status: 'active', stats: ['6 stops', '2 buses'], startPoint: 'Ernakulam (Start)', endPoint: 'Kottayam (End)' },
  { id: 4, title: 'Thrissur ➔ Palakkad', status: 'active', stats: ['5 stops', '3 buses'], startPoint: 'Thrissur (Start)', endPoint: 'Palakkad (End)' },
  { id: 5, title: 'Trivandrum ➔ Kollam', status: 'active', stats: ['4 stops', '5 buses'], startPoint: 'Trivandrum (Start)', endPoint: 'Kollam (End)' },
  { id: 6, title: 'Alappuzha ➔ Changanassery', status: 'inactive', stats: ['4 stops', '0 buses'], startPoint: 'Alappuzha (Start)', endPoint: 'Changanassery (End)' },
  { id: 7, title: 'Kottarakkara ➔ Punalur', status: 'active', stats: ['3 stops', '2 buses'], startPoint: 'Kottarakkara (Start)', endPoint: 'Punalur (End)' },
  { id: 8, title: 'Wayanad ➔ Kozhikode', status: 'inactive', stats: ['5 stops', '0 buses'], startPoint: 'Wayanad (Start)', endPoint: 'Kozhikode (End)' },
]

function GroupCard({ group }) {
  return (
    <div className="bg-white rounded-xl shadow-card border border-slate-100 p-5 hover:shadow-card-md transition-shadow cursor-pointer group">
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
          <span className="w-2 h-2 rounded-full bg-online inline-block" /> <span className="text-slate-600">{group.online} Online</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-offline inline-block" /> <span className="text-slate-600">{group.offline} Offline</span>
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
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [view, setView] = useState('grid')
  const [page, setPage] = useState(1)

  const filteredRoutes = MOCK_ROUTES.filter(route =>
    route.title.toLowerCase().includes(search.toLowerCase()) ||
    route.startPoint.toLowerCase().includes(search.toLowerCase()) ||
    route.endPoint.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard icon={MapPin} iconBg="bg-blue-50"   iconColor="text-blue-500"   label="Total Routes"         value="18" sub="All routes" />
        <StatCard icon={Bus}    iconBg="bg-green-50"  iconColor="text-green-500"  label="Active Routes"         value="14 (77.8%)" sub="Currently active" />
        <StatCard icon={Wifi}   iconBg="bg-purple-50" iconColor="text-purple-500" label="Routes in Operation"   value="12 (66.7%)" sub="Currently running" />
        <StatCard icon={WifiOff}iconBg="bg-red-50"    iconColor="text-red-500"    label="Inactive Routes"       value="4 (22.2%)" sub="Currently inactive" />
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex-1 max-w-sm">
          <SearchInput
            placeholder="Search routes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button variant="secondary" label="Filters" startIcon={SlidersHorizontal} />
          <Select value={sortBy} onChange={e => setSortBy(e.target.value)} className="w-36 text-xs">
            <option value="name">Sort by Name</option>
            <option value="stops">Sort by Stops</option>
            <option value="buses">Sort by Buses</option>
          </Select>
          <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50">
            <button
              onClick={() => setView('grid')}
              className={clsx('p-1.5 rounded-md transition-colors', view === 'grid' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600')}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setView('list')}
              className={clsx('p-1.5 rounded-md transition-colors', view === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600')}
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Routes list/grid */}
      {view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {filteredRoutes.map((route, index) => (
            <DataCard
              key={route.id}
              index={index + 1}
              title={route.title}
              status={route.status}
              stats={route.stats}
              startPoint={route.startPoint}
              endPoint={route.endPoint}
              onViewDetails={() => {}}
              onMore={() => {}}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3 w-12">#</th>
                <th className="px-5 py-3">Route Title</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Details</th>
                <th className="px-5 py-3">Start Point</th>
                <th className="px-5 py-3">End Point</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRoutes.map((route, index) => (
                <tr key={route.id} className="hover:bg-slate-50 transition-colors text-xs text-slate-700">
                  <td className="px-5 py-3.5 font-medium text-slate-500">{index + 1}</td>
                  <td className="px-5 py-3.5 font-semibold text-slate-900">{route.title}</td>
                  <td className="px-5 py-3.5">
                    <Badge status={route.status} />
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{route.stats.join(' · ')}</td>
                  <td className="px-5 py-3.5">{route.startPoint}</td>
                  <td className="px-5 py-3.5">{route.endPoint}</td>
                  <td className="px-5 py-3.5 text-right">
                    <button className="text-brand hover:underline mr-3">View Details</button>
                    <button className="text-slate-400 hover:text-slate-600">
                      <MoreVertical size={14} className="inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={3}
        onPageChange={setPage}
        totalItems={18}
        itemsPerPage={8}
        className="mt-6"
      />
    </div>
  )
}

export default function FleetPage() {
  const [tab, setTab] = useState('groups')
  const navigate = useNavigate()

  return (
    <AppLayout title="Fleet" subtitle="Manage all bus screens by groups or routes">
      <div className="p-6 max-w-screen-xl">
        {/* Tab bar + action */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
            {[['groups', 'By Groups'], ['routes', 'By Routes']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setTab(val)}
                className={clsx(
                  'px-4 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer',
                  tab === val
                    ? 'bg-brand text-white'
                    : 'text-slate-500 hover:text-slate-800'
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {tab === 'groups' ? (
            <div className="flex items-center gap-2">
              <Button variant="secondary" startIcon={Plus} label="Add Screen" onClick={() => navigate('/fleet/add-bus-screen')} />
              <Button startIcon={Plus} label="Add Group" onClick={() => navigate('/fleet/add-group')} />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="secondary" label="Import Routes" />
              <Button startIcon={Plus} label="Add Route" />
            </div>
          )}
        </div>

        {tab === 'groups' ? <ByGroupsTab /> : <ByRoutesTab />}
      </div>
    </AppLayout>
  )
}
