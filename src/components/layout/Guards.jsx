import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

// Spinner shown while session is being validated
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-sidebar-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading...</p>
      </div>
    </div>
  )
}

// Requires any authenticated user
export function RequireAuth() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

// Requires superadmin role
export function RequireSuperadmin() {
  const { user, loading, isSuperadmin } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (!isSuperadmin) return <Navigate to="/dashboard" replace />
  return <Outlet />
}

// Redirect to dashboard if already logged in
export function RedirectIfAuth() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (user) return <Navigate to="/dashboard" replace />
  return <Outlet />
}
