import { useState, useEffect, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Bus, Clock, MapPin, Shield, Info, Activity } from 'lucide-react'

// Default center (Kerala, India coordinates)
const DEFAULT_CENTER = [10.8505, 76.2711]

// Custom Leaflet Bus Marker creator
function createBusMarker(regNumber, status) {
  const isOnline = status === 'online'
  const html = `
    <div class="bus-marker-container">
      ${isOnline ? '<div class="bus-pulse-ring pulse-online"></div>' : ''}
      <div class="bus-marker-icon-wrapper ${isOnline ? 'bus-online' : 'bus-offline'}">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v7c0 .6.4 1 1 1h1"></path>
          <circle cx="8" cy="17" r="2"></circle>
          <circle cx="16" cy="17" r="2"></circle>
          <path d="M4 11h9.5"></path>
          <path d="M8 7v4"></path>
        </svg>
      </div>
      <div class="bus-marker-label">${regNumber}</div>
    </div>
  `
  return L.divIcon({
    className: '',
    html: html,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
}

// Fit Bounds component to fit map view to all online/offline buses
function FitFleetBounds({ buses, hasRunRef }) {
  const map = useMap()

  useEffect(() => {
    if (!buses || buses.length === 0 || hasRunRef.current) return

    const coords = buses.map(bus => {
      if (bus.route?.stops && bus.route.stops.length > 0) {
        return [bus.route.stops[0].lat, bus.route.stops[0].lng]
      }
      return DEFAULT_CENTER
    })

    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords)
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 })
      hasRunRef.current = true
    }
  }, [buses, map, hasRunRef])

  return null
}

// Main component
export function LiveTrackingMap({ buses = [], height = '400px' }) {
  const [simulatedTime, setSimulatedTime] = useState(Date.now())
  const [selectedBusId, setSelectedBusId] = useState(null)
  const hasRunRef = useRef(false)

  // Reset bounds flag when the number of buses changes significantly
  const busesLen = buses.length
  useEffect(() => {
    hasRunRef.current = false
  }, [busesLen])

  // Update time periodically to animate movement
  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedTime(Date.now())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Position interpolation function
  const getPosition = (bus, time) => {
    // If offline, place it at the first stop or default
    const isOnline = bus.status === 'online'

    if (!bus.route?.stops || bus.route.stops.length === 0) {
      // Jitter based on bus registry or ID to avoid overlap
      const seed = bus.id ? bus.id.split('-').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0
      const jitterLat = ((seed % 100) - 50) * 0.0008
      const jitterLng = ((seed % 97) - 48) * 0.0008
      return [DEFAULT_CENTER[0] + jitterLat, DEFAULT_CENTER[1] + jitterLng]
    }

    const stops = bus.route.stops
    if (stops.length === 1) {
      return [stops[0].lat, stops[0].lng]
    }

    if (!isOnline) {
      // Offline buses stay at their first stop
      return [stops[0].lat, stops[0].lng]
    }

    // online: simulate traveling along the stops
    // 30 seconds per segment, loop around stops
    const segmentDuration = 30000 // 30 seconds
    const totalSegments = stops.length - 1
    const loopDuration = segmentDuration * totalSegments * 2 // two-way trip

    const seedVal = bus.id ? bus.id.split('-').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0
    const timeWithOffset = time + (seedVal * 1000) // Desynchronize buses

    const progressMs = timeWithOffset % loopDuration
    
    let currentSegment
    let segmentProgress
    let isReturning = progressMs >= (loopDuration / 2)
    let adjustedProgress = progressMs % (loopDuration / 2)

    if (!isReturning) {
      currentSegment = Math.floor(adjustedProgress / segmentDuration)
      segmentProgress = (adjustedProgress % segmentDuration) / segmentDuration
      
      const start = stops[currentSegment]
      const end = stops[currentSegment + 1]
      if (!start || !end) return [stops[0].lat, stops[0].lng]

      const lat = start.lat + (end.lat - start.lat) * segmentProgress
      const lng = start.lng + (end.lng - start.lng) * segmentProgress
      return [lat, lng]
    } else {
      // Traveling back
      const reverseIdx = totalSegments - Math.floor(adjustedProgress / segmentDuration)
      segmentProgress = (adjustedProgress % segmentDuration) / segmentDuration

      const start = stops[reverseIdx]
      const end = stops[reverseIdx - 1]
      if (!start || !end) return [stops[0].lat, stops[0].lng]

      const lat = start.lat + (end.lat - start.lat) * segmentProgress
      const lng = start.lng + (end.lng - start.lng) * segmentProgress
      return [lat, lng]
    }
  }

  // Map buses with simulated coordinates and metadata
  const mappedBuses = useMemo(() => {
    return buses.map(bus => {
      const pos = getPosition(bus, simulatedTime)
      // Mock some telemetry data
      const isOnline = bus.status === 'online'
      const speed = isOnline ? Math.floor(35 + (Math.sin(simulatedTime / 5000 + (bus.id?.charCodeAt(0) || 0)) * 15)) : 0
      
      return {
        ...bus,
        currentPos: pos,
        speed: speed,
        rssi: isOnline ? Math.floor(-75 + (Math.sin(simulatedTime / 3000) * 10)) : -110,
      }
    })
  }, [buses, simulatedTime])

  const selectedBus = useMemo(() => {
    return mappedBuses.find(b => b.id === selectedBusId)
  }, [mappedBuses, selectedBusId])

  return (
    <div className="w-full h-full flex flex-col lg:flex-row gap-4">
      {/* Map Window */}
      <div 
        className="flex-1 bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm relative z-10"
        style={{ height: height }}
      >
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={10}
          className="w-full h-full"
          zoomControl={true}
          attributionControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FitFleetBounds buses={buses} hasRunRef={hasRunRef} />

          {/* Render Route Polyline for Selected Bus */}
          {selectedBus?.route?.stops && selectedBus.route.stops.length >= 2 && (
            <Polyline
              positions={selectedBus.route.stops.map(s => [s.lat, s.lng])}
              pathOptions={{
                color: '#6366f1', // Indigo 500
                weight: 4,
                opacity: 0.8,
                dashArray: '8, 8',
                lineCap: 'round',
              }}
            />
          )}

          {/* Render Bus Markers */}
          {mappedBuses.map(bus => {
            const marker = createBusMarker(bus.regNumber, bus.status)
            return (
              <Marker
                key={bus.id}
                position={bus.currentPos}
                icon={marker}
                eventHandlers={{
                  click: () => {
                    setSelectedBusId(bus.id)
                  }
                }}
              >
                <Popup className="custom-leaflet-popup">
                  <div className="p-1 space-y-2 min-w-[200px] text-slate-800">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <span className="font-mono font-bold text-xs text-slate-900">{bus.regNumber}</span>
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${
                        bus.status === 'online' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-slate-50 text-slate-500 border border-slate-200'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${bus.status === 'online' ? 'bg-green-500' : 'bg-slate-400'}`} />
                        {bus.status === 'online' ? 'Online' : 'Offline'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[10px] text-slate-600">
                      <div>
                        <p className="text-[9px] text-slate-400 font-medium uppercase">Group</p>
                        <p className="font-semibold text-slate-700 truncate">{bus.group?.name || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 font-medium uppercase">Type</p>
                        <p className="font-semibold text-slate-700 capitalize">{bus.busType || '—'}</p>
                      </div>
                      {bus.route && (
                        <div className="col-span-2">
                          <p className="text-[9px] text-slate-400 font-medium uppercase">Route</p>
                          <p className="font-semibold text-slate-700 truncate">{bus.route.name}</p>
                        </div>
                      )}
                      {bus.status === 'online' && (
                        <>
                          <div>
                            <p className="text-[9px] text-slate-400 font-medium uppercase">Speed</p>
                            <p className="font-semibold text-slate-800">{bus.speed} km/h</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-400 font-medium uppercase">Signal (RSSI)</p>
                            <p className="font-semibold text-slate-800">{bus.rssi} dBm</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </div>

      {/* Right Telemetry Panel (only visible on large layout if selected) */}
      {selectedBus && (
        <div className="w-full lg:w-72 bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4 shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-mono text-sm font-bold text-slate-900">{selectedBus.regNumber}</h4>
              <p className="text-xs text-slate-400 font-medium">{selectedBus.busType} · {selectedBus.model || 'Standard model'}</p>
            </div>
            <button 
              onClick={() => setSelectedBusId(null)}
              className="text-xs text-slate-400 hover:text-slate-600 font-medium"
            >
              Clear
            </button>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-100">
            {/* Status bar */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1.5"><Activity size={13} /> Status</span>
              <span className={`font-semibold ${selectedBus.status === 'online' ? 'text-green-600' : 'text-slate-500'}`}>
                {selectedBus.status === 'online' ? 'Online & Tracking' : 'Offline'}
              </span>
            </div>

            {/* Simulated speed */}
            {selectedBus.status === 'online' && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1.5"><Info size={13} /> Current Speed</span>
                <span className="font-bold text-slate-800 font-mono">{selectedBus.speed} km/h</span>
              </div>
            )}

            {/* Route & stops info */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1.5"><MapPin size={13} /> Assigned Route</span>
              <span className="font-semibold text-slate-700 truncate max-w-[130px]">{selectedBus.route?.name || 'No Route'}</span>
            </div>

            {/* Sim Number info */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1.5"><Clock size={13} /> SIM No.</span>
              <span className="font-mono font-medium text-slate-700">{selectedBus.simNumber}</span>
            </div>

            {/* Contact Person */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1.5"><Shield size={13} /> Contact</span>
              <span className="font-semibold text-slate-700">{selectedBus.contactName}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
