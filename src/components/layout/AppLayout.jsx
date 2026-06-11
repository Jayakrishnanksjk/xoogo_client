import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function AppLayout({ children, title, subtitle, searchValue, onSearchChange }) {
  return (
    <div className="min-h-screen bg-surface-secondary">
      <Sidebar />
      <div className="ml-[220px] min-h-screen flex flex-col">
        <Topbar title={title} subtitle={subtitle} searchValue={searchValue} onSearchChange={onSearchChange} />
        <main className="flex-1 pt-16 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  )
}
