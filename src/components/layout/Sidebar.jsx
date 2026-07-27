import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Bus, Library, ListMusic,
  MapPin, Users, LogOut, ChevronDown, Palette, Key
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useBranding } from '@/context/ThemeContext'
import clsx from 'clsx'

const NAV_SUPERADMIN = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/fleet', icon: Bus, label: 'Fleet' },
  { to: '/routes', icon: MapPin, label: 'Routes & Stops' },
  { to: '/media', icon: Library, label: 'Media Library' },
  { to: '/playlists', icon: ListMusic, label: 'Playlists' },
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/settings/branding', icon: Palette, label: 'Branding' },
  { to: '/settings/integrations', icon: Key, label: 'Integrations' },
]

const NAV_PARTNER = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/fleet', icon: Bus, label: 'Fleet' },
  { to: '/media', icon: Library, label: 'Media Library' },
  { to: '/playlists', icon: ListMusic, label: 'Playlists' },
]

export default function Sidebar() {
  const { user, logout, isSuperadmin } = useAuth()
  const { branding } = useBranding() || {}
  const navigate = useNavigate()
  const location = useLocation()
  const [hoveredPath, setHoveredPath] = useState(null)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const navItems = isSuperadmin ? NAV_SUPERADMIN : NAV_PARTNER

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="fixed top-0 left-0 h-screen bg-sidebar-bg text-white flex flex-col z-30 w-[220px] border-r border-white/5 shadow-2xl">
      <div className="px-6 py-4 border-b border-white/5">
        <div className="flex items-center justify-start h-20 w-full overflow-visible">
          <img
            src={branding?.logo_url || '/logo.svg'}
            alt="Logo"
            className="h-full w-auto max-w-full object-contain object-left border-0 bg-transparent scale-110 origin-left"
            style={{ background: 'transparent', border: 'none' }}
          />
        </div>
      </div>

      {/* Navigation Links */}
      <nav 
        className="flex-1 py-6 space-y-1 overflow-y-auto"
        onMouseLeave={() => setHoveredPath(null)}
      >
        {navItems.map(({ to, icon: Icon, label }, idx) => {
          const isActive = location.pathname.startsWith(to)
          return (
            <NavLink
              key={to}
              to={to}
              onMouseEnter={() => setHoveredPath(to)}
              className="relative block mx-3 select-none"
            >
              <div
                className={clsx(
                  'relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 cursor-pointer',
                  isActive ? 'text-white' : 'text-slate-400 hover:text-white'
                )}
              >
                {/* Active Indicator Pill */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 bg-brand rounded-xl -z-10 shadow-lg shadow-brand/20"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}

                {/* Hover Background Pill */}
                {hoveredPath === to && !isActive && (
                  <motion.div
                    layoutId="hoverNavIndicator"
                    className="absolute inset-0 bg-white/5 rounded-xl -z-10"
                    transition={{ type: 'spring', stiffness: 350, damping: 35 }}
                  />
                )}

                {/* Icon with micro-bounce effect on hover */}
                <motion.div
                  animate={hoveredPath === to ? { scale: 1.1, rotate: [0, -5, 5, 0] } : { scale: 1, rotate: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center shrink-0"
                >
                  <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                </motion.div>

                <span>{label}</span>
              </div>
            </NavLink>
          )
        })}
      </nav>

      {/* Bottom Profile and Settings */}
      <div className="p-4 border-t border-white/5 bg-slate-950/20 relative">
        <AnimatePresence>
          {showProfileMenu && (
            <>
              {/* Overlay click catcher */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowProfileMenu(false)}
              />
              {/* Profile dropup menu */}
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute left-4 right-4 bottom-20 bg-[#131b2e] border border-white/5 rounded-xl p-2.5 shadow-2xl z-50 space-y-1.5"
              >
                <div className="px-2 py-1.5 border-b border-white/5 mb-1 text-left">
                  <p className="text-xs font-semibold text-white truncate">{user?.full_name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-left font-medium"
                >
                  <LogOut size={13} className="shrink-0" />
                  Sign out
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* User Card trigger */}
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className={clsx(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 border",
            showProfileMenu 
              ? "bg-[#131b2e] border-white/10" 
              : "border-transparent hover:bg-white/5 hover:border-white/5"
          )}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand to-brand-light flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-md shadow-brand/10">
            {user?.full_name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-semibold text-white truncate">{user?.full_name}</p>
            <p className="text-[10px] text-slate-400 capitalize leading-none mt-0.5">{user?.role}</p>
          </div>
          <motion.div
            animate={{ rotate: showProfileMenu ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0"
          >
            <ChevronDown size={13} className="text-slate-400" />
          </motion.div>
        </motion.div>
      </div>
    </aside>
  )
}
