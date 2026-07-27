import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { RequireAuth, RequireSuperadmin, RedirectIfAuth } from '@/components/layout/Guards'

// Pages
import LoginPage from '@/pages/auth/LoginPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import FleetPage from '@/pages/fleet/FleetPage'
import GroupScreensPage from '@/pages/fleet/GroupScreensPage'
import RoutesPage from '@/pages/routes/RoutesPage'
import AddRoutePage from '@/pages/routes/AddRoutePage'
import UsersPage from '@/pages/users/UsersPage'
import AddGroupPage from '@/pages/fleet/AddGroupPage'
import AddBusScreenPage from '@/pages/fleet/AddBusScreenPage'
import BusesPage from '@/pages/fleet/BusesPage'
import MediaLibraryPage from '@/pages/media/MediaLibraryPage'
import PlaylistsPage from '@/pages/playlists/PlaylistsPage'
import BrandingSettingsPage from '@/pages/settings/BrandingSettingsPage'
import IntegrationsPage from '@/pages/settings/IntegrationsPage'

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
            <Route path="/fleet/buses" element={<BusesPage />} />
            <Route path="/fleet/group/:id/screens" element={<GroupScreensPage />} />
            <Route path="/fleet/add-group" element={<AddGroupPage />} />
            <Route path="/fleet/add-bus-screen" element={<AddBusScreenPage />} />
            <Route path="/fleet/edit-bus-screen/:id" element={<AddBusScreenPage />} />
            <Route path="/media" element={<MediaLibraryPage />} />
            <Route path="/playlists" element={<PlaylistsPage />} />

            {/* Superadmin only */}
            <Route element={<RequireSuperadmin />}>
              <Route path="/routes" element={<RoutesPage />} />
              <Route path="/routes/add" element={<AddRoutePage />} />
              <Route path="/routes/edit/:id" element={<AddRoutePage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/settings/branding" element={<BrandingSettingsPage />} />
              <Route path="/settings/integrations" element={<IntegrationsPage />} />
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
