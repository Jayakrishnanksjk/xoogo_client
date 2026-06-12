import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import { Badge, Button, Pagination, SearchInput, BusesStatBarSkeleton, TableRowSkeleton } from '@/components/ui'
import { Bus, Wifi, WifiOff, MoreVertical, Plus } from 'lucide-react'
import clsx from 'clsx'
import { busesApi } from '@/api'
import { toast } from 'sonner'

const FILTERS = [
  { value: 'all', label: 'All', icon: Bus },
  { value: 'online', label: 'Online', icon: Wifi },
  { value: 'offline', label: 'Offline', icon: WifiOff },
]

export default function BusesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const statusParam = searchParams.get('status') || 'all'

  const [buses, setBuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState(statusParam)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const itemsPerPage = 10

  useEffect(() => {
    const fetchBuses = async () => {
      try {
        setLoading(true)
        const res = await busesApi.list()
        setBuses(res.data)
      } catch (err) {
        console.error('Failed to fetch buses:', err)
        toast.error('Failed to load buses')
      } finally {
        setLoading(false)
      }
    }
    fetchBuses()
  }, [])

  const handleFilterChange = (filter) => {
    setActiveFilter(filter)
    setPage(1)
    if (filter === 'all') {
      setSearchParams({})
    } else {
      setSearchParams({ status: filter })
    }
  }

  const statusFiltered = activeFilter === 'all' ? buses : buses.filter(b => b.status === activeFilter)

  const filteredBuses = statusFiltered.filter(b => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      b.regNumber?.toLowerCase().includes(q) ||
      b.busType?.toLowerCase().includes(q) ||
      b.model?.toLowerCase().includes(q) ||
      b.group?.name?.toLowerCase().includes(q) ||
      b.simNumber?.toLowerCase().includes(q) ||
      b.contactName?.toLowerCase().includes(q) ||
      b.contactNumber?.toLowerCase().includes(q)
    )
  })

  const totalPages = Math.ceil(filteredBuses.length / itemsPerPage) || 1
  const paginatedBuses = filteredBuses.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  return (
    <AppLayout title="Buses" subtitle="View and manage all bus screens">
      <div className="p-6 max-w-screen-xl">
        {/* Stats bar */}
        {loading ? (
          <BusesStatBarSkeleton />
        ) : (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {FILTERS.map(f => {
              const count = f.value === 'all' ? buses.length : buses.filter(b => b.status === f.value).length
              const isActive = activeFilter === f.value
              return (
                <button
                  key={f.value}
                  onClick={() => handleFilterChange(f.value)}
                  className={clsx(
                    'bg-white rounded-xl shadow-card border p-4 flex items-center gap-4 transition-all',
                    isActive
                      ? 'border-brand ring-1 ring-brand'
                      : 'border-slate-100 hover:border-slate-200 hover:shadow-card-md'
                  )}
                >
                  <div className={clsx(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                    f.value === 'all' && 'bg-slate-50',
                    f.value === 'online' && 'bg-green-50',
                    f.value === 'offline' && 'bg-red-50'
                  )}>
                    <f.icon size={18} className={clsx(
                      f.value === 'all' && 'text-slate-500',
                      f.value === 'online' && 'text-green-500',
                      f.value === 'offline' && 'text-red-500'
                    )} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-slate-500">{f.label} Buses</p>
                    <p className="text-xl font-semibold text-slate-900 leading-tight">
                      {count}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Filters Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex-1 max-w-sm">
            <SearchInput
              placeholder="Search buses by reg no, type, model, group..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button startIcon={Plus} label="Add Bus Screen" onClick={() => navigate('/fleet/add-bus-screen')} />
          </div>
        </div>

        {/* Buses Table */}
        {loading ? (
          <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {['Reg Number', 'Status', 'Bus Type', 'Model', 'Group', 'SIM Number', 'Contact', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} cols={8} />)}
              </tbody>
            </table>
          </div>
        ) : paginatedBuses.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
            <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Bus size={28} className="text-slate-300" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700 mb-1">No Buses Found</h3>
            <p className="text-xs text-slate-400 mb-4">
              {activeFilter !== 'all'
                ? `There are no ${activeFilter} bus screens registered.`
                : 'No bus screens have been added yet.'}
            </p>
            <Button startIcon={Plus} label="Add Bus Screen" onClick={() => navigate('/fleet/add-bus-screen')} />
          </div>
        ) : (
          <>
            <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-5 py-3">Reg Number</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Bus Type</th>
                    <th className="px-5 py-3">Model</th>
                    <th className="px-5 py-3">Group</th>
                    <th className="px-5 py-3">SIM Number</th>
                    <th className="px-5 py-3">Contact</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedBuses.map(bus => (
                    <tr key={bus.id} className="hover:bg-slate-50 transition-colors text-xs text-slate-700">
                      <td className="px-5 py-3.5 font-semibold text-slate-900">{bus.regNumber}</td>
                      <td className="px-5 py-3.5">
                        <Badge status={bus.status} />
                      </td>
                      <td className="px-5 py-3.5">{bus.busType}</td>
                      <td className="px-5 py-3.5 text-slate-500">{bus.model || '—'}</td>
                      <td className="px-5 py-3.5">{bus.group?.name || '—'}</td>
                      <td className="px-5 py-3.5">{bus.simNumber}</td>
                      <td className="px-5 py-3.5">
                        <span className="block">{bus.contactName}</span>
                        <span className="text-slate-400">{bus.contactNumber}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => navigate(`/fleet/edit-bus-screen/${bus.id}`)}
                          className="text-brand hover:underline mr-3"
                        >
                          Edit
                        </button>
                        <button className="text-slate-400 hover:text-slate-600">
                          <MoreVertical size={14} className="inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={filteredBuses.length}
              itemsPerPage={itemsPerPage}
              className="mt-6"
            />
          </>
        )}
      </div>
    </AppLayout>
  )
}
