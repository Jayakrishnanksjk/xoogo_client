import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import { Stepper, Input, Select, Button, Badge } from '@/components/ui'
import clsx from 'clsx'
import { ArrowLeft, ArrowRight, Info, CheckCircle, Bus, Calendar, Check, User } from 'lucide-react'
import { groupsApi, busesApi, schedulesApi } from '@/api'
import { toast } from 'sonner'

const STEPS = ['Bus Details', 'Schedule', 'Preview & Complete']

const BUS_TYPES = ['Limited stop', 'Local', 'City']

const BUS_TYPE_COLORS = {
  'Limited stop': 'bg-rose-400',
  'Local': 'bg-sky-400',
  'City': 'bg-green-500',
}

const STOP_COLORS = [
  'bg-brand', 'bg-purple-500', 'bg-amber-500', 'bg-green-500', 'bg-red-500', 'bg-pink-500', 'bg-teal-500', 'bg-orange-500'
]

function BusDetailsStep({ form, setForm, groups = [], reviewed }) {
  const tick = reviewed ? <Check size={14} className="text-green-500" /> : undefined
  const selectedGroup = groups.find(g => String(g.id) === String(form.groupId))
  const groupOwner = selectedGroup?.owner
  const [useOwner, setUseOwner] = useState(false)

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

  // Reset when group changes
  useEffect(() => {
    setUseOwner(false)
    setForm(f => ({ ...f, contactName: '', contactNumber: '' }))
  }, [form.groupId])

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
              placeholder="987654321012"
              value={form.simNumber}
              onChange={e => setForm(f => ({ ...f, simNumber: e.target.value }))}
              suffix={tick}
            />
            <p className="text-[11px] text-slate-400 mt-1">Enter SIM number used for tracking</p>
          </div>
          <div className="relative">
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

        {/* Additional Information */}
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

function ScheduleStep({ form, setForm, schedules = [], reviewed }) {
  const selectedSchedule = schedules.find(s => String(s.id) === String(form.scheduleId))
  const scheduleRoutes = selectedSchedule?.scheduleRoutes
    ? [...selectedSchedule.scheduleRoutes].sort((a, b) => a.sequenceOrder - b.sequenceOrder)
    : []
  const [scheduleSearch, setScheduleSearch] = useState('')
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const scheduleRef = useRef(null)

  const filteredSchedules = schedules.filter(s =>
    s.name.toLowerCase().includes(scheduleSearch.toLowerCase())
  )

  useEffect(() => {
    function handleClickOutside(e) {
      if (scheduleRef.current && !scheduleRef.current.contains(e.target)) {
        setScheduleOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!scheduleOpen) {
      setScheduleSearch('')
    }
  }, [scheduleOpen])

  const selectSchedule = (id) => {
    setForm(f => ({ ...f, scheduleId: id }))
    setScheduleOpen(false)
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-900 mb-1">2. Schedule</h3>
      <p className="text-xs text-slate-500 mb-5">Select the schedule for this bus.</p>

      <div className="space-y-4">
        <div ref={scheduleRef} className="relative">
          {reviewed && <span className="absolute right-2 top-[34px] text-green-500 z-10"><Check size={14} /></span>}
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Schedule *
          </label>
          <input
            type="text"
            placeholder={selectedSchedule ? `${selectedSchedule.name} (${selectedSchedule.scheduleRoutes?.length || 0} routes)` : 'Type to search schedules...'}
            value={scheduleOpen ? scheduleSearch : (selectedSchedule ? '' : '')}
            onChange={e => { setScheduleSearch(e.target.value); setScheduleOpen(true) }}
            onFocus={() => { setScheduleOpen(true); setScheduleSearch('') }}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all duration-150 placeholder:text-slate-400"
          />
          {scheduleOpen && (
            <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredSchedules.length === 0 ? (
                <div className="px-3 py-2 text-xs text-slate-400">No schedules found</div>
              ) : (
                filteredSchedules.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => selectSchedule(s.id)}
                    className={clsx(
                      'w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors flex items-center gap-2',
                      String(s.id) === String(form.scheduleId) && 'bg-brand/5 text-brand font-medium'
                    )}
                  >
                    <span className="flex-1 truncate">{s.name}</span>
                    <span className="text-xs text-slate-400 shrink-0">{s.scheduleRoutes?.length || 0} routes</span>
                    {String(s.id) === String(form.scheduleId) && <Check size={14} className="text-brand shrink-0" />}
                  </button>
                ))
              )}
            </div>
          )}
          <p className="text-[11px] text-slate-400 mt-1">Select the schedule for this bus</p>
        </div>

        {selectedSchedule && scheduleRoutes.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Routes in this Schedule</label>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              {scheduleRoutes.map((sr, idx) => (
                <div
                  key={sr.id || idx}
                  className="flex items-center gap-3 px-3 py-2.5 border-b border-slate-100 last:border-b-0 bg-slate-50"
                >
                  <span className="w-5 h-5 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {sr.sequenceOrder}
                  </span>
                  <div>
                    <span className="text-sm text-slate-800 font-medium">{sr.route?.name || 'Unknown'}</span>
                    <span className="text-xs text-slate-400 ml-2 font-mono">{sr.route?.code || ''}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedSchedule && scheduleRoutes.length === 0 && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
            <Info size={14} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">This schedule has no routes assigned to it yet.</p>
          </div>
        )}

        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
          <Calendar size={14} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            A schedule defines the routes this bus will operate. Each schedule can only be assigned to one bus.
          </p>
        </div>
      </div>
    </div>
  )
}

