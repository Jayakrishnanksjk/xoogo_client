import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import AppLayout from '@/components/layout/AppLayout'
import { Badge, EmptyState, StatCard, Button, DataCard, Pagination, SearchInput, Select, Tabs, Modal, LiveTrackingMap, StatCardSkeleton, GroupCardSkeleton, DataCardSkeleton, TableRowSkeleton, ConfirmDialog, SlidePanel, Textarea, Input } from '@/components/ui'
import { Bus, Plus, Users, MapPin, Wifi, WifiOff, MoreVertical, SlidersHorizontal, LayoutGrid, List, Pencil, Trash2, Search, X, Mail, Phone, Check } from 'lucide-react'
import clsx from 'clsx'
import { groupsApi, routesApi, usersApi } from '@/api'
import { toast } from 'sonner'

function GroupCard({ group, onViewScreens, onLiveTracking, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const isActive = group.status === 'active'

  return (
    <motion.div
      onClick={onViewScreens}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, transition: { duration: 0.25, ease: 'easeOut' } }}
      className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_24px_-4px_rgba(0,0,0,0.08)] transition-shadow duration-300 cursor-pointer select-none group relative overflow-hidden"
    >
      {/* Visual background wrapper */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-500/0 via-slate-400/0 to-slate-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Image / Icon container */}
      <div className="h-32 bg-slate-50 border border-slate-100/50 rounded-xl flex items-center justify-center relative overflow-hidden shrink-0">
        <Bus size={32} className="text-slate-300 group-hover:scale-110 group-hover:text-brand/50 transition-all duration-300" />
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

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-800 tracking-tight truncate">
            {group.name}
          </h3>
          <Badge
            variant={isActive ? 'default' : 'secondary'}
            className="text-[9px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded-full shrink-0"
          >
            {group.status || 'Active'}
          </Badge>
        </div>

        <p className="text-[11px] font-medium text-slate-400 leading-none">
          {group.buses} {group.buses === 1 ? 'Bus Screen' : 'Bus Screens'}
        </p>

        {/* Online/Offline status line */}
        <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600 mt-1">
          <div className="flex items-center gap-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span>{group.online} Online</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <span>{group.offline} Offline</span>
          </div>
        </div>
      </div>

      {/* Button controls */}
      <div className="flex items-center gap-2 pt-3 border-t border-slate-100/80 mt-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onViewScreens()
          }}
          className="flex-1 text-xs gap-1.5 h-8 font-medium border-slate-100 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
        >
          <Bus size={13} className="text-slate-400" />
          Screens
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onLiveTracking()
          }}
          className="flex-1 text-xs gap-1.5 h-8 font-medium border-slate-100 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
        >
          <MapPin size={13} className="text-slate-400" />
          Track
        </Button>
      </div>
    </motion.div>
  )
}

function ByGroupsTab({ groups = [], loading = false, onLiveTracking, onEditGroup, onDeleteGroup, search = '' }) {
  const navigate = useNavigate()
  const [groupSearch, setGroupSearch] = useState('')

  const q = (groupSearch || search).toLowerCase()
  const filteredGroups = q
    ? groups.filter(g =>
        g.name.toLowerCase().includes(q) ||
        g.buses?.some(b => b.regNumber?.toLowerCase().includes(q))
      )
    : groups

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
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard icon={Users} theme="purple" label="Total Groups" value={String(groups.length)} sub="All bus groups" />
            <StatCard icon={Bus} theme="blue" label="Total Bus Screens" value={String(totalBuses)} sub="Across all groups" onClick={() => navigate('/fleet/buses')} />
            <StatCard icon={Wifi} theme="green" label="Online Screens" value={String(onlineBuses)} sub={`${onlinePercentage}% of fleet`} onClick={() => navigate('/fleet/buses?status=online')} />
            <StatCard icon={WifiOff} theme="red" label="Offline Screens" value={String(offlineBuses)} sub={`${offlinePercentage}% of fleet`} onClick={() => navigate('/fleet/buses?status=offline')} />
          </>
        )}
      </div>

      {/* Groups search */}
      <div className="mb-6 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <SearchInput
          placeholder="Search groups..."
          value={groupSearch}
          onChange={e => setGroupSearch(e.target.value)}
          size="md"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <GroupCardSkeleton key={i} />)}
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-6">
          <EmptyState
            icon={Users}
            title="No Groups Found"
            description="You haven't added any bus groups yet. Create one to get started."
            action={
              <Button onClick={() => navigate('/fleet/add-group')}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Group
              </Button>
            }
          />
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-6">
          <EmptyState
            icon={Users}
            title="No Groups Match"
            description="No groups match your search. Try a different search term."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {filteredGroups.map(g => {
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

function ByRoutesTab({ routes = [], loading = false, search: searchProp, onSearchChange: onSearchChangeProp }) {
  const navigate = useNavigate()
  const isControlled = searchProp !== undefined
  const [internalSearch, setInternalSearch] = useState('')
  const search = isControlled ? searchProp : internalSearch
  const setSearch = isControlled ? onSearchChangeProp : setInternalSearch
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
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard icon={MapPin} theme="blue" label="Total Routes" value={String(routes.length)} sub="All routes" onClick={() => navigate('/routes')} />
            <StatCard icon={Bus} theme="green" label="Active Routes" value={String(routes.filter(r => r.status === 'active').length)} sub="Currently active" onClick={() => navigate('/routes')} />
            <StatCard icon={Wifi} theme="purple" label="Routes in Operation" value="0" sub="Currently running" onClick={() => navigate('/routes')} />
            <StatCard icon={WifiOff} theme="red" label="Inactive Routes" value={String(routes.filter(r => r.status === 'inactive').length)} sub="Currently inactive" onClick={() => navigate('/routes')} />
          </>
        )}
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
          <Button variant="outline" className="shadow-sm">
            <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
            Filters
          </Button>
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
        view === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <DataCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {['#', 'Route Title', 'Status', 'Details', 'Start Point', 'End Point', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Array.from({ length: 6 }).map((_, i) => <TableRowSkeleton key={i} cols={7} />)}
              </tbody>
            </table>
          </div>
        )
      ) : filteredRoutes.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-6">
          <EmptyState
            icon={MapPin}
            title="No Routes Found"
            description="You haven't added any routes yet. Create one to get started."
            action={
              <Button onClick={() => navigate('/routes/add')}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Route
              </Button>
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

function OwnerSelect({ users, ownerId, search, setSearch, showDropdown, setShowDropdown, onSelect, onClear }) {
  const dropdownRef = useRef(null)
  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )
  const selectedUser = users.find(u => u.id === ownerId)

  useEffect(() => {
    const selected = users.find(u => u.id === ownerId)
    if (selected && !search) {
      setSearch(selected.name)
    }
  }, [ownerId, users, search, setSearch])

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [setShowDropdown])

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search and select user"
          value={search}
          onChange={e => { setSearch(e.target.value); setShowDropdown(true) }}
          onFocus={() => setShowDropdown(true)}
          className="w-full pl-8 pr-8 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white placeholder:text-slate-400 transition-all duration-150"
        />
        {selectedUser && (
          <button
            type="button"
            onClick={() => { onClear(); setShowDropdown(true) }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
            title="Change owner"
          >
            <X size={14} />
          </button>
        )}
      </div>
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
          {filtered.map(user => (
            <button
              key={user.id}
              type="button"
              onClick={() => {
                onSelect(user.id)
                setSearch(user.name)
                setShowDropdown(false)
              }}
              className="w-full text-left px-3 py-2.5 hover:bg-slate-50 flex items-center gap-2 transition-colors border-b border-slate-50 last:border-0"
            >
              <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center text-[10px] font-semibold text-white shrink-0">
                {user.name?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="text-xs font-medium text-slate-800">{user.name}</p>
                <p className="text-[11px] text-slate-400">{user.email}</p>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-3 py-3 text-xs text-slate-400 text-center">No users found</p>
          )}
        </div>
      )}
      {selectedUser && (
        <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-xs font-semibold text-white shrink-0">
              {selectedUser.name?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900">{selectedUser.name}</p>
              <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                <span className="flex items-center gap-1"><Mail size={10} />{selectedUser.email}</span>
                <span className="flex items-center gap-1"><Phone size={10} />{selectedUser.phone || '—'}</span>
              </div>
            </div>
          </div>
        </div>
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
  const [routeSearch, setRouteSearch] = useState('')

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
    const groupData = deleteGroup
    try {
      await groupsApi.delete(groupData.id)
      setDeleteGroup(null)
      fetchData()
      toast.success('Group deleted', {
        action: { label: 'Undo', onClick: () => groupsApi.create({
          name: groupData.name,
          code: groupData.code,
          description: groupData.description,
          status: groupData.status,
          ownerId: groupData.ownerId,
        }).then(fetchData).catch((err) => toast.error(err?.response?.data?.message || 'Failed to restore group')) },
        duration: 5000,
      })
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
    <AppLayout title="Fleet" subtitle="Manage all bus screens by groups or routes" searchValue={routeSearch} onSearchChange={setRouteSearch}>
      <div className="p-6 max-w-screen-xl">
        {/* Tab bar + action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setTab('groups')}
              className={clsx(
                "px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer",
                tab === 'groups'
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              By Groups
            </button>
            <button
              onClick={() => setTab('routes')}
              className={clsx(
                "px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer",
                tab === 'routes'
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              By Routes
            </button>
          </div>

          {tab === 'groups' ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => navigate('/fleet/add-bus-screen')}
                className="shadow-sm font-medium"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Screen
              </Button>
              <Button
                onClick={() => navigate('/fleet/add-group')}
                className="shadow-sm font-medium bg-brand hover:bg-brand-dark text-white"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Group
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="shadow-sm font-medium"
              >
                Import Routes
              </Button>
              <Button
                onClick={() => navigate('/routes/add')}
                className="shadow-sm font-medium bg-brand hover:bg-brand-dark text-white"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Route
              </Button>
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
            search={routeSearch}
          />
        ) : (
          <ByRoutesTab routes={routes} loading={loading} search={routeSearch} onSearchChange={setRouteSearch} />
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
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Group Owner</label>
            <OwnerSelect
              users={editUsers}
              ownerId={editForm.ownerId}
              search={editOwnerSearch}
              setSearch={setEditOwnerSearch}
              showDropdown={editOwnerDropdown}
              setShowDropdown={setEditOwnerDropdown}
              onSelect={(userId) => setEditForm(f => ({ ...f, ownerId: userId }))}
              onClear={() => {
                setEditForm(f => ({ ...f, ownerId: null }))
                setEditOwnerSearch('')
              }}
            />
            <p className="text-[11px] text-slate-400 mt-1">The owner manages this group and its buses</p>
          </div>
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
