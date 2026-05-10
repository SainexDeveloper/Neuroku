import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef
} from 'react'

const BASE = import.meta.env.VITE_API_URL ?? '/backend/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [accessToken, setAccessToken] = useState(null)
  const [loading, setLoading] = useState(true)

  const refreshTimer = useRef(null)

  const storeTokens = useCallback((access, refresh) => {
    setAccessToken(access)
    if (refresh) localStorage.setItem('neuroku_rt', refresh)
  }, [])

  const clearAuth = useCallback(() => {
    setUser(null)
    setAccessToken(null)
    localStorage.removeItem('neuroku_rt')
    if (refreshTimer.current) clearTimeout(refreshTimer.current)
  }, [])

  const refreshAccess = useCallback(async () => {
    const rt = localStorage.getItem('neuroku_rt')
    if (!rt) {
      clearAuth()
      setLoading(false)
      return null
    }

    try {
      const res = await fetch(`${BASE}/auth.php?action=refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: rt }),
      })

      if (!res.ok) throw new Error()

      const data = await res.json()

      storeTokens(data.access_token, data.refresh_token)

      refreshTimer.current = setTimeout(
        refreshAccess,
        (data.expires_in - 60) * 1000
      )

      return data.access_token
    } catch {
      clearAuth()
      return null
    }
  }, [storeTokens, clearAuth])

  const loadMe = useCallback(async (token) => {
    try {
      const res = await fetch(`${BASE}/auth.php?action=me`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      const data = await res.json()
      if (data?.ok) setUser(data.user)
    } catch {}
  }, [])

  useEffect(() => {
    ;(async () => {
      const token = await refreshAccess()
      if (token) await loadMe(token)
      setLoading(false)
    })()

    return () => clearTimeout(refreshTimer.current)
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await fetch(`${BASE}/auth.php?action=login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json()
    if (!data.ok) throw new Error(data.error || 'Login failed')

    storeTokens(data.access_token, data.refresh_token)
    setUser(data.user)

    refreshTimer.current = setTimeout(
      refreshAccess,
      (data.expires_in - 60) * 1000
    )

    return data.user
  }, [storeTokens, refreshAccess])

  const register = useCallback(async (username, email, password) => {
    const res = await fetch(`${BASE}/auth.php?action=register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    })

    const data = await res.json()
    if (!data.ok) throw new Error(data.error || 'Register failed')

    storeTokens(data.access_token, data.refresh_token)
    setUser(data.user)

    return data.user
  }, [storeTokens])

  const logout = useCallback(async () => {
    const rt = localStorage.getItem('neuroku_rt')

    try {
      await fetch(`${BASE}/auth.php?action=logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: rt }),
      })
    } catch {}

    clearAuth()
  }, [clearAuth])

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      isAuth: !!user
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}