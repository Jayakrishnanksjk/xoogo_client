import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '@/api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount, try to restore session from token
  useEffect(() => {
    const token = localStorage.getItem('xoogo_token')
    if (!token) {
      setLoading(false)
      return
    }
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    api.get('/auth/me')
      .then(res => setUser(res.data.user))
      .catch(() => {
        localStorage.removeItem('xoogo_token')
        delete api.defaults.headers.common['Authorization']
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const { token, user } = res.data
    localStorage.setItem('xoogo_token', token)
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(user)
    return user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('xoogo_token')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }, [])

  const isSuperadmin = user?.role === 'superadmin'
  const isPartner = user?.role === 'partner'

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isSuperadmin, isPartner }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
