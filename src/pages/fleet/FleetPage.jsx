import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import { Badge, EmptyState, StatCard, Button, DataCard, Pagination, SearchInput, Select, Tabs, Modal, SlidePanel, ConfirmDialog, Input, Textarea } from '@/components/ui'
import { Bus, Plus, Users, MapPin, Wifi, WifiOff, MoreVertical, SlidersHorizontal, LayoutGrid, List, Pencil, Trash2, Mail, Phone, Check } from 'lucide-react'
import clsx from 'clsx'
import { groupsApi, routesApi, usersApi } from '@/api'
import { toast } from 'sonner'

function GroupCard({ group, onViewScreens, onLiveTracking, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <div
      onClick={onViewScreens}
      onMouseLeave={() => setMenuOpen(false)}
      className="bg-white rounded-xl shadow-card border border-slate-100 p-5 hover:shadow-card-md transition-shadow cursor-pointer group"
    >
      {/* Image placeholder */}
      <div className="h-32 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
        <Bus size={32} className="text-slate-300" />
        <div className="absolute top-2 right-2">
          <div className="relative">
            <button
              onClick={e => { e.stopPropagation(); setMenuOpen(v => !v) }}
              className="p-1 bg-white/80 hover:bg-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical size={14} className="text-slate-500" />
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 w-36 py-1"
                onClick={e => e.stopPropagation()}
              >
                <button
                  onClick={() => { onEdit(); setMenuOpen(false) }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                >
                  <Pencil size={12} /> Edit Group
                </button>
                <button
                  onClick={() => { onDelete(); setMenuOpen(false) }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-red-600"
                >
                  <Trash2 size={12} /> Delete Group
                </button>
              </div>
            )}
          </div>
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
        <button
          onClick={(e) => {
            e.stopPropagation()
            onViewScreens()
          }}
          className="flex items-center gap-1 text-xs text-brand hover:underline"
        >
          <Bus size={12} /> View Screens
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onLiveTracking()
          }}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-brand hover:underline"
        >
          <MapPin size={12} /> Live Tracking
        </button>
      </div>
    </div>
  )
}

