import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Search, MapPin, X } from 'lucide-react'
import clsx from 'clsx'
import { routesApi } from '@/api'

export function StopAutocomplete({
  value = '',
  onSelect,
  onChangeText,
  onClear,
  selectedStop = null,
  label,
  placeholder = 'Search or type stop name...',
  error,
  containerClassName,
  disabled = false,
}) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [highlightIdx, setHighlightIdx] = useState(-1)
  const wrapperRef = useRef(null)
  const inputRef = useRef(null)
  const debounceRef = useRef(null)

  // Sync external value changes
  useEffect(() => {
    setQuery(value)
  }, [value])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const doSearch = useCallback(async (q) => {
    if (q.length < 2) {
      setResults([])
      setOpen(false)
      return
    }
    setLoading(true)
    try {
      const res = await routesApi.searchStops(q)
      setResults(res.data || [])
      setOpen(true)
      setHighlightIdx(-1)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleInputChange = (e) => {
    const val = e.target.value
    setQuery(val)
    onChangeText?.(val)

    // Debounce search
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(val), 300)
  }

  const handleSelect = (stop) => {
    setQuery(stop.name)
    setOpen(false)
    setResults([])
    onSelect?.(stop)
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setOpen(false)
    onClear?.()
    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIdx((prev) => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIdx((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && highlightIdx >= 0) {
      e.preventDefault()
      handleSelect(results[highlightIdx])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={wrapperRef} className={clsx('relative w-full', containerClassName)}>
      {label && (
        <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      )}

      {/* Selected stop badge */}
      {selectedStop && (
        <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs">
          <MapPin size={12} className="text-brand shrink-0" />
          <span className="font-medium text-slate-800">
            Reusing existing stop
          </span>
          <span className="text-slate-500">
            — used in {selectedStop.usageCount || 0} route(s)
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="ml-auto p-0.5 hover:bg-blue-100 rounded text-slate-500 hover:text-slate-700 transition-colors"
            title="Clear selection to create new"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {!selectedStop && (
        <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <Search size={14} />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results.length > 0) setOpen(true) }}
          placeholder={placeholder}
          disabled={disabled || !!selectedStop}
          className={clsx(
            'w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all duration-150 bg-white placeholder:text-slate-400',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            (disabled || selectedStop) && 'bg-slate-50 text-slate-500 cursor-not-allowed',
          )}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-3.5 h-3.5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      )}

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 border border-slate-100">
          {results.map((stop, idx) => (
            <button
              key={stop.id}
              type="button"
              onClick={() => handleSelect(stop)}
              onMouseEnter={() => setHighlightIdx(idx)}
              className={clsx(
                'w-full text-left px-3 py-2.5 flex items-start gap-2 transition-colors',
                highlightIdx === idx ? 'bg-brand text-white' : 'text-slate-900 hover:bg-slate-50'
              )}
            >
              <MapPin size={13} className={clsx('shrink-0 mt-0.5', highlightIdx === idx ? 'text-white/80' : 'text-slate-400')} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium truncate">{stop.name}</span>
                  {stop.nameMl && (
                    <span className={clsx('text-[11px] truncate', highlightIdx === idx ? 'text-white/70' : 'text-slate-400')}>
                      {stop.nameMl}
                    </span>
                  )}
                </div>
                <div className={clsx('flex items-center gap-2 text-[11px] mt-0.5', highlightIdx === idx ? 'text-white/60' : 'text-slate-400')}>
                  {stop.latitude && stop.longitude && (
                    <span className="font-mono">
                      {Number(stop.latitude).toFixed(4)}, {Number(stop.longitude).toFixed(4)}
                    </span>
                  )}
                  <span>·</span>
                  <span>{stop.usageCount || 0} route(s)</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && results.length === 0 && !loading && query.length >= 2 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg bg-white py-3 px-4 text-sm shadow-lg ring-1 ring-black/5 border border-slate-100 text-slate-500 text-center">
          No existing stops found. A new stop will be created.
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 mt-1">{error.message || error}</p>
      )}
    </div>
  )
}
