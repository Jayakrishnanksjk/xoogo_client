import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import { Stepper, Input, Select, Textarea, Button, Badge, SearchInput } from '@/components/ui'
import { ArrowLeft, ArrowRight, Info, CheckCircle, User, Mail, Phone } from 'lucide-react'

const STEPS = ['Group Details', 'Assign Owner', 'Review & Complete']

const MOCK_USERS = [
  { id: 1, name: 'Akhil Pavithran', role: 'Super Admin', email: 'akhil.pavithran@xoogo.com', phone: '+91 98765 43210' },
  { id: 2, name: 'James George', role: 'Partner', email: 'james.george@avemaria.com', phone: '+91 90123 45678' },
  { id: 3, name: 'Priya Nair', role: 'Partner', email: 'priya.nair@galaxytravels.com', phone: '+91 87654 32109' },
  { id: 4, name: 'Rajan Kumar', role: 'Partner', email: 'rajan@starlinetravels.com', phone: '+91 76543 21098' },
]

function GroupDetailsStep({ form, setForm }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-900 mb-1">1. Group Details</h3>
      <p className="text-xs text-slate-500 mb-5">Enter the basic information about the group.</p>

      <div className="space-y-4">
        <div>
          <Input
            label="Group Name *"
            placeholder="Enter group name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />
          <p className="text-[11px] text-slate-400 mt-1">This will be the name of the group</p>
        </div>

        <div>
          <Input
            label="Group Code (Optional)"
            placeholder="Enter group code"
            value={form.code}
            onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
          />
          <p className="text-[11px] text-slate-400 mt-1">Unique code to identify the group</p>
        </div>

        <div>
          <Textarea
            label="Description (Optional)"
            placeholder="Enter description"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={3}
          />
          <p className="text-[11px] text-slate-400 mt-1">Add a short description about this group</p>
        </div>

        <div>
          <Select
            label="Status *"
            value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
          >
            <option value="active">● Active</option>
            <option value="inactive">● Inactive</option>
          </Select>
          <p className="text-[11px] text-slate-400 mt-1">Select the status of this group</p>
        </div>

        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
          <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">You can add buses to this group after it is created.</p>
        </div>
      </div>
    </div>
  )
}

function AssignOwnerStep({ form, setForm }) {
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  const filtered = MOCK_USERS.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const selectedUser = MOCK_USERS.find(u => u.id === form.ownerId)

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-900 mb-1">2. Assign Owner</h3>
      <p className="text-xs text-slate-500 mb-5">Select a user who will be the owner of this group.</p>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Group Owner (User) *</label>
          <div className="relative">
            <SearchInput
              placeholder="Search and select user"
              value={search}
              onChange={e => { setSearch(e.target.value); setShowDropdown(true) }}
              onFocus={() => setShowDropdown(true)}
            />
            {showDropdown && search.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                {filtered.map(user => (
                  <button
                    key={user.id}
                    onClick={() => {
                      setForm(f => ({ ...f, ownerId: user.id }))
                      setSearch(user.name)
                      setShowDropdown(false)
                    }}
                    className="w-full text-left px-3 py-2.5 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center text-[10px] font-semibold text-white shrink-0">
                      {user.name.charAt(0)}
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
          </div>
          <p className="text-[11px] text-slate-400 mt-1">The owner will manage this group and its buses</p>
        </div>

        {/* Selected user card */}
        {selectedUser && (
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-sm font-semibold text-white shrink-0">
                {selectedUser.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{selectedUser.name}</p>
                <p className="text-xs text-brand">{selectedUser.role}</p>
              </div>
            </div>
            <div className="mt-3 space-y-1.5 pl-[52px]">
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Mail size={11} className="text-slate-400" />
                {selectedUser.email}
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Phone size={11} className="text-slate-400" />
                {selectedUser.phone}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
          <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">The selected user will be notified once this group is created.</p>
        </div>
      </div>
    </div>
  )
}

function ReviewStep({ form }) {
  const selectedUser = MOCK_USERS.find(u => u.id === form.ownerId)

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-900 mb-1">3. Review & Complete</h3>
      <p className="text-xs text-slate-500 mb-5">Review all details before creating the group.</p>

      <div className="space-y-3">
        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <span className="text-xs text-slate-500">Group Name</span>
          <span className="text-xs font-medium text-slate-900">{form.name || '–'}</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <span className="text-xs text-slate-500">Group Code</span>
          <span className="text-xs font-medium text-slate-900">{form.code || '–'}</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <span className="text-xs text-slate-500">Description</span>
          <span className="text-xs font-medium text-slate-900 max-w-[200px] text-right">{form.description || '–'}</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <span className="text-xs text-slate-500">Status</span>
          <Badge status={form.status} />
        </div>

        {/* Group Owner */}
        {selectedUser && (
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-xs text-slate-500">Group Owner</span>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-brand flex items-center justify-center text-[10px] font-semibold text-white">
                {selectedUser.name.charAt(0)}
              </div>
              <span className="text-xs font-medium text-slate-900">{selectedUser.name}</span>
            </div>
          </div>
        )}

        <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg mt-4">
          <CheckCircle size={14} className="text-green-500 shrink-0 mt-0.5" />
          <p className="text-xs text-green-700">Once created, you can add bus screens and manage settings for this group.</p>
        </div>
      </div>
    </div>
  )
}

export default function AddGroupPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    status: 'active',
    ownerId: null,
  })

  return (
    <AppLayout title="Add New Group" subtitle="Fleet > Add New Group" showBack onBack={() => navigate('/fleet')}>
      <div className="p-6 max-w-screen-xl">
        {/* Stepper */}
        <Stepper steps={STEPS} current={step} />

        {/* 3-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-card border border-slate-100 p-6">
            <GroupDetailsStep form={form} setForm={setForm} />
          </div>
          <div className="bg-white rounded-xl shadow-card border border-slate-100 p-6">
            <AssignOwnerStep form={form} setForm={setForm} />
          </div>
          <div className="bg-white rounded-xl shadow-card border border-slate-100 p-6">
            <ReviewStep form={form} />
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
