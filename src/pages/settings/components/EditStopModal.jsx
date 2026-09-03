import React, { useState, useEffect } from 'react'
import { Modal, Button, Input } from '@/components/ui'
import { toast } from 'sonner'
import api from '@/api/client'

export function EditStopModal({ open, onClose, stop, masterData, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    nameMl: '',
    latitude: '',
    longitude: '',
    state_id: '',
    district_id: '',
    region_id: '',
    status: 'active',
    description: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (stop && open) {
      setFormData({
        name: stop.name || '',
        nameMl: stop.nameMl || '',
        latitude: stop.latitude || '',
        longitude: stop.longitude || '',
        state_id: stop.stateMaster?.id || stop.state_id || '',
        district_id: stop.districtMaster?.id || stop.district_id || '',
        region_id: stop.regionMaster?.id || stop.region_id || '',
        status: stop.status || 'active',
        description: stop.description || ''
      })
    }
  }, [stop, open])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.put(`/master-data/stops/${stop.id}`, {
        ...formData,
        latitude: parseFloat(formData.latitude) || 0,
        longitude: parseFloat(formData.longitude) || 0
      })
      toast.success('Stop updated successfully')
      onSave(res.data)
      onClose()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update stop')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={() => { if (!saving) onClose() }} title="Edit Stop" width="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name (EN) *</label>
            <Input required value={formData.name} onChange={e => handleChange('name', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name (ML)</label>
            <Input value={formData.nameMl} onChange={e => handleChange('nameMl', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Latitude</label>
            <Input type="number" step="any" value={formData.latitude} onChange={e => handleChange('latitude', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Longitude</label>
            <Input type="number" step="any" value={formData.longitude} onChange={e => handleChange('longitude', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              value={formData.state_id}
              onChange={e => handleChange('state_id', e.target.value)}
            >
              <option value="">-- Select State --</option>
              {masterData?.states?.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">District</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              value={formData.district_id}
              onChange={e => handleChange('district_id', e.target.value)}
            >
              <option value="">-- Select District --</option>
              {masterData?.districts?.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Region</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              value={formData.region_id}
              onChange={e => handleChange('region_id', e.target.value)}
            >
              <option value="">-- Select Region --</option>
              {masterData?.regions?.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              value={formData.status}
              onChange={e => handleChange('status', e.target.value)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            rows={3}
            value={formData.description}
            onChange={e => handleChange('description', e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" type="button" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </form>
    </Modal>
  )
}
