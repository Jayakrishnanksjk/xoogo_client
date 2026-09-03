import React, { useState, useMemo } from 'react'
import { Modal, Button } from '@/components/ui'
import { toast } from 'sonner'
import api from '@/api/client'
import clsx from 'clsx'

export function CombineStopsModal({ open, onClose, masterData, onSave }) {
  const [primaryStopId, setPrimaryStopId] = useState('')
  const [duplicateStopIds, setDuplicateStopIds] = useState([])
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const stops = masterData?.stops || []

  const filteredStops = useMemo(() => {
    if (!searchQuery) {
      // If no search, only show stops that have exact name duplicates, sorted by name
      const nameCounts = {}
      stops.forEach(s => {
        const lowerName = s.name.toLowerCase().trim()
        nameCounts[lowerName] = (nameCounts[lowerName] || 0) + 1
      })
      const duplicatesOnly = stops.filter(s => nameCounts[s.name.toLowerCase().trim()] > 1)
      return duplicatesOnly.sort((a, b) => a.name.localeCompare(b.name)).slice(0, 300)
    }
    // If searching, show any stop matching the query to allow fuzzy duplicate matching
    const lowerQ = searchQuery.toLowerCase()
    return stops.filter(s => s.name.toLowerCase().includes(lowerQ))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 100)
  }, [stops, searchQuery])

  const toggleDuplicate = (id) => {
    if (id === primaryStopId) return
    setDuplicateStopIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handlePrimaryChange = (id) => {
    setPrimaryStopId(id)
    if (duplicateStopIds.includes(id)) {
      setDuplicateStopIds(prev => prev.filter(x => x !== id))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!primaryStopId || duplicateStopIds.length === 0) {
      toast.error('Please select a primary stop and at least one duplicate.')
      return
    }

    setSaving(true)
    try {
      await api.post('/master-data/stops/combine', {
        primaryStopId,
        duplicateStopIds
      })
      toast.success('Stops combined successfully')
      onSave()
      onClose()
      setPrimaryStopId('')
      setDuplicateStopIds([])
      setSearchQuery('')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to combine stops')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={() => { if (!saving) onClose() }} title="Combine Duplicate Stops" width="max-w-2xl">
      <form onSubmit={handleSubmit} className="flex flex-col h-[70vh]">
        <div className="mb-4">
          <p className="text-sm text-slate-600 mb-3">
            Select a <strong>Primary Stop</strong> (the one to keep) and one or more <strong>Duplicate Stops</strong> (to merge and delete). All route assignments will be transferred to the primary stop.
            <br/><span className="text-xs text-slate-500">By default, only exact name duplicates are shown. Search to find similar names (e.g. "Aluva" and "Aluva Bus Stand").</span>
          </p>
          <input
            type="text"
            placeholder="Search stops to select..."
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-auto border rounded-lg bg-slate-50">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-100 text-slate-600 sticky top-0">
              <tr>
                <th className="px-4 py-2 font-medium w-24 text-center">Primary</th>
                <th className="px-4 py-2 font-medium w-24 text-center">Duplicate</th>
                <th className="px-4 py-2 font-medium">Stop Name</th>
                <th className="px-4 py-2 font-medium">District</th>
              </tr>
            </thead>
            <tbody className="divide-y bg-white">
              {filteredStops.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    No stops found matching your search.
                  </td>
                </tr>
              )}
              {filteredStops.map(stop => {
                const isPrimary = primaryStopId === stop.id
                const isDuplicate = duplicateStopIds.includes(stop.id)

                return (
                  <tr key={stop.id} className={clsx('hover:bg-slate-50 transition-colors', isPrimary && 'bg-blue-50', isDuplicate && 'bg-amber-50')}>
                    <td className="px-4 py-2 text-center">
                      <input 
                        type="radio" 
                        name="primaryStop" 
                        checked={isPrimary}
                        onChange={() => handlePrimaryChange(stop.id)}
                        className="w-4 h-4 text-blue-600 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <input 
                        type="checkbox" 
                        checked={isDuplicate}
                        onChange={() => toggleDuplicate(stop.id)}
                        disabled={isPrimary}
                        className="w-4 h-4 text-amber-600 cursor-pointer rounded"
                      />
                    </td>
                    <td className="px-4 py-2 font-medium">{stop.name}</td>
                    <td className="px-4 py-2 text-slate-500">{stop.districtMaster?.name || stop.district || '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center mt-4 pt-4 border-t shrink-0">
          <div className="text-sm text-slate-600">
            Selected <strong>{duplicateStopIds.length}</strong> duplicates to merge.
          </div>
          <div className="flex gap-3">
            <Button variant="outline" type="button" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving || !primaryStopId || duplicateStopIds.length === 0}>
              {saving ? 'Combining...' : 'Combine Selected'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
