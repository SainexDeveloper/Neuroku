import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'
import { formatTime } from '../lib/sudoku.js'
import { cardStyle, buttonStyle } from '../styles/theme.js'

const ACHIEVEMENTS = [
  {
    id: 'first_win',
    icon: '🏆',
    title: 'First Victory',
    desc: 'Complete your first puzzle',
    threshold: (s) => s.wins >= 1,
  },
  {
    id: 'streak3',
    icon: '🔥',
    title: 'On Fire',
    desc: '3-day streak',
    threshold: (s) => s.longestStreak >= 3,
  },
  {
    id: 'streak7',
    icon: '⚡',
    title: 'Week Warrior',
    desc: '7-day streak',
    threshold: (s) => s.longestStreak >= 7,
  },
  {
    id: 'speed_3min',
    icon: '🚀',
    title: 'Speed Demon',
    desc: 'Solve in under 3 minutes',
    threshold: (s) =>
      s.bestTime !== null &&
      s.bestTime < 180,
  },
  {
    id: 'played10',
    icon: '🧩',
    title: 'Dedicated',
    desc: '10 games played',
    threshold: (s) => s.gamesPlayed >= 10,
  },
  {
    id: 'played50',
    icon: '🧠',
    title: 'Brain Athlete',
    desc: '50 games played',
    threshold: (s) => s.gamesPlayed >= 50,
  },
  {
    id: 'expert_win',
    icon: '💀',
    title: 'Expert Mind',
    desc: 'Complete an Expert puzzle',
    threshold: (s) =>
      (s.byDifficulty?.expert ?? 0) >= 1,
  },
  {
    id: 'win100',
    icon: '👑',
    title: 'Centurion',
    desc: '100 puzzles completed',
    threshold: (s) => s.wins >= 100,
  },
]