function ByGroupsTab({ groups = [], loading = false, onLiveTracking, onEditGroup, onDeleteGroup }) {
  const navigate = useNavigate()

  // Calculate totals dynamically
  const totalBuses = groups.reduce((sum, g) => sum + (g.buses?.length || 0), 0)
  const onlineBuses = groups.reduce((sum, g) => sum + (g.buses?.filter(b => b.status === 'online').length || 0), 0)
  const offlineBuses = totalBuses - onlineBuses
  const onlinePercentage = totalBuses > 0 ? Math.round((onlineBuses / totalBuses) * 100) : 0
  const offlinePercentage = totalBuses > 0 ? Math.round((offlineBuses / totalBuses) * 100) : 0

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users}  iconBg="bg-blue-50"  iconColor="text-blue-500"  label="Total Groups"        value={String(groups.length)} sub="All bus groups" />
        <StatCard icon={Bus}    iconBg="bg-slate-50" iconColor="text-slate-500" label="Total Bus Screens"    value={String(totalBuses)} sub="Across all groups" />
        <StatCard icon={Wifi}   iconBg="bg-green-50" iconColor="text-green-500" label="Online Screens"       value={`${onlineBuses} (${onlinePercentage}%)`} sub="Currently online" />
        <StatCard icon={WifiOff}iconBg="bg-red-50"   iconColor="text-red-500"   label="Offline Screens"      value={`${offlineBuses} (${offlinePercentage}%)`} sub="Currently offline" />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-6">
          <EmptyState
            icon={Users}
            title="No Groups Found"
            description="You haven't added any bus groups yet. Create one to get started."
            action={
              <Button startIcon={Plus} label="Add Group" onClick={() => navigate('/fleet/add-group')} />
            }
          />
        </div>
      ) : (
        /* Group grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {groups.map(g => {
            const numBuses = g.buses?.length || 0
            const onlineCount = g.buses?.filter(b => b.status === 'online').length || 0
            const offlineCount = numBuses - onlineCount
            return (
              <GroupCard
                  key={g.id}
                  group={{
                    id: g.id,
                    name: g.name,
                    status: g.status || 'active',
                    buses: numBuses,
                    online: onlineCount,
                    offline: offlineCount
                  }}
                  onViewScreens={() => navigate(`/fleet/group/${g.id}/screens`)}
                  onLiveTracking={() => onLiveTracking(g)}
                  onEdit={() => onEditGroup(g)}
                  onDelete={() => onDeleteGroup(g)}
                />
            )
          })}
        </div>
      )}
    </div>
  )
}

function ByRoutesTab({ routes = [], loading = false }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [view, setView] = useState('grid')
  const [page, setPage] = useState(1)

  const mappedRoutes = routes.map(route => {
    const numStops = route.stops?.length || 0
    const start = route.stops?.[0]?.name || '—'
    const end = route.stops?.[numStops - 1]?.name || '—'
    return {
      id: route.id,
      title: route.name,
      status: route.status || 'active',
      stats: [`${numStops} stops`, `0 buses`],
      startPoint: start,
      endPoint: end
    }
  })

  const filteredRoutes = mappedRoutes.filter(route =>
    route.title.toLowerCase().includes(search.toLowerCase()) ||
    route.startPoint.toLowerCase().includes(search.toLowerCase()) ||
    route.endPoint.toLowerCase().includes(search.toLowerCase())
  )

  const itemsPerPage = 8
  const totalPages = Math.ceil(filteredRoutes.length / itemsPerPage) || 1
  const paginatedRoutes = filteredRoutes.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard icon={MapPin} iconBg="bg-blue-50"   iconColor="text-blue-500"   label="Total Routes"         value={String(routes.length)} sub="All routes" />
        <StatCard icon={Bus}    iconBg="bg-green-50"  iconColor="text-green-500"  label="Active Routes"         value={String(routes.filter(r => r.status === 'active').length)} sub="Currently active" />
        <StatCard icon={Wifi}   iconBg="bg-purple-50" iconColor="text-purple-500" label="Routes in Operation"   value="0" sub="Currently running" />
        <StatCard icon={WifiOff}iconBg="bg-red-50"    iconColor="text-red-500"    label="Inactive Routes"       value={String(routes.filter(r => r.status === 'inactive').length)} sub="Currently inactive" />
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex-1 max-w-sm">
          <SearchInput
            placeholder="Search routes..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
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

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredRoutes.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-6">
          <EmptyState
            icon={MapPin}
            title="No Routes Found"
            description="You haven't added any routes yet. Create one to get started."
            action={
              <Button startIcon={Plus} label="Add Route" onClick={() => navigate('/routes/add')} />
            }
          />
        </div>
      ) : (
        <>
          {/* Routes list/grid */}
          {view === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {paginatedRoutes.map((route, index) => (
                <DataCard
                  key={route.id}
                  index={(page - 1) * itemsPerPage + index + 1}
                  title={route.title}
                  status={route.status}
                  stats={route.stats}
                  startPoint={route.startPoint}
                  endPoint={route.endPoint}
                  onViewDetails={() => navigate(`/routes`)}
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
                  {paginatedRoutes.map((route, index) => (
                    <tr key={route.id} className="hover:bg-slate-50 transition-colors text-xs text-slate-700">
                      <td className="px-5 py-3.5 font-medium text-slate-500">{(page - 1) * itemsPerPage + index + 1}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-900">{route.title}</td>
                      <td className="px-5 py-3.5">
                        <Badge status={route.status} />
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">{route.stats.join(' · ')}</td>
                      <td className="px-5 py-3.5">{route.startPoint}</td>
                      <td className="px-5 py-3.5">{route.endPoint}</td>
                      <td className="px-5 py-3.5 text-right">
                        <button className="text-brand hover:underline mr-3" onClick={() => navigate(`/routes`)}>View Details</button>
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
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={filteredRoutes.length}
            itemsPerPage={itemsPerPage}
            className="mt-6"
          />
        </>
      )}
    </div>
  )
}

export default function FleetPage() {
  const [tab, setTab] = useState('groups')
  const navigate = useNavigate()
  const [groups, setGroups] = useState([])
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [trackingGroup, setTrackingGroup] = useState(null)

  // Edit state
  const [editGroup, setEditGroup] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', code: '', description: '', status: 'active', ownerId: null })
  const [savingEdit, setSavingEdit] = useState(false)
  const [editUsers, setEditUsers] = useState([])
  const [editOwnerSearch, setEditOwnerSearch] = useState('')
  const [editOwnerDropdown, setEditOwnerDropdown] = useState(false)
  const [deleteGroup, setDeleteGroup] = useState(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [groupsRes, routesRes] = await Promise.all([
        groupsApi.list(),
        routesApi.list()
      ])
      setGroups(groupsRes.data)
      setRoutes(routesRes.data)
    } catch (err) {
      console.error('Failed to load fleet data:', err)
      toast.error('Failed to load fleet data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleEditGroup = useCallback((g) => {
    setEditGroup(g)
    setEditForm({
      name: g.name || '',
      code: g.code || '',
      description: g.description || '',
      status: g.status || 'active',
      ownerId: g.ownerId || null,
    })
    setEditOwnerSearch(g.owner?.full_name || g.owner?.name || '')
    usersApi.list().then(res => {
      setEditUsers(res.data.map(u => ({
        id: u.id,
        name: u.name || u.full_name || 'Unknown',
        email: u.email || '',
        role: u.role,
      })))
    }).catch(() => {})
  }, [])

  const handleSaveEdit = async () => {
    if (!editForm.name.trim()) {
      toast.error('Group name is required')
      return
    }
    try {
      setSavingEdit(true)
      await groupsApi.update(editGroup.id, {
        name: editForm.name.trim(),
        code: editForm.code.trim() || null,
        description: editForm.description.trim() || null,
        status: editForm.status,
        ownerId: editForm.ownerId,
      })
      toast.success('Group updated')
      setEditGroup(null)
      fetchData()
    } catch (err) {
      console.error('Failed to update group:', err)
      toast.error(err.response?.data?.message || 'Failed to update group')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDeleteGroup = useCallback(async () => {
    if (!deleteGroup) return
    try {
      await groupsApi.delete(deleteGroup.id)
      toast.success('Group deleted')
      setDeleteGroup(null)
      fetchData()
    } catch (err) {
      console.error('Failed to delete group:', err)
      toast.error(err.response?.data?.message || 'Failed to delete group')
    }
  }, [deleteGroup])

  const trackingBuses = trackingGroup
    ? (groups.find(g => g.id === trackingGroup.id)?.buses || []).map(b => ({
        ...b,
        group: { id: trackingGroup.id, name: trackingGroup.name }
      }))
    : []

  return (
    <AppLayout title="Fleet" subtitle="Manage all bus screens by groups or routes">
      <div className="p-6 max-w-screen-xl">
        {/* Tab bar + action */}
        <div className="flex items-center justify-between mb-6">
          <Tabs
            tabs={[
              { value: 'groups', label: 'By Groups' },
              { value: 'routes', label: 'By Routes' }
            ]}
            active={tab}
            onChange={setTab}
          />
          {tab === 'groups' ? (
            <div className="flex items-center gap-2">
              <Button variant="secondary" startIcon={Plus} label="Add Screen" onClick={() => navigate('/fleet/add-bus-screen')} />
              <Button startIcon={Plus} label="Add Group" onClick={() => navigate('/fleet/add-group')} />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="secondary" label="Import Routes" />
              <Button startIcon={Plus} label="Add Route" onClick={() => navigate('/routes/add')} />
            </div>
          )}
        </div>

        {tab === 'groups' ? (
          <ByGroupsTab 
            groups={groups} 
            loading={loading} 
            onLiveTracking={(g) => setTrackingGroup(g)}
            onEditGroup={handleEditGroup}
            onDeleteGroup={setDeleteGroup}
          />
        ) : (
          <ByRoutesTab routes={routes} loading={loading} />
        )}
      </div>

      {/* Group Live Tracking Modal */}
      <Modal
        open={!!trackingGroup}
        onClose={() => setTrackingGroup(null)}
        title={`${trackingGroup?.name || ''} - Live Tracking`}
        subtitle={`Tracking ${trackingBuses.filter(b => b.status === 'online').length} online screens in this group.`}
        width="max-w-5xl"
      >
        {trackingBuses.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Bus size={32} className="mx-auto mb-2 text-slate-300" />
            No bus screens registered in this group to track.
          </div>
        ) : (
          <div className="h-[500px] overflow-hidden -mx-5 -mb-5 border-t border-slate-100">
            <LiveTrackingMap buses={trackingBuses} height="500px" />
          </div>
        )}
      </Modal>

      {/* Edit Group Panel */}
      <SlidePanel
        open={!!editGroup}
        onClose={() => setEditGroup(null)}
        title="Edit Group"
        subtitle={editGroup?.name ? `Editing: ${editGroup.name}` : ''}
      >
        <div className="space-y-4">
          <Input
            label="Group Name *"
            value={editForm.name}
            onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
          />
          <Input
            label="Group Code"
            value={editForm.code}
            onChange={e => setEditForm(f => ({ ...f, code: e.target.value }))}
          />
          <div>
            <Textarea
              label="Description"
              value={editForm.description}
              onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
            />
          </div>
          <Select
            label="Status"
            value={editForm.status}
            onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
          >
            <option value="active">● Active</option>
            <option value="inactive">● Inactive</option>
          </Select>
          <div className="pt-4 border-t border-slate-100">
            <Button
              label="Save Changes"
              onClick={handleSaveEdit}
              loading={savingEdit}
              className="w-full"
            />
          </div>
        </div>
      </SlidePanel>

      {/* Delete Group Confirmation */}
      <ConfirmDialog
        open={!!deleteGroup}
        onClose={() => setDeleteGroup(null)}
        onConfirm={handleDeleteGroup}
        title="Delete Group"
        message={`Are you sure you want to delete "${deleteGroup?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
      />
    </AppLayout>
  )
}
