import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { Button, Select, Input, Badge, Modal } from '@/components/ui'
import { Key, Copy, Check, Trash2, AlertTriangle, Download, Play, Plus, ChevronDown } from 'lucide-react'
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

  // API Tester State
  const [testerEndpoint, setTesterEndpoint] = useState('/api/sync/full-timetable')
  const [testerApiKey, setTesterApiKey] = useState('')
  const [testerBusId, setTesterBusId] = useState('')
  const [queryParams, setQueryParams] = useState([{ key: 'bus_id', value: '' }])
  const [bodyParams, setBodyParams] = useState({ busId: '' })
  const [sending, setSending] = useState(false)
  const [responseState, setResponseState] = useState(null)
  const [activeResTab, setActiveResTab] = useState('json')
  const [showHeaders, setShowHeaders] = useState(true)

  const endpointsList = [
    {
      path: '/api/sync/full-timetable',
      method: 'GET',
      status: 'Active',
      description: 'Get complete bus, schedule, and route data with ordered stops in a single call.',
      defaultParams: [{ key: 'bus_id', value: '' }]
    },
    {
      path: '/api/public/bus',
      method: 'POST',
      status: 'Active',
      description: 'Get bus details (regNumber, busType, status, group, route).',
      defaultBody: { busId: '' }
    },
    {
      path: '/api/public/bus-routes',
      method: 'POST',
      status: 'Active',
      description: 'Get route with stops (includes lat/lng coordinates).',
      defaultBody: { busId: '' }
    },
    {
      path: '/api/public/bus-schedule',
      method: 'POST',
      status: 'Active',
      description: 'Get schedule and group info.',
      defaultBody: { busId: '' }
    }
  ]

  const currentEndpoint = endpointsList.find(e => e.path === testerEndpoint) || endpointsList[0]

  useEffect(() => {
    setBaseUrl(window.location.origin)
    loadData()
  }, [])

  useEffect(() => {
    if (apiKeys.length > 0 && !testerApiKey) {
      const activeKey = apiKeys.find(k => k.status === 'active') || apiKeys[0]
      if (activeKey) {
        setTesterApiKey(activeKey.key)
        const busIdentifier = activeKey.bus?.busId || activeKey.bus?.regNumber || ''
        setTesterBusId(busIdentifier)
        setQueryParams([{ key: 'bus_id', value: busIdentifier }])
        setBodyParams({ busId: busIdentifier })
      }
    }
  }, [apiKeys])

  const handleEndpointSelect = (path) => {
    setTesterEndpoint(path)
    setResponseState(null)
    const ep = endpointsList.find(e => e.path === path)
    if (ep?.method === 'GET') {
      setQueryParams([{ key: 'bus_id', value: testerBusId }])
    } else {
      setBodyParams({ busId: testerBusId })
    }
  }

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

  const handleDownloadKey = (busId, apiKey) => {
    const busIdValue = busId || 'UNKNOWN'
    const timestamp = Math.floor(Date.now() / 1000)
    const fileName = `nool-web-bus_${timestamp}.key`
    const content = `BUS ID = ${busIdValue}\nKEY=${apiKey}`

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success(`Downloaded ${fileName}`)
  }

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
    toast.success('Copied to clipboard')
  }

  const handleAddQueryParam = () => {
    setQueryParams([...queryParams, { key: '', value: '' }])
  }

  const handleRemoveQueryParam = (index) => {
    setQueryParams(queryParams.filter((_, i) => i !== index))
  }

  const handleQueryParamChange = (index, field, value) => {
    const updated = [...queryParams]
    updated[index][field] = value
    setQueryParams(updated)
  }

  const handleSendRequest = async () => {
    if (!testerApiKey) {
      toast.error('Please select or enter an API key')
      return
    }

    setSending(true)
    const startTime = performance.now()

    try {
      let url = `${baseUrl}${currentEndpoint.path}`
      let options = {
        method: currentEndpoint.method,
        headers: {
          'Authorization': `Bearer ${testerApiKey}`,
          'Content-Type': 'application/json'
        }
      }

      if (currentEndpoint.method === 'GET') {
        const queryObj = {}
        queryParams.forEach(p => {
          if (p.key.trim()) queryObj[p.key.trim()] = p.value
        })
        const searchParams = new URLSearchParams(queryObj).toString()
        if (searchParams) url += `?${searchParams}`
      } else {
        options.body = JSON.stringify(bodyParams)
      }

      const res = await fetch(url, options)
      const endTime = performance.now()
      const duration = Math.round(endTime - startTime)

      const text = await res.text()
      let data
      try {
        data = JSON.parse(text)
      } catch {
        data = text
      }

      const headersObj = {}
      res.headers.forEach((val, key) => { headersObj[key] = val })

      const approxSize = (new Blob([text]).size / 1024).toFixed(1)

      setResponseState({
        status: res.status,
        statusText: res.statusText || (res.ok ? 'OK' : 'Error'),
        ok: res.ok,
        duration,
        size: `${approxSize} KB`,
        data,
        headers: headersObj,
        requestUrl: url,
        requestMethod: currentEndpoint.method,
        requestBody: options.body
      })
    } catch (err) {
      const endTime = performance.now()
      setResponseState({
        status: 500,
        statusText: 'Network Error',
        ok: false,
        duration: Math.round(endTime - startTime),
        size: '0 KB',
        data: { error: err.message || 'Failed to fetch' },
        headers: {}
      })
    } finally {
      setSending(false)
    }
  }

  const getCurlSnippet = () => {
    let url = `${baseUrl}${currentEndpoint.path}`
    if (currentEndpoint.method === 'GET') {
      const queryObj = {}
      queryParams.forEach(p => {
        if (p.key.trim()) queryObj[p.key.trim()] = p.value
      })
      const searchParams = new URLSearchParams(queryObj).toString()
      if (searchParams) url += `?${searchParams}`
      return `curl -X GET "${url}" \\\n  -H "Authorization: Bearer ${testerApiKey || '<your_api_key>'}"`
    } else {
      return `curl -X POST "${url}" \\\n  -H "Authorization: Bearer ${testerApiKey || '<your_api_key>'}" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(bodyParams)}'`
    }
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
                      onClick={() => handleDownloadKey(k.bus?.busId || k.bus?.regNumber, k.key)}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-brand transition-colors"
                      title="Download key file"
                    >
                      <Download size={15} />
                    </button>
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

        {/* Interactive Realtime API Tester */}
        <div className="bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden">
          {/* Header Bar */}
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${currentEndpoint.method === 'GET' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                {currentEndpoint.method}
              </span>
              <div className="relative">
                <select
                  value={testerEndpoint}
                  onChange={e => handleEndpointSelect(e.target.value)}
                  className="appearance-none font-mono text-sm font-semibold text-slate-900 bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:border-brand cursor-pointer shadow-sm"
                >
                  {endpointsList.map(ep => (
                    <option key={ep.path} value={ep.path}>
                      {ep.path} ({ep.method})
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                {currentEndpoint.status}
              </span>
            </div>
          </div>

          <p className="px-6 pt-3 text-xs text-slate-500">{currentEndpoint.description}</p>

          <div className="p-6 space-y-6">
            {/* Request Form */}
            <div className="space-y-5">
              <div className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Request</div>

              {/* Base URL & Auth Key Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Base URL</label>
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={e => setBaseUrl(e.target.value)}
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Select API Key</label>
                  <select
                    value={testerApiKey}
                    onChange={e => {
                      const val = e.target.value
                      setTesterApiKey(val)
                      const found = apiKeys.find(k => k.key === val)
                      if (found?.bus) {
                        const bId = found.bus.busId || found.bus.regNumber || ''
                        setTesterBusId(bId)
                        if (currentEndpoint.method === 'GET') {
                          setQueryParams([{ key: 'bus_id', value: bId }])
                        } else {
                          setBodyParams({ busId: bId })
                        }
                      }
                    }}
                    className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:border-brand"
                  >
                    <option value="">-- Choose Key --</option>
                    {apiKeys.map(k => (
                      <option key={k.id} value={k.key}>
                        {k.bus?.busId || k.bus?.regNumber || 'Bus Key'} ({k.key.substring(0, 12)}...)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Query Parameters (GET) */}
              {currentEndpoint.method === 'GET' && (
                <div className="space-y-3 pt-1">
                  <label className="block text-xs font-medium text-slate-600">Query Parameters</label>
                  {queryParams.map((param, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <input
                        type="text"
                        placeholder="Parameter Key (e.g. bus_id)"
                        value={param.key}
                        onChange={e => handleQueryParamChange(index, 'key', e.target.value)}
                        className="flex-1 text-xs font-mono bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-brand"
                      />
                      <input
                        type="text"
                        placeholder="Value (e.g. NW48432)"
                        value={param.value}
                        onChange={e => handleQueryParamChange(index, 'value', e.target.value)}
                        className="flex-1 text-xs font-mono bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-brand"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveQueryParam(index)}
                        className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                        title="Remove parameter"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddQueryParam}
                    className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:text-brand-dark pt-1"
                  >
                    <Plus size={14} /> Add Parameter
                  </button>
                </div>
              )}

              {/* Body Parameters (POST) */}
              {currentEndpoint.method === 'POST' && (
                <div className="space-y-2 pt-1">
                  <label className="block text-xs font-medium text-slate-600">Request Body (JSON)</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[11px] text-slate-500 block mb-1 font-mono">busId</span>
                      <input
                        type="text"
                        value={bodyParams.busId || ''}
                        onChange={e => setBodyParams({ busId: e.target.value })}
                        placeholder="e.g. NW48432"
                        className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-brand"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Accordion Header & Send Button */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowHeaders(!showHeaders)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  <ChevronDown size={14} className={`transition-transform ${showHeaders ? '' : '-rotate-90'}`} />
                  Headers <span className="text-slate-400">(Authorization: Bearer key)</span>
                </button>

                <Button
                  onClick={handleSendRequest}
                  loading={sending}
                  className="bg-brand hover:bg-brand-dark text-white px-5 py-2 rounded-xl shadow-md shadow-brand/20 transition-all font-medium text-xs flex items-center gap-2"
                >
                  <Play size={13} className="fill-current" />
                  Send Request
                </Button>
              </div>

              {/* Headers Drawer */}
              {showHeaders && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono space-y-1 text-slate-600">
                  <div><strong className="text-slate-800">Authorization:</strong> Bearer {testerApiKey || '<your_api_key>'}</div>
                  <div><strong className="text-slate-800">Content-Type:</strong> application/json</div>
                </div>
              )}
            </div>

            {/* Response Section */}
            {responseState && (
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-900">Response</span>
                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-md ${responseState.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      • {responseState.status} {responseState.statusText}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">{responseState.duration} ms</span>
                    <span className="text-xs text-slate-500 font-mono">{responseState.size}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(responseState.data, null, 2), 'response-raw')}
                      className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors"
                    >
                      {copiedId === 'response-raw' ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                      <span>{copiedId === 'response-raw' ? 'Copied' : 'View Raw'}</span>
                    </button>
                  </div>
                </div>

                {/* Response Tabs (JSON / Headers / Curl) */}
                <div className="flex items-center gap-4 border-b border-slate-200 text-xs font-medium">
                  {['json', 'headers', 'curl'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveResTab(tab)}
                      className={`pb-2 border-b-2 uppercase tracking-wider font-semibold transition-colors ${activeResTab === tab ? 'border-brand text-brand' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Response Output Box */}
                <div className="bg-[#0f172a] text-slate-200 rounded-xl p-4 font-mono text-xs overflow-x-auto max-h-96 shadow-inner relative group">
                  {activeResTab === 'json' && (
                    <pre className="text-emerald-400 whitespace-pre-wrap">
                      {typeof responseState.data === 'object' ? JSON.stringify(responseState.data, null, 2) : responseState.data}
                    </pre>
                  )}

                  {activeResTab === 'headers' && (
                    <pre className="text-sky-300 whitespace-pre-wrap">
                      {JSON.stringify(responseState.headers, null, 2)}
                    </pre>
                  )}

                  {activeResTab === 'curl' && (
                    <pre className="text-amber-300 whitespace-pre-wrap">
                      {getCurlSnippet()}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* API Usage Guide */}
        <div className="bg-white rounded-xl shadow-card border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-slate-900">API Usage Guide</h3>
            <span className="text-xs font-medium text-slate-500">Header: <code className="text-brand font-mono bg-brand/5 px-2 py-0.5 rounded">Authorization: Bearer &lt;your_api_key&gt;</code></span>
          </div>
          <p className="text-xs text-slate-500 mb-5">Use these endpoints to integrate on-bus display devices or fetch bus data.</p>

          <div className="space-y-4">
            {[
              {
                endpoint: '/api/sync/full-timetable',
                method: 'GET',
                recommended: true,
                desc: 'Single unified endpoint for on-bus devices. Returns complete bus info, active schedules, and routes with ordered stops in a single call.',
                example: `curl -X GET "${baseUrl}/api/sync/full-timetable?bus_id=${selectedBus?.busId || 'NW48432'}" \\
  -H "Authorization: Bearer <your_api_key>"`
              },
              {
                endpoint: '/api/public/bus',
                method: 'POST',
                desc: 'Get bus details (registration number, bus type, status, group, and route).',
                example: `curl -X POST ${baseUrl}/api/public/bus \\
  -H "Authorization: Bearer <your_api_key>" \\
  -H "Content-Type: application/json" \\
  -d '{"busId":"${selectedBus?.busId || 'NW48432'}"}'`
              },
              {
                endpoint: '/api/public/bus-routes',
                method: 'POST',
                desc: 'Get route with stops (includes latitude/longitude coordinates).',
                example: `curl -X POST ${baseUrl}/api/public/bus-routes \\
  -H "Authorization: Bearer <your_api_key>" \\
  -H "Content-Type: application/json" \\
  -d '{"busId":"${selectedBus?.busId || 'NW48432'}"}'`
              },
              {
                endpoint: '/api/public/bus-schedule',
                method: 'POST',
                desc: 'Get schedule and group info.',
                example: `curl -X POST ${baseUrl}/api/public/bus-schedule \\
  -H "Authorization: Bearer <your_api_key>" \\
  -H "Content-Type: application/json" \\
  -d '{"busId":"${selectedBus?.busId || 'NW48432'}"}'`
              },
            ].map(({ endpoint, method, recommended, desc, example }) => (
              <div key={endpoint} className={`p-4 rounded-xl border ${recommended ? 'bg-amber-50/40 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${method === 'GET' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                      {method}
                    </span>
                    <code className="text-xs font-semibold text-slate-900">{endpoint}</code>
                    {recommended && (
                      <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                        ★ Single-call Sync (Recommended)
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => copyToClipboard(example, endpoint)}
                    className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                    title="Copy curl command"
                  >
                    {copiedId === endpoint ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-600 mb-2.5">{desc}</p>
                <pre className="text-[11px] font-mono text-slate-700 bg-white p-3 rounded-lg border border-slate-200/80 overflow-x-auto whitespace-pre-wrap">{example}</pre>
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
                <Button size="sm" onClick={() => copyToClipboard(newKey.key, 'new-key')} title="Copy key">
                  {copiedId === 'new-key' ? <Check size={14} /> : <Copy size={14} />}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadKey(newKey.bus?.busId || newKey.bus?.regNumber || selectedBus?.busId || selectedBus?.regNumber, newKey.key)}
                  title="Download key file"
                >
                  <Download size={14} className="mr-1" />
                  Download
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