import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Loader2, Search } from 'lucide-react'
import clsx from 'clsx'

/**
 * LocationAutocomplete — Google Maps-style location search with suggestions.
 * Uses the free Nominatim (OpenStreetMap) geocoding API.
 *
 * Props:
 *   label         – input label
 *   placeholder   – placeholder text
 *   value         – controlled text value
 *   onChange       – (text) => void, called on text change
 *   onSelect      – ({ name, displayName, lat, lng }) => void, called when a suggestion is selected
 *   className     – extra className for the wrapper
 */
export function LocationAutocomplete({ label, placeholder, value, onChange, onSelect, className }) {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const [highlightIdx, setHighlightIdx] = useState(-1)
  const debounceRef = useRef(null)
  const wrapperRef = useRef(null)
  const inputRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Debounced fetch from Nominatim
  const fetchSuggestions = useCallback((query) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!query || query.length < 2) {
      setSuggestions([])
      setOpen(false)
      setLoading(false)
      return
    }

    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=12&addressdetails=1`
        const res = await fetch(url, {
          headers: { 'Accept-Language': 'en' },
        })
        const data = await res.json()

        const mapped = data.map((item) => ({
          id: item.place_id,
          name: item.address?.city || item.address?.town || item.address?.village || item.address?.suburb || item.name || item.display_name.split(',')[0],
          displayName: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          type: item.type,
          address: item.address,
        }))

        setSuggestions(mapped)
        setOpen(mapped.length > 0)
        setHighlightIdx(-1)
      } catch {
        setSuggestions([])
        setOpen(false)
      } finally {
        setLoading(false)
      }
    }, 350)
  }, [])

  const handleInputChange = (e) => {
    const text = e.target.value
    onChange(text)
    fetchSuggestions(text)
  }

  const handleSelect = (suggestion) => {
    onChange(suggestion.name)
    onSelect?.(suggestion)
    setOpen(false)
    setSuggestions([])
    inputRef.current?.blur()
  }

  const handleKeyDown = (e) => {
    if (!open || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIdx((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIdx((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1))
    } else if (e.key === 'Enter' && highlightIdx >= 0) {
      e.preventDefault()
      handleSelect(suggestions[highlightIdx])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  // Build secondary text (state, district from address)
  const getSecondary = (suggestion) => {
    const parts = suggestion.displayName.split(',').map((s) => s.trim())
    // Take the 2nd and 3rd parts (usually district/state)
    return parts.slice(1, 3).join(', ')
  }

  return (
    <div ref={wrapperRef} className={clsx('relative', className)}>
      {label && (
        <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      )}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Search size={14} />
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => {
            setFocused(true)
            if (suggestions.length > 0) setOpen(true)
          }}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className={clsx(
            'w-full pl-8 pr-9 py-2 text-sm border rounded-lg transition-all duration-150 bg-white placeholder:text-slate-400',
            focused
              ? 'border-brand ring-2 ring-brand/20'
              : 'border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand'
          )}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <MapPin size={13} className="text-slate-400" />
        </div>
      </div>

      {/* Suggestions dropdown */}
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-lg shadow-black/8 overflow-hidden max-h-[260px] overflow-y-auto">
          {suggestions.map((suggestion, idx) => (
            <button
              key={suggestion.id}
              onMouseDown={(e) => {
                e.preventDefault()
                handleSelect(suggestion)
              }}
              onMouseEnter={() => setHighlightIdx(idx)}
              className={clsx(
                'w-full flex items-start gap-2.5 px-3 py-2.5 text-left transition-colors',
                idx === highlightIdx ? 'bg-brand/5' : 'hover:bg-slate-50',
                idx !== suggestions.length - 1 && 'border-b border-slate-50'
              )}
            >
              <div className={clsx(
                'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                idx === highlightIdx ? 'bg-brand/10' : 'bg-slate-100'
              )}>
                <MapPin size={13} className={idx === highlightIdx ? 'text-brand' : 'text-slate-400'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={clsx(
                  'text-xs font-medium truncate',
                  idx === highlightIdx ? 'text-brand' : 'text-slate-800'
                )}>
                  {suggestion.name}
                </p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {getSecondary(suggestion)}
                </p>
              </div>
              <span className="text-[9px] text-slate-300 font-mono mt-1 shrink-0">
                {suggestion.lat.toFixed(3)}, {suggestion.lng.toFixed(3)}
              </span>
            </button>
          ))}
          <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100">
            <p className="text-[9px] text-slate-400">Powered by OpenStreetMap Nominatim</p>
          </div>
        </div>
      )}

      {/* No results */}
      {open && suggestions.length === 0 && !loading && value.length >= 2 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-lg shadow-black/8 px-3 py-4 text-center">
          <p className="text-xs text-slate-400">No locations found</p>
        </div>
      )}
    </div>
  )
}
