import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { Button, Select, Input, Badge, Modal } from '@/components/ui'
import { Key, Copy, Check, Trash2, AlertTriangle } from 'lucide-react'
import { busesApi } from '@/api'
import api from '@/api/client'
import { toast } from 'sonner'

export default function IntegrationsPage() {
  const [buses, setBuses] = useState([])
  const [apiKeys, setApiKeys] = useState([])
  const [selectedBusId, setSelectedBusId] = useState('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const [showKeyModal, setShowKeyModal] = useState(false)
  const [newKey, setNewKey] = useState(null)
  const [baseUrl, setBaseUrl] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => {
    setBaseUrl(window.location.origin)
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [busesRes, keysRes] = await Promise.all([
        busesApi.list(),
        api.get('/api-keys')
      ])
      setBuses(busesRes.data)
      setApiKeys(keysRes.data)
    } catch (err) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!selectedBusId) {
      toast.error('Please select a bus')
      return
    }
    try {
      setGenerating(true)
      const res = await api.post('/api-keys/generate', { busId: selectedBusId })
      setNewKey(res.data)
      setShowKeyModal(true)
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate API key')
    } finally {
      setGenerating(false)
    }
  }

  const handleRevoke = async (keyId) => {
    try {
      await api.delete(`/api-keys/${keyId}`)
      toast.success('API key revoked')
      loadData()
    } catch (err) {
      toast.error('Failed to revoke API key')
    }
  }

  const handleDelete = async (keyId) => {
    try {
      await api.delete(`/api-keys/${keyId}/permanent`)
      toast.success('API key permanently deleted')
      setDeleteConfirm(null)
      loadData()
    } catch (err) {
      toast.error('Failed to delete API key')
    }
  }

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
    toast.success('Copied to clipboard')
  }

  const getBusLabel = (bus) => {
    const parts = []
    if (bus.busId) parts.push(bus.busId)
    if (bus.regNumber) parts.push(bus.regNumber)
    return parts.join(' — ') || bus.id
  }

  const selectedBus = buses.find(b => b.id === selectedBusId)

  return (
    <AppLayout title="Integrations" subtitle="Settings > Integrations">
      <div className="p-6 max-w-screen-xl space-y-8">
        {/* Generate API Key */}
        <div className="bg-white rounded-xl shadow-card border border-slate-100 p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">Generate API Key</h3>
          <p className="text-xs text-slate-500 mb-5">Select a bus and generate an API key to access its data via the public API.</p>

          <div className="flex items-end gap-3 max-w-lg">
            <div className="flex-1">
              <Select
                label="Select Bus"
                value={selectedBusId}
                onChange={e => setSelectedBusId(e.target.value)}
              >
                <option value="">-- Choose a bus --</option>
                {buses.map(b => (
                  <option key={b.id} value={b.id}>{getBusLabel(b)}</option>
                ))}
              </Select>
            </div>
            <Button onClick={handleGenerate} loading={generating} disabled={!selectedBusId || generating}>
              <Key className="mr-1.5 h-3.5 w-3.5" />
              Generate Key
            </Button>
          </div>

          {selectedBus && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-500">
                Generating key for: <strong className="text-slate-800">{getBusLabel(selectedBus)}</strong>
              </p>
            </div>
          )}
        </div>

        {/* API Keys List */}
        <div className="bg-white rounded-xl shadow-card border border-slate-100 p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">API Keys</h3>
          <p className="text-xs text-slate-500 mb-5">Manage your generated API keys.</p>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No API keys generated yet.
            </div>
          ) : (
            <div className="space-y-3">
              {apiKeys.map(k => (
                <div key={k.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge status={k.status} />
                      <span className="text-sm font-semibold text-slate-900">{k.bus?.busId || k.bus?.regNumber || 'Unknown Bus'}</span>
                    </div>
                    <p className="text-xs font-mono text-slate-500 truncate max-w-md">{k.key}</p>
                    <p className="text-[11px] text-slate-400">
                      Created: {new Date(k.createdAt).toLocaleDateString()}
                      {k.lastUsedAt ? ` · Last used: ${new Date(k.lastUsedAt).toLocaleDateString()}` : ' · Never used'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(k.key, k.id)}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
                      title="Copy API key"
                    >
                      {copiedId === k.id ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
                    </button>
                    {k.status === 'active' ? (
                      <button
                        onClick={() => handleRevoke(k.id)}
                        className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                        title="Revoke API key"
                      >
                        <Trash2 size={15} />
                      </button>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(k)}
                        className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                        title="Delete API key permanently"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* API Usage Guide */}
        <div className="bg-white rounded-xl shadow-card border border-slate-100 p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">API Usage</h3>
          <p className="text-xs text-slate-500 mb-5">Use these endpoints to fetch bus data with your API key.</p>

          <div className="space-y-4">
            {[
              {
                endpoint: '/api/public/bus',
                desc: 'Get bus details (regNumber, busType, status, group, route)',
                example: `curl -X POST ${baseUrl}/api/public/bus \\
  -H "Authorization: Bearer <your_api_key>" \\
  -H "Content-Type: application/json" \\
  -d '{"busId":"${selectedBus?.busId || 'NW48432'}"}'`
              },
              {
                endpoint: '/api/public/bus-routes',
                desc: 'Get route with stops (includes lat/lng coordinates)',
                example: `curl -X POST ${baseUrl}/api/public/bus-routes \\
  -H "Authorization: Bearer <your_api_key>" \\
  -H "Content-Type: application/json" \\
  -d '{"busId":"${selectedBus?.busId || 'NW48432'}"}'`
              },
              {
                endpoint: '/api/public/bus-schedule',
                desc: 'Get schedule and group info',
                example: `curl -X POST ${baseUrl}/api/public/bus-schedule \\
  -H "Authorization: Bearer <your_api_key>" \\
  -H "Content-Type: application/json" \\
  -d '{"busId":"${selectedBus?.busId || 'NW48432'}"}'`
              },
            ].map(({ endpoint, desc, example }) => (
              <div key={endpoint} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <code className="text-xs font-semibold text-brand">{endpoint}</code>
                    <p className="text-[11px] text-slate-500 mt-0.5">{desc}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(example, endpoint)}
                    className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                    title="Copy curl command"
                  >
                    {copiedId === endpoint ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </button>
                </div>
                <pre className="text-[11px] font-mono text-slate-700 bg-white p-3 rounded-lg border border-slate-100 overflow-x-auto whitespace-pre-wrap">{example}</pre>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* New Key Modal */}
      <Modal open={showKeyModal} onClose={() => setShowKeyModal(false)} title="API Key Generated" width="max-w-lg">
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs text-green-700 font-medium">Save this key — it won't be shown again.</p>
          </div>
          {newKey && (
            <div>
              <p className="text-xs font-medium text-slate-600 mb-1.5">API Key</p>
              <div className="flex items-center gap-2">
                <Input value={newKey.key} readOnly className="font-mono text-xs" />
                <Button size="sm" onClick={() => copyToClipboard(newKey.key, 'new-key')}>
                  {copiedId === 'new-key' ? <Check size={14} /> : <Copy size={14} />}
                </Button>
              </div>
            </div>
          )}
          <div className="flex justify-end pt-2">
            <Button onClick={() => setShowKeyModal(false)}>Done</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete API Key" width="max-w-sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Are you sure?</p>
              <p className="text-xs text-red-600 mt-1">
                This will permanently delete the API key for <strong>{deleteConfirm?.bus?.busId || deleteConfirm?.bus?.regNumber || 'Unknown Bus'}</strong>. This action cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button onClick={() => handleDelete(deleteConfirm.id)}>
              <Trash2 size={14} className="mr-1.5" />
              Delete Forever
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  )
}