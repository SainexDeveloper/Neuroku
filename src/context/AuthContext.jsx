import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  const login = (email, password) =>
    supabase.auth.signInWithPassword({ email, password })

  const register = async (email, password, username) => {
    const cleanEmail = email.trim().toLowerCase()
  
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: { username }
      }
    })
  
    if (error) throw error
  
    const user = data.user
    if (!user) throw new Error("User not created")
  
    await supabase.from('profiles').insert({
      id: user.id,
      username,
      rating: 1000,
      games_won: 0
    })
  
    return data
  }

  const logout = () => supabase.auth.signOut()

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)