import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'
import { cardStyle, buttonStyle } from '../styles/theme.js'

export default function ProfilePage({T, stats, userId: propUserId, onOpenAuth }){
  const { user: me } = useAuth()

  const userId = propUserId ?? me?.id
  const isOwnProfile = userId === me?.id

  const [profile, setProfile] = useState(null)
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')

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

      <div style={{
        display: 'flex',
        gap: 10,
        marginTop: 20,
        marginBottom: 24,
        flexWrap: 'wrap',
      }}>
        {[
          ['overview', 'Profile'],
          ['stats', 'Stats'],
          ['history', 'History'],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              ...buttonStyle(T, tab === id ? 'primary' : 'ghost'),
            }}
          >
            {label}
          </button>
        ))}
      </div>
      
      {tab === 'overview' && (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
        gap: 14,
      }}>
        <div style={cardStyle(T)}>
          <div style={{ color: T.textMuted }}>Rating</div>
          <div style={{ fontSize: 32, fontWeight: 800 }}>
            {profile.rating ?? 1000}
          </div>
        </div>

        <div style={cardStyle(T)}>
          <div style={{ color: T.textMuted }}>Games</div>
          <div style={{ fontSize: 32, fontWeight: 800 }}>
            {games.length}
          </div>
        </div>

        <div style={cardStyle(T)}>
          <div style={{ color: T.textMuted }}>Country</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>
            {profile.country || '—'}
          </div>
        </div>
      </div>
    )}

    {tab === 'stats' && (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
        gap: 14,
      }}>
        {[
          ['Games Played', stats.gamesPlayed],
          ['Wins', stats.wins],
          ['Mistakes', stats.mistakes],
          ['Streak', stats.streak],
        ].map(([label, value]) => (
          <div key={label} style={cardStyle(T)}>
            <div style={{ color: T.textMuted }}>
              {label}
            </div>

            <div style={{
              fontSize: 32,
              fontWeight: 800,
              marginTop: 8,
            }}>
              {value}
            </div>
          </div>
        ))}
      </div>
    )}

    {tab === 'history' && (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        {games.map(g => (
          <div key={g.id} style={cardStyle(T)}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
            }}>
              <b>{g.difficulty}</b>

              <span style={{ color: T.textMuted }}>
                {g.time}s
              </span>
            </div>
          </div>
        ))}
      </div>
    )}

    </div>
  )
}