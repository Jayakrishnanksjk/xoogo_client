import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import { Stepper, Input, Select, Textarea, Button, Badge, SearchInput } from '@/components/ui'
import { ArrowLeft, ArrowRight, Info, CheckCircle, User, Mail, Phone, Check } from 'lucide-react'
import clsx from 'clsx'
import { usersApi, groupsApi } from '@/api'
import { toast } from 'sonner'

const STEPS = ['Group Details', 'Assign Owner', 'Review & Complete']

function GroupDetailsStep({ form, setForm, reviewed }) {
  const tick = reviewed ? <Check size={14} className="text-green-500" /> : undefined
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
            suffix={tick}
          />
          <p className="text-[11px] text-slate-400 mt-1">This will be the name of the group</p>
        </div>

        <div>
          <Input
            label="Group Code (Optional)"
            placeholder="Enter group code"
            value={form.code}
            onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
            suffix={tick}
          />
          <p className="text-[11px] text-slate-400 mt-1">Unique code to identify the group</p>
        </div>

        <div>
          <div className="relative">
            <Textarea
              label="Description (Optional)"
              placeholder="Enter description"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
            />
            {reviewed && <span className="absolute right-2 top-[34px] text-green-500"><Check size={14} /></span>}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Add a short description about this group</p>
        </div>

        <div>
          <div className="relative">
            <Select
              label="Status *"
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            >
              <option value="active">● Active</option>
              <option value="inactive">● Inactive</option>
            </Select>
            {reviewed && <span className="absolute right-2 top-[34px] text-green-500"><Check size={14} /></span>}
          </div>
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

function AssignOwnerStep({ form, setForm, users = [], reviewed }) {
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  // Pre-populate search input if selected user is found
  useEffect(() => {
    const selectedUser = users.find(u => u.id === form.ownerId)
    if (selectedUser && !search) {
      setSearch(selectedUser.name)
    }
  }, [form.ownerId, users, search])

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const selectedUser = users.find(u => u.id === form.ownerId)

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
            {reviewed && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none"><Check size={14} /></span>}
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                {filtered.map(user => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      setForm(f => ({ ...f, ownerId: user.id }))
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
          </div>
          <p className="text-[11px] text-slate-400 mt-1">The owner will manage this group and its buses</p>
        </div>

        {/* Selected user card */}
        {selectedUser && (
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-sm font-semibold text-white shrink-0">
                {selectedUser.name?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{selectedUser.name}</p>
                <p className="text-xs text-brand capitalize">{selectedUser.role}</p>
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

function ReviewStep({ form, users = [], reviewed }) {
  const selectedUser = users.find(u => u.id === form.ownerId)

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
                {selectedUser.name?.charAt(0) || 'U'}
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
  const [reviewed, setReviewed] = useState(new Set())
  const [users, setUsers] = useState([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    status: 'active',
    ownerId: null,
  })

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await usersApi.list()
        const mappedUsers = res.data.map(u => ({
          id: u.id,
          name: u.name || u.full_name || 'Unknown User',
          role: u.role,
          email: u.email || '',
          phone: u.phone || '—'
        }))
        setUsers(mappedUsers)
      } catch (err) {
        console.error('Failed to load users:', err)
        toast.error('Failed to load owners')
      }
    }
    loadUsers()
  }, [])

  const isNextDisabled = () => {
    if (step === 0 && !form.name.trim()) return true
    if (step === 1 && !form.ownerId) return true
    if (step === 2 && (!form.name.trim() || !form.ownerId)) return true
    return saving
  }

  const handleCreateGroup = async () => {
    if (!form.name.trim()) {
      toast.error('Group name is required')
      return
    }
    if (!form.ownerId) {
      toast.error('Please assign a group owner')
      return
    }

    try {
      setSaving(true)
      await groupsApi.create({
        name: form.name.trim(),
        code: form.code.trim() || null,
        description: form.description.trim() || null,
        status: form.status,
        ownerId: form.ownerId
      })
      toast.success('Group created successfully')
      navigate('/fleet')
    } catch (err) {
      console.error('Failed to create group:', err)
      const errorMsg = err.response?.data?.message || 'Failed to create group'
      toast.error(errorMsg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout title="Add New Group" subtitle="Fleet > Add New Group" showBack onBack={() => navigate('/fleet')}>
      <div className="p-6 max-w-screen-xl">
        {/* Stepper */}
        <Stepper steps={STEPS} current={step} />

        {/* 3-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={clsx('rounded-xl shadow-card border p-6 transition-colors', reviewed.has(0) ? 'bg-green-50/40 border-green-200' : 'bg-white border-slate-100')}>
            {reviewed.has(0) && <div className="flex items-center gap-1.5 mb-4 text-green-600"><Check size={14} /><span className="text-xs font-semibold">Reviewed</span></div>}
            <GroupDetailsStep form={form} setForm={setForm} reviewed={reviewed.has(0)} />
          </div>
          <div className={clsx('rounded-xl shadow-card border p-6 transition-colors', reviewed.has(1) ? 'bg-green-50/40 border-green-200' : 'bg-white border-slate-100')}>
            {reviewed.has(1) && <div className="flex items-center gap-1.5 mb-4 text-green-600"><Check size={14} /><span className="text-xs font-semibold">Reviewed</span></div>}
            <AssignOwnerStep form={form} setForm={setForm} users={users} reviewed={reviewed.has(1)} />
          </div>
          <div className={clsx('rounded-xl shadow-card border p-6 transition-colors', reviewed.has(2) ? 'bg-green-50/40 border-green-200' : 'bg-white border-slate-100')}>
            {reviewed.has(2) && <div className="flex items-center gap-1.5 mb-4 text-green-600"><Check size={14} /><span className="text-xs font-semibold">Reviewed</span></div>}
            <ReviewStep form={form} users={users} reviewed={reviewed.has(2)} />
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
              onClick={() => navigate('/fleet')}
              disabled={saving}
            />
          )}
          <div className="flex items-center gap-3">
            <Button variant="secondary" label="Save as Draft" disabled={saving} />
            <Button
              label={step < STEPS.length - 1 ? 'Review & Complete' : 'Create Group'}
              endIcon={step < STEPS.length - 1 ? ArrowRight : Check}
              loading={saving}
              disabled={isNextDisabled()}
              onClick={() => {
                if (step < STEPS.length - 1) {
                  setReviewed(prev => new Set([...prev, step]))
                  setStep(step + 1)
                } else {
                  handleCreateGroup()
                }
              }}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
