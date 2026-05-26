import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { Badge, StatCard, SlidePanel, Stepper, Button, Input, Select } from '@/components/ui'
import { Users, Shield, Building2, UserCog, Plus, Search, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { usersApi, groupsApi } from '@/api'
import toast from 'react-hot-toast'

const STEPS = ['User Details', 'Assign Role & Group', 'Review & Confirm']

function AddUserPanel({ open, onClose, onUserAdded }) {
  const [step, setStep] = useState(0)
  const [groups, setGroups] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm()

  useEffect(() => {
    if (open) {
      setStep(0)
      reset()
      groupsApi.list()
        .then(res => setGroups(res.data))
        .catch(() => toast.error('Failed to load groups'))
    }
  }, [open, reset])

  const onSubmit = async (data) => {
    if (step < 2) {
      setStep(s => s + 1)
      return
    }
    
    setSubmitting(false)
    try {
      setSubmitting(true)
      await usersApi.create({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
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
          <div className="space-y-4">
            <Input
              label="Full Name *"
              placeholder="Enter full name"
              error={errors.full_name}
              {...register('full_name', { required: 'Name is required' })}
            />
            <Input
              label="Email Address *"
              type="email"
              placeholder="email@example.com"
              error={errors.email}
              {...register('email', { required: 'Email is required' })}
            />
            <Input
              label="Phone Number *"
              placeholder="+91 98765 43210"
              error={errors.phone}
              {...register('phone', { required: 'Phone is required' })}
            />
            <Input
              label="Password *"
              type="password"
              placeholder="Set initial password"
              error={errors.password}
              {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } })}
            />
            <Select
              label="Status"
              {...register('status')}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
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

            <Select
              label="Assign Bus Group"
              {...register('group_id')}
            >
              <option value="">Select group (optional)</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </Select>
            <div className="bg-blue-50 text-blue-700 text-xs rounded-lg p-3">
              The selected user will be notified once their account is created.
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
              {[
                ['Name', watch('full_name')],
                ['Email', watch('email')],
                ['Phone', watch('phone')],
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

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')

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

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete user "${name}"?`)) return
    try {
      await usersApi.delete(id)
      toast.success('User deleted successfully')
      fetchUsers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user')
    }
  }

  // Count user statistics dynamically
  const totalUsers = users.length
  const adminsCount = users.filter(u => u.role === 'superadmin' || u.role === 'admin').length
  const partnersCount = users.filter(u => u.role === 'partner').length
  const operatorsCount = users.filter(u => u.role === 'operator').length

  return (
    <AppLayout title="Users" subtitle="Manage system users and permissions">
      <div className="p-6 max-w-screen-xl">
        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <StatCard icon={Users}    iconBg="bg-blue-50"   iconColor="text-blue-500"   label="Total Users"  value={String(totalUsers)} sub="Across all roles" />
          <StatCard icon={Shield}   iconBg="bg-purple-50" iconColor="text-purple-500" label="Admins"       value={String(adminsCount)}  sub="System administration" />
          <StatCard icon={Building2}iconBg="bg-green-50"  iconColor="text-green-500"  label="Bus Owners"   value={String(partnersCount)} sub="Partner level access" />
          <StatCard icon={UserCog}  iconBg="bg-orange-50" iconColor="text-orange-500" label="Operators"    value={String(operatorsCount)}  sub="Operator level access" />
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
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No users found.
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
                {users.map(u => (
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
                      <button
                        onClick={() => handleDeleteUser(u.id, u.full_name)}
                        className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-md transition-colors"
                        title="Delete User"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AddUserPanel open={showAdd} onClose={() => setShowAdd(false)} onUserAdded={fetchUsers} />
    </AppLayout>
  )
}

