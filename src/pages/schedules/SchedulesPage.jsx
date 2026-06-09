import { useState, useEffect, useMemo } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { Badge, Button, Input, Tabs, Modal, ConfirmDialog, Select } from '@/components/ui'
import { Calendar, Plus, Search, Trash2, X, Bus } from 'lucide-react'
import { schedulesApi, routesApi, busesApi } from '@/api'
import { toast } from 'sonner'

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [activeTab, setActiveTab] = useState('routes')
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')

  const [addRouteOpen, setAddRouteOpen] = useState(false)
  const [availableRoutes, setAvailableRoutes] = useState([])
  const [selectedRouteId, setSelectedRouteId] = useState('')
  const [copyFromScheduleId, setCopyFromScheduleId] = useState('')
  const [copying, setCopying] = useState(false)

  const [assignOpen, setAssignOpen] = useState(false)
  const [availableBuses, setAvailableBuses] = useState([])
  const [selectedBusId, setSelectedBusId] = useState('')

  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, name: '' })

  const fetchSchedules = async () => {
    try {
      setLoading(true)
      const res = await schedulesApi.list()
      setSchedules(res.data)
      if (res.data.length > 0) {
        setSelected((prev) => {
          const found = res.data.find((s) => s.id === prev?.id)
          return found || res.data[0]
        })
      } else {
        setSelected(null)
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to load schedules')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchedules()
  }, [])

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error('Schedule name is required')
      return
    }
    try {
      const res = await schedulesApi.create({ name: newName.trim(), description: newDescription.trim() || undefined })
      toast.success('Schedule created')
      setCreateOpen(false)
      setNewName('')
      setNewDescription('')
      fetchSchedules()
      setSelected(res.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create schedule')
    }
  }

  const handleDelete = async () => {
    try {
      await schedulesApi.delete(deleteConfirm.id)
      toast.success('Schedule deleted')
      setDeleteConfirm({ open: false, id: null, name: '' })
      fetchSchedules()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete schedule')
    }
  }

  const openAddRoute = async () => {
    try {
      const res = await routesApi.list()
      const scheduleRouteIds = new Set((selected?.scheduleRoutes || []).map(sr => sr.routeId))
      setAvailableRoutes(res.data.filter(r => !scheduleRouteIds.has(r.id)))
      setSelectedRouteId('')
      setCopyFromScheduleId('')
      setAddRouteOpen(true)
    } catch (err) {
      toast.error('Failed to load routes')
    }
  }

  const handleAddRoute = async () => {
    if (!selectedRouteId) {
      toast.error('Please select a route')
      return
    }
    try {
      await schedulesApi.addRoute(selected.id, { routeId: selectedRouteId })
      toast.success('Route added to schedule')
      setAddRouteOpen(false)
      fetchSchedules()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add route')
    }
  }

  const handleCopyRoutes = async () => {
    if (!copyFromScheduleId) {
      toast.error('Please select a schedule to copy from')
      return
    }
    try {
      setCopying(true)
      const res = await schedulesApi.copyRoutes(selected.id, { sourceScheduleId: copyFromScheduleId })
      toast.success(res.data.message || 'Routes copied successfully')
      setAddRouteOpen(false)
      fetchSchedules()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to copy routes')
    } finally {
      setCopying(false)
    }
  }

  const handleRemoveRoute = async (routeId) => {
    try {
      await schedulesApi.removeRoute(selected.id, routeId)
      toast.success('Route removed from schedule')
      fetchSchedules()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove route')
    }
  }

  const openAssign = async () => {
    try {
      const res = await busesApi.list()
      const allBuses = res.data
      const currentBusId = selected?.assignedBus?.id
      setAvailableBuses(allBuses.filter(b => !b.scheduleId || b.id === currentBusId))
      setSelectedBusId(currentBusId || '')
      setAssignOpen(true)
    } catch (err) {
      toast.error('Failed to load buses')
    }
  }

  const handleAssign = async () => {
    if (!selectedBusId) {
      toast.error('Please select a bus')
      return
    }
    try {
      await schedulesApi.assignBus(selected.id, { busId: selectedBusId })
      toast.success('Schedule assigned to bus')
      setAssignOpen(false)
      fetchSchedules()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign schedule')
    }
  }

  const handleUnassign = async () => {
    try {
      await schedulesApi.unassignBus(selected.id)
      toast.success('Schedule unassigned from bus')
      fetchSchedules()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to unassign schedule')
    }
  }

  const filtered = useMemo(() => {
    return schedules.filter((s) =>
      s.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [schedules, search])

  const routeCount = (schedule) => schedule?.scheduleRoutes?.length || 0
  const assignedBus = selected?.assignedBus
  const otherSchedules = useMemo(() => {
    return schedules.filter(s => s.id !== selected?.id)
  }, [schedules, selected])

  return (
    <AppLayout title="Route Schedules" subtitle="Create and manage route schedules, assign to buses">
      <div className="p-6 max-w-screen-xl">
        <div className="flex gap-4">

          {/* Left: schedule list */}
          <div className="w-80 shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <Input
                placeholder="Search schedules..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                startIcon={Search}
                containerClassName="flex-1"
                className="py-1.5"
              />
              <Button className="shrink-0" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Create
              </Button>
            </div>

            <div className="space-y-2">
              {loading ? (
                <div className="flex justify-center items-center py-12 bg-white rounded-xl border border-slate-100 shadow-card">
                  <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs bg-white rounded-xl border border-slate-100 shadow-card">
                  No schedules found.
                </div>
              ) : (
                filtered.map(schedule => (
                  <div
                    key={schedule.id}
                    onClick={() => setSelected(schedule)}
                    className={`bg-white rounded-xl shadow-card border border-slate-100 p-5 cursor-pointer transition-all ${selected?.id === schedule.id ? 'ring-2 ring-brand' : 'hover:shadow-card-md'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 bg-purple-50 rounded-lg flex items-center justify-center shrink-0">
                          <Calendar size={13} className="text-purple-600" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-900 truncate max-w-[180px]">{schedule.name}</p>
                          <p className="text-xs text-slate-400">{routeCount(schedule)} Routes{schedule.assignedBus ? ` · ${schedule.assignedBus.regNumber}` : ''}</p>
                        </div>
                      </div>
                    </div>
                    <Badge status={schedule.status} />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: schedule detail */}
          {selected ? (
            <div className="flex-1 bg-white rounded-xl shadow-card border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-slate-900">{selected.name}</h2>
                  <Badge status={selected.status} />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="px-4 rounded-lg"
                    onClick={() => setDeleteConfirm({ open: true, id: selected.id, name: selected.name })}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              {selected.description && (
                <p className="text-xs text-slate-500 mb-4">{selected.description}</p>
              )}

              {/* Schedule summary */}
              <div className="grid grid-cols-3 gap-4 mb-5 p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-xs text-slate-500">Routes</p>
                  <p className="text-sm font-medium text-slate-800">{routeCount(selected)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Assigned Bus</p>
                  <p className="text-sm font-medium text-slate-800">{assignedBus ? assignedBus.regNumber : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Status</p>
                  <p className="text-sm font-medium text-slate-800 capitalize">{selected.status}</p>
                </div>
              </div>

              {/* Tabs */}
              <Tabs
                variant="underline"
                tabs={[
                  { value: 'routes', label: 'Routes' },
                  { value: 'assignment', label: 'Bus Assignment' }
                ]}
                active={activeTab}
                onChange={setActiveTab}
                className="mb-4"
              />

              {activeTab === 'routes' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-slate-700">Routes in this Schedule ({routeCount(selected)})</p>
                    <Button size="sm" variant="outline" onClick={openAddRoute}>
                      <Plus className="mr-1 h-3 w-3" />
                      Add Route
                    </Button>
                  </div>
                  {routeCount(selected) === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      No routes in this schedule. Add a route to get started.
                    </div>
                  ) : (
                    <div className="border border-slate-100 rounded-xl overflow-hidden bg-white">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="p-3 text-xs font-semibold text-slate-500 uppercase w-12">#</th>
                            <th className="p-3 text-xs font-semibold text-slate-500 uppercase">Route Name</th>
                            <th className="p-3 text-xs font-semibold text-slate-500 uppercase">Code</th>
                            <th className="p-3 text-xs font-semibold text-slate-500 uppercase w-16"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {selected.scheduleRoutes
                            ?.sort((a, b) => a.sequenceOrder - b.sequenceOrder)
                            .map((sr) => (
                              <tr key={sr.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                <td className="p-3 text-xs font-medium text-slate-500">{sr.sequenceOrder}</td>
                                <td className="p-3 text-xs text-slate-800 font-medium">{sr.route?.name || 'Unknown'}</td>
                                <td className="p-3 text-xs text-slate-400 font-mono">{sr.route?.code || '—'}</td>
                                <td className="p-3">
                                  <button
                                    onClick={() => handleRemoveRoute(sr.routeId)}
                                    className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500 transition-colors"
                                  >
                                    <X size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'assignment' && (
                <div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    {assignedBus ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100">
                          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                            <Bus size={15} className="text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">{assignedBus.regNumber}</p>
                            <p className="text-xs text-slate-400">Currently assigned to this schedule</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleUnassign}>
                          Unassign Bus
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-slate-500">No bus assigned to this schedule.</p>
                        <Button size="sm" onClick={openAssign}>
                          <Bus className="mr-1.5 h-3.5 w-3.5" />
                          Assign to a Bus
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 bg-white rounded-xl shadow-card border border-slate-100 p-5">
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Calendar size={40} className="mb-3 text-slate-300" />
                <p className="text-sm font-medium">Select a schedule</p>
                <p className="text-xs mt-1">Click a schedule from the list to view its details.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Schedule Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Schedule" width="max-w-md">
        <div className="space-y-4">
          <Input
            label="Schedule Name"
            placeholder="e.g. Morning Shift"
            value={newName}
            onChange={e => setNewName(e.target.value)}
          />
          <Input
            label="Description (optional)"
            placeholder="Brief description of the schedule"
            value={newDescription}
            onChange={e => setNewDescription(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create</Button>
          </div>
        </div>
      </Modal>

      {/* Add Route Modal */}
      <Modal open={addRouteOpen} onClose={() => setAddRouteOpen(false)} title="Add Routes to Schedule" width="max-w-md">
        <div className="space-y-5">
          {/* Add individual route */}
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-2">Add a single route</p>
            {availableRoutes.length === 0 ? (
              <p className="text-sm text-slate-500">All available routes are already in this schedule.</p>
            ) : (
              <Select
                label="Select Route"
                value={selectedRouteId}
                onChange={e => setSelectedRouteId(e.target.value)}
              >
                <option value="">-- Choose a route --</option>
                {availableRoutes.map(r => (
                  <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
                ))}
              </Select>
            )}
            <div className="flex justify-end mt-2">
              <Button onClick={handleAddRoute} disabled={!selectedRouteId} size="sm">Add Route</Button>
            </div>
          </div>

          <div className="border-t border-slate-100" />

          {/* Copy from another schedule */}
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-2">Copy routes from another schedule</p>
            {otherSchedules.length === 0 ? (
              <p className="text-sm text-slate-500">No other schedules available.</p>
            ) : (
              <Select
                label="Source Schedule"
                value={copyFromScheduleId}
                onChange={e => setCopyFromScheduleId(e.target.value)}
              >
                <option value="">-- Choose a schedule --</option>
                {otherSchedules.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({routeCount(s)} routes)</option>
                ))}
              </Select>
            )}
            <div className="flex justify-end mt-2">
              <Button onClick={handleCopyRoutes} disabled={!copyFromScheduleId || copying} size="sm">
                {copying ? 'Copying...' : 'Copy All Routes'}
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => setAddRouteOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Assign Bus Modal */}
      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title="Assign Schedule to Bus" width="max-w-md">
        <div className="space-y-4">
          {availableBuses.length === 0 ? (
            <p className="text-sm text-slate-500">No available buses to assign.</p>
          ) : (
            <Select
              label="Select Bus"
              value={selectedBusId}
              onChange={e => setSelectedBusId(e.target.value)}
            >
              <option value="">-- Choose a bus --</option>
              {availableBuses.map(b => (
                <option key={b.id} value={b.id}>{b.regNumber}</option>
              ))}
            </Select>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={!selectedBusId}>Assign</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: null, name: '' })}
        onConfirm={handleDelete}
        title="Delete Schedule"
        message={`Are you sure you want to delete schedule "${deleteConfirm.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
      />
    </AppLayout>
  )
}
