import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import AppLayout from '@/components/layout/AppLayout'
import { Badge, EmptyState, Button, Input, Tabs, ConfirmDialog } from '@/components/ui'
import { MapPin, Plus, ChevronRight, MoreVertical, Search, Trash2 } from 'lucide-react'
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
    const bounds = L.latLngBounds(stops.map((s) => [s.lat, s.lng]))
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

  const fetchRoutes = async () => {
    try {
      setLoading(true)
      const res = await routesApi.list()
      setRoutes(res.data)
      if (res.data.length > 0) {
        setSelected((prev) => {
          const found = res.data.find((r) => r.id === prev?.id)
          return found || res.data[0]
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

  const handleDeleteRoute = async () => {
    const { routeId } = deleteConfirm
    if (!routeId) return
    try {
      await routesApi.delete(routeId)
      toast.success('Route deleted successfully')
      setDeleteConfirm({ open: false, routeId: null, routeName: '' })
      fetchRoutes()
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Failed to delete route')
    }
  }

  const filtered = useMemo(() => {
    return routes.filter((r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.code.toLowerCase().includes(search.toLowerCase())
    )
  }, [routes, search])

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
                onClick={() => navigate('/routes/add')}
              />
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
                    variant="secondary"
                    size="sm"
                    className="px-4 rounded-lg"
                    label="Edit"
                    onClick={() => navigate(`/routes/edit/${selected.id}`)}
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    className="px-4 rounded-lg"
                    label="Delete"
                    onClick={() => setDeleteConfirm({ open: true, routeId: selected.id, routeName: selected.name })}
                  />
                </div>
              </div>

              {/* Route summary */}
              <div className="grid grid-cols-4 gap-4 mb-5 p-4 bg-slate-50 rounded-xl">
                <div><p className="text-xs text-slate-500">Start</p><p className="text-sm font-medium text-slate-800 truncate">{selected.stops?.[0]?.name || '—'}</p></div>
                <div><p className="text-xs text-slate-500">End</p><p className="text-sm font-medium text-slate-800 truncate">{selected.stops?.[selected.stops.length - 1]?.name || '—'}</p></div>
                <div><p className="text-xs text-slate-500">Total Stops</p><p className="text-sm font-medium text-slate-800">{selected.stops?.length || 0}</p></div>
                <div><p className="text-xs text-slate-500">Distance</p><p className="text-sm font-medium text-slate-800">{selected.distance ? `${selected.distance.toFixed(1)} km` : '—'}</p></div>
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
                            <th className="p-3 text-xs font-semibold text-slate-500 uppercase">Stop Name</th>
                            <th className="p-3 text-xs font-semibold text-slate-500 uppercase">Location</th>
                            <th className="p-3 text-xs font-semibold text-slate-500 uppercase">Coordinates</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selected.stops.map((stop, idx) => (
                            <tr key={stop.id || idx} className="border-b border-slate-50 hover:bg-slate-50/50">
                              <td className="p-3 text-xs font-medium text-slate-500">{idx + 1}</td>
                              <td className="p-3 text-xs font-semibold text-slate-800">{stop.name}</td>
                              <td className="p-3 text-xs text-slate-500">{stop.location}</td>
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
                        center={[selected.stops[0].lat, selected.stops[0].lng]}
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
                            positions={selectedRouteGeometry.length > 0 ? selectedRouteGeometry : selected.stops.map((s) => [s.lat, s.lng])}
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
