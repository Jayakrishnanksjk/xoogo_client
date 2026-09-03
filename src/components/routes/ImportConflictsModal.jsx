import React, { useState, useMemo } from 'react'
import { Modal, Button, Badge, StopAutocomplete } from '@/components/ui'
import { AlertTriangle, Check, Plus, Link2, ChevronRight, X, Database } from 'lucide-react'
import clsx from 'clsx'

export function ImportConflictsModal({
  open,
  onClose,
  previewData,
  onConfirm,
  confirming = false,
}) {
  // resolutions: Record<string, { action: 'map' | 'create' | 'skip', stopId?: string, stop?: any }>
  const [resolutions, setResolutions] = useState(() => initResolutions(previewData))

  function initResolutions(data) {
    const initial = {}
    if (data?.mappings) {
      for (const m of data.mappings) {
        if (m.status === 'mapped') {
          initial[m.key] = { action: 'map', stopId: m.mappedStopId, stop: m.existingStops.find(s => s.id === m.mappedStopId) || m.existingStops[0] }
        } else {
          initial[m.key] = { action: 'skip' }
        }
      }
    }
    return initial
  }

  // Update resolutions when previewData changes
  useMemo(() => {
    setResolutions(initResolutions(previewData))
  }, [previewData])

  const handleResolve = (key, action, stop = null) => {
    setResolutions(prev => ({
      ...prev,
      [key]: { action, stopId: stop?.id, stop }
    }))
  }

  const handleConfirm = () => {
    const resPayload = {}
    for (const [k, v] of Object.entries(resolutions)) {
      if (v.action === 'map' && v.stopId) {
        resPayload[k] = v.stopId
      } else if (v.action === 'create') {
        resPayload[k] = 'create'
      } else {
        resPayload[k] = 'skip'
      }
    }

    onConfirm?.({
      routes: previewData.routes,
      resolutions: resPayload,
    })
  }

  if (!previewData) return null

  const stats = previewData.stats || { total: 0, mapped: 0, unmapped: 0, ambiguous: 0 }
  
  // Calculate current resolution stats
  let willMap = 0
  let willCreate = 0
  let willSkip = 0
  
  for (const v of Object.values(resolutions)) {
    if (v.action === 'map') willMap++
    else if (v.action === 'create') willCreate++
    else willSkip++
  }

  return (
    <Modal
      open={open}
      onClose={() => { if (!confirming) onClose() }}
      title="Import Preview & Mapping"
      subtitle={`${previewData.routes?.length || 0} route(s) · ${previewData.totalStops || 0} total stop(s)`}
      width="max-w-6xl"
    >
      <div className="flex flex-col h-[75vh]">
        {/* Summary */}
        <div className="flex items-center gap-6 bg-slate-50 border rounded-xl p-4 mb-4 shrink-0">
          <div className="flex-1 grid grid-cols-4 gap-4 divide-x">
            <div className="px-4">
              <div className="text-xs text-slate-500 font-medium">Total CSV Rows</div>
              <div className="text-lg font-semibold text-slate-800">{stats.total}</div>
            </div>
            <div className="px-4">
              <div className="text-xs text-slate-500 font-medium">Auto Mapped</div>
              <div className="text-lg font-semibold text-emerald-600">{stats.mapped}</div>
            </div>
            <div className="px-4">
              <div className="text-xs text-slate-500 font-medium">Ambiguous Matches</div>
              <div className="text-lg font-semibold text-amber-600">{stats.ambiguous}</div>
            </div>
            <div className="px-4">
              <div className="text-xs text-slate-500 font-medium">Unmapped</div>
              <div className="text-lg font-semibold text-rose-600">{stats.unmapped}</div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between mb-3 shrink-0">
          <div className="text-sm font-medium text-slate-700">
            Review Mappings
          </div>
          <div className="text-xs flex gap-4 text-slate-500 font-medium">
            <span className="text-emerald-600 flex items-center gap-1"><Link2 size={12}/> {willMap} Mapping</span>
            <span className="text-blue-600 flex items-center gap-1"><Plus size={12}/> {willCreate} Creating</span>
            <span className="text-slate-400 flex items-center gap-1"><X size={12}/> {willSkip} Skipping</span>
          </div>
        </div>

        {/* Mapping List */}
        <div className="flex-1 overflow-y-auto border rounded-xl bg-slate-50">
          <div className="grid grid-cols-12 gap-px bg-slate-200">
            {/* Header */}
            <div className="col-span-6 bg-white p-3 text-xs font-semibold text-slate-500 uppercase flex items-center sticky top-0 z-10">
              CSV Import Record
            </div>
            <div className="col-span-6 bg-white p-3 text-xs font-semibold text-slate-500 uppercase flex items-center sticky top-0 z-10">
              Master Data Mapping
            </div>

            {/* Rows */}
            {previewData.mappings?.map((m) => {
              const res = resolutions[m.key] || { action: 'skip' }
              const csv = m.csvStop

              return (
                <React.Fragment key={m.key}>
                  {/* Left: CSV Record */}
                  <div className="col-span-6 bg-white p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-slate-800">{csv.name}</div>
                        {csv.name_ml && <div className="text-xs text-slate-500">{csv.name_ml}</div>}
                      </div>
                      {csv.stop_id && (
                        <Badge variant="outline" className="text-[10px] font-mono">ID: {csv.stop_id}</Badge>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
                      {(csv.state || csv.district) ? (
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded truncate">
                          {[csv.district, csv.state].filter(Boolean).join(', ')}
                        </span>
                      ) : null}
                      <span className="font-mono">
                        {csv.latitude?.toFixed(4)}, {csv.longitude?.toFixed(4)}
                      </span>
                    </div>
                    
                    {/* Status hint from preview */}
                    <div className="mt-2">
                      {m.status === 'mapped' && <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">100% Match</span>}
                      {m.status === 'ambiguous' && <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">{m.existingStops.length} Duplicate Matches Found</span>}
                      {m.status === 'unmapped' && <span className="text-[10px] font-medium text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">No Match Found</span>}
                    </div>
                  </div>

                  {/* Right: Master Mapping */}
                  <div className={clsx("col-span-6 p-4 flex flex-col justify-center transition-colors", 
                    res.action === 'map' ? 'bg-emerald-50/50' : 
                    res.action === 'create' ? 'bg-blue-50/50' : 'bg-white'
                  )}>
                    {res.action === 'map' && res.stop ? (
                      <div className="border border-emerald-200 bg-white rounded-lg p-3 shadow-sm relative">
                        <div className="absolute top-3 right-3 text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                          ID: {res.stop.id}
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <Database size={14} className="text-emerald-500" />
                          <div className="font-medium text-emerald-900 text-sm">{res.stop.name}</div>
                        </div>
                        <div className="text-[11px] text-slate-500 pl-5">
                          {[res.stop.district, res.stop.state].filter(Boolean).join(', ')}
                        </div>
                        <div className="mt-3 flex justify-end">
                          <button onClick={() => handleResolve(m.key, 'skip')} className="text-[11px] text-slate-500 hover:text-slate-700 underline">
                            Change mapping
                          </button>
                        </div>
                      </div>
                    ) : res.action === 'create' ? (
                      <div className="border border-blue-200 bg-white rounded-lg p-3 shadow-sm flex flex-col items-center justify-center text-center">
                        <div className="text-blue-600 mb-1"><Plus size={16} /></div>
                        <div className="text-sm font-medium text-blue-900">Will create new Master Stop</div>
                        <div className="text-[11px] text-slate-500 mt-1">This stop will be added to the global database.</div>
                        <button onClick={() => handleResolve(m.key, 'skip')} className="mt-2 text-[11px] text-slate-500 hover:text-slate-700 underline">
                          Cancel creation
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 w-full max-w-sm mx-auto">
                        <StopAutocomplete
                          placeholder="Search Master Data to map..."
                          value=""
                          onChangeText={() => {}}
                          onSelect={(stop) => handleResolve(m.key, 'map', stop)}
                          hideMapTip
                        />
                        <div className="flex items-center gap-2 mt-1">
                          <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => handleResolve(m.key, 'create')}>
                            <Plus size={12} className="mr-1" /> Create New
                          </Button>
                          <Button variant="ghost" size="sm" className="flex-1 text-xs text-rose-600 hover:bg-rose-50" disabled>
                            <X size={12} className="mr-1" /> Skipped
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </React.Fragment>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t shrink-0">
          <div className="text-xs text-slate-500">
            Skipped records will not be imported into the route.
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={confirming}>Cancel</Button>
            <Button onClick={handleConfirm} loading={confirming}>
              <Check size={14} className="mr-1" /> Finalize Import
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
