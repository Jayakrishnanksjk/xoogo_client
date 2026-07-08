import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { useBranding } from '@/context/ThemeContext'
import { toast } from 'sonner'
import { Eye, EyeOff, Bus, Loader2, CheckCircle2 } from 'lucide-react'
import { Input, Button } from '@/components/ui'

// Stagger container animation
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
}

// Fade in items
const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
}

export default function LoginPage() {
  const { login } = useAuth()
  const { branding } = useBranding() || {}
  const navigate = useNavigate()
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loginSuccess, setLoginSuccess] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await login(data.email, data.password)
      setLoginSuccess(true)
      
      // Delay navigation to show success animation
      setTimeout(() => {
        navigate('/dashboard')
      }, 1200)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-white overflow-hidden font-sans">
      <AnimatePresence mode="wait">
        {loginSuccess ? (
          /* Premium Fullscreen Success/Loading transition */
          <motion.div
            key="success-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0F172A] flex flex-col items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
              className="flex flex-col items-center space-y-4"
            >
              <div className="relative flex items-center justify-center">
                {/* Rotating accent border ring */}
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  className="w-16 h-16 border-2 border-brand-light/30 border-t-brand rounded-full"
                />
                {/* Success Icon */}
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 12 }}
                  className="absolute"
                >
                  <CheckCircle2 size={32} className="text-emerald-500" />
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-center"
              >
                <h3 className="text-white font-semibold text-base">Signing you in</h3>
                <p className="text-slate-400 text-xs mt-1">Preparing your dashboard...</p>
              </motion.div>
            </motion.div>
          </motion.div>
        ) : (
          <div className="w-full flex min-h-screen" key="login-form-screen">
            {/* Left — branding with sleek gradients and particles */}
            <div className="hidden lg:flex w-1/2 bg-[#0b0f19] flex-col justify-between p-12 relative overflow-hidden">
              {/* Radial gradient glow */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,#1e293b_0%,#020617_70%)] pointer-events-none" />
              
              {/* Modern Grid Line Pattern */}
              <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-2 relative z-10"
              >
                {branding?.logo_url ? (
                  <img src={branding.logo_url} alt="Logo" className="h-8 object-contain" />
                ) : (
                  <span className="text-3xl font-bold tracking-tight select-none">
                    <span className="text-brand-light">x</span>
                    <span className="text-white">oogo</span>
                  </span>
                )}
              </motion.div>

              <div className="relative z-10">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-14 h-14 bg-gradient-to-tr from-brand to-brand-light rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-brand/20"
                >
                  <Bus size={28} className="text-white" />
                </motion.div>
                
                <motion.h2 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-semibold text-white leading-tight mb-3 tracking-tight"
                >
                  Manage your fleet<br />from one place
                </motion.h2>
                
                <motion.p 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-slate-400 text-sm leading-relaxed max-w-sm"
                >
                  Track buses, manage routes, assign media playlists, and monitor your entire operation in real time.
                </motion.p>
              </div>

              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                transition={{ delay: 0.5 }}
                className="text-slate-600 text-xs relative z-10"
              >
                © 2026 Xoogo. All rights reserved.
              </motion.p>
            </div>

            {/* Right — login credentials form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-slate-50/50">
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="w-full max-w-md bg-white border border-slate-100 rounded-2xl p-8 shadow-sm"
              >
                {/* Mobile branding */}
                <motion.div variants={itemVariants} className="lg:hidden mb-8">
                  {branding?.logo_url ? (
                    <img src={branding.logo_url} alt="Logo" className="h-7 object-contain" />
                  ) : (
                    <span className="text-2xl font-bold tracking-tight select-none">
                      <span className="text-brand">x</span>oogo
                    </span>
                  )}
                </motion.div>

                <div className="mb-8">
                  <motion.h1 variants={itemVariants} className="text-2xl font-bold text-slate-900 tracking-tight mb-1.5">Welcome back</motion.h1>
                  <motion.p variants={itemVariants} className="text-slate-500 text-sm">Sign in to your account to continue</motion.p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <motion.div variants={itemVariants}>
                    <Input
                      label="Email address"
                      type="email"
                      placeholder="you@example.com"
                      error={errors.email}
                      disabled={loading}
                      {...register('email', { required: 'Email is required' })}
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Input
                      label="Password"
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      error={errors.password}
                      disabled={loading}
                      suffix={
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowPass(p => !p)}
                          className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none cursor-pointer"
                        >
                          {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      }
                      {...register('password', { required: 'Password is required' })}
                    />
                  </motion.div>

                  <motion.div variants={itemVariants} className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-10 bg-brand hover:bg-brand-dark text-white font-semibold rounded-lg shadow-md shadow-brand/20 text-sm hover:shadow-lg transition-all duration-200 flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 size={16} className="animate-spin text-white" />
                          <span>Authenticating...</span>
                        </div>
                      ) : (
                        <span>Sign in</span>
                      )}
                    </button>
                  </motion.div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