function PreviewStep({ form, groups = [], schedules = [], isEditMode = false, reviewed }) {
  const selectedGroup = groups.find(g => String(g.id) === String(form.groupId))
  const selectedSchedule = schedules.find(s => String(s.id) === String(form.scheduleId))
  const scheduleRoutes = selectedSchedule?.scheduleRoutes
    ? [...selectedSchedule.scheduleRoutes].sort((a, b) => a.sequenceOrder - b.sequenceOrder)
    : []

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-900 mb-1">3. Preview & Complete</h3>
      <p className="text-xs text-slate-500 mb-5">Review all details before {isEditMode ? 'updating' : 'creating'} the bus screen.</p>

      {/* Bus plate preview */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 mb-5 flex items-center justify-center">
        <div className="bg-brand/90 text-white px-6 py-3 rounded-lg border-2 border-white/20">
          <p className="text-lg font-bold tracking-wider">{form.regNumber || 'KL-XX-XXXX'}</p>
        </div>
      </div>

      {/* Details table */}
      <div className="space-y-2.5">
        {[
          ['Bus Group', selectedGroup?.name || '–'],
          ['Bus Type', form.busType || '–'],
          ['SIM Number', form.simNumber || '–'],
          ['Contact Person', form.contactName || '–'],
          ['Contact Number', form.contactNumber ? `+91 ${form.contactNumber}` : '–'],
          ['Schedule', selectedSchedule?.name || '–'],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between py-1.5 border-b border-slate-100">
            <span className="text-xs text-slate-500">{label}</span>
            <span className="text-xs font-medium text-slate-900">{value}</span>
          </div>
        ))}
      </div>

      {/* Routes list from schedule */}
      {scheduleRoutes.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-slate-500 mb-2">Routes ({scheduleRoutes.length})</p>
          <div className="space-y-1.5">
            {scheduleRoutes.map((sr) => (
              <div key={sr.id} className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${STOP_COLORS[sr.sequenceOrder % STOP_COLORS.length]} shrink-0`} />
                <span className="text-xs text-slate-700">{sr.route?.name} <span className="text-slate-400 font-mono">({sr.route?.code})</span></span>
              </div>
            ))}
          </div>
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
  const [schedules, setSchedules] = useState([])
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
    scheduleId: '',
  })

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const [groupsRes, schedulesRes] = await Promise.all([
          groupsApi.list(),
          schedulesApi.list()
        ])
        setGroups(groupsRes.data)
        setSchedules(schedulesRes.data)

        if (isEditMode) {
          const busRes = await busesApi.get(id)
          const busData = busRes.data
          setForm({
            regNumber: busData.regNumber || '',
            groupId: busData.groupId ? String(busData.groupId) : '',
            simNumber: busData.simNumber || '',
            busType: busData.busType || '',
            contactName: busData.contactName || '',
            contactNumber: busData.contactNumber ? busData.contactNumber.replace(/^\+91\s*/, '') : '',
            chassisNumber: busData.chassisNumber || '',
            model: busData.model || '',
            scheduleId: busData.scheduleId ? String(busData.scheduleId) : '',
          })
        }
      } catch (err) {
        console.error('Failed to load data:', err)
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

  const validateStep1 = () => {
    const missing = []
    if (!form.scheduleId) missing.push('Schedule')
    return missing
  }

  const handleSaveBusScreen = async () => {
    try {
      setSaving(true)
      const payload = {
        regNumber: form.regNumber.trim(),
        groupId: form.groupId,
        simNumber: form.simNumber.trim(),
        busType: form.busType,
        contactName: form.contactName.trim(),
        contactNumber: `+91 ${form.contactNumber}`,
        chassisNumber: form.chassisNumber.trim() || null,
        model: form.model || null,
        scheduleId: form.scheduleId || null,
      }

      if (isEditMode) {
        await busesApi.update(id, payload)
        toast.success('Bus screen updated successfully')
      } else {
        await busesApi.create(payload)
        toast.success('Bus screen added successfully')
      }
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
      <AppLayout title={isEditMode ? "Edit Bus Screen" : "Add New Bus Screen"} subtitle={isEditMode ? "Fleet > Edit Bus Screen" : "Fleet > Add New Bus Screen"} showBack onBack={() => navigate(-1)}>
        <div className="flex justify-center items-center py-24">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout
      title={isEditMode ? "Edit Bus Screen" : "Add New Bus Screen"}
      subtitle={isEditMode ? "Fleet > Edit Bus Screen" : "Fleet > Add New Bus Screen"}
      showBack
      onBack={() => navigate(form.groupId ? `/fleet/group/${form.groupId}/screens` : '/fleet')}
    >
      <div className="p-6 max-w-screen-xl">
        {/* Stepper */}
        <Stepper steps={STEPS} current={step} />

        {/* 3-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={clsx('rounded-xl shadow-card border p-6 transition-colors', reviewed.has(0) ? 'bg-green-50/40 border-green-200' : 'bg-white border-slate-100')}>
            {reviewed.has(0) && <div className="flex items-center gap-1.5 mb-4 text-green-600"><Check size={14} /><span className="text-xs font-semibold">Reviewed</span></div>}
            <BusDetailsStep form={form} setForm={setForm} groups={groups} reviewed={reviewed.has(0)} />
          </div>
          <div className={clsx('rounded-xl shadow-card border p-6 transition-colors', reviewed.has(1) ? 'bg-green-50/40 border-green-200' : 'bg-white border-slate-100')}>
            {reviewed.has(1) && <div className="flex items-center gap-1.5 mb-4 text-green-600"><Check size={14} /><span className="text-xs font-semibold">Reviewed</span></div>}
            <ScheduleStep form={form} setForm={setForm} schedules={schedules} reviewed={reviewed.has(1)} />
          </div>
          <div className={clsx('rounded-xl shadow-card border p-6 transition-colors', reviewed.has(2) ? 'bg-green-50/40 border-green-200' : 'bg-white border-slate-100')}>
            {reviewed.has(2) && <div className="flex items-center gap-1.5 mb-4 text-green-600"><Check size={14} /><span className="text-xs font-semibold">Reviewed</span></div>}
            <PreviewStep form={form} groups={groups} schedules={schedules} isEditMode={isEditMode} reviewed={reviewed.has(2)} />
          </div>
        </div>

        {/* Bottom action bar */}
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
              label={step < STEPS.length - 1 ? 'Review & Complete' : (isEditMode ? 'Save Changes' : 'Create Bus Screen')}
              endIcon={step < STEPS.length - 1 ? ArrowRight : Check}
              loading={saving}
              disabled={isNextDisabled()}
              onClick={() => {
                if (step < STEPS.length - 1) {
                  const missing = step === 0 ? validateStep0() : validateStep1()
                  if (missing.length > 0) {
                    toast.error(`Please fill in: ${missing.join(', ')}`)
                    return
                  }
                  setReviewed(prev => new Set([...prev, step]))
                  setStep(step + 1)
                } else {
                  const missing = [...validateStep0(), ...validateStep1()]
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
