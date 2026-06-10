import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { Badge, StatCard, SlidePanel, Stepper, Button, Input, Select, ConfirmDialog } from '@/components/ui'
import { Users, Shield, Building2, UserCog, Plus, Search, Trash2, Check, Pencil } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { usersApi, groupsApi } from '@/api'
import { toast } from 'sonner'
import clsx from 'clsx'

const STEPS = ['User Details', 'Assign Role & Group', 'Review & Confirm']

function AddUserPanel({ open, onClose, onUserAdded }) {
  const [step, setStep] = useState(0)
  const [reviewed, setReviewed] = useState(new Set())
  const [groups, setGroups] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm()

  useEffect(() => {
    if (open) {
      setStep(0)
      setReviewed(new Set())
      reset()
      groupsApi.list()
        .then(res => setGroups(res.data))
        .catch(() => toast.error('Failed to load groups'))
    }
  }, [open, reset])

  const onSubmit = async (data) => {
    if (step < 2) {
      setReviewed(prev => new Set([...prev, step]))
      setStep(s => s + 1)
      return
    }
    
    setSubmitting(false)
    try {
      setSubmitting(true)
      await usersApi.create({
        full_name: data.full_name,
        email: data.email,
        phone: `+91 ${data.phone}`,
        password: data.password,
        role: data.role,
        status: data.status || 'active',
        group_id: data.group_id || null
      })
      toast.success('User created successfully')
      onUserAdded()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user')
    } finally {
      setSubmitting(false)
    }
  }

  // Find assigned group name for review step
  const selectedGroupId = watch('group_id')
  const selectedGroup = groups.find(g => g.id === selectedGroupId)
  const selectedGroupName = selectedGroup ? selectedGroup.name : 'None'

  return (
    <SlidePanel open={open} onClose={onClose} title="Add New User" subtitle="Create a new user account">
      <Stepper steps={STEPS} current={step} />

      <form onSubmit={handleSubmit(onSubmit)}>
        {step === 0 && (
          <div className={clsx('p-4 rounded-xl border transition-colors', reviewed.has(0) ? 'bg-green-50/40 border-green-200' : 'border-transparent')}>
            {reviewed.has(0) && <div className="flex items-center gap-1.5 mb-4 text-green-600"><Check size={14} /><span className="text-xs font-semibold">Reviewed</span></div>}
            <div className="space-y-4">
              <Input
                label="Full Name *"
                placeholder="Enter full name"
                error={errors.full_name}
                {...register('full_name', { required: 'Name is required' })}
                suffix={reviewed.has(0) ? <Check size={14} className="text-green-500" /> : undefined}
              />
              <Input
                label="Email Address *"
                type="email"
                placeholder="email@example.com"
                error={errors.email}
                {...register('email', { required: 'Email is required' })}
                suffix={reviewed.has(0) ? <Check size={14} className="text-green-500" /> : undefined}
              />
              <Input
                label="Phone Number *"
                placeholder="98765 43210"
                startIcon={
                  <div className="flex items-center pr-2 border-r border-slate-200 select-none">
                    <span className="text-slate-500 text-sm font-semibold font-mono leading-none">+91</span>
                  </div>
                }
                className="pl-[60px]"
                error={errors.phone}
                {...register('phone', {
                  required: 'Phone is required',
                  pattern: {
                    value: /^[0-9]{10}$/,
                    message: 'Must be exactly 10 digits'
                  },
                  onChange: (e) => {
                    const cleanVal = e.target.value.replace(/\D/g, '').slice(0, 10)
                    e.target.value = cleanVal
                  }
                })}
                suffix={reviewed.has(0) ? <Check size={14} className="text-green-500" /> : undefined}
              />
              <Input
                label="Password *"
                type="password"
                placeholder="Set initial password"
                error={errors.password}
                {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } })}
                suffix={reviewed.has(0) ? <Check size={14} className="text-green-500" /> : undefined}
              />
              <div className="relative">
                <Select
                  label="Status"
                  {...register('status')}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Select>
                {reviewed.has(0) && <span className="absolute right-2 top-[34px] text-green-500"><Check size={14} /></span>}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className={clsx('p-4 rounded-xl border transition-colors', reviewed.has(1) ? 'bg-green-50/40 border-green-200' : 'border-transparent')}>
            {reviewed.has(1) && <div className="flex items-center gap-1.5 mb-4 text-green-600"><Check size={14} /><span className="text-xs font-semibold">Reviewed</span></div>}
            <div className="space-y-4">
              <div className="relative">
                <Select
                  label="Role *"
                  error={errors.role}
                  {...register('role', { required: 'Role is required' })}
                >
                  <option value="">Select role</option>
                  <option value="superadmin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="partner">Partner (Bus Owner)</option>
                  <option value="operator">Operator</option>
                </Select>
                {reviewed.has(1) && <span className="absolute right-2 top-[34px] text-green-500"><Check size={14} /></span>}
              </div>

              <div className="relative">
                <Select
                  label="Assign Bus Group"
                  {...register('group_id')}
                >
                  <option value="">Select group (optional)</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </Select>
                {reviewed.has(1) && <span className="absolute right-2 top-[34px] text-green-500"><Check size={14} /></span>}
              </div>
              <div className="bg-blue-50 text-blue-700 text-xs rounded-lg p-3">
                The selected user will be notified once their account is created.
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className={clsx('p-4 rounded-xl border transition-colors', reviewed.has(2) ? 'bg-green-50/40 border-green-200' : 'border-transparent')}>
            {reviewed.has(2) && <div className="flex items-center gap-1.5 mb-4 text-green-600"><Check size={14} /><span className="text-xs font-semibold">Reviewed</span></div>}
            <div className="space-y-3">
              <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                {[
                  ['Name', watch('full_name')],
                  ['Email', watch('email')],
                  ['Phone', watch('phone') ? `+91 ${watch('phone')}` : '—'],
                  ['Role', watch('role')],
                  ['Group', selectedGroupName],
                  ['Status', watch('status') || 'active']
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-slate-500 text-xs">{k}</span>
                    <span className="font-medium text-slate-800 text-xs capitalize">{v || '—'}</span>
                  </div>
                ))}
              </div>
              <div className="bg-green-50 text-green-700 text-xs rounded-lg p-3">
                ✓ Review all details before creating the user account.
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-6">
          {step > 0
            ? <Button type="button" onClick={() => setStep(s => s - 1)} variant="secondary" disabled={submitting} label="← Back" />
            : <Button type="button" onClick={onClose} variant="secondary" disabled={submitting} label="Cancel" />
          }
          <Button
            type="submit"
            loading={submitting}
            label={step < 2 ? 'Next →' : 'Create User'}
          />
        </div>
      </form>
    </SlidePanel>
  )
}

