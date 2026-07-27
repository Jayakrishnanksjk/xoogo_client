import { useState, useEffect, useRef, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { Button, Spinner } from '@/components/ui'
import { brandingApi } from '@/api'
import { applyBranding, useBranding } from '@/context/ThemeContext'
import { toast } from 'sonner'
import { Save, RotateCcw, Upload, Check } from 'lucide-react'

const DEFAULT_COLORS = {
  primary_color: '#2563EB',
  brand_light: '#3B82F6',
  brand_dark: '#1D4ED8',
  sidebar_bg: '#0F172A',
  sidebar_active: '#1E293B',
  sidebar_hover: '#1E293B',
}

const COLOR_LABELS = {
  primary_color: 'Primary Brand',
  brand_light: 'Brand Light',
  brand_dark: 'Brand Dark',
  sidebar_bg: 'Sidebar Background',
  sidebar_active: 'Sidebar Active Item',
  sidebar_hover: 'Sidebar Hover Item',
}

function ColorPicker({ label, value, onChange }) {
  const id = label.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex items-center justify-between py-3 px-4 bg-white rounded-lg border border-slate-100">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">{label}</label>
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400 font-mono uppercase">{value}</span>
        <div className="relative">
          <input
            id={id}
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 w-8 h-8 cursor-pointer"
          />
          <div
            className="w-8 h-8 rounded-lg border border-slate-200 shadow-sm cursor-pointer"
            style={{ backgroundColor: value }}
          />
        </div>
      </div>
    </div>
  )
}

