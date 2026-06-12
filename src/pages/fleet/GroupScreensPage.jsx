import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import { Badge, EmptyState, StatCard, Button, ConfirmDialog, LiveTrackingMap, SlidePanel, Input, Select } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import { Bus, Plus, User, Mail, Phone, ChevronRight, ShieldAlert, Monitor, Wifi, WifiOff, Trash2, ArrowLeft, Edit, Search, X, Check, Pencil } from 'lucide-react'
import { groupsApi, busesApi, usersApi } from '@/api'
import { toast } from 'sonner'

export default function GroupScreensPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, busId: null, regNumber: '' })
  const [editingOwner, setEditingOwner] = useState(false)
  const [ownerUsers, setOwnerUsers] = useState([])
  const [ownerSearch, setOwnerSearch] = useState('')
  const [ownerDropdown, setOwnerDropdown] = useState(false)
  const [savingOwner, setSavingOwner] = useState(false)
  const ownerDropdownRef = useRef(null)
  const [userFormOpen, setUserFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [userForm, setUserForm] = useState({ full_name: '', email: '', phone: '', password: '', role: '', status: 'active' })
  const [savingUser, setSavingUser] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [editingGroup, setEditingGroup] = useState(false)
  const [groupForm, setGroupForm] = useState({ name: '', code: '', description: '', status: 'active' })
  const [savingGroup, setSavingGroup] = useState(false)

  const fetchGroupDetails = async () => {
    try {
      setLoading(true)
      const res = await groupsApi.get(id)
      setGroup(res.data)
    } catch (err) {
      console.error('Failed to fetch group details:', err)
      toast.error('Failed to load group details')
      navigate('/fleet')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchGroupDetails()
    }
  }, [id])

  useEffect(() => {
    if (editingOwner) {
      usersApi.list().then(res => {
        setOwnerUsers(res.data.map(u => ({
          id: u.id,
          name: u.name || u.full_name || 'Unknown',
          email: u.email || '',
          phone: u.phone || '—',
          role: u.role,
        })))
      }).catch(() => toast.error('Failed to load users'))
    }
  }, [editingOwner])

  useEffect(() => {
    function handleClickOutside(e) {
      if (ownerDropdownRef.current && !ownerDropdownRef.current.contains(e.target)) {
        setOwnerDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSaveGroup = async () => {
    if (!groupForm.name.trim()) {
      toast.error('Group name is required')
      return
    }
    try {
      setSavingGroup(true)
      await groupsApi.update(id, {
        name: groupForm.name.trim(),
        code: groupForm.code.trim() || null,
        description: groupForm.description.trim() || null,
        status: groupForm.status,
      })
      toast.success('Group updated')
      setEditingGroup(false)
      fetchGroupDetails()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update group')
    } finally {
      setSavingGroup(false)
    }
  }

  const handleDeleteBus = async () => {
    const { busId } = deleteConfirm
    if (!busId) return
    const busData = group?.buses?.find(b => b.id === busId)
    try {
      await busesApi.delete(busId)
      setDeleteConfirm({ open: false, busId: null, regNumber: '' })
      fetchGroupDetails()
      toast.success('Bus screen deleted', {
        action: busData ? { label: 'Undo', onClick: () => busesApi.create({
          regNumber: busData.regNumber,
          groupId: busData.groupId,
          simNumber: busData.simNumber,
          busType: busData.busType,
          contactName: busData.contactName,
          contactNumber: busData.contactNumber,
          chassisNumber: busData.chassisNumber,
          model: busData.model,
          routeId: busData.routeId,
          scheduleId: busData.scheduleId,
        }).then(fetchGroupDetails).catch((err) => toast.error(err?.response?.data?.message || 'Failed to restore bus screen')) } : undefined,
        duration: 5000,
      })
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Failed to delete bus screen')
    }
  }

  const filteredOwnerUsers = ownerUsers.filter(u =>
    u.name.toLowerCase().includes(ownerSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(ownerSearch.toLowerCase())
  )
  const selectedOwnerUser = ownerUsers.find(u => u.id === group?.ownerId)

  const handleChangeOwner = async (userId) => {
    try {
      setSavingOwner(true)
      const selectedUser = ownerUsers.find(u => u.id === userId)
      await groupsApi.update(group.id, { ownerId: userId })
      setGroup(prev => ({ ...prev, ownerId: userId, owner: selectedUser ? { ...selectedUser } : prev.owner }))
      toast.success(`Owner changed to ${selectedUser?.name || 'None'}`)
      setEditingOwner(false)
      setOwnerSearch('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update owner')
    } finally {
      setSavingOwner(false)
    }
  }

  const handleClearOwner = async () => {
    try {
      setSavingOwner(true)
      await groupsApi.update(group.id, { ownerId: null })
      setGroup(prev => ({ ...prev, ownerId: null, owner: null }))
      toast.success('Owner removed')
      setEditingOwner(false)
      setOwnerSearch('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update owner')
    } finally {
      setSavingOwner(false)
    }
  }

  const openAddUser = () => {
    setEditingUser(null)
    setUserForm({ full_name: '', email: '', phone: '', password: '', role: '', status: 'active' })
    setUserFormOpen(true)
  }

  const openEditUser = (u) => {
    setEditingUser(u)
    setUserForm({
      full_name: u.full_name || '',
      email: u.email || '',
      phone: u.phone?.replace('+91 ', '') || '',
      password: '',
      role: u.role || '',
      status: u.status || 'active',
    })
    setUserFormOpen(true)
  }

  const handleSaveUser = async () => {
    if (!userForm.full_name.trim() || !userForm.email.trim()) {
      toast.error('Full name and email are required')
      return
    }
    try {
      setSavingUser(true)
      const payload = {
        full_name: userForm.full_name.trim(),
        email: userForm.email.trim(),
        phone: `+91 ${userForm.phone}`,
        role: userForm.role,
        status: userForm.status,
        group_id: id,
      }
      if (userForm.password) payload.password = userForm.password

      if (editingUser) {
        await usersApi.update(editingUser.id, payload)
        toast.success('User updated successfully')
      } else {
        await usersApi.create(payload)
        toast.success('User added successfully')
      }
      setUserFormOpen(false)
      fetchGroupDetails()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save user')
    } finally {
      setSavingUser(false)
    }
  }

  if (loading) {
    return (
      <AppLayout title="Group Screens" subtitle="Fleet > Group Screens" showBack onBack={() => navigate('/fleet')}>
        <div className="flex justify-center items-center py-24">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    )
  }

  if (!group) {
    return (
      <AppLayout title="Group Screens" subtitle="Fleet > Group Screens" showBack onBack={() => navigate('/fleet')}>
        <div className="p-6 text-center text-slate-400">Group not found</div>
      </AppLayout>
    )
  }

  const owner = group.owner
  const screens = group.buses || []
  const filteredScreens = statusFilter === 'all' ? screens : screens.filter(s => s.status === statusFilter)
  const onlineScreens = screens.filter(s => s.status === 'online').length
  const offlineScreens = screens.length - onlineScreens

  return (
    <AppLayout title={group.name} subtitle={`Fleet > ${group.name} > Screens`} showBack onBack={() => navigate('/fleet')}>
      <div className="p-6 max-w-screen-xl space-y-6">
        
        {/* Main Header / Group Info Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-card border border-slate-100 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-bold text-slate-900">{group.name}</h2>
                <Badge status={group.status} />
                <button
                  onClick={() => { setGroupForm({ name: group.name, code: group.code || '', description: group.description || '', status: group.status || 'active' }); setEditingGroup(true) }}
                  className="ml-auto p-1.5 text-slate-400 hover:text-brand rounded-md hover:bg-slate-50 transition-all"
                  title="Edit Group"
                >
                  <Pencil size={14} />
                </button>
              </div>
              <p className="text-xs text-slate-500 font-mono mb-4">Code: {group.code || '—'}</p>
              <p className="text-sm text-slate-600 leading-relaxed">
                {group.description || 'No description provided for this group.'}
              </p>
            </div>
            
            <div className="flex items-center gap-4 mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400">
              <span>Created: {formatDate(group.createdAt)}</span>
              <span>•</span>
              <span>Last Updated: {formatDate(group.updatedAt)}</span>
            </div>
          </div>

          {/* Owner details card */}
          <div className="bg-white rounded-xl shadow-card border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Group Owner</h3>
              <button
                onClick={() => setEditingOwner(!editingOwner)}
                className="text-xs font-medium text-brand hover:text-brand-dark flex items-center gap-1"
              >
                <Edit size={12} />
                {editingOwner ? 'Cancel' : 'Change'}
              </button>
            </div>

            {editingOwner ? (
              <div className="space-y-3">
                <div className="relative" ref={ownerDropdownRef}>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={ownerSearch}
                      onChange={e => { setOwnerSearch(e.target.value); setOwnerDropdown(true) }}
                      onFocus={() => setOwnerDropdown(true)}
                      className="w-full pl-8 pr-8 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white placeholder:text-slate-400"
                    />
                  </div>
                  {ownerDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                      <button
                        type="button"
                        onClick={handleClearOwner}
                        disabled={savingOwner}
                        className="w-full text-left px-3 py-2.5 hover:bg-slate-50 flex items-center gap-2 text-xs text-slate-500 border-b border-slate-50 transition-colors"
                      >
                        <X size={14} className="text-slate-400" />
                        Remove owner
                      </button>
                      {filteredOwnerUsers.map(user => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleChangeOwner(user.id)}
                          disabled={savingOwner}
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
                      {filteredOwnerUsers.length === 0 && (
                        <p className="px-3 py-3 text-xs text-slate-400 text-center">No users found</p>
                      )}
                    </div>
                  )}
                </div>
                {savingOwner && (
                  <div className="flex items-center justify-center py-2">
                    <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            ) : owner ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-sm font-semibold text-white shrink-0">
                    {owner.full_name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{owner.full_name}</p>
                    <p className="text-xs text-brand capitalize">{owner.role || 'Partner'}</p>
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t border-slate-50">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Mail size={12} className="text-slate-400 shrink-0" />
                    <span className="truncate">{owner.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Phone size={12} className="text-slate-400 shrink-0" />
                    <span>{owner.phone || '—'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center bg-slate-55 rounded-lg border border-dashed border-slate-200">
                <User size={24} className="text-slate-300 mb-2" />
                <p className="text-xs text-slate-400">No owner assigned to this group</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className={`rounded-2xl transition-all ${statusFilter === 'all' ? 'ring-1 ring-brand' : ''}`}>
            <StatCard icon={Monitor} iconBg={statusFilter === 'all' ? 'bg-blue-100' : 'bg-blue-50'} iconColor="text-blue-500" label="Total Screens" value={String(screens.length)} sub="Registered screens" onClick={() => setStatusFilter('all')} />
          </div>
          <div className={`rounded-2xl transition-all ${statusFilter === 'online' ? 'ring-1 ring-brand' : ''}`}>
            <StatCard icon={Wifi} iconBg={statusFilter === 'online' ? 'bg-green-100' : 'bg-green-50'} iconColor="text-green-500" label="Online Screens" value={String(onlineScreens)} sub="Currently tracking" onClick={() => setStatusFilter('online')} />
          </div>
          <div className={`rounded-2xl transition-all ${statusFilter === 'offline' ? 'ring-1 ring-brand' : ''}`}>
            <StatCard icon={WifiOff} iconBg={statusFilter === 'offline' ? 'bg-red-100' : 'bg-red-50'} iconColor="text-red-500" label="Offline Screens" value={String(offlineScreens)} sub="Currently offline" onClick={() => setStatusFilter('offline')} />
          </div>
        </div>

        {/* Live Screens Tracking Map */}
        {/* {screens.length > 0 && (
          <div className="bg-white rounded-xl shadow-card border border-slate-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <h3 className="text-sm font-semibold text-slate-900">Live Screens Tracking</h3>
            </div>
            <div className="rounded-xl overflow-hidden border border-slate-100 h-80">
              <LiveTrackingMap 
                buses={screens.map(s => ({ 
                  ...s, 
                  group: { id: group.id, name: group.name } 
                }))} 
                height="100%" 
              />
            </div>
          </div>
        )} */}

        {/* Screens table section */}
        <div className="bg-white rounded-xl shadow-card border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-slate-900">Bus Screens {statusFilter !== 'all' ? `(${filteredScreens.length} of ${screens.length})` : `(${screens.length})`}</h3>
            <Button
              startIcon={Plus}
              label="Add Screen"
              onClick={() => navigate('/fleet/add-bus-screen')}
            />
          </div>

          {screens.length === 0 ? (
            <div className="border border-dashed border-slate-200 rounded-xl p-12">
              <EmptyState
                icon={Monitor}
                title="No Screens Registered"
                description="This group doesn't have any bus screens added to it yet."
                action={
                  <Button
                    startIcon={Plus}
                    label="Add First Screen"
                    onClick={() => navigate('/fleet/add-bus-screen')}
                  />
                }
              />
            </div>
          ) : filteredScreens.length === 0 ? (
            <div className="border border-dashed border-slate-200 rounded-xl p-12">
              <EmptyState
                icon={Monitor}
                title={`No ${statusFilter} screens`}
                description={`There are no ${statusFilter} screens in this group.`}
              />
            </div>
          ) : (
            <div className="border border-slate-100 rounded-xl overflow-hidden bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-5 py-3">Registration No.</th>
                    <th className="px-5 py-3">SIM Number</th>
                    <th className="px-5 py-3">Bus Type</th>
                    <th className="px-5 py-3">Assigned Route</th>
                    <th className="px-5 py-3">Contact Person</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredScreens.map(screen => (
                    <tr key={screen.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4 font-semibold text-slate-900">{screen.regNumber}</td>
                      <td className="px-5 py-4 font-mono text-slate-500">{screen.simNumber}</td>
                      <td className="px-5 py-4 capitalize">{screen.busType}</td>
                      <td className="px-5 py-4 text-slate-600">
                        {screen.route?.name ? (
                          <span className="font-medium text-slate-800">{screen.route.name}</span>
                        ) : (
                          <span className="text-slate-400">No route assigned</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">{screen.contactName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{screen.contactNumber}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          screen.status === 'online' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${screen.status === 'online' ? 'bg-green-500' : 'bg-slate-400'}`} />
                          {screen.status === 'online' ? 'Online' : 'Offline'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/fleet/edit-bus-screen/${screen.id}`)}
                            className="p-1.5 text-slate-400 hover:text-brand rounded-md hover:bg-slate-50 transition-all"
                            title="Edit Screen"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ open: true, busId: screen.id, regNumber: screen.regNumber })}
                            className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-slate-50 transition-all"
                            title="Delete Screen"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {/* Group Users section */}
        <div className="bg-white rounded-xl shadow-card border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-slate-900">Group Users ({(group.users || []).length})</h3>
            <Button startIcon={Plus} label="Add User" onClick={openAddUser} />
          </div>

          {(!group.users || group.users.length === 0) ? (
            <div className="border border-dashed border-slate-200 rounded-xl p-12">
              <EmptyState
                icon={User}
                title="No Users Assigned"
                description="This group doesn't have any users assigned to it yet."
                action={
                  <Button startIcon={Plus} label="Add First User" onClick={openAddUser} />
                }
              />
            </div>
          ) : (
            <div className="border border-slate-100 rounded-xl overflow-hidden bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-5 py-3">User</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Phone</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {group.users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-xs font-semibold text-white shrink-0">
                            {u.full_name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <span className="font-semibold text-slate-900">{u.full_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{u.email}</td>
                      <td className="px-5 py-4 font-mono text-slate-500">{u.phone || '—'}</td>
                      <td className="px-5 py-4 capitalize">{u.role}</td>
                      <td className="px-5 py-4">
                        <Badge status={u.status} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => openEditUser(u)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-50 transition-all"
                          title="Edit User"
                        >
                          <Pencil size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Group Panel */}
      <SlidePanel
        open={editingGroup}
        onClose={() => setEditingGroup(false)}
        title="Edit Group"
        subtitle={`Editing: ${group.name}`}
      >
        <div className="space-y-4">
          <Input
            label="Group Name *"
            value={groupForm.name}
            onChange={e => setGroupForm(f => ({ ...f, name: e.target.value }))}
          />
          <Input
            label="Group Code"
            value={groupForm.code}
            onChange={e => setGroupForm(f => ({ ...f, code: e.target.value }))}
          />
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
            <textarea
              value={groupForm.description}
              onChange={e => setGroupForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white placeholder:text-slate-400 transition-all duration-150 resize-none"
            />
          </div>
          <Select
            label="Status"
            value={groupForm.status}
            onChange={e => setGroupForm(f => ({ ...f, status: e.target.value }))}
          >
            <option value="active">● Active</option>
            <option value="inactive">● Inactive</option>
          </Select>
          <div className="pt-4 border-t border-slate-100">
            <Button
              label="Save Changes"
              onClick={handleSaveGroup}
              loading={savingGroup}
              className="w-full"
            />
          </div>
        </div>
      </SlidePanel>

      {/* Add/Edit User Panel */}
      <SlidePanel
        open={userFormOpen}
        onClose={() => setUserFormOpen(false)}
        title={editingUser ? 'Edit User' : 'Add User'}
        subtitle={editingUser ? `Editing: ${editingUser.full_name}` : `Add a new user to ${group.name}`}
      >
        <div className="space-y-4">
          <Input
            label="Full Name *"
            placeholder="Enter full name"
            value={userForm.full_name}
            onChange={e => setUserForm(f => ({ ...f, full_name: e.target.value }))}
          />
          <Input
            label="Email Address *"
            type="email"
            placeholder="email@example.com"
            value={userForm.email}
            onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))}
          />
          <Input
            label="Phone Number"
            placeholder="98765 43210"
            startIcon={
              <div className="flex items-center pr-2 border-r border-slate-200 select-none">
                <span className="text-slate-500 text-sm font-semibold font-mono leading-none">+91</span>
              </div>
            }
            className="pl-[60px]"
            value={userForm.phone}
            onChange={e => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 10)
              setUserForm(f => ({ ...f, phone: val }))
            }}
          />
          {!editingUser && (
            <Input
              label="Password *"
              type="password"
              placeholder="Set initial password"
              value={userForm.password}
              onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))}
            />
          )}
          {editingUser && (
            <Input
              label="New Password (leave blank to keep current)"
              type="password"
              placeholder="Enter new password"
              value={userForm.password}
              onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))}
            />
          )}
          <Select
            label="Role *"
            value={userForm.role}
            onChange={e => setUserForm(f => ({ ...f, role: e.target.value }))}
          >
            <option value="">Select role</option>
            <option value="superadmin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="partner">Partner (Bus Owner)</option>
            <option value="operator">Operator</option>
          </Select>
          <Select
            label="Status"
            value={userForm.status}
            onChange={e => setUserForm(f => ({ ...f, status: e.target.value }))}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
          <div className="pt-4 border-t border-slate-100">
            <Button
              label={editingUser ? 'Save Changes' : 'Add User'}
              onClick={handleSaveUser}
              loading={savingUser}
              className="w-full"
            />
          </div>
        </div>
      </SlidePanel>

      <ConfirmDialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, busId: null, regNumber: '' })}
        onConfirm={handleDeleteBus}
        title="Remove Bus Screen"
        message={`Are you sure you want to delete bus screen "${deleteConfirm.regNumber}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
      />
    </AppLayout>
  )
}
