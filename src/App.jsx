import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { RequireAuth, RequireSuperadmin, RedirectIfAuth } from '@/components/layout/Guards'

// Pages
import LoginPage from '@/pages/auth/LoginPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import FleetPage from '@/pages/fleet/FleetPage'
import RoutesPage from '@/pages/routes/RoutesPage'
import UsersPage from '@/pages/users/UsersPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public — redirect if already logged in */}
          <Route element={<RedirectIfAuth />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* Protected — any authenticated user */}
          <Route element={<RequireAuth />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/fleet" element={<FleetPage />} />

            {/* Superadmin only */}
            <Route element={<RequireSuperadmin />}>
              <Route path="/routes" element={<RoutesPage />} />
              <Route path="/users" element={<UsersPage />} />
            </Route>
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
