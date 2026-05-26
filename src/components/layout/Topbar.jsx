import { Bell, Search } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function Topbar({ title, subtitle }) {
  const { user } = useAuth()

  return (
    <header className="h-14 bg-white border-b border-slate-100 flex items-center px-6 gap-4 sticky top-0 z-20">
      {/* Page title */}
      <div className="flex-1">
        {title && <h1 className="text-sm font-semibold text-slate-900">{title}</h1>}
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>

      {/* Search */}
      <div className="relative hidden md:block">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="pl-8 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand w-56 placeholder:text-slate-400"
          placeholder="Search anything..."
        />
      </div>

      {/* Notifications */}
      <button className="relative p-2 hover:bg-slate-50 rounded-lg transition-colors">
        <Bell size={16} className="text-slate-500" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
      </button>

      {/* Avatar */}
      <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center text-xs font-semibold text-white cursor-pointer">
        {user?.full_name?.charAt(0) || 'U'}
      </div>
    </header>
  )
}