function LivePreview({ colors, logoPreview }) {
  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
      <div className="p-3 border-b border-slate-100">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Live Preview</p>
      </div>
      <div className="flex min-h-[200px]">
        <div
          className="w-[140px] shrink-0 p-3 flex flex-col gap-2"
          style={{ backgroundColor: colors.sidebar_bg }}
        >
          <div className="flex items-center justify-start h-16 w-full mb-3" style={{ color: colors.brand_light }}>
            <img src={logoPreview || '/logo.svg'} alt="logo" className="h-full w-auto max-w-full object-contain object-left border-0 bg-transparent" />
          </div>
          <div
            className="px-2 py-1.5 rounded-lg text-xs font-medium"
            style={{ backgroundColor: colors.sidebar_active, color: '#fff' }}
          >
            Dashboard
          </div>
          <div
            className="px-2 py-1.5 rounded-lg text-xs font-medium"
            style={{ color: '#94a3b8' }}
          >
            Fleet
          </div>
          <div
            className="px-2 py-1.5 rounded-lg text-xs font-medium"
            style={{ color: '#94a3b8' }}
          >
            Media
          </div>
        </div>
        <div className="flex-1 p-4 bg-slate-50/50 space-y-3">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-white shadow-sm"
              style={{ backgroundColor: colors.primary_color }}
            >
              X
            </div>
            <div className="h-2 w-24 rounded-full bg-slate-200" />
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-white shadow-sm"
              style={{ backgroundColor: colors.primary_color }}
            >
              Primary
            </button>
            <button
              className="px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm"
              style={{ backgroundColor: colors.brand_light, color: '#fff' }}
            >
              Light
            </button>
            <button
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-white shadow-sm"
              style={{ backgroundColor: colors.brand_dark }}
            >
              Dark
            </button>
          </div>
          <div
            className="h-2 w-full rounded-full"
            style={{
              background: `linear-gradient(to right, ${colors.primary_color}, ${colors.brand_light})`,
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default function BrandingSettingsPage() {
  const { refetch } = useBranding()
  const [colors, setColors] = useState(DEFAULT_COLORS)
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [existingLogo, setExistingLogo] = useState(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef(null)

  useEffect(() => {
    brandingApi.get()
      .then((res) => {
        const data = res.data
        const cols = {}
        for (const key of Object.keys(DEFAULT_COLORS)) {
          cols[key] = data[key] || DEFAULT_COLORS[key]
        }
        setColors(cols)
        if (data.logo_url) {
          setExistingLogo(data.logo_url)
        }
      })
      .catch(() => toast.error('Failed to load branding settings'))
      .finally(() => setLoading(false))
  }, [])

  const updateColor = useCallback((key, value) => {
    setColors((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleLogoSelect = useCallback((e) => {
    const file = e.target.files[0]
    if (!file) return
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setLogoPreview(ev.target.result)
    reader.readAsDataURL(file)
  }, [])

  const handleReset = useCallback(() => {
    setColors(DEFAULT_COLORS)
    setLogoFile(null)
    setLogoPreview(null)
    toast.info('Defaults restored. Click Save to apply.')
  }, [])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const formData = new FormData()
      if (logoFile) formData.append('logo', logoFile)
      for (const [key, value] of Object.entries(colors)) {
        formData.append(key, value)
      }
      const res = await brandingApi.update(formData)
      applyBranding(res.data)
      setExistingLogo(res.data.logo_url)
      setLogoFile(null)
      setLogoPreview(null)
      refetch()
      toast.success('Branding updated successfully')
    } catch {
      toast.error('Failed to save branding settings')
    } finally {
      setSaving(false)
    }
  }, [colors, logoFile, refetch])

  const displayLogo = logoPreview || existingLogo || '/logo.svg'

  if (loading) {
    return (
      <AppLayout title="Branding" subtitle="Customize your app appearance">
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Branding" subtitle="Customize your app appearance">
      <div className="p-6 max-w-4xl space-y-8">
        {/* Logo Upload */}
        <section>
          <h3 className="text-sm font-semibold text-slate-800 mb-3">App Logo</h3>
          <div className="bg-white rounded-xl border border-slate-100 p-6">
            <div className="flex items-start gap-6">
              <div
                className="w-60 h-24 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden cursor-pointer hover:border-brand/50 transition-colors bg-slate-50/50 shrink-0"
                onClick={() => fileInputRef.current?.click()}
              >
                {displayLogo ? (
                  <img src={displayLogo} alt="Logo preview" className="w-full h-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-slate-400">
                    <Upload size={16} />
                    <span className="text-xs">Upload</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-sm text-slate-600">Upload your app logo</p>
                <p className="text-xs text-slate-400">Recommended: 200×60px. PNG, SVG, or JPG (max 5MB)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/svg+xml,image/webp"
                  onChange={handleLogoSelect}
                  className="hidden"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {displayLogo ? 'Change Logo' : 'Select Logo'}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Brand Colors */}
        <section>
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Brand Colors</h3>
          <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-50 overflow-hidden">
            <ColorPicker
              label={COLOR_LABELS.primary_color}
              value={colors.primary_color}
              onChange={(v) => updateColor('primary_color', v)}
            />
            <ColorPicker
              label={COLOR_LABELS.brand_light}
              value={colors.brand_light}
              onChange={(v) => updateColor('brand_light', v)}
            />
            <ColorPicker
              label={COLOR_LABELS.brand_dark}
              value={colors.brand_dark}
              onChange={(v) => updateColor('brand_dark', v)}
            />
          </div>
        </section>

        {/* Sidebar Colors */}
        <section>
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Sidebar Colors</h3>
          <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-50 overflow-hidden">
            <ColorPicker
              label={COLOR_LABELS.sidebar_bg}
              value={colors.sidebar_bg}
              onChange={(v) => updateColor('sidebar_bg', v)}
            />
            <ColorPicker
              label={COLOR_LABELS.sidebar_active}
              value={colors.sidebar_active}
              onChange={(v) => updateColor('sidebar_active', v)}
            />
            <ColorPicker
              label={COLOR_LABELS.sidebar_hover}
              value={colors.sidebar_hover}
              onChange={(v) => updateColor('sidebar_hover', v)}
            />
          </div>
        </section>

        {/* Live Preview */}
        <section>
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Preview</h3>
          <LivePreview colors={colors} logoPreview={displayLogo} />
        </section>

        {/* Actions */}
        <div className="flex items-center gap-3 pb-8">
          <Button
            onClick={handleSave}
            loading={saving}
            startIcon={saving ? undefined : Check}
            label={saving ? 'Saving...' : 'Save Changes'}
          />
          <Button
            variant="outline"
            onClick={handleReset}
            startIcon={RotateCcw}
            label="Reset to Defaults"
          />
        </div>
      </div>
    </AppLayout>
  )
}
