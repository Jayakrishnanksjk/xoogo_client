import { useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { Badge, EmptyState, Button, Input } from '@/components/ui'
import { MapPin, Plus, ChevronRight, MoreVertical, Search } from 'lucide-react'

const MOCK_ROUTES = [
  { id: 1, name: 'Kannur → Kasaragod', code: 'KNR-KSD-001', stops: 5, distance: '68 km', status: 'active', start: 'Kannur', end: 'Kasaragod' },
  { id: 2, name: 'Kozhikode → Payyanur', code: 'KZD-PYN-001', stops: 9, distance: '54 km', status: 'active', start: 'Kozhikode', end: 'Payyanur' },
  { id: 3, name: 'Ernakulam → Kottayam', code: 'EKM-KTM-001', stops: 7, distance: '72 km', status: 'active', start: 'Ernakulam', end: 'Kottayam' },
  { id: 4, name: 'Kochi → Alappuzha', code: 'KCH-ALP-001', stops: 8, distance: '63 km', status: 'active', start: 'Kochi', end: 'Alappuzha' },
  { id: 5, name: 'Thrissur → Palakkad', code: 'TCR-PKD-001', stops: 6, distance: '82 km', status: 'inactive', start: 'Thrissur', end: 'Palakkad' },
]

export default function RoutesPage() {
  const [selected, setSelected] = useState(MOCK_ROUTES[0])
  const [search, setSearch] = useState('')

  const filtered = MOCK_ROUTES.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AppLayout title="Routes & Stops" subtitle="Create and manage routes and their stops">
      <div className="p-6 max-w-screen-xl">
        <div className="flex gap-4">

          {/* Left: route list */}
          <div className="w-80 shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <Input
                placeholder="Search routes..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                startIcon={Search}
                containerClassName="flex-1"
                className="py-1.5"
              />
              <Button
                startIcon={Plus}
                label="Create"
                className="shrink-0"
              />
            </div>

            <div className="space-y-2">
              {filtered.map(route => (
                <div
                  key={route.id}
                  onClick={() => setSelected(route)}
                  className={`bg-white rounded-xl shadow-card border border-slate-100 p-5 cursor-pointer transition-all ${selected?.id === route.id ? 'ring-2 ring-brand' : 'hover:shadow-card-md'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                        <MapPin size={13} className="text-brand" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900">{route.name}</p>
                        <p className="text-xs text-slate-400">{route.stops} Stops · {route.distance}</p>
                      </div>
                    </div>
                    <button className="p-0.5 hover:bg-slate-100 rounded" onClick={e => e.stopPropagation()}>
                      <MoreVertical size={13} className="text-slate-400" />
                    </button>
                  </div>
                  <Badge status={route.status} />
                </div>
              ))}
            </div>
          </div>

          {/* Right: route detail */}
          {selected ? (
            <div className="flex-1 bg-white rounded-xl shadow-card border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-slate-900">{selected.name}</h2>
                  <Badge status={selected.status} />
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" className="px-4 rounded-lg" label="Edit Route" />
                  <Button variant="danger" size="sm" className="px-4 rounded-lg" label="Delete" />
                </div>
              </div>

              {/* Route summary */}
              <div className="grid grid-cols-4 gap-4 mb-5 p-4 bg-slate-50 rounded-xl">
                <div><p className="text-xs text-slate-500">Start</p><p className="text-sm font-medium text-slate-800">{selected.start}</p></div>
                <div><p className="text-xs text-slate-500">End</p><p className="text-sm font-medium text-slate-800">{selected.end}</p></div>
                <div><p className="text-xs text-slate-500">Total Stops</p><p className="text-sm font-medium text-slate-800">{selected.stops}</p></div>
                <div><p className="text-xs text-slate-500">Distance</p><p className="text-sm font-medium text-slate-800">{selected.distance}</p></div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 border-b border-slate-100 mb-4">
                {['Stops', 'Route Map', 'Details'].map(t => (
                  <button key={t} className="px-4 py-2 text-xs font-medium text-brand border-b-2 border-brand">
                    {t === 'Stops' ? t : <span className="text-slate-400 hover:text-slate-700">{t}</span>}
                  </button>
                ))}
              </div>

              {/* Stops table placeholder */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-700">Route Stops</p>
                <Button variant="primary" size="sm" className="px-4 rounded-lg" label="+ Add Stop" />
              </div>
              <div className="text-center py-10 text-slate-400 text-sm bg-slate-50 rounded-xl">
                Stops table + Map — connect to API
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-white rounded-xl shadow-card border border-slate-100 p-5">
              <EmptyState icon={MapPin} title="Select a route" description="Click a route from the list to view its details and stops." />
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
