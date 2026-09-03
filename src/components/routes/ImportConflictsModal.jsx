import React, { useState, useMemo, useEffect } from 'react'
import { Modal, Button, Badge, Input, StopAutocomplete } from '@/components/ui'
import { AlertTriangle, Check, Plus, MapPin, Link2, ChevronRight, ChevronLeft } from 'lucide-react'
import clsx from 'clsx'

export function ImportConflictsModal({
  open,
  onClose,
  previewData,
  onConfirm,
  confirming = false,
}) {
  const [step, setStep] = useState(1) // 1: Conflicts, 2: Missing Details

  const [resolutions, setResolutions] = useState(() => {
    const initial = {}
    if (previewData?.conflicts) {
      for (const c of previewData.conflicts) {
        initial[c.key] = c.existingStops[0] || null
      }
    }
    return initial
  })

  // State for missing details (district, state) for new stops
  // Keyed by lowercase stop name to avoid filling out duplicates
  const [newStopsDetails, setNewStopsDetails] = useState({})

  // Rebuild when previewData changes
  useMemo(() => {
    if (!previewData?.conflicts) return
    setResolutions((prev) => {
      const next = { ...prev }
      for (const c of previewData.conflicts) {
        if (!(c.key in next)) {
          next[c.key] = c.existingStops[0] || null
        }
      }
      return next
    })
    setStep(1)
  }, [previewData])

  const handleBulkAction = (action) => {
    const next = { ...resolutions }
    for (const c of (previewData?.conflicts || [])) {
      next[c.key] = action === 'reuse' ? (c.existingStops[0] || null) : null
    }
    setResolutions(next)
  }

  const handleResolve = (key, stopObj) => {
    setResolutions((prev) => ({ ...prev, [key]: stopObj }))
  }

  const handleNextStep = () => {
    // Collect all new stops or existing stops missing details
    const requiredStops = new Map()
    for (const r of (previewData?.routes || [])) {
      for (const s of r.stops) {
        const resolvedStop = resolutions[s.key]
        if (!resolvedStop) {
          const lowerName = s.name.trim().toLowerCase()
          if (!requiredStops.has(lowerName)) {
            requiredStops.set(lowerName, { name: s.name.trim(), initialDistrict: '', initialState: 'Kerala' })
          }
        } else if (!resolvedStop.district || !resolvedStop.state) {
          const lowerName = resolvedStop.name.trim().toLowerCase()
          if (!requiredStops.has(lowerName)) {
            requiredStops.set(lowerName, { 
              name: resolvedStop.name.trim(), 
              initialDistrict: resolvedStop.district || '', 
              initialState: resolvedStop.state || 'Kerala' 
            })
          }
        }
      }
    }
    
    if (requiredStops.size === 0) {
      // No missing details, we can confirm immediately
      handleConfirm()
    } else {
      // Initialize state for any required stops not yet in state
      setNewStopsDetails((prev) => {
        const next = { ...prev }
        requiredStops.forEach((val, key) => {
          if (!next[key]) {
            next[key] = { district: val.initialDistrict, state: val.initialState }
          }
        })
        return next
      })
      setStep(2)
    }
  }

  const handleConfirm = () => {
    // Map resolutions back to IDs
    const resIds = {}
    for (const [k, v] of Object.entries(resolutions)) {
      resIds[k] = v ? v.id : null
    }

    // Attach district/state to stops in routes
    const finalRoutes = previewData.routes.map(r => ({
      ...r,
      stops: r.stops.map(s => {
        const resolvedStop = resolutions[s.key]
        if (!resolvedStop) {
          const lowerName = s.name.trim().toLowerCase()
          const details = newStopsDetails[lowerName]
          if (details) {
            return { ...s, district: details.district, state: details.state }
          }
        } else if (!resolvedStop.district || !resolvedStop.state) {
          const lowerName = resolvedStop.name.trim().toLowerCase()
          const details = newStopsDetails[lowerName]
          if (details) {
            return { ...s, district: details.district, state: details.state }
          }
        }
        return s
      })
    }))

    onConfirm?.({
      routes: finalRoutes,
      resolutions: resIds,
    })
  }

  const totalConflicts = previewData?.conflicts?.length || 0
  const reuseCount = Object.values(resolutions).filter(v => v != null).length
  const newCount = totalConflicts - reuseCount

  if (!previewData) return null

  // Check if step 2 is valid (all new stops have district and state)
  const isStep2Valid = Object.values(newStopsDetails).every(d => d.district.trim() && d.state.trim())

  return (
    <Modal
      open={open}
      onClose={() => { if (!confirming) onClose() }}
      title={step === 1 ? "Import Preview — Resolve Conflicts" : "Import Preview — Missing Details"}
      subtitle={step === 1 
        ? `${previewData.routes?.length || 0} route(s) · ${previewData.totalStops || 0} stop(s) · ${totalConflicts} conflict(s)` 
        : "Please provide the District and State for stops missing these details."}
      width="max-w-5xl"
    >
      <div className="flex flex-col" style={{ maxHeight: 'calc(80vh - 120px)' }}>
        
        {step === 1 && (
          <>
            {/* Summary bar — always visible */}
            <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 shrink-0">
              <div className="flex items-center gap-2 text-xs">
                <AlertTriangle size={14} className="text-amber-500" />
                <span className="font-medium text-amber-800">
                  {totalConflicts} stop(s) match existing stops
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleBulkAction('reuse')}
                  className="px-2.5 py-1 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors border border-blue-200"
                >
                  <Link2 size={11} className="inline mr-1 -mt-px" />
                  Reuse all
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkAction('create')}
                  className="px-2.5 py-1 text-[11px] font-medium text-slate-600 bg-white hover:bg-slate-50 rounded-md transition-colors border border-slate-200"
                >
                  <Plus size={11} className="inline mr-1 -mt-px" />
                  Create all new
                </button>
              </div>
            </div>

            {/* Scrollable middle — table + routes list */}
            <div className="overflow-y-auto flex-1 min-h-[300px] space-y-4 mb-4 pb-64">
              {/* Conflict table */}
              <div className="border border-slate-100 rounded-xl overflow-visible">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 sticky top-0 z-20">
                      <th className="p-3 text-xs font-semibold text-slate-500 uppercase w-[15%]">Route</th>
                      <th className="p-3 text-xs font-semibold text-slate-500 uppercase w-[30%]">CSV Stop</th>
                      <th className="p-3 text-xs font-semibold text-slate-500 uppercase w-[55%]">Resolution (Select existing or leave empty for New)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.conflicts.map((conflict) => {
                      const routeCode = conflict.key.split('::')[0]
                      const isReuse = resolutions[conflict.key] != null
                      const selectedObj = resolutions[conflict.key] || null

                      return (
                        <tr key={conflict.key} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className="p-3 text-xs font-mono text-slate-600 align-top break-all">{routeCode}</td>
                          <td className="p-3 align-top">
                            <div className="text-xs font-medium text-slate-800 truncate">{conflict.csvStop.name}</div>
                            {conflict.csvStop.name_ml && (
                              <div className="text-[11px] text-slate-400 truncate">{conflict.csvStop.name_ml}</div>
                            )}
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {conflict.csvStop.latitude?.toFixed(4)}, {conflict.csvStop.longitude?.toFixed(4)}
                            </div>
                          </td>
                          <td className="p-3 align-top">
                            <div className="w-full">
                              <StopAutocomplete
                                placeholder="Search existing stops..."
                                value={selectedObj ? selectedObj.name : ''}
                                selectedStop={selectedObj}
                                onChangeText={() => {}}
                                onSelect={(stop) => handleResolve(conflict.key, stop)}
                                onClear={() => handleResolve(conflict.key, null)}
                                hideMapTip
                              />
                            </div>
                            {!isReuse && (
                              <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded inline-flex">
                                <Plus size={10} /> Creating as New Stop
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 shrink-0">
              <div className="text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Link2 size={11} className="text-brand" /> {reuseCount} reuse
                </span>
                <span className="mx-2">·</span>
                <span className="inline-flex items-center gap-1">
                  <Plus size={11} className="text-emerald-500" /> {newCount} new
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={handleNextStep}>
                  Next <ChevronRight size={14} className="ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="overflow-y-auto flex-1 min-h-0 space-y-4 mb-4 pb-4">
              <p className="text-sm text-slate-600 mb-2">
                The following stops require a District and State before finalization.
              </p>
              
              <div className="space-y-3">
                {Object.keys(newStopsDetails).map((keyName) => {
                  const details = newStopsDetails[keyName]
                  // capitalize the key for display
                  const displayName = keyName.charAt(0).toUpperCase() + keyName.slice(1)
                  return (
                    <div key={keyName} className="p-4 rounded-xl border border-slate-100 bg-slate-50 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <div className="font-medium text-slate-800 text-sm truncate">
                        {displayName}
                      </div>
                      <Input
                        placeholder="District *"
                        value={details.district}
                        onChange={(e) => setNewStopsDetails(prev => ({
                          ...prev, [keyName]: { ...prev[keyName], district: e.target.value }
                        }))}
                        size="sm"
                      />
                      <Input
                        placeholder="State *"
                        value={details.state}
                        onChange={(e) => setNewStopsDetails(prev => ({
                          ...prev, [keyName]: { ...prev[keyName], state: e.target.value }
                        }))}
                        size="sm"
                      />
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 shrink-0">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft size={14} className="mr-1" /> Back
              </Button>
              <Button
                onClick={handleConfirm}
                loading={confirming}
                disabled={confirming || !isStep2Valid}
              >
                <Check size={14} className="mr-1" />
                Finalize Import
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

