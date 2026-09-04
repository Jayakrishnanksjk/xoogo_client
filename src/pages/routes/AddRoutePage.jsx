import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import AppLayout from '@/components/layout/AppLayout'
import { Input, Button, Modal } from '@/components/ui'
import {
  ArrowLeft, Plus, Trash2, Pencil, GripVertical, MapPin, Navigation,
  Route as RouteIcon, Clock, Milestone, X, Check, MousePointerClick, Crosshair
} from 'lucide-react'
import clsx from 'clsx'
import { routesApi } from '@/api'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { StopAutocomplete } from '@/components/ui/StopAutocomplete'

// ── Helpers ─────────────────────────────────────────────
function createNumberedIcon(number, type = 'intermediate') {
  const cls = `leaflet-numbered-marker marker-${type}`
  const size = type === 'intermediate' ? [28, 28] : [32, 32]
  return L.divIcon({
    className: '',
    html: `<div class="${cls}">${number}</div>`,
    iconSize: size,
    iconAnchor: [size[0] / 2, size[1] / 2],
  })
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371 // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function calcTotalDistance(stops) {
  let total = 0
  for (let i = 1; i < stops.length; i++) {
    total += haversineDistance(stops[i - 1].lat, stops[i - 1].lng, stops[i].lat, stops[i].lng)
  }
  return total
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function parseCoordinate(val) {
  if (val === undefined || val === null) return NaN
  let str = String(val).trim().toUpperCase()
  if (!str) return NaN

  // Determine sign based on compass directions (S or W indicates negative)
  let multiplier = 1
  if (str.includes('S') || str.includes('W') || str.endsWith('S') || str.endsWith('W')) {
    multiplier = -1
  }

  // Extract the numeric/decimal part
  const match = str.match(/-?([0-9]*\.[0-9]+|[0-9]+)/)
  if (match) {
    let num = parseFloat(match[0])
    return num * multiplier
  }
  return parseFloat(str)
}

function coordStr(lat, lng) {
  return `${parseFloat(lat).toFixed(5)}, ${parseFloat(lng).toFixed(5)}`
}


// ── Map sub-components ──────────────────────────────────
function FitBounds({ stops }) {
  const map = useMap()
  useEffect(() => {
    if (stops.length === 0) return
    const bounds = L.latLngBounds(stops.map((s) => [s.lat, s.lng]))
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 })
  }, [stops, map])
  return null
}

function MapClickHandler({ onMapClick, addMode }) {
  useMapEvents({
    click(e) {
      if (addMode) {
        onMapClick(e.latlng)
      }
    },
  })
  return null
}

function DraggableMarker({ stop, index, total, onDragEnd }) {
  const type = index === 0 ? 'start' : index === total - 1 ? 'end' : 'intermediate'
  const icon = createNumberedIcon(index + 1, type)

  return (
    <Marker
      position={[stop.lat, stop.lng]}
      icon={icon}
      draggable
      eventHandlers={{
        dragend: (e) => {
          const { lat, lng } = e.target.getLatLng()
          onDragEnd(stop.id, lat, lng)
        },
      }}
    />
  )
}

// ── Stop colors for the right panel ─────────────────────
const STOP_COLORS = [
  'bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500',
  'bg-pink-500', 'bg-teal-500', 'bg-orange-500', 'bg-red-500',
]

