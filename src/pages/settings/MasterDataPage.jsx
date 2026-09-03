import { useState, useEffect, useMemo } from 'react'
import { Plus, Search, MapPin, Map, Database, Combine } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import api from '@/api/client'
import clsx from 'clsx'
import { EditStopModal } from './components/EditStopModal'
import { CombineStopsModal } from './components/CombineStopsModal'
import { AddStopModal } from './components/AddStopModal'

const TABS = [
  { id: 'states', label: 'States', icon: Map },
  { id: 'districts', label: 'Districts', icon: MapPin },
  { id: 'regions', label: 'Regions', icon: Map },
  { id: 'stops', label: 'Stops', icon: Database },
]

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState('states')
  const [data, setData] = useState({
    states: [],
    districts: [],
    regions: [],
    stops: []
  })
  const [loading, setLoading] = useState(true)
  const [editStopModalOpen, setEditStopModalOpen] = useState(false)
  const [addStopModalOpen, setAddStopModalOpen] = useState(false)
  const [combineModalOpen, setCombineModalOpen] = useState(false)
  const [selectedStop, setSelectedStop] = useState(null)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [filterState, setFilterState] = useState('')
  const [filterDistrict, setFilterDistrict] = useState('')

  const filteredItems = useMemo(() => {
    let items = data[activeTab] || []
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      items = items.filter(item => 
        item.name?.toLowerCase().includes(q) || 
        item.nameMl?.toLowerCase().includes(q)
      )
    }
    if (activeTab === 'stops') {
      if (filterState) {
        items = items.filter(item => item.state_id === filterState || item.stateMaster?.id === filterState)
      }
      if (filterDistrict) {
        items = items.filter(item => item.district_id === filterDistrict || item.districtMaster?.id === filterDistrict)
      }
    }
    return items
  }, [data, activeTab, searchQuery, filterState, filterDistrict])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const ObjectArray = (arr) => Array.isArray(arr) ? arr : []

      const [statesRes, districtsRes, regionsRes, stopsRes] = await Promise.all([
        api.get('/master-data/states'),
        api.get('/master-data/districts'),
        api.get('/master-data/regions'),
        api.get('/master-data/stops')
      ])

      setData({
        states: ObjectArray(statesRes.data),
        districts: ObjectArray(districtsRes.data),
        regions: ObjectArray(regionsRes.data),
        stops: ObjectArray(stopsRes.data)
      })
    } catch (error) {
      console.error('Failed to fetch master data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout title="Master Data" subtitle="Manage master records for States, Districts, Regions, and Stops.">
      <div className="flex flex-col h-full bg-slate-50 relative">

      {/* Tabs */}
      <div className="px-6 pt-4 bg-white border-b">
        <div className="flex gap-6">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setSearchQuery('')
                  setFilterState('')
                  setFilterDistrict('')
                }}
                className={clsx(
                  'flex items-center gap-2 pb-4 px-1 text-sm font-medium transition-colors relative',
                  isActive ? 'text-brand' : 'text-slate-500 hover:text-slate-900'
                )}
              >
                <Icon size={16} />
                {tab.label}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-t-full" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
          
          {/* Toolbar */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
              </div>
              
              {activeTab === 'stops' && (
                <>
                  <select
                    className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    value={filterState}
                    onChange={(e) => setFilterState(e.target.value)}
                  >
                    <option value="">All States</option>
                    {data.states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <select
                    className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    value={filterDistrict}
                    onChange={(e) => setFilterDistrict(e.target.value)}
                  >
                    <option value="">All Districts</option>
                    {data.districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {activeTab === 'stops' && (
                <button 
                  className="btn btn-secondary flex items-center gap-2 text-sm"
                  onClick={() => setCombineModalOpen(true)}
                >
                  <Combine size={16} /> Combine Stops
                </button>
              )}
              <button className="btn btn-secondary text-sm">Import CSV</button>
              <button 
                className="btn btn-primary flex items-center gap-2 text-sm"
                onClick={() => {
                  if (activeTab === 'stops') {
                    setAddStopModalOpen(true)
                  }
                }}
              >
                <Plus size={16} /> Add {TABS.find(t => t.id === activeTab)?.label.slice(0, -1)}
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading master data...</div>
            ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 sticky top-0 border-b">
                  <tr>
                    <th className="px-6 py-3 font-medium">Name</th>
                    {activeTab === 'districts' && <th className="px-6 py-3 font-medium">State</th>}
                    {activeTab === 'stops' && (
                      <>
                        <th className="px-6 py-3 font-medium">Name (ML)</th>
                        <th className="px-6 py-3 font-medium">Coordinates</th>
                        <th className="px-6 py-3 font-medium">District</th>
                        <th className="px-6 py-3 font-medium">State</th>
                        <th className="px-6 py-3 font-medium">Region</th>
                        <th className="px-6 py-3 font-medium">Assigned Routes</th>
                        <th className="px-6 py-3 font-medium">Description</th>
                      </>
                    )}
                    {!['states', 'districts'].includes(activeTab) && <th className="px-6 py-3 font-medium">Status</th>}
                    {activeTab === 'stops' && <th className="px-6 py-3 font-medium sticky right-0 bg-slate-50 z-10 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.05)]"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-700">
                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-6 py-8 text-center text-slate-500">
                        No {activeTab} found.
                      </td>
                    </tr>
                  )}
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium">{item.name}</td>
                      {activeTab === 'districts' && (
                        <td className="px-6 py-4">{item.state?.name || '-'}</td>
                      )}
                      {activeTab === 'stops' && (
                        <>
                          <td className="px-6 py-4">{item.nameMl || '-'}</td>
                          <td className="px-6 py-4 text-slate-500">{item.latitude}, {item.longitude}</td>
                          <td className="px-6 py-4">{item.districtMaster?.name || item.district || '-'}</td>
                          <td className="px-6 py-4">{item.stateMaster?.name || item.state || '-'}</td>
                          <td className="px-6 py-4">{item.regionMaster?.name || item.region || '-'}</td>
                          <td className="px-6 py-4">{item.assignedRoutesCount || 0}</td>
                          <td className="px-6 py-4 truncate max-w-[150px]" title={item.description}>{item.description || '-'}</td>
                        </>
                      )}
                      {!['states', 'districts'].includes(activeTab) && (
                        <td className="px-6 py-4">
                          <span className={clsx(
                            'px-2.5 py-1 rounded-full text-xs font-medium',
                            item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                          )}>
                            {item.status || 'active'}
                          </span>
                        </td>
                      )}
                      {activeTab === 'stops' && (
                        <td className="px-6 py-4 text-right sticky right-0 bg-white z-10 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.05)]">
                          <button
                            onClick={() => {
                              setSelectedStop(item)
                              setEditStopModalOpen(true)
                            }}
                            className="text-brand hover:text-brand-dark text-sm font-medium"
                          >
                            Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
    
    <EditStopModal
      open={editStopModalOpen}
      onClose={() => { setEditStopModalOpen(false); setSelectedStop(null) }}
      stop={selectedStop}
      masterData={data}
      onSave={() => {
        fetchData()
        setEditStopModalOpen(false)
        setSelectedStop(null)
      }}
    />

    <AddStopModal
      open={addStopModalOpen}
      onClose={() => setAddStopModalOpen(false)}
      masterData={data}
      onSave={() => fetchData()}
    />

    <CombineStopsModal
      open={combineModalOpen}
      onClose={() => setCombineModalOpen(false)}
      masterData={data}
      onSave={() => {
        fetchData()
      }}
    />

    </AppLayout>
  )
}
