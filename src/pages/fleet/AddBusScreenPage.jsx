import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import { Stepper, Input, Select, Checkbox, Button, Badge } from '@/components/ui'
import { ArrowLeft, ArrowRight, Info, CheckCircle, GripVertical, Bus } from 'lucide-react'

const STEPS = ['Bus Details', 'Route & Stops', 'Preview & Complete']

const MOCK_GROUPS = [
  { id: 1, name: 'Ave Maria' },
  { id: 2, name: 'Madhavi Travels' },
  { id: 3, name: 'Galaxy Travels' },
  { id: 4, name: 'Starline Travels' },
]

const MOCK_ROUTES = [
  { id: 1, name: 'Kannur → Kasaragod', stops: ['Kannur (Start)', 'Taliparamba', 'Payyanur', 'Kanhangad', 'Nileshwaram', 'Kasaragod (End)'] },
  { id: 2, name: 'Kozhikode → Payyanur', stops: ['Kozhikode (Start)', 'Vadakara', 'Thalassery', 'Kannur', 'Taliparamba', 'Payyanur (End)'] },
  { id: 3, name: 'Ernakulam → Kottayam', stops: ['Ernakulam (Start)', 'Tripunithura', 'Muvattupuzha', 'Thodupuzha', 'Pala', 'Kottayam (End)'] },
]

const BUS_TYPES = ['Limited Stop', 'Express', 'Super Express', 'Ordinary', 'Fast Passenger']

const STOP_COLORS = [
  'bg-brand', 'bg-purple-500', 'bg-amber-500', 'bg-green-500', 'bg-red-500', 'bg-pink-500', 'bg-teal-500', 'bg-orange-500'
]

function BusDetailsStep({ form, setForm }) {
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
            />
            <p className="text-[11px] text-slate-400 mt-1">Enter bus registration number</p>
          </div>
          <div>
            <Select
              label="Bus Group *"
              value={form.groupId}
              onChange={e => setForm(f => ({ ...f, groupId: e.target.value }))}
            >
              <option value="">Select group</option>
              {MOCK_GROUPS.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </Select>
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
            />
            <p className="text-[11px] text-slate-400 mt-1">Enter SIM number used for tracking</p>
          </div>
          <div>
            <Select
              label="Bus Type *"
              value={form.busType}
              onChange={e => setForm(f => ({ ...f, busType: e.target.value }))}
            >
              <option value="">Select the type of service</option>
              {BUS_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
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
            />
            <p className="text-[11px] text-slate-400 mt-1">Person responsible for this bus</p>
          </div>
          <div>
            <Input
              label="Contact Number *"
              placeholder="+91 98765 43210"
              value={form.contactNumber}
              onChange={e => setForm(f => ({ ...f, contactNumber: e.target.value }))}
            />
            <p className="text-[11px] text-slate-400 mt-1">Primary contact number</p>
          </div>
        </div>

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
              />
              <p className="text-[11px] text-slate-400 mt-1">Enter bus chassis number</p>
            </div>
            <div>
              <Select
                label="Model / Make"
                value={form.model}
                onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
              >
                <option value="">Select bus make or model</option>
                <option value="BharatBenz 12M">BharatBenz 12M</option>
                <option value="Ashok Leyland Viking">Ashok Leyland Viking</option>
                <option value="Tata Starbus">Tata Starbus</option>
                <option value="Volvo 9600">Volvo 9600</option>
              </Select>
              <p className="text-[11px] text-slate-400 mt-1">Select bus make or model</p>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
          <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            The selected group owner (<strong>{MOCK_GROUPS.find(g => String(g.id) === String(form.groupId))?.name || '...'}</strong>) will be notified once this bus screen is added.
          </p>
        </div>
      </div>
    </div>
  )
}

function RouteStopsStep({ form, setForm }) {
  const selectedRoute = MOCK_ROUTES.find(r => String(r.id) === String(form.routeId))

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-900 mb-1">2. Route & Stops</h3>
      <p className="text-xs text-slate-500 mb-5">Select the route for this bus and choose the stops.</p>

      <div className="space-y-4">
        <div>
          <Select
            label="Route *"
            value={form.routeId}
            onChange={e => {
              const route = MOCK_ROUTES.find(r => String(r.id) === e.target.value)
              setForm(f => ({
                ...f,
                routeId: e.target.value,
                selectedStops: route ? route.stops.map((_, i) => i) : [],
              }))
            }}
          >
            <option value="">Select route</option>
            {MOCK_ROUTES.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </Select>
          <p className="text-[11px] text-slate-400 mt-1">Select the route this bus will operate on</p>
        </div>

        {selectedRoute && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Select Stops *</label>
            <p className="text-[11px] text-slate-400 mb-3">Choose the stops where this bus will display content</p>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              {selectedRoute.stops.map((stop, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 px-3 py-2.5 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors"
                >
                  <GripVertical size={14} className="text-slate-300 cursor-grab shrink-0" />
                  <Checkbox
                    checked={form.selectedStops?.includes(idx)}
                    onChange={() => {
                      setForm(f => ({
                        ...f,
                        selectedStops: f.selectedStops?.includes(idx)
                          ? f.selectedStops.filter(i => i !== idx)
                          : [...(f.selectedStops || []), idx],
                      }))
                    }}
                  />
                  <span className="text-xs font-medium text-slate-500 w-5">{idx + 1}</span>
                  <span className="text-sm text-slate-800">{stop}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-brand font-medium">{form.selectedStops?.length || 0} stops selected</p>
              <button className="text-xs text-slate-500 hover:text-brand flex items-center gap-1">
                ✎ Edit Order
              </button>
            </div>
          </div>
        )}

        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
          <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">You can reorder stops by drag and drop.</p>
        </div>
      </div>
    </div>
  )
}

function PreviewStep({ form }) {
  const selectedGroup = MOCK_GROUPS.find(g => String(g.id) === String(form.groupId))
  const selectedRoute = MOCK_ROUTES.find(r => String(r.id) === String(form.routeId))

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-900 mb-1">3. Preview & Complete</h3>
      <p className="text-xs text-slate-500 mb-5">Review all details before creating the bus screen.</p>

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
          ['Contact Number', form.contactNumber || '–'],
          ['Route', selectedRoute?.name || '–'],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between py-1.5 border-b border-slate-100">
            <span className="text-xs text-slate-500">{label}</span>
            <span className="text-xs font-medium text-slate-900">{value}</span>
          </div>
        ))}
      </div>

      {/* Stops list */}
      {selectedRoute && form.selectedStops?.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-slate-500 mb-2">Stops ({form.selectedStops.length})</p>
          <div className="space-y-1.5">
            {form.selectedStops.sort((a, b) => a - b).map((stopIdx, i) => (
              <div key={stopIdx} className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${STOP_COLORS[i % STOP_COLORS.length]} shrink-0`} />
                <span className="text-xs text-slate-700">{selectedRoute.stops[stopIdx]}</span>
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
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    regNumber: '',
    groupId: '',
    simNumber: '',
    busType: '',
    contactName: '',
    contactNumber: '',
    chassisNumber: '',
    model: '',
    routeId: '',
    selectedStops: [],
  })

  return (
    <AppLayout title="Add New Bus Screen" subtitle="Fleet > Add New Bus Screen" showBack onBack={() => navigate('/fleet')}>
      <div className="p-6 max-w-screen-xl">
        {/* Stepper */}
        <Stepper steps={STEPS} current={step} />

        {/* 3-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-card border border-slate-100 p-6">
            <BusDetailsStep form={form} setForm={setForm} />
          </div>
          <div className="bg-white rounded-xl shadow-card border border-slate-100 p-6">
            <RouteStopsStep form={form} setForm={setForm} />
          </div>
          <div className="bg-white rounded-xl shadow-card border border-slate-100 p-6">
            <PreviewStep form={form} />
          </div>
        </div>

        {/* Bottom action bar */}
        <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-200">
          <Button
            variant="secondary"
            label="Cancel"
            onClick={() => navigate('/fleet')}
          />
          <div className="flex items-center gap-3">
            <Button variant="secondary" label="Save as Draft" />
            <Button
              label="Review & Complete"
              endIcon={ArrowRight}
              onClick={() => {
                if (step < STEPS.length - 1) setStep(step + 1)
              }}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
