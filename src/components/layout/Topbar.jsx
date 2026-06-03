import { Bell, Search } from 'lucide-react'

export default function Topbar({ title, subtitle }) {
  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center px-6 gap-4 fixed top-0 right-0 left-[220px] z-20">
      {/* Page title */}
      <div className="flex-1 text-left">
        {title && <h1 className="text-sm font-semibold text-slate-900 leading-none">{title}</h1>}
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>

      {/* Search Bar - Shadcn input aesthetic aligned to brand primary color */}
      <div className="relative hidden md:block">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand w-64 placeholder:text-slate-400 transition-all text-slate-700"
          placeholder="Search anything..."
        />
      </div>

      {/* Notifications Button - Shadcn icon-button style */}
      <button className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100 cursor-pointer">
        <Bell size={15} />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
      </button>
    </header>
  )
}