export default function ProfilePage({
  T,
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
        .order('completed_at', {
          ascending: false,
        })

      setGames(gamesData ?? [])

      setLoading(false)
    }

    loadProfile()
  }, [userId])

  if (!me && !propUserId) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: 40,
        }}
      >
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
      <div
        style={{
          padding: 40,
          color: T.textMuted,
        }}
      >
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
      ? Math.round(
          (stats.wins / stats.gamesPlayed) * 100
        )
      : 0

  const avgTime =
    stats.wins > 0
      ? Math.round(stats.totalTime / stats.wins)
      : 0

  const unlockedCount =
    ACHIEVEMENTS.filter((a) =>
      a.threshold(stats)
    ).length

  return (
    <div
      style={{
        maxWidth: 920,
        margin: '0 auto',
        padding: '32px 24px 90px',
      }}
    >
      {/* HERO */}
      <div
        style={{
          ...cardStyle(T),
          marginBottom: 24,
          padding: '32px',
          background: `linear-gradient(135deg, ${T.card}, ${T.surface})`,
          border: `1px solid ${T.border}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 22,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          {/* AVATAR */}
          <div
            style={{
              width: 94,
              height: 94,
              borderRadius: '50%',
              background:
                profile.avatar_color ||
                T.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 36,
              fontWeight: 900,
              color: '#fff',
              boxShadow: `0 10px 30px ${T.accent}44`,
              flexShrink: 0,
            }}
          >
            {profile.avatar_initials || 'N'}
          </div>

          {/* USER INFO */}
          <div style={{ flex: 1 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 36,
                fontWeight: 900,
                color: T.text,
                fontFamily:
                  'Outfit, sans-serif',
              }}
            >
              {profile.username}
            </h1>

            <div
              style={{
                marginTop: 8,
                color: T.textMuted,
                fontSize: 15,
                lineHeight: 1.5,
                maxWidth: 600,
              }}
            >
              {profile.bio ||
                'Sudoku player grinding for perfection.'}
            </div>

            <div
              style={{
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap',
                marginTop: 16,
              }}
            >
              <div
                style={{
                  padding: '8px 14px',
                  borderRadius: 999,
                  background: `${T.accent}22`,
                  color: T.accentLight,
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                ⭐ Rating{' '}
                {profile.rating ?? 1000}
              </div>

              <div
                style={{
                  padding: '8px 14px',
                  borderRadius: 999,
                  background: T.surface,
                  color: T.textMuted,
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                🎮 {stats.gamesPlayed} games
              </div>

              <div
                style={{
                  padding: '8px 14px',
                  borderRadius: 999,
                  background: T.surface,
                  color: T.textMuted,
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                🔥 {stats.streak} streak
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STREAK HERO */}
      <div
        style={{
          background: `linear-gradient(135deg, ${T.accent}20, ${T.accentLight}0d)`,
          border: `1px solid ${T.accent}44`,
          borderRadius: 24,
          padding: '30px 34px',
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          marginBottom: 24,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            fontSize: 72,
            lineHeight: 1,
          }}
        >
          🔥
        </div>

        <div>
          <div
            style={{
              fontSize: 56,
              fontWeight: 900,
              color: T.accentLight,
              lineHeight: 1,
            }}
          >
            {stats.streak}
          </div>

          <div
            style={{
              marginTop: 6,
              fontSize: 18,
              fontWeight: 700,
              color: T.text,
            }}
          >
            Day Streak
          </div>

          <div
            style={{
              marginTop: 4,
              color: T.textMuted,
              fontSize: 14,
            }}
          >
            Personal best:{' '}
            {stats.longestStreak} days
          </div>
        </div>

        <div
          style={{
            marginLeft: 'auto',
            textAlign: 'right',
          }}
        >
          <div
            style={{
              color: T.textMuted,
              fontSize: 13,
            }}
          >
            Achievements
          </div>

          <div
            style={{
              marginTop: 4,
              fontSize: 30,
              fontWeight: 900,
              color: T.accentLight,
            }}
          >
            {unlockedCount}/
            {ACHIEVEMENTS.length}
          </div>
        </div>
      </div>

      {/* STATS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit,minmax(160px,1fr))',
          gap: 14,
          marginBottom: 30,
        }}
      >
        {[
          {
            label: 'Games',
            value: stats.gamesPlayed,
            icon: '🎮',
          },
          {
            label: 'Wins',
            value: stats.wins,
            icon: '🏆',
          },
          {
            label: 'Win Rate',
            value: `${winRate}%`,
            icon: '📈',
          },
          {
            label: 'Best Time',
            value:
              stats.bestTime !== null
                ? formatTime(stats.bestTime)
                : '—',
            icon: '⚡',
          },
          {
            label: 'Average',
            value:
              avgTime > 0
                ? formatTime(avgTime)
                : '—',
            icon: '⏱️',
          },
          {
            label: 'Mistakes',
            value: stats.mistakes,
            icon: '❌',
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              ...cardStyle(T),
              padding: '22px 18px',
            }}
          >
            <div
              style={{
                fontSize: 28,
              }}
            >
              {s.icon}
            </div>

            <div
              style={{
                marginTop: 10,
                fontSize: 30,
                fontWeight: 900,
                color: T.accentLight,
                lineHeight: 1,
              }}
            >
              {s.value}
            </div>

            <div
              style={{
                marginTop: 8,
                color: T.textMuted,
                fontSize: 12,
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* WIN RATE BAR */}
      <div
        style={{
          ...cardStyle(T),
          marginBottom: 30,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            marginBottom: 12,
          }}
        >
          <span
            style={{
              color: T.text,
              fontWeight: 700,
            }}
          >
            Win Rate
          </span>

          <span
            style={{
              color: T.accentLight,
              fontWeight: 800,
            }}
          >
            {winRate}%
          </span>
        </div>

        <div
          style={{
            background: T.surface,
            borderRadius: 999,
            height: 10,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${winRate}%`,
              height: '100%',
              borderRadius: 999,
              background: `linear-gradient(90deg, ${T.accent}, ${T.accentLight})`,
            }}
          />
        </div>
      </div>

      {/* HISTORY */}
      <div style={{ marginBottom: 34 }}>
        <h2
          style={{
            fontSize: 26,
            fontWeight: 900,
            color: T.text,
            marginBottom: 18,
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

          {games
            .slice(0, 10)
            .map((g) => (
              <div
                key={g.id}
                style={{
                  ...cardStyle(T),
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 800,
                      textTransform:
                        'capitalize',
                      fontSize: 16,
                    }}
                  >
                    {g.difficulty}
                  </div>

                  <div
                    style={{
                      marginTop: 4,
                      color: T.textMuted,
                      fontSize: 13,
                    }}
                  >
                    Errors:{' '}
                    {g.errors ?? 0}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: T.text,
                  }}
                >
                  {formatTime(g.time)}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* ACHIEVEMENTS */}
      <div>
        <h2
          style={{
            fontSize: 26,
            fontWeight: 900,
            color: T.text,
            marginBottom: 18,
          }}
        >
          Achievements
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fill,minmax(230px,1fr))',
            gap: 12,
          }}
        >
          {ACHIEVEMENTS.map((a) => {
            const unlocked =
              a.threshold(stats)

            return (
              <div
                key={a.id}
                style={{
                  ...cardStyle(T),
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  opacity: unlocked
                    ? 1
                    : 0.45,
                  transition:
                    'opacity 0.2s ease',
                }}
              >
                <div
                  style={{
                    fontSize: 34,
                    flexShrink: 0,
                  }}
                >
                  {a.icon}
                </div>

                <div>
                  <div
                    style={{
                      fontWeight: 800,
                      color: T.text,
                    }}
                  >
                    {a.title}
                  </div>

                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 12,
                      color: T.textMuted,
                    }}
                  >
                    {a.desc}
                  </div>

                  {unlocked && (
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 11,
                        color: T.success,
                        fontWeight: 700,
                      }}
                    >
                      ✓ Unlocked
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}