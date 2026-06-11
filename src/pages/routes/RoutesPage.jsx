import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import AppLayout from '@/components/layout/AppLayout'
import { Badge, EmptyState, Button, Tabs, ConfirmDialog, Modal } from '@/components/ui'
import { MapPin, Plus, ChevronRight, MoreVertical, Trash2, Upload } from 'lucide-react'
import { routesApi } from '@/api'
import { toast } from 'sonner'

// ── Leaflet Helpers ─────────────────────────────────────
function createNumberedIcon(number, type = 'intermediate') {
  const cls = `leaflet-numbered-marker marker-${type}`
  const size = type === 'intermediate' ? [24, 24] : [28, 28]
  return L.divIcon({
    className: '',
    html: `<div class="${cls}">${number}</div>`,
    iconSize: size,
    iconAnchor: [size[0] / 2, size[1] / 2],
  })
}

function FitBounds({ stops }) {
  const map = useMap()
  useEffect(() => {
    if (!stops || stops.length === 0) return
    const coords = stops
      .filter((s) => s.lat != null && s.lng != null)
      .map((s) => [s.lat, s.lng])
    if (coords.length === 0) return
    const bounds = L.latLngBounds(coords)
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 })
  }, [stops, map])
  return null
}

export default function RoutesPage() {
  const navigate = useNavigate()
  const [routes, setRoutes] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('stops')
  const [selectedRouteGeometry, setSelectedRouteGeometry] = useState([])
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, routeId: null, routeName: '' })
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [importing, setImporting] = useState(false)

  const fetchRoutes = async () => {
    try {
      setLoading(true)
      const res = await routesApi.list()
      const normalized = res.data.map(r => ({
        ...r,
        stops: (r.stops || []).map(s => ({
          ...s,
          lat: s.lat ?? s.latitude,
          lng: s.lng ?? s.longitude,
        })),
      }))
      setRoutes(normalized)
      if (normalized.length > 0) {
        setSelected((prev) => {
          const found = normalized.find((r) => r.id === prev?.id)
          return found || normalized[0]
        })
      } else {
        setSelected(null)
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to load routes from server')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoutes()
  }, [])

  // OSRM routing for the selected route map view
  useEffect(() => {
    if (!selected || !selected.stops || selected.stops.length < 2) {
      setSelectedRouteGeometry([])
      return
    }

    let active = true
    const fetchSelectedRoute = async () => {
      try {
        const coordsString = selected.stops.map((s) => `${s.lng},${s.lat}`).join(';')
        const url = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`
        const res = await fetch(url)
        const data = await res.json()
        if (active && data.code === 'Ok' && data.routes?.[0]) {
          const points = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng])
          setSelectedRouteGeometry(points)
        } else if (active) {
          setSelectedRouteGeometry(selected.stops.map((s) => [s.lat, s.lng]))
        }
      } catch (err) {
        if (active) {
          setSelectedRouteGeometry(selected.stops.map((s) => [s.lat, s.lng]))
        }
      }
    }
    fetchSelectedRoute()
    return () => {
      active = false
    }
  }, [selected])

  const handleImportCSV = async () => {
    if (!importFile) return
    const formData = new FormData()
    formData.append('file', importFile)
    try {
      setImporting(true)
      const res = await routesApi.importCsv(formData)
      toast.success(`${res.data.imported} route(s) imported successfully`)
      if (res.data.errors?.length > 0) {
        toast.error(`${res.data.errors.length} route(s) had errors`)
      }
      setImportModalOpen(false)
      setImportFile(null)
      fetchRoutes()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to import routes')
    } finally {
      setImporting(false)
    }
  }

  const handleDeleteRoute = async () => {
    const { routeId } = deleteConfirm
    if (!routeId) return
    const routeData = routes.find(r => r.id === routeId)
    try {
      await routesApi.delete(routeId)
      setDeleteConfirm({ open: false, routeId: null, routeName: '' })
      fetchRoutes()
      toast.success('Route deleted', {
        action: routeData ? { label: 'Undo', onClick: () => routesApi.create({
          name: routeData.name,
          code: routeData.code,
          estimatedDuration: routeData.estimatedDuration,
          distance: routeData.distance,
          routeType: routeData.routeType,
          status: routeData.status,
        }).then(fetchRoutes).catch((err) => toast.error(err?.response?.data?.message || 'Failed to restore route')) } : undefined,
        duration: 5000,
      })
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Failed to delete route')
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return routes.filter((r) =>
      r.name?.toLowerCase().includes(q) ||
      r.code?.toLowerCase().includes(q)
    )
  }, [routes, search])

  // Clear selection if selected route is no longer in filtered results
  useEffect(() => {
    if (selected && !filtered.find(r => r.id === selected.id)) {
      setSelected(filtered.length > 0 ? filtered[0] : null)
    }
  }, [filtered, selected])

  return (
    <AppLayout title="Routes & Stops" subtitle="Create and manage routes and their stops" searchValue={search} onSearchChange={setSearch}>
      <div className="p-6 max-w-screen-xl">
        <div className="flex gap-4">

          {/* Left: route list */}
          <div className="w-80 shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <Button
                variant="outline"
                className="shrink-0"
                onClick={() => setImportModalOpen(true)}
              >
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                Import CSV
              </Button>
              <Button
                className="shrink-0"
                onClick={() => navigate('/routes/add')}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Create
              </Button>
            </div>

            <div className="space-y-2">
              {loading ? (
                <div className="flex justify-center items-center py-12 bg-white rounded-xl border border-slate-100 shadow-card">
                  <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs bg-white rounded-xl border border-slate-100 shadow-card">
                  No routes found.
                </div>
              ) : (
                filtered.map(route => {
                  const numStops = route.stops?.length || 0
                  const distStr = route.distance ? `${route.distance.toFixed(1)} km` : '—'
                  return (
                    <div
                      key={route.id}
                      onClick={() => setSelected(route)}
                      className={`bg-white rounded-xl shadow-card border border-slate-100 p-5 cursor-pointer transition-all ${selected?.id === route.id ? 'ring-2 ring-brand' : 'hover:shadow-card-md'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                            <MapPin size={13} className="text-brand" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-900 truncate max-w-[180px]">{route.name}</p>
                            <p className="text-xs text-slate-400">{numStops} Stops · {distStr}</p>
                          </div>
                        </div>
                      </div>
                      <Badge status={route.status} />
                    </div>
                  )
                })
              )}
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="px-4 rounded-lg"
                    onClick={() => navigate(`/routes/edit/${selected.id}`)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="px-4 rounded-lg"
                    onClick={() => setDeleteConfirm({ open: true, routeId: selected.id, routeName: selected.name })}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              {/* Route summary */}
              <div className="grid grid-cols-4 gap-4 mb-5 p-4 bg-slate-50 rounded-xl">
                <div><p className="text-xs text-slate-500">Start Coords</p><p className="text-sm font-mono font-medium text-slate-800 truncate">{selected.stops?.[0]?.lat != null ? `${selected.stops[0].lat.toFixed(5)}, ${selected.stops[0].lng.toFixed(5)}` : '—'}</p></div>
                <div><p className="text-xs text-slate-500">End Coords</p><p className="text-sm font-mono font-medium text-slate-800 truncate">{selected.stops?.[selected.stops.length - 1]?.lat != null ? `${selected.stops[selected.stops.length - 1].lat.toFixed(5)}, ${selected.stops[selected.stops.length - 1].lng.toFixed(5)}` : '—'}</p></div>
                <div><p className="text-xs text-slate-500">Total Stops</p><p className="text-sm font-medium text-slate-800">{selected.stops?.length || 0}</p></div>
                <div><p className="text-xs text-slate-500">Distance</p><p className="text-sm font-medium text-slate-800">{selected.distance != null ? `${selected.distance.toFixed(1)} km` : '—'}</p></div>
              </div>

              {/* Tabs */}
              <Tabs
                variant="underline"
                tabs={[
                  { value: 'stops', label: 'Stops' },
                  { value: 'map', label: 'Route Map' },
                  { value: 'details', label: 'Details' }
                ]}
                active={activeTab}
                onChange={setActiveTab}
                className="mb-4"
              />

              {/* Tab panels */}
              {activeTab === 'stops' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-slate-700">Route Stops ({selected.stops?.length || 0})</p>
                  </div>
                  {(!selected.stops || selected.stops.length === 0) ? (
                    <div className="text-center py-10 text-slate-400 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      No stops defined for this route.
                    </div>
                  ) : (
                    <div className="border border-slate-100 rounded-xl overflow-hidden bg-white max-h-[300px] overflow-y-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="p-3 text-xs font-semibold text-slate-500 uppercase">Seq</th>
                            <th className="p-3 text-xs font-semibold text-slate-500 uppercase">Coordinates</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selected.stops.map((stop, idx) => (
                            <tr key={stop.id || idx} className="border-b border-slate-50 hover:bg-slate-50/50">
                              <td className="p-3 text-xs font-medium text-slate-500">{idx + 1}</td>
                              <td className="p-3 text-xs text-slate-400 font-mono">
                                {stop.lat?.toFixed(5)}, {stop.lng?.toFixed(5)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'map' && (
                <div>
                  {(!selected.stops || selected.stops.length === 0) ? (
                    <div className="text-center py-16 text-slate-400 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      Add stops to view the route map.
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden h-[360px] relative z-10">
                      <MapContainer
                        center={selected.stops?.[0]?.lat != null && selected.stops?.[0]?.lng != null ? [selected.stops[0].lat, selected.stops[0].lng] : [10.8505, 76.2711]}
                        zoom={11}
                        className="w-full h-full min-h-[360px]"
                        zoomControl={true}
                        attributionControl={true}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <FitBounds stops={selected.stops} />
                        
                        {/* Polyline */}
                        {selected.stops.length >= 2 && (
                          <Polyline
                            positions={selectedRouteGeometry.length > 0 ? selectedRouteGeometry : selected.stops.filter((s) => s.lat != null && s.lng != null).map((s) => [s.lat, s.lng])}
                            pathOptions={{
                              color: '#2563EB',
                              weight: 4,
                              opacity: 0.8,
                              lineCap: 'round',
                              lineJoin: 'round',
                              }}
                            />
                          )}
  
                          {/* Markers */}
                          {selected.stops.map((stop, idx) => {
                            if (stop.lat == null || stop.lng == null) return null
                            const isFirst = idx === 0
                            const isLast = idx === selected.stops.length - 1
                            const type = isFirst ? 'start' : isLast ? 'end' : 'intermediate'
                            const icon = createNumberedIcon(idx + 1, type)
                            return (
                              <Marker
                                key={stop.id || idx}
                                position={[stop.lat, stop.lng]}
                                icon={icon}
                              />
                            )
                          })}
                        </MapContainer>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'details' && (
                <div className="bg-slate-50 rounded-xl p-5 space-y-4">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">General Info</h3>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400">Route Name:</span>
                        <span className="ml-2 font-medium text-slate-800">{selected.name}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Route Code:</span>
                        <span className="ml-2 font-mono font-medium text-slate-800">{selected.code}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Estimated Duration:</span>
                        <span className="ml-2 font-medium text-slate-800">{selected.estimatedDuration || '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Route Type:</span>
                        <span className="ml-2 font-medium text-slate-800 capitalize">{selected.routeType}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 bg-white rounded-xl shadow-card border border-slate-100 p-5">
              <EmptyState icon={MapPin} title="Select a route" description="Click a route from the list to view its details and stops." />
            </div>
          )}
        </div>
      </div>

      <Modal
        open={importModalOpen}
        onClose={() => { if (!importing) { setImportModalOpen(false); setImportFile(null) } }}
        title="Import Routes from CSV"
        subtitle="Upload a CSV file with route and stop data"
      >
        <div className="space-y-4">
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-brand/50 transition-colors cursor-pointer" onClick={() => document.getElementById('csv-file-input')?.click()}>
            {importFile ? (
              <div className="space-y-1">
                <Upload className="size-8 text-brand mx-auto" />
                <p className="text-sm font-medium text-slate-700">{importFile.name}</p>
                <p className="text-xs text-slate-400">{(importFile.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div className="space-y-1">
                <Upload className="size-8 text-slate-300 mx-auto" />
                <p className="text-sm font-medium text-slate-600">Click to select CSV file</p>
                <p className="text-xs text-slate-400">.csv files only</p>
              </div>
            )}
            <input
              id="csv-file-input"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={e => setImportFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500 space-y-1">
            <p className="font-medium text-slate-700">Expected CSV format:</p>
            <code className="block text-xs text-slate-400 break-all">
              route_name,route_code,estimated_duration,distance,route_type,status,stop_name,latitude,longitude,stop_sequence
            </code>
            <p className="mt-1">Each stop is a separate row. Route info is grouped by route_code.</p>
            <button
              type="button"
              className="text-brand hover:underline mt-1"
              onClick={() => {
                const sample = 'route_name,route_code,estimated_duration,distance,route_type,status,stop_name,latitude,longitude,stop_sequence\n' +
                  'Downtown Express,D001,45 mins,15.2,outbound,active,Central Station,10.0123,76.1234,1\n' +
                  'Downtown Express,D001,45 mins,15.2,outbound,active,Market Square,10.0345,76.1456,2\n' +
                  'Uptown Local,U002,30 mins,8.5,inbound,active,North Terminal,10.1000,76.2000,1\n' +
                  'Uptown Local,U002,30 mins,8.5,inbound,active,Library Stop,10.1111,76.2111,2'
                const blob = new Blob([sample], { type: 'text/csv' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url; a.download = 'sample-routes.csv'; a.click()
                URL.revokeObjectURL(url)
              }}
            >
              Download sample CSV
            </button>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => { setImportModalOpen(false); setImportFile(null) }}
              disabled={importing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImportCSV}
              disabled={!importFile || importing}
              loading={importing}
            >
              {importing ? 'Importing...' : 'Import'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, routeId: null, routeName: '' })}
        onConfirm={handleDeleteRoute}
        title="Delete Route"
        message={`Are you sure you want to delete route "${deleteConfirm.routeName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
      />
    </AppLayout>
  )
}
