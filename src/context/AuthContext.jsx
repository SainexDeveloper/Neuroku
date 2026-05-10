import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))

  const isAuth = !!user

  const saveSession = (t, u) => {
    setToken(t)
    setUser(u)
    localStorage.setItem('token', t)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
  }

  const login = async (email, password) => {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    const data = await res.json()
    if (!data.ok) throw new Error(data.error)

    saveSession(data.token, data.user)
    return data.user
  }

  const register = async (username, email, password) => {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    })

    const data = await res.json()
    if (!data.ok) throw new Error(data.error)

    saveSession(data.token, data.user)
    return data.user
  }

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuth,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}