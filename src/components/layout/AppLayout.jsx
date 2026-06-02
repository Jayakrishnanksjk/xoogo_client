import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function AppLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-surface-secondary">
      <Sidebar />
      <div className="ml-[220px] min-h-screen flex flex-col">
        <Topbar title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
