import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import { Stepper, Input, Select, Button, Badge, Modal } from '@/components/ui'
import clsx from 'clsx'
import { ArrowRight, Check, User, Info, Plus, Calendar, Edit2, Trash2 } from 'lucide-react'
import { groupsApi, busesApi, schedulesApi, routesApi } from '@/api'
import { toast } from 'sonner'

const STEPS = ['Bus Details', 'Bus Schedule', 'Preview & Complete']

const BUS_TYPES = ['Limited stop', 'Local', 'City']

const BUS_TYPE_COLORS = {
  'Limited stop': 'bg-rose-400',
  'Local': 'bg-sky-400',
  'City': 'bg-green-500',
}

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))

function to24h(hour12, minute, ampm) {
  if (!hour12 || !minute) return null
  let hour = parseInt(hour12, 10)
  if (ampm === 'PM' && hour !== 12) hour += 12
  if (ampm === 'AM' && hour === 12) hour = 0
  return `${String(hour).padStart(2, '0')}:${minute}:00`
}

function to12h(time24) {
  if (!time24) return null
  const [h, m] = time24.split(':')
  const hour = parseInt(h, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${m} ${ampm}`
}

function timePartsFrom24(time24) {
  if (!time24) return { hour: '', minute: '', ampm: 'AM' }
  const [h, m] = time24.split(':')
  const hour = parseInt(h, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return { hour: String(hour12).padStart(2, '0'), minute: m || '00', ampm }
}

function BusDetailsStep({ form, setForm, groups = [], reviewed }) {
  const tick = reviewed ? <Check size={14} className="text-green-500" /> : undefined
  const selectedGroup = groups.find(g => String(g.id) === String(form.groupId))
  const groupOwner = selectedGroup?.owner
  const [useOwner, setUseOwner] = useState(false)
  const busTypeRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (busTypeRef.current && !busTypeRef.current.contains(e.target)) {
        setForm(f => ({ ...f, _busTypeOpen: false }))
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggleOwner = () => {
    if (!useOwner && groupOwner) {
      setUseOwner(true)
      setForm(f => ({
        ...f,
        contactName: groupOwner.full_name || '',
        contactNumber: (groupOwner.phone || '').replace(/\D/g, '').slice(0, 10),
      }))
    } else {
      setUseOwner(false)
    }
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-900 mb-1">1. Bus Details</h3>
      <p className="text-xs text-slate-500 mb-5">Enter the basic information about this bus.</p>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              label="Registration Number *"
              placeholder="KL-13-1234"
              value={form.regNumber}
              onChange={e => setForm(f => ({ ...f, regNumber: e.target.value }))}
              suffix={tick}
            />
            <p className="text-[11px] text-slate-400 mt-1">Enter bus registration number</p>
          </div>
          <div>
            <div className="relative">
              <Select
                label="Bus Group *"
                value={form.groupId}
                onChange={e => setForm(f => ({ ...f, groupId: e.target.value }))}
              >
                <option value="">Select group</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </Select>
              {reviewed && <span className="absolute right-2 top-[34px] text-green-500"><Check size={14} /></span>}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">This group is linked to a user (owner)</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              label="SIM Number *"
              placeholder="98765 43210"
              startIcon={
                <div className="flex items-center pr-2 border-r border-slate-200 select-none">
                  <span className="text-slate-500 text-sm font-semibold font-mono leading-none">+91</span>
                </div>
              }
              className="pl-[60px]"
              value={form.simNumber}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                setForm(f => ({ ...f, simNumber: val }))
              }}
              suffix={tick}
            />
            <p className="text-[11px] text-slate-400 mt-1">Enter SIM number used for tracking</p>
          </div>
          <div ref={busTypeRef} className="relative">
            <label className="block text-xs font-medium text-slate-600 mb-1">Bus Type *</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, _busTypeOpen: !f._busTypeOpen }))}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all duration-150 bg-white text-left"
              >
                {form.busType ? (
                  <>
                    <span className={`w-3 h-3 rounded-sm ${BUS_TYPE_COLORS[form.busType]}`} />
                    <span>{form.busType}</span>
                  </>
                ) : (
                  <span className="text-slate-400">Select the type of service</span>
                )}
              </button>
              {reviewed && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500"><Check size={14} /></span>}
              {form._busTypeOpen && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                  {BUS_TYPES.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, busType: t, _busTypeOpen: false }))}
                      className={clsx(
                        'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 transition-colors text-left',
                        form.busType === t && 'bg-brand/5 text-brand font-medium'
                      )}
                    >
                      <span className={`w-3 h-3 rounded-sm ${BUS_TYPE_COLORS[t]}`} />
                      <span className="flex-1">{t}</span>
                      {form.busType === t && <Check size={14} className="text-brand shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Select the type of service</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              label="Contact Person Name *"
              placeholder="James George"
              value={form.contactName}
              onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))}
              suffix={tick}
            />
            <p className="text-[11px] text-slate-400 mt-1">Person responsible for this bus</p>
          </div>
          <div>
            <Input
              label="Contact Number *"
              placeholder="98765 43210"
              startIcon={
                <div className="flex items-center pr-2 border-r border-slate-200 select-none">
                  <span className="text-slate-500 text-sm font-semibold font-mono leading-none">+91</span>
                </div>
              }
              className="pl-[60px]"
              value={form.contactNumber}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                setForm(f => ({ ...f, contactNumber: val }))
              }}
              suffix={tick}
            />
            <p className="text-[11px] text-slate-400 mt-1">Primary contact number</p>
          </div>
        </div>

        {groupOwner && (
          <div>
            <button
              type="button"
              onClick={handleToggleOwner}
              className={clsx(
                'flex items-center gap-2 w-full px-3 py-2.5 rounded-lg border text-xs font-medium transition-all',
                useOwner
                  ? 'bg-brand/5 border-brand/30 text-brand'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              )}
            >
              <div className={clsx(
                'w-4 h-4 rounded border flex items-center justify-center transition-colors',
                useOwner ? 'bg-brand border-brand' : 'border-slate-300'
              )}>
                {useOwner && <Check size={10} className="text-white" />}
              </div>
              <User size={13} />
              <span>Same as group owner — <strong>{groupOwner.full_name || 'Unknown'}</strong></span>
            </button>
          </div>
        )}

        <div className="pt-2">
          <p className="text-xs font-medium text-slate-600 mb-3">Additional Information <span className="text-slate-400 font-normal">(Optional)</span></p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="Chassis Number"
                placeholder="MBPP1234K678910"
                value={form.chassisNumber}
                onChange={e => setForm(f => ({ ...f, chassisNumber: e.target.value }))}
                suffix={tick}
              />
              <p className="text-[11px] text-slate-400 mt-1">Enter bus chassis number</p>
            </div>
            <div>
              <Input
                label="Model / Make"
                placeholder="eg:Volvo"
                value={form.model}
                onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
                suffix={tick}
              />
              <p className="text-[11px] text-slate-400 mt-1">Enter bus model</p>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
          <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            The selected group owner (<strong>{groups.find(g => String(g.id) === String(form.groupId))?.name || '...'}</strong>) will be notified once this bus screen is added.
          </p>
        </div>
      </div>
    </div>
  )
}

function BusScheduleStep({ schedulesList, setSchedulesList, reviewed }) {
  const [editingIndex, setEditingIndex] = useState(null)
  const [allRoutes, setAllRoutes] = useState([])

  // Existing schedule picker modal state
  const [assignScheduleModalOpen, setAssignScheduleModalOpen] = useState(false)
  const [existingSchedules, setExistingSchedules] = useState([])
  const [selectedExistingScheduleId, setSelectedExistingScheduleId] = useState('')

  const activeSchedule = editingIndex !== null ? schedulesList[editingIndex] : null

  const updateActiveSchedule = (updater) => {
    if (editingIndex === null) return
    setSchedulesList(prev => prev.map((sch, i) => i === editingIndex ? (typeof updater === 'function' ? updater(sch) : { ...sch, ...updater }) : sch))
  }

  useEffect(() => {
    routesApi.list().then(res => setAllRoutes(res.data)).catch(() => {})
  }, [])

  const sel = 'text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand hover:border-slate-300 transition-all duration-150 appearance-none cursor-pointer'
  const arrow = `bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2210%22%20height%3D%226%22%20fill%3D%22%23949ba3%22%3E%3Cpath%20d%3D%22M0%200l5%206%205-6z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_6px_center] bg-[length_10px_6px]`

  const handleAddNewSchedule = () => {
    const newSch = {
      _scheduleId: null,
      name: `Schedule ${schedulesList.filter(s => s.name.trim()).length + 1}`,
      description: '',
      startHour: '',
      startMinute: '',
      startAmPm: 'AM',
      endHour: '',
      endMinute: '',
      endAmPm: 'AM',
      routeId: '',
      route: null,
    }
    const cleanList = schedulesList.filter(s => s.name.trim() || s._scheduleId)
    setSchedulesList([...cleanList, newSch])
    setEditingIndex(cleanList.length)
  }

  const handleOpenAssignExistingModal = async () => {
    try {
      const res = await schedulesApi.list()
      const currentAssignedIds = new Set(schedulesList.map(s => s._scheduleId).filter(Boolean))
      const available = res.data.filter(s => !currentAssignedIds.has(s.id))
      setExistingSchedules(available)
      setSelectedExistingScheduleId('')
      setAssignScheduleModalOpen(true)
    } catch (err) {
      toast.error('Failed to load existing schedules')
    }
  }

  const handleAssignExistingSchedule = async () => {
    if (!selectedExistingScheduleId) {
      toast.error('Please select a schedule')
      return
    }
    const found = existingSchedules.find(s => s.id === selectedExistingScheduleId)
    if (!found) return
    try {
      const fullRes = await schedulesApi.get(found.id)
      const s = fullRes.data
      const { hour: sh, minute: sm, ampm: sa } = timePartsFrom24(s.startTime)
      const { hour: eh, minute: em, ampm: ea } = timePartsFrom24(s.endTime)
      const formatted = {
        _scheduleId: s.id,
        name: s.name,
        description: s.description || '',
        startHour: sh,
        startMinute: sm,
        startAmPm: sa,
        endHour: eh,
        endMinute: em,
        endAmPm: ea,
        routeId: s.scheduleRoutes?.[0]?.routeId || '',
        route: s.scheduleRoutes?.[0]?.route || null,
      }
      const cleanList = schedulesList.filter(sch => sch.name.trim() || sch._scheduleId)
      setSchedulesList([...cleanList, formatted])
      setAssignScheduleModalOpen(false)
      toast.success(`Assigned schedule "${s.name}"`)
    } catch (err) {
      toast.error('Failed to load schedule details')
    }
  }

  const handleRemoveSchedule = (index) => {
    const validList = schedulesList.filter(s => s.name.trim() || s._scheduleId)
    const updated = validList.filter((_, i) => i !== index)
    setSchedulesList(updated.length === 0 ? [{
      _scheduleId: null,
      name: '',
      description: '',
      startHour: '',
      startMinute: '',
      startAmPm: 'AM',
      endHour: '',
      endMinute: '',
      endAmPm: 'AM',
      routeId: '',
      route: null,
    }] : updated)
    if (editingIndex === index) {
      setEditingIndex(null)
    } else if (editingIndex > index) {
      setEditingIndex(editingIndex - 1)
    }
    toast.success('Schedule removed')
  }

const validSchedules = schedulesList.filter(s => s.name.trim() || s._scheduleId)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-1">2. Bus Schedules</h3>
          <p className="text-xs text-slate-500">Currently assigned schedules for this bus screen.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleOpenAssignExistingModal}>
            <Calendar className="mr-1 h-3.5 w-3.5" />
            Assign Existing Schedule
          </Button>
          <Button size="sm" onClick={handleAddNewSchedule}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Create New Schedule
          </Button>
        </div>
      </div>

      {/* List of currently assigned schedules */}
      <div className="space-y-3 mb-6">
        {validSchedules.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
            <p className="text-xs text-slate-400">No schedules assigned to this bus screen yet.</p>
          </div>
        ) : (
          validSchedules.map((sch, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-all shadow-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">{sch.name || `Schedule #${idx + 1}`}</span>
                  {sch._scheduleId && <Badge variant="secondary" className="text-[10px] py-0.5 px-2">Assigned</Badge>}
                </div>
                {sch.description && <p className="text-xs text-slate-500">{sch.description}</p>}
                <div className="flex items-center gap-4 text-xs text-slate-400 pt-0.5 font-mono">
                  <span>
                    Time: {sch.startHour && sch.startMinute ? `${sch.startHour}:${sch.startMinute} ${sch.startAmPm}` : '--:--'} - {sch.endHour && sch.endMinute ? `${sch.endHour}:${sch.endMinute} ${sch.endAmPm}` : '--:--'}
                  </span>
                  <span>Route: {sch.route?.name || sch.routeId || 'None'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingIndex(idx)}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors flex items-center gap-1.5 text-xs font-medium border border-slate-200"
                >
                  <Edit2 size={14} className="text-brand" />
                  <span>Edit Schedule</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveSchedule(idx)}
                  className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Schedule Modal */}
      <Modal open={editingIndex !== null} onClose={() => setEditingIndex(null)} title={activeSchedule?.name ? `Edit "${activeSchedule.name}"` : 'Schedule Details'} width="max-w-xl">
        {activeSchedule && (
          <div className="space-y-4 pt-1">
            <Input
              label="Schedule Name *"
              placeholder="e.g. Morning Shift"
              value={activeSchedule.name}
              onChange={e => updateActiveSchedule({ name: e.target.value })}
            />

            <Input
              label="Description (optional)"
              placeholder="Brief description of the schedule"
              value={activeSchedule.description}
              onChange={e => updateActiveSchedule({ description: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-medium text-slate-600 mb-1.5">Start Time</p>
                <div className="flex items-center gap-1.5">
                  <select
                    value={activeSchedule.startHour}
                    onChange={e => updateActiveSchedule({ startHour: e.target.value })}
                    className={`${sel} ${arrow} w-[4.25rem] pr-6`}
                  >
                    <option value="">--</option>
                    {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <span className="text-slate-400 text-sm font-medium -mt-0.5">:</span>
                  <select
                    value={activeSchedule.startMinute}
                    onChange={e => updateActiveSchedule({ startMinute: e.target.value })}
                    className={`${sel} ${arrow} w-[4.25rem] pr-6`}
                  >
                    <option value="">--</option>
                    {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select
                    value={activeSchedule.startAmPm}
                    onChange={e => updateActiveSchedule({ startAmPm: e.target.value })}
                    className={`${sel} ${arrow} w-[4.5rem] pr-6`}
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 mb-1.5">End Time</p>
                <div className="flex items-center gap-1.5">
                  <select
                    value={activeSchedule.endHour}
                    onChange={e => updateActiveSchedule({ endHour: e.target.value })}
                    className={`${sel} ${arrow} w-[4.25rem] pr-6`}
                  >
                    <option value="">--</option>
                    {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <span className="text-slate-400 text-sm font-medium -mt-0.5">:</span>
                  <select
                    value={activeSchedule.endMinute}
                    onChange={e => updateActiveSchedule({ endMinute: e.target.value })}
                    className={`${sel} ${arrow} w-[4.25rem] pr-6`}
                  >
                    <option value="">--</option>
                    {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select
                    value={activeSchedule.endAmPm}
                    onChange={e => updateActiveSchedule({ endAmPm: e.target.value })}
                    className={`${sel} ${arrow} w-[4.5rem] pr-6`}
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-600">Route</p>
                <Select
                  value={activeSchedule.routeId || ''}
                  onChange={e => {
                    const route = allRoutes.find(r => r.id === e.target.value)
                    updateActiveSchedule({ routeId: e.target.value, route: route || null })
                  }}
                >
                  <option value="">No route selected</option>
                  {allRoutes.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
                  ))}
                </Select>
                <p className="text-[11px] text-slate-400">Select the route for this schedule</p>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <Button onClick={() => setEditingIndex(null)}>Done</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal to assign existing schedule */}
      <Modal open={assignScheduleModalOpen} onClose={() => setAssignScheduleModalOpen(false)} title="Assign Existing Schedule" width="max-w-md">
        <div className="space-y-4">
          <p className="text-xs text-slate-500">Select an existing schedule from system to attach to this bus screen.</p>
          {existingSchedules.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">No other unassigned schedules found.</p>
          ) : (
            <Select
              label="Select Schedule"
              value={selectedExistingScheduleId}
              onChange={e => setSelectedExistingScheduleId(e.target.value)}
            >
              <option value="">-- Choose a schedule --</option>
              {existingSchedules.map(s => (
                <option key={s.id} value={s.id}>{s.name} {s.description ? `(${s.description})` : ''}</option>
              ))}
            </Select>
          )}

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="outline" onClick={() => setAssignScheduleModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignExistingSchedule} disabled={!selectedExistingScheduleId}>Assign Schedule</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function PreviewStep({ form, groups = [], schedulesList = [], isEditMode = false }) {
  const selectedGroup = groups.find(g => String(g.id) === String(form.groupId))

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-900 mb-1">3. Preview & Complete</h3>
      <p className="text-xs text-slate-500 mb-5">Review all details before {isEditMode ? 'updating' : 'creating'} the bus screen.</p>

      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 mb-5 flex items-center justify-center">
        <div className="bg-brand/90 text-white px-6 py-3 rounded-lg border-2 border-white/20">
          <p className="text-lg font-bold tracking-wider">{form.regNumber || 'KL-XX-XXXX'}</p>
        </div>
      </div>

      <div className="space-y-2.5 mb-5">
        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Bus Details</p>
        {[
          ['Bus Group', selectedGroup?.name || '–'],
          ['Bus Type', form.busType || '–'],
          ['SIM Number', form.simNumber || '–'],
          ['Contact Person', form.contactName || '–'],
          ['Contact Number', form.contactNumber ? `+91 ${form.contactNumber}` : '–'],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between py-1.5 border-b border-slate-100">
            <span className="text-xs text-slate-500">{label}</span>
            <span className="text-xs font-medium text-slate-900">{value}</span>
          </div>
        ))}
      </div>

      {schedulesList.filter(s => s.name.trim()).length > 0 && (
        <div className="space-y-4">
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Schedules ({schedulesList.filter(s => s.name.trim()).length})</p>
          {schedulesList.filter(s => s.name.trim()).map((sch, idx) => (
            <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <span className="text-xs font-bold text-slate-800">{sch.name}</span>
                {sch._scheduleId && <Badge variant="secondary" className="text-[10px] py-0 px-1">Existing Schedule</Badge>}
              </div>
              {[
                ['Description', sch.description || '–'],
                ['Start Time', sch.startHour && sch.startMinute ? `${sch.startHour}:${sch.startMinute} ${sch.startAmPm}` : '–'],
                ['End Time', sch.endHour && sch.endMinute ? `${sch.endHour}:${sch.endMinute} ${sch.endAmPm}` : '–'],
                ['Route', sch.route?.name || sch.routeId || 'None'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-medium text-slate-900">{value}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AddBusScreenPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditMode = !!id

  const [step, setStep] = useState(0)
  const [reviewed, setReviewed] = useState(new Set())
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    regNumber: '',
    groupId: '',
    simNumber: '',
    busType: '',
    contactName: '',
    contactNumber: '',
    chassisNumber: '',
    model: '',
  })
  const [schedulesList, setSchedulesList] = useState([
    {
      _scheduleId: null,
      name: '',
      description: '',
      startHour: '',
      startMinute: '',
      startAmPm: 'AM',
      endHour: '',
      endMinute: '',
      endAmPm: 'AM',
      routeId: '',
      route: null,
    }
  ])
  const [originalScheduleIds, setOriginalScheduleIds] = useState(new Set())

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const [groupsRes] = await Promise.all([
          groupsApi.list()
        ])
        setGroups(groupsRes.data)

        if (isEditMode) {
          const busRes = await busesApi.get(id)
          const busData = busRes.data
          setForm({
            regNumber: busData.regNumber || '',
            groupId: busData.groupId ? String(busData.groupId) : '',
            simNumber: busData.simNumber ? busData.simNumber.replace(/^\+91\s*/, '') : '',
            busType: busData.busType || '',
            contactName: busData.contactName || '',
            contactNumber: busData.contactNumber ? busData.contactNumber.replace(/^\+91\s*/, '') : '',
            chassisNumber: busData.chassisNumber || '',
            model: busData.model || '',
          })

          const assignedSchedules = busData.schedules || []
          if (assignedSchedules.length > 0) {
            const loadedList = []
            const origIds = new Set()
            for (const schItem of assignedSchedules) {
              origIds.add(schItem.id)
              try {
                const scheduleRes = await schedulesApi.get(schItem.id)
                const s = scheduleRes.data
                const { hour: sh, minute: sm, ampm: sa } = timePartsFrom24(s.startTime)
                const { hour: eh, minute: em, ampm: ea } = timePartsFrom24(s.endTime)
                loadedList.push({
                  _scheduleId: s.id,
                  name: s.name,
                  description: s.description || '',
                  startHour: sh,
                  startMinute: sm,
                  startAmPm: sa,
                  endHour: eh,
                  endMinute: em,
                  endAmPm: ea,
                  routeId: s.scheduleRoutes?.[0]?.routeId || '',
                  route: s.scheduleRoutes?.[0]?.route || null,
                })
              } catch {
                // ignore failed schedule fetch
              }
            }
            setOriginalScheduleIds(origIds)
            if (loadedList.length > 0) {
              setSchedulesList(loadedList)
            }
          }
        }
      } catch (err) {
        toast.error(isEditMode ? 'Failed to load bus screen details' : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id, isEditMode])

  const isNextDisabled = () => {
    return loading || saving
  }

  const validateStep0 = () => {
    const missing = []
    if (!form.regNumber.trim()) missing.push('Registration Number')
    if (!form.groupId) missing.push('Bus Group')
    if (!form.simNumber.trim()) missing.push('SIM Number')
    if (!form.contactName.trim()) missing.push('Contact Person Name')
    if (form.contactNumber.length !== 10) missing.push('Contact Number (10 digits)')
    return missing
  }

  const handleSaveBusScreen = async () => {
    try {
      setSaving(true)
      const payload = {
        regNumber: form.regNumber.trim(),
        groupId: form.groupId,
        simNumber: form.simNumber ? `+91 ${form.simNumber}` : '',
        busType: form.busType,
        contactName: form.contactName.trim(),
        contactNumber: `+91 ${form.contactNumber}`,
        chassisNumber: form.chassisNumber.trim() || null,
        model: form.model || null,
      }

      let busId = id
      if (isEditMode) {
        await busesApi.update(id, payload)
      } else {
        const busRes = await busesApi.create(payload)
        busId = busRes.data.id
      }

      // Process schedules
      const currentScheduleIds = new Set(schedulesList.map(s => s._scheduleId).filter(Boolean))

      // Unassign schedules that were removed in UI
      if (isEditMode) {
        for (const origId of originalScheduleIds) {
          if (!currentScheduleIds.has(origId)) {
            try {
              await schedulesApi.unassignBus(origId, busId)
            } catch {
              // ignore unassign errors
            }
          }
        }
      }

      // Save/Update each schedule in schedulesList
      for (const sch of schedulesList) {
        if (!sch.name.trim()) continue

        let targetScheduleId = sch._scheduleId

        if (targetScheduleId) {
          // Update existing schedule
          await schedulesApi.update(targetScheduleId, {
            name: sch.name.trim(),
            description: sch.description.trim() || undefined,
            startTime: to24h(sch.startHour, sch.startMinute, sch.startAmPm) || undefined,
            endTime: to24h(sch.endHour, sch.endMinute, sch.endAmPm) || undefined,
          })
          // Replace route on existing schedule (single route)
          if (sch.routeId) {
            await schedulesApi.addRoute(targetScheduleId, { routeId: sch.routeId, replace: true })
          } else {
            const existingRes = await schedulesApi.get(targetScheduleId)
            for (const sr of existingRes.data.scheduleRoutes || []) {
              await schedulesApi.removeRoute(targetScheduleId, sr.routeId)
            }
          }
          // Ensure bus is assigned to this schedule
          try {
            await schedulesApi.assignBus(targetScheduleId, { busId })
          } catch {
            // Already assigned or ignore error
          }
        } else {
          // Create new schedule and assign
          const scheduleRes = await schedulesApi.create({
            name: sch.name.trim(),
            description: sch.description.trim() || undefined,
            startTime: to24h(sch.startHour, sch.startMinute, sch.startAmPm) || undefined,
            endTime: to24h(sch.endHour, sch.endMinute, sch.endAmPm) || undefined,
          })
          targetScheduleId = scheduleRes.data.id

          if (sch.routeId) {
            await schedulesApi.addRoute(targetScheduleId, { routeId: sch.routeId })
          }
          await schedulesApi.assignBus(targetScheduleId, { busId })
        }
      }

      toast.success(isEditMode ? 'Bus screen updated successfully' : 'Bus screen added successfully')
      navigate(form.groupId ? `/fleet/group/${form.groupId}/screens` : '/fleet')
    } catch (err) {
      console.error('Failed to save bus screen:', err)
      const errorMsg = err.response?.data?.message || (isEditMode ? 'Failed to update bus screen' : 'Failed to add bus screen')
      toast.error(errorMsg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AppLayout title={isEditMode ? 'Edit Bus Screen' : 'Add New Bus Screen'} subtitle={isEditMode ? 'Fleet > Edit Bus Screen' : 'Fleet > Add New Bus Screen'} showBack onBack={() => navigate(-1)}>
        <div className="flex justify-center items-center py-24">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout
      title={isEditMode ? 'Edit Bus Screen' : 'Add New Bus Screen'}
      subtitle={isEditMode ? 'Fleet > Edit Bus Screen' : 'Fleet > Add New Bus Screen'}
      showBack
      onBack={() => navigate(form.groupId ? `/fleet/group/${form.groupId}/screens` : '/fleet')}
    >
      <div className="p-6 max-w-screen-xl">
        <Stepper steps={STEPS} current={step} />

        <div className={clsx('rounded-xl shadow-card border p-6 transition-colors', step === 0 && reviewed.has(0) ? 'bg-green-50/40 border-green-200' : 'bg-white border-slate-100')}>
          {step === 0 && reviewed.has(0) && <div className="flex items-center gap-1.5 mb-4 text-green-600"><Check size={14} /><span className="text-xs font-semibold">Reviewed</span></div>}
          {step === 0 && <BusDetailsStep form={form} setForm={setForm} groups={groups} reviewed={reviewed.has(0)} />}
          {step === 1 && <BusScheduleStep schedulesList={schedulesList} setSchedulesList={setSchedulesList} reviewed={reviewed.has(1)} />}
          {step === 2 && <PreviewStep form={form} groups={groups} schedulesList={schedulesList} isEditMode={isEditMode} />}
        </div>

        <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-200">
          {step > 0 ? (
            <Button
              variant="secondary"
              label="Back"
              onClick={() => setStep(step - 1)}
              disabled={saving}
            />
          ) : (
            <Button
              variant="secondary"
              label="Cancel"
              onClick={() => navigate(form.groupId ? `/fleet/group/${form.groupId}/screens` : '/fleet')}
              disabled={saving}
            />
          )}
          <div className="flex items-center gap-3">
            <Button variant="secondary" label="Save as Draft" disabled={saving} />
            <Button
              label={
                step < STEPS.length - 1
                  ? step === 0 ? 'Next: Bus Schedule' : 'Next: Preview'
                  : (isEditMode ? 'Save Changes' : 'Create Bus Screen')
              }
              endIcon={step < STEPS.length - 1 ? ArrowRight : Check}
              loading={saving}
              disabled={isNextDisabled()}
              onClick={() => {
                if (step < STEPS.length - 1) {
                  if (step === 0) {
                    const missing = validateStep0()
                    if (missing.length > 0) {
                      toast.error(`Please fill in: ${missing.join(', ')}`)
                      return
                    }
                  }
                  setReviewed(prev => new Set([...prev, step]))
                  setStep(step + 1)
                } else {
                  const missing = validateStep0()
                  if (missing.length > 0) {
                    toast.error(`Please fill in: ${missing.join(', ')}`)
                    return
                  }
                  handleSaveBusScreen()
                }
              }}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}