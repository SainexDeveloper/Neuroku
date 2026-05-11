import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'
import { cardStyle, buttonStyle } from '../styles/theme.js'

export default function ProfilePage({
  T,
  stats,
  userId: propUserId,
  onOpenAuth,
}) {
  const { user: me } = useAuth()

  const userId = propUserId ?? me?.id

  const [profile, setProfile] = useState(null)
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    const loadProfile = async () => {
      setLoading(true)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      setProfile(profileData)

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
        <h2 style={{ color: T.text }}>
          Sign in to view profile
        </h2>

        <button
          onClick={onOpenAuth}
          style={buttonStyle(T, 'primary')}
        >
          Sign In
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ padding: 40, color: T.textMuted }}>
        Loading...
      </div>
    )
  }

  if (!profile) {
    return (
      <div style={{ padding: 40 }}>
        Profile not found
      </div>
    )
  }

  const winRate =
    stats.gamesPlayed > 0
      ? Math.round((stats.wins / stats.gamesPlayed) * 100)
      : 0

  return (
    <div
      style={{
        maxWidth: 900,
        margin: '0 auto',
        padding: 24,
      }}
    >
      {/* PROFILE HEADER */}
      <div
        style={{
          ...cardStyle(T),
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
          }}
        >
          <div
            style={{
              width: 74,
              height: 74,
              borderRadius: '50%',
              background: profile.avatar_color || T.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              fontWeight: 800,
              color: '#fff',
            }}
          >
            {profile.avatar_initials || 'N'}
          </div>

          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 32,
                fontWeight: 800,
              }}
            >
              {profile.username}
            </h1>

            <div style={{ color: T.textMuted }}>
              {profile.bio || 'No bio yet'}
            </div>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit,minmax(180px,1fr))',
          gap: 14,
          marginBottom: 24,
        }}
      >
        {[
          ['Rating', profile.rating ?? 1000],
          ['Games', games.length],
          ['Wins', stats.wins],
          ['Win Rate', `${winRate}%`],
          ['Best Time', stats.bestTime ?? '—'],
          ['Streak', stats.streak],
        ].map(([label, value]) => (
          <div key={label} style={cardStyle(T)}>
            <div style={{ color: T.textMuted }}>
              {label}
            </div>

            <div
              style={{
                fontSize: 32,
                fontWeight: 800,
                marginTop: 8,
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* HISTORY */}
      <div style={{ marginTop: 10 }}>
        <h2
          style={{
            marginBottom: 14,
            fontSize: 24,
          }}
        >
          Match History
        </h2>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {games.length === 0 && (
            <div style={cardStyle(T)}>
              No games played yet
            </div>
          )}

          {games.map((g) => (
            <div
              key={g.id}
              style={{
                ...cardStyle(T),
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 16,
                    textTransform: 'capitalize',
                  }}
                >
                  {g.difficulty}
                </div>

                <div
                  style={{
                    color: T.textMuted,
                    fontSize: 13,
                    marginTop: 4,
                  }}
                >
                  Errors: {g.errors ?? 0}
                </div>
              </div>

              <div
                style={{
                  fontWeight: 700,
                  fontSize: 18,
                }}
              >
                {g.time}s
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}