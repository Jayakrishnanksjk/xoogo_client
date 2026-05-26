import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Bus, Library, ListMusic,
  MapPin, Users, LogOut, ChevronDown
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import clsx from 'clsx'

const NAV_SUPERADMIN = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/fleet', icon: Bus, label: 'Fleet' },
  { to: '/routes', icon: MapPin, label: 'Routes & Stops' },
  { to: '/users', icon: Users, label: 'Users' },
]

const NAV_PARTNER = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/fleet', icon: Bus, label: 'Fleet' },
]

export default function Sidebar() {
  const { user, logout, isSuperadmin } = useAuth()
  const navigate = useNavigate()
  const navItems = isSuperadmin ? NAV_SUPERADMIN : NAV_PARTNER

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold tracking-tight">
            <span className="text-brand-light">x</span>
            <span className="text-white">oogo</span>
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx('nav-item', isActive && 'active')
            }
          >
            <Icon size={16} strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User profile at bottom */}
      <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-sidebar-hover cursor-pointer transition-colors">
          <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center text-xs font-semibold text-white shrink-0">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{user?.full_name}</p>
            <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
          </div>
          <ChevronDown size={14} className="text-slate-500 shrink-0" />
        </div>
        <button
          onClick={handleLogout}
          className="mt-1 w-full flex items-center gap-2 px-2 py-2 text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-colors"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
