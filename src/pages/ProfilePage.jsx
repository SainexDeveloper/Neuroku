import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'
import { cardStyle, buttonStyle } from '../styles/theme.js'

export default function ProfilePage({ T, userId: propUserId, onOpenAuth }) {
  const { user: me } = useAuth()

  const userId = propUserId ?? me?.id
  const isOwnProfile = userId === me?.id

  const [profile, setProfile] = useState(null)
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    const loadProfile = async () => {
      setLoading(true)

      // PROFILE
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (!profileError) setProfile(profileData)

      // GAMES
      const { data: gamesData } = await supabase
        .from('games')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })

      setGames(gamesData ?? [])

      setLoading(false)
    }

    loadProfile()
  }, [userId])

  if (!me && !propUserId) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <h2 style={{ color: T.text }}>Sign in to view profile</h2>
        <button onClick={onOpenAuth} style={buttonStyle(T, 'primary')}>
          Sign In
        </button>
      </div>
    )
  }

  if (loading) {
    return <div style={{ padding: 40, color: T.textMuted }}>Loading...</div>
  }

  if (!profile) {
    return <div style={{ padding: 40 }}>Profile not found</div>
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: 24 }}>

      <div style={cardStyle(T)}>
        <h1>{profile.username}</h1>
        <p style={{ color: T.textMuted }}>{profile.bio}</p>
        <div>Rating: <b>{profile.rating}</b></div>
      </div>

      <div style={{ marginTop: 20, ...cardStyle(T) }}>
        <h3>Games</h3>
        <div>Total: {games.length}</div>
      </div>

      <div style={{ marginTop: 20 }}>
        {games.slice(0, 10).map(g => (
          <div key={g.id} style={cardStyle(T)}>
            <b>{g.difficulty}</b> — {g.time}
          </div>
        ))}
      </div>

    </div>
  )
}