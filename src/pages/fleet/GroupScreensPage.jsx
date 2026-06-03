import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import { Badge, EmptyState, StatCard, Button, ConfirmDialog, LiveTrackingMap } from '@/components/ui'
import { Bus, Plus, User, Mail, Phone, ChevronRight, ShieldAlert, Monitor, Wifi, WifiOff, Trash2, ArrowLeft, Edit } from 'lucide-react'
import { groupsApi, busesApi } from '@/api'
import { toast } from 'sonner'

export default function GroupScreensPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, busId: null, regNumber: '' })

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

  const handleDeleteBus = async () => {
    const { busId } = deleteConfirm
    if (!busId) return
    try {
      await busesApi.delete(busId)
      toast.success('Bus screen deleted successfully')
      setDeleteConfirm({ open: false, busId: null, regNumber: '' })
      fetchGroupDetails()
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Failed to delete bus screen')
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
              </div>
              <p className="text-xs text-slate-500 font-mono mb-4">Code: {group.code || '—'}</p>
              <p className="text-sm text-slate-600 leading-relaxed">
                {group.description || 'No description provided for this group.'}
              </p>
            </div>
            
            <div className="flex items-center gap-4 mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400">
              <span>Created: {new Date(group.createdAt).toLocaleDateString()}</span>
              <span>•</span>
              <span>Last Updated: {new Date(group.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Owner details card */}
          <div className="bg-white rounded-xl shadow-card border border-slate-100 p-6">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Group Owner</h3>
            {owner ? (
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
          <StatCard icon={Monitor} iconBg="bg-blue-50" iconColor="text-blue-500" label="Total Screens" value={String(screens.length)} sub="Registered screens" />
          <StatCard icon={Wifi} iconBg="bg-green-50" iconColor="text-green-500" label="Online Screens" value={String(onlineScreens)} sub="Currently tracking" />
          <StatCard icon={WifiOff} iconBg="bg-red-50" iconColor="text-red-500" label="Offline Screens" value={String(offlineScreens)} sub="Currently offline" />
        </div>

        {/* Live Screens Tracking Map */}
        {screens.length > 0 && (
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
        )}

        {/* Screens table section */}
        <div className="bg-white rounded-xl shadow-card border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-slate-900">Bus Screens ({screens.length})</h3>
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
                  {screens.map(screen => (
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
      </div>

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
