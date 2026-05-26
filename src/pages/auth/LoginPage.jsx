import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Bus } from 'lucide-react'
import { Input, Button } from '@/components/ui'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await login(data.email, data.password)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — branding */}
      <div className="hidden lg:flex w-1/2 bg-sidebar-bg flex-col justify-between p-12">
        <div className="flex items-center gap-2">
          <span className="text-3xl font-bold tracking-tight">
            <span className="text-brand-light">x</span>
            <span className="text-white">oogo</span>
          </span>
        </div>
        <div>
          <div className="w-14 h-14 bg-brand/20 rounded-2xl flex items-center justify-center mb-6">
            <Bus size={28} className="text-brand-light" />
          </div>
          <h2 className="text-3xl font-semibold text-white leading-tight mb-3">
            Manage your fleet<br />from one place
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
            Track buses, manage routes, assign media playlists, and monitor your entire operation in real time.
          </p>
        </div>
        <p className="text-slate-600 text-xs">© 2026 Xoogo. All rights reserved.</p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <span className="text-2xl font-bold">
              <span className="text-brand">x</span>oogo
            </span>
          </div>

          <h1 className="text-2xl font-semibold text-slate-900 mb-1">Welcome back</h1>
          <p className="text-slate-500 text-sm mb-8">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              error={errors.email}
              {...register('email', { required: 'Email is required' })}
            />

            <Input
              label="Password"
              type={showPass ? 'text' : 'password'}
              placeholder="••••••••"
              error={errors.password}
              suffix={
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
              {...register('password', { required: 'Password is required' })}
            />

            <Button
              type="submit"
              loading={loading}
              label="Sign in"
              className="w-full py-2.5 mt-2"
            />
          </form>
        </div>
      </div>
    </div>
  )
}
