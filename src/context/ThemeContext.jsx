import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { brandingApi } from '@/api'

const BrandingContext = createContext(null)

export function applyBranding(data) {
  const root = document.documentElement
  if (!data) return
  root.style.setProperty('--primary', data.primary_color)
  root.style.setProperty('--brand', data.primary_color)
  root.style.setProperty('--brand-light', data.brand_light)
  root.style.setProperty('--brand-dark', data.brand_dark)
  root.style.setProperty('--sidebar-bg', data.sidebar_bg)
  root.style.setProperty('--sidebar-active', data.sidebar_active)
  root.style.setProperty('--sidebar-hover', data.sidebar_hover)
}

export function BrandingProvider({ children }) {
  const [branding, setBranding] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchBranding = useCallback(async () => {
    try {
      const res = await brandingApi.get()
      const data = res.data
      setBranding(data)
      applyBranding(data)
    } catch {
      // Server not available — use CSS defaults
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBranding()
  }, [fetchBranding])

  return (
    <BrandingContext.Provider value={{ branding, loading, refetch: fetchBranding }}>
      {children}
    </BrandingContext.Provider>
  )
}

export function useBranding() {
  return useContext(BrandingContext)
}