function EditUserPanel({ user, open, onClose, onUserUpdated }) {
  const [groups, setGroups] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    role: '',
    status: 'active',
    group_id: ''
  })

  useEffect(() => {
    if (open && user) {
      setForm({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone?.replace('+91 ', '') || '',
        password: '',
        role: user.role || '',
        status: user.status || 'active',
        group_id: user.group_id || ''
      })
      groupsApi.list()
        .then(res => setGroups(res.data))
        .catch(() => toast.error('Failed to load groups'))
    }
  }, [open, user])

  const handleChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }))
  }

  const handlePhoneChange = (e) => {
    const cleanVal = e.target.value.replace(/\D/g, '').slice(0, 10)
    handleChange('phone', cleanVal)
  }

  const handleSave = async () => {
    if (!form.full_name.trim() || !form.email.trim()) {
      toast.error('Full name and email are required')
      return
    }
    try {
      setSubmitting(true)
      const payload = {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: `+91 ${form.phone}`,
        role: form.role,
        status: form.status,
        group_id: form.group_id || null
      }
      if (form.password) payload.password = form.password
      await usersApi.update(user.id, payload)
      toast.success('User updated successfully')
      onUserUpdated()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedGroup = groups.find(g => g.id === form.group_id)

  return (
    <SlidePanel open={open} onClose={onClose} title="Edit User" subtitle={`Editing: ${user?.full_name || ''}`}>
      <div className="space-y-4">
        <Input
          label="Full Name *"
          placeholder="Enter full name"
          value={form.full_name}
          onChange={e => handleChange('full_name', e.target.value)}
        />
        <Input
          label="Email Address *"
          type="email"
          placeholder="email@example.com"
          value={form.email}
          onChange={e => handleChange('email', e.target.value)}
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
          value={form.phone}
          onChange={handlePhoneChange}
        />
        <Input
          label="New Password (leave blank to keep current)"
          type="password"
          placeholder="Enter new password"
          value={form.password}
          onChange={e => handleChange('password', e.target.value)}
        />
        <Select
          label="Role *"
          value={form.role}
          onChange={e => handleChange('role', e.target.value)}
        >
          <option value="">Select role</option>
          <option value="superadmin">Super Admin</option>
          <option value="admin">Admin</option>
          <option value="partner">Partner (Bus Owner)</option>
          <option value="operator">Operator</option>
        </Select>
        <Select
          label="Assign Bus Group"
          value={form.group_id}
          onChange={e => handleChange('group_id', e.target.value)}
        >
          <option value="">Select group (optional)</option>
          {groups.map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </Select>
        <Select
          label="Status"
          value={form.status}
          onChange={e => handleChange('status', e.target.value)}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>

        <div className="pt-4 border-t border-slate-100">
          <Button
            label="Save Changes"
            onClick={handleSave}
            loading={submitting}
            className="w-full"
          />
        </div>
      </div>
    </SlidePanel>
  )
}

const ROLE_FILTERS = [
  { value: '', label: 'Total Users', icon: Users, theme: 'blue' },
  { value: 'superadmin,admin', label: 'Admins', icon: Shield, theme: 'purple' },
  { value: 'partner', label: 'Bus Owners', icon: Building2, theme: 'green' },
  { value: 'operator', label: 'Operators', icon: UserCog, theme: 'amber' },
]

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [editingUser, setEditingUser] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, userId: null, userName: '' })

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await usersApi.list({ search })
      setUsers(res.data)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load users from server')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [search])

  const triggerDeleteConfirm = (id, name) => {
    setDeleteConfirm({ open: true, userId: id, userName: name })
  }

  const handleConfirmDelete = async () => {
    const { userId } = deleteConfirm
    if (!userId) return
    try {
      await usersApi.delete(userId)
      toast.success('User deleted successfully')
      fetchUsers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user')
    }
  }

  // Client-side filtering for role (stats always based on full user list)
  const displayedUsers = roleFilter
    ? users.filter(u => roleFilter.split(',').includes(u.role))
    : users

  // Count user statistics from the full list
  const totalUsers = users.length
  const adminsCount = users.filter(u => u.role === 'superadmin' || u.role === 'admin').length
  const partnersCount = users.filter(u => u.role === 'partner').length
  const operatorsCount = users.filter(u => u.role === 'operator').length

  const roleCardCounts = {
    '': totalUsers,
    'superadmin,admin': adminsCount,
    'partner': partnersCount,
    'operator': operatorsCount,
  }

  const handleRoleFilter = (value) => {
    setRoleFilter(prev => prev === value ? '' : value)
  }

  return (
    <AppLayout title="Users" subtitle="Manage system users and permissions">
      <div className="p-6 max-w-screen-xl">
        {/* Role filter cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {ROLE_FILTERS.map(f => {
            const isActive = roleFilter === f.value
            const count = roleCardCounts[f.value]
            return (
              <div key={f.value} className={clsx(isActive && 'ring-2 ring-brand rounded-2xl')}>
                <StatCard
                  icon={f.icon}
                  label={f.label}
                  value={loading ? '...' : count}
                  onClick={() => handleRoleFilter(f.value)}
                  theme={f.theme}
                />
              </div>
            )
          })}
        </div>

        {/* Table card */}
        <div className="bg-white rounded-xl shadow-card border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <Input
              placeholder="Search by name, email or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              startIcon={Search}
              className="w-72 py-1.5"
            />
            <Button
              startIcon={Plus}
              label="Add User"
              onClick={() => setShowAdd(true)}
            />
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            </div>
          ) : displayedUsers.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              {roleFilter ? 'No users found for the selected role.' : 'No users found.'}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {['User', 'Role', 'Assigned Groups', 'Status', 'Last Login', 'Actions'].map(h => (
                    <th key={h} className="text-xs font-medium text-slate-500 uppercase tracking-wide text-left pb-3 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayedUsers.map(u => (
                  <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-xs font-semibold text-white shrink-0">
                          {u.full_name ? u.full_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{u.full_name}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4"><Badge status={u.role} /></td>
                    <td className="py-3 pr-4 text-sm text-slate-600">{u.group}</td>
                    <td className="py-3 pr-4"><Badge status={u.status} /></td>
                    <td className="py-3 pr-4 text-xs text-slate-500">{u.lastLogin}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingUser(u)}
                          className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-md transition-colors"
                          title="Edit User"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => triggerDeleteConfirm(u.id, u.full_name)}
                          className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-md transition-colors"
                          title="Delete User"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AddUserPanel open={showAdd} onClose={() => setShowAdd(false)} onUserAdded={fetchUsers} />

      <EditUserPanel user={editingUser} open={!!editingUser} onClose={() => setEditingUser(null)} onUserUpdated={fetchUsers} />

      <ConfirmDialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, userId: null, userName: '' })}
        onConfirm={handleConfirmDelete}
        title="Delete User"
        message={`Are you sure you want to delete user "${deleteConfirm.userName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
      />
    </AppLayout>
  )
}