// ── Main Page ───────────────────────────────────────────
export default function AddRoutePage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditMode = !!id

  // Route form state
  const [routeName, setRouteName] = useState('')
  const [routeCode, setRouteCode] = useState('')
  const [startLat, setStartLat] = useState('')
  const [startLng, setStartLng] = useState('')
  const [endLat, setEndLat] = useState('')
  const [endLng, setEndLng] = useState('')
  const [estimatedDuration, setEstimatedDuration] = useState('')
  const [routeType, setRouteType] = useState('inbound')
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedExistingStop, setSelectedExistingStop] = useState(null)

  // Fetch route details if in edit mode
  useEffect(() => {
    if (isEditMode) {
      routesApi.get(id)
        .then((res) => {
          const route = res.data
          setRouteName(route.name)
          setRouteCode(route.code)
          setEstimatedDuration(route.estimatedDuration || '')
          setRouteType(route.routeType || 'inbound')
          setIsActive(route.status === 'active')
          const fetchedStops = (route.stops || []).map((s) => ({
            id: s.id,
            name: s.name,
            name_ml: s.name_ml ?? s.nameMl ?? '',
            lat: s.latitude !== undefined ? s.latitude : s.lat,
            lng: s.longitude !== undefined ? s.longitude : s.lng,
          }))
          setStops(fetchedStops)

          const startStop = fetchedStops[0]
          if (startStop) {
            setStartLat(String(startStop.lat))
            setStartLng(String(startStop.lng))
          }
          const endStop = fetchedStops[fetchedStops.length - 1]
          if (endStop && fetchedStops.length > 1) {
            setEndLat(String(endStop.lat))
            setEndLng(String(endStop.lng))
          }
        })
        .catch((err) => {
          console.error(err)
          toast.error('Failed to load route details')
          navigate('/routes')
        })
    }
  }, [id, isEditMode, navigate])

  // Stops
  const [stops, setStops] = useState([])
  const [routeGeometry, setRouteGeometry] = useState([])
  const [osrmDistance, setOsrmDistance] = useState(null)

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [stopForm, setStopForm] = useState({ name: '', name_ml: '', lat: '', lng: '', district: '', state: '' })
  const [editingStop, setEditingStop] = useState(null)
  const [modalError, setModalError] = useState('')

  // Sync start/end coords from first/last stop
  useEffect(() => {
    if (stops.length > 0) {
      setStartLat(String(stops[0].lat))
      setStartLng(String(stops[0].lng))
    } else {
      setStartLat('')
      setStartLng('')
    }
    if (stops.length > 1) {
      setEndLat(String(stops[stops.length - 1].lat))
      setEndLng(String(stops[stops.length - 1].lng))
    } else {
      setEndLat('')
      setEndLng('')
    }
  }, [stops])

  // Map click-to-add mode
  const [addMode, setAddMode] = useState(false)

  // Drag reorder state
  const [dragIdx, setDragIdx] = useState(null)

  // OSRM Road Routing fetch
  useEffect(() => {
    if (stops.length < 2) {
      setRouteGeometry([])
      setOsrmDistance(null)
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const coordsString = stops.map((s) => `${s.lng},${s.lat}`).join(';')
        const url = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`

        const res = await fetch(url, { signal: controller.signal })
        const data = await res.json()

        if (data.code === 'Ok' && data.routes?.[0]) {
          const route = data.routes[0]
          // Convert [lng, lat] to [lat, lng] for react-leaflet
          const points = route.geometry.coordinates.map(([lng, lat]) => [lat, lng])
          setRouteGeometry(points)
          setOsrmDistance(route.distance / 1000) // convert to km

          // Auto-fill duration if empty or if previously auto-filled
          if (route.duration) {
            const hours = Math.floor(route.duration / 3600)
            const minutes = Math.floor((route.duration % 3600) / 60)
            const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} hrs`
            setEstimatedDuration((prev) => {
              if (!prev || prev.endsWith('hrs')) {
                return formatted
              }
              return prev
            })
          }
        } else {
          // Fallback to straight line on error
          setRouteGeometry(stops.map((s) => [s.lat, s.lng]))
          setOsrmDistance(null)
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          // Fallback
          setRouteGeometry(stops.map((s) => [s.lat, s.lng]))
          setOsrmDistance(null)
        }
      }
    }, 300) // 300ms debounce

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [stops])

  // Computed values
  const totalDistance = useMemo(() => {
    if (stops.length < 2) return 0
    return osrmDistance !== null ? osrmDistance : calcTotalDistance(stops)
  }, [stops, osrmDistance])

  const polylinePositions = useMemo(() => stops.map((s) => [s.lat, s.lng]), [stops])

  // ── Handlers ────────────────────────────────────────────
  const handleOpenAddModal = () => {
    setStopForm({ name: '', name_ml: '', lat: '', lng: '', district: '', state: '' })
    setSelectedExistingStop(null)
    setModalError('')
    setShowAddModal(true)
  }

  const handleOpenEditModal = (stop) => {
    setStopForm({
      name: stop.name || '',
      name_ml: stop.name_ml || '',
      lat: stop.lat || '',
      lng: stop.lng || '',
      district: stop.district || '',
      state: stop.state || 'Kerala',
    })
    setEditingStop(stop.id)
    setModalError('')
    setShowAddModal(true)
  }

  const handleSaveStop = () => {
    const lat = parseCoordinate(stopForm.lat)
    const lng = parseCoordinate(stopForm.lng)

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setModalError('Invalid latitude (must be between -90 and 90)')
      return
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setModalError('Invalid longitude (must be between -180 and 180)')
      return
    }

    setModalError('')

    const name = stopForm.name.trim()
    const nameMl = stopForm.name_ml?.trim() || ''

    if (editingStop) {
      setStops((prev) =>
        prev.map((s) =>
          s.id === editingStop ? { ...s, name: name || s.name, name_ml: nameMl, lat, lng, district: stopForm.district, state: stopForm.state } : s
        )
      )
    } else {
      setStops((prev) => {
        const newStop = {
          id: genId(),
          name: name || '',
          name_ml: nameMl,
          lat,
          lng,
          district: stopForm.district,
          state: stopForm.state || 'Kerala',
        }
        const endIdx = prev.findIndex((s) => s._isEnd)
        if (endIdx !== -1) {
          const next = [...prev]
          next.splice(endIdx, 0, newStop)
          return next
        }
        return [...prev, newStop]
      })
    }
    setShowAddModal(false)
    setEditingStop(null)
  }

  const handleDeleteStop = (id) => {
    setStops((prev) => prev.filter((s) => s.id !== id))
  }

  const handleMapClick = useCallback(
    (latlng) => {
      setStops((prev) => {
        const newStop = {
          id: genId(),
          name: '',
          name_ml: '',
          lat: latlng.lat,
          lng: latlng.lng,
        }
        const endIdx = prev.findIndex((s) => s._isEnd)
        if (endIdx !== -1) {
          const next = [...prev]
          next.splice(endIdx, 0, newStop)
          return next
        }
        return [...prev, newStop]
      })
    },
    []
  )

  const handleMarkerDrag = useCallback((id, lat, lng) => {
    setStops((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, lat, lng } : s
      )
    )
  }, [])

  // Drag reorder handlers
  const handleDragStart = (idx) => setDragIdx(idx)
  const handleDragOver = (e, idx) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === idx) return
    setStops((prev) => {
      const copy = [...prev]
      const [moved] = copy.splice(dragIdx, 1)
      copy.splice(idx, 0, moved)
      return copy
    })
    setDragIdx(idx)
  }
  const handleDragEnd = () => {
    setDragIdx(null)
  }

  const handleSaveRoute = async () => {
    if (!routeName) {
      toast.error('Route name is required')
      return
    }
    if (!routeCode) {
      toast.error('Route code is required')
      return
    }
    if (stops.length < 2) {
      toast.error('At least 2 stops are required (Start and End)')
      return
    }

    try {
      setSaving(true)
      const payload = {
        name: routeName,
        code: routeCode,
        estimatedDuration: estimatedDuration || '—',
        distance: parseFloat(totalDistance.toFixed(1)),
        routeType,
        status: isActive ? 'active' : 'inactive',
        stops: stops.map((s, idx) => ({
          id: s.id,
          name: s.name || '',
          name_ml: s.name_ml || '',
          lat: s.lat,
          lng: s.lng,
          _isStart: idx === 0,
          _isEnd: idx === stops.length - 1,
        }))
      }

      if (isEditMode) {
        await routesApi.update(id, payload)
        toast.success('Route updated successfully')
      } else {
        await routesApi.create(payload)
        toast.success('Route created successfully')
      }
      navigate('/routes')
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} route`)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveDraft = async () => {
    try {
      setSaving(true)
      const payload = {
        name: routeName || `Draft Route — ${formatDate(new Date())}`,
        code: routeCode || `DRAFT-${Date.now()}`,
        estimatedDuration: estimatedDuration || '—',
        distance: parseFloat(totalDistance.toFixed(1)),
        routeType,
        status: 'inactive',
        stops: stops.map((s, idx) => ({
          id: s.id,
          name: s.name || '',
          name_ml: s.name_ml || '',
          lat: s.lat,
          lng: s.lng,
          _isStart: idx === 0,
          _isEnd: idx === stops.length - 1,
        }))
      }

      if (isEditMode) {
        await routesApi.update(id, payload)
        toast.success('Route draft updated')
      } else {
        await routesApi.create(payload)
        toast.success('Route saved as draft')
      }
      navigate('/routes')
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Failed to save draft')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout title="Routes & Stops" subtitle="Create and manage routes and their stops">
      <div className="p-6">
        {/* Page header */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => navigate('/routes')}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft size={15} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-base font-semibold text-slate-900">{isEditMode ? 'Edit Route' : 'Add New Route'}</h1>
            <p className="text-xs text-slate-400">
              {isEditMode ? 'Modify route details, stops, and preview on the map' : 'Define route details, add stops, and preview on the map'}
            </p>
          </div>
        </div>

        {/* 3-panel layout */}
        <div className={clsx('grid grid-cols-12 gap-4', addMode && 'add-stop-cursor')}>
          {/* ── LEFT: Route Details ────────────────────── */}
          <div className="col-span-3 space-y-4">
            <div className="bg-white rounded-xl shadow-card border border-slate-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-md bg-brand/10 flex items-center justify-center">
                  <RouteIcon size={13} className="text-brand" />
                </div>
                <h2 className="text-sm font-semibold text-slate-900">Route Details</h2>
              </div>

              <div className="space-y-3.5">
                <div>
                  <Input
                    label="Route Name *"
                    placeholder="Kannur → Kasaragod"
                    value={routeName}
                    onChange={(e) => setRouteName(e.target.value)}
                  />
                </div>

                <div>
                  <Input
                    label="Route Code *"
                    placeholder="KNR-KSD-001"
                    value={routeCode}
                    onChange={(e) => setRouteCode(e.target.value)}
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Unique code for this route</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Start Latitude *"
                    placeholder="e.g. 11.7413"
                    value={startLat}
                    onChange={(e) => setStartLat(e.target.value)}
                  />
                  <Input
                    label="Start Longitude *"
                    placeholder="e.g. 75.4907"
                    value={startLng}
                    onChange={(e) => setStartLng(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="End Latitude *"
                    placeholder="e.g. 12.2958"
                    value={endLat}
                    onChange={(e) => setEndLat(e.target.value)}
                  />
                  <Input
                    label="End Longitude *"
                    placeholder="e.g. 75.7503"
                    value={endLng}
                    onChange={(e) => setEndLng(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Total Stops</label>
                    <div className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-700">
                      {stops.length}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Total Distance</label>
                    <div className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-700">
                      {totalDistance > 0 ? `${totalDistance.toFixed(1)} km` : '—'}
                    </div>
                  </div>
                </div>

                <div>
                  <Input
                    label="Estimated Duration"
                    placeholder="01:45 hrs"
                    value={estimatedDuration}
                    onChange={(e) => setEstimatedDuration(e.target.value)}
                    suffix={<Clock size={13} className="text-slate-400" />}
                  />
                </div>

                {/* Route Type Toggle */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Route Type</label>
                  {/* <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                    <button
                      onClick={() => setRouteType('inbound')}
                      className={clsx(
                        'flex-1 py-1.5 text-xs font-medium transition-colors',
                        routeType === 'inbound'
                          ? 'bg-brand text-white'
                          : 'bg-white text-slate-500 hover:bg-slate-50'
                      )}
                    >
                      Inbound
                    </button>
                    <button
                      onClick={() => setRouteType('outbound')}
                      className={clsx(
                        'flex-1 py-1.5 text-xs font-medium transition-colors',
                        routeType === 'outbound'
                          ? 'bg-brand text-white'
                          : 'bg-white text-slate-500 hover:bg-slate-50'
                      )}
                    >
                      Outbound
                    </button>
                  </div> */}
                </div>

                {/* Status Toggle */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Status</label>
                  <button
                    onClick={() => setIsActive(!isActive)}
                    className="flex items-center gap-2"
                  >
                    <div
                      className={clsx(
                        'w-9 h-5 rounded-full transition-colors duration-200 relative',
                        isActive ? 'bg-brand' : 'bg-slate-300'
                      )}
                    >
                      <div
                        className={clsx(
                          'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
                          isActive ? 'translate-x-4' : 'translate-x-0.5'
                        )}
                      />
                    </div>
                    <span className="text-xs text-slate-600 font-medium">{isActive ? 'Active' : 'Inactive'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Hint card */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 flex items-start gap-2.5">
              <MousePointerClick size={15} className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-700 leading-relaxed">
                Add stops on the map or use the <strong>Add Stop</strong> button on the right.
              </p>
            </div>
          </div>

          {/* ── CENTER: Map ───────────────────────────── */}
          <div className="col-span-6 flex flex-col gap-3">
            {/* Map toolbar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAddMode(!addMode)}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                    addMode
                      ? 'bg-brand text-white border-brand shadow-md shadow-brand/20'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  )}
                >
                  <Crosshair size={13} />
                  {addMode ? 'Click Map to Add' : 'Draw Route'}
                </button>
                <Button
                  size="sm"
                  variant="secondary"
                  startIcon={Plus}
                  label="Add Stop"
                  onClick={handleOpenAddModal}
                />
                {stops.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm('Remove all stops?')) setStops([])
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-500 bg-red-50 border border-red-100 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={12} />
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {/* Map */}
            <div className="bg-white rounded-xl shadow-card border border-slate-100 overflow-hidden flex-1 min-h-[460px]">
              <MapContainer
                center={[11.8745, 75.3704]}
                zoom={10}
                className="w-full h-full min-h-[460px]"
                zoomControl={true}
                attributionControl={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickHandler onMapClick={handleMapClick} addMode={addMode} />
                {stops.length > 0 && <FitBounds stops={stops} />}

                {/* Polyline */}
                {stops.length >= 2 && (
                  <Polyline
                    positions={routeGeometry.length > 0 ? routeGeometry : polylinePositions}
                    pathOptions={{
                      color: '#2563EB',
                      weight: 4,
                      opacity: 0.8,
                      dashArray: null,
                      lineCap: 'round',
                      lineJoin: 'round',
                    }}
                  />
                )}

                {/* Markers */}
                {stops.map((stop, idx) => (
                  <DraggableMarker
                    key={stop.id}
                    stop={stop}
                    index={idx}
                    total={stops.length}
                    onDragEnd={handleMarkerDrag}
                  />
                ))}
              </MapContainer>
            </div>

            {/* Bottom info bar */}
            <div className="bg-white rounded-xl shadow-card border border-slate-100 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-brand/10 flex items-center justify-center">
                    <Milestone size={12} className="text-brand" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400">Total Stops</p>
                    <p className="text-sm font-semibold text-slate-800">{stops.length}</p>
                  </div>
                </div>
                <div className="w-px h-8 bg-slate-100" />
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-purple-50 flex items-center justify-center">
                    <Navigation size={12} className="text-purple-500" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400">Total Distance</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {totalDistance > 0 ? `${totalDistance.toFixed(1)} km` : '—'}
                    </p>
                  </div>
                </div>
                <div className="w-px h-8 bg-slate-100" />
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-50 flex items-center justify-center">
                    <Clock size={12} className="text-amber-500" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400">Est. Duration</p>
                    <p className="text-sm font-semibold text-slate-800">{estimatedDuration || '—'}</p>
                  </div>
                </div>
                <div className="w-px h-8 bg-slate-100" />
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center">
                    <RouteIcon size={12} className="text-green-500" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400">Route Type</p>
                    <p className="text-sm font-semibold text-slate-800 capitalize">{routeType}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Stops & Sequence ───────────────── */}
          <div className="col-span-3">
            <div className="bg-white rounded-xl shadow-card border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-900">
                  Stops & Sequence{' '}
                  <span className="text-slate-400 font-normal">({stops.length})</span>
                </h2>
                <Button
                  size="sm"
                  startIcon={Plus}
                  label="Add Stop"
                  onClick={handleOpenAddModal}
                />
              </div>

              {/* Stops list */}
              {stops.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <MapPin size={24} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">No stops added yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Click the map or use Add Stop</p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
                  {stops.map((stop, idx) => {
                    const isFirst = idx === 0
                    const isLast = idx === stops.length - 1

                    return (
                      <div
                        key={stop.id}
                        draggable
                        onDragStart={() => handleDragStart(idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDragEnd={handleDragEnd}
                        className={clsx(
                          'group flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-all cursor-grab active:cursor-grabbing',
                          dragIdx === idx
                            ? 'bg-brand/5 border-brand/20 shadow-sm'
                            : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
                        )}
                      >
                        <GripVertical size={13} className="text-slate-300 shrink-0" />

                        {/* Numbered dot */}
                        <div
                          className={clsx(
                            'w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0',
                            isFirst ? 'bg-green-500' : isLast ? 'bg-red-500' : STOP_COLORS[(idx) % STOP_COLORS.length]
                          )}
                        >
                          {idx + 1}
                        </div>

                        {/* Stop info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-800 truncate">{stop.name || coordStr(stop.lat, stop.lng)}</p>
                          <p className="text-[10px] text-slate-400 font-mono truncate">{stop.name ? coordStr(stop.lat, stop.lng) : ''}</p>
                          {stop.name_ml && (
                            <p className="text-[10px] text-slate-500 truncate">{stop.name_ml}</p>
                          )}
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {isFirst && (
                              <span className="text-[9px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                                Start
                              </span>
                            )}
                            {isLast && stops.length > 1 && (
                              <span className="text-[9px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                                End
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenEditModal(stop)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-brand transition-colors"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteStop(stop.id)}
                            className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Drag hint */}
              {stops.length > 1 && (
                <div className="flex items-center gap-1.5 mt-3 px-1">
                  <GripVertical size={12} className="text-slate-300" />
                  <p className="text-[10px] text-slate-400">Drag to reorder stops</p>
                </div>
              )}

              {/* Route Preview */}
              {stops.length > 0 && (
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-semibold text-slate-700 mb-2.5">Route Preview</h3>
                  <div className="space-y-1.5">
                    {stops.map((stop, idx) => (
                      <div key={stop.id} className="flex items-center gap-2">
                        <span
                          className={clsx(
                            'w-2 h-2 rounded-full shrink-0',
                            idx === 0
                              ? 'bg-green-500'
                              : idx === stops.length - 1
                                ? 'bg-red-500'
                                : STOP_COLORS[idx % STOP_COLORS.length]
                          )}
                        />
                        <span className="text-[11px] text-slate-600 truncate">{stop.name || coordStr(stop.lat, stop.lng)}</span>
                        {stop.name_ml && <span className="text-[10px] text-slate-400 truncate">{stop.name_ml}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom action bar */}
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-200">
          <Button variant="secondary" label="Cancel" onClick={() => navigate('/routes')} disabled={saving} />
          <div className="flex items-center gap-3">
            <Button variant="secondary" label="Save as Draft" onClick={handleSaveDraft} disabled={saving} />
            <Button
              label={isEditMode ? 'Save Changes' : 'Create Route'}
              startIcon={Check}
              loading={saving}
              disabled={!routeName || stops.length < 2}
              onClick={handleSaveRoute}
            />
          </div>
        </div>
      </div>

      {/* ── Add/Edit Stop Modal ────────────────────────── */}
      <Modal
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setEditingStop(null)
        }}
        title={editingStop ? 'Edit Stop' : 'Add New Stop'}
      >
        <div className="space-y-3.5 py-2">
          {modalError && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-100 text-xs text-red-600 font-medium">
              {modalError}
            </div>
          )}
          <StopAutocomplete
            label="Stop Name (English) *"
            value={stopForm.name}
            selectedStop={selectedExistingStop}
            onChangeText={(val) => setStopForm((f) => ({ ...f, name: val }))}
            onSelect={(stop) => {
              setStopForm({
                name: stop.name,
                name_ml: stop.nameMl || stop.name_ml || '',
                lat: stop.latitude != null ? String(stop.latitude) : '',
                lng: stop.longitude != null ? String(stop.longitude) : '',
                district: stop.district || '',
                state: stop.state || 'Kerala',
              })
              setSelectedExistingStop(stop)
            }}
            onClear={() => {
              setSelectedExistingStop(null)
              setStopForm((f) => ({ ...f, name: '' }))
            }}
            placeholder="Search existing stops or type new name..."
          />
          <Input
            label="Stop Name (Malayalam)"
            placeholder="e.g. സെൻട്രൽ സ്റ്റേഷൻ"
            value={stopForm.name_ml}
            onChange={(e) => setStopForm((f) => ({ ...f, name_ml: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Latitude *"
              placeholder="e.g. 11.7413"
              value={stopForm.lat}
              onChange={(e) => setStopForm((f) => ({ ...f, lat: e.target.value }))}
              disabled={!!selectedExistingStop}
            />
            <Input
              label="Longitude *"
              placeholder="e.g. 75.4907"
              value={stopForm.lng}
              onChange={(e) => setStopForm((f) => ({ ...f, lng: e.target.value }))}
              disabled={!!selectedExistingStop}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="District *"
              placeholder="e.g. Ernakulam"
              value={stopForm.district}
              onChange={(e) => setStopForm((f) => ({ ...f, district: e.target.value }))}
            />
            <Input
              label="State *"
              placeholder="e.g. Kerala"
              value={stopForm.state}
              onChange={(e) => setStopForm((f) => ({ ...f, state: e.target.value }))}
            />
          </div>
          <div className="bg-blue-50 rounded-lg p-2.5 flex items-start gap-2">
            <Crosshair size={13} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-blue-700">
              Tip: Enable <strong>Draw Route</strong> mode and click directly on the map to add stops.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
          <Button
            variant="secondary"
            label="Cancel"
            onClick={() => {
              setShowAddModal(false)
              setEditingStop(null)
            }}
          />
          <Button
            label={editingStop ? 'Save Changes' : 'Add Stop'}
            onClick={handleSaveStop}
            disabled={!stopForm.lat || !stopForm.lng}
          />
        </div>
      </Modal>
    </AppLayout>
  )
}
