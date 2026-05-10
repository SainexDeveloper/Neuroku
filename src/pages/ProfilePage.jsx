import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import ActivityCalendar from '../components/ActivityCalendar.jsx'
import { formatTime } from '../lib/sudoku.js'
import { cardStyle, buttonStyle, pillStyle, DIFFICULTIES } from '../styles/theme.js'

const BASE = import.meta.env.VITE_API_URL ?? '/backend/api'

export default function ProfilePage({ T, userId: propUserId, onOpenAuth }) {
  const { user: me, authFetch, isAuthenticated, updateLocalUser } = useAuth()

  // If no userId prop, show own profile
  const userId    = propUserId ?? me?.id
  const isOwnProfile = userId === me?.id

  const [profile,   setProfile]   = useState(null)
  const [calendar,  setCalendar]  = useState(null)
  const [history,   setHistory]   = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [tab,       setTab]       = useState('stats')
  const [editOpen,  setEditOpen]  = useState(false)
  const [histPage,  setHistPage]  = useState(1)

  // ── Load profile ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) { setLoading(false); return }
    setLoading(true)

    const fetcher = isOwnProfile && isAuthenticated ? authFetch : fetch

    Promise.all([
      fetcher(`${BASE}/profile.php?user_id=${userId}`).then(r => r.json()),
      isOwnProfile && isAuthenticated
        ? authFetch(`${BASE}/profile.php?action=calendar`).then(r => r.json())
        : Promise.resolve(null),
    ])
      .then(([profileData, calData]) => {
        if (profileData.ok) setProfile(profileData)
        if (calData?.ok)   setCalendar(calData)
      })
      .finally(() => setLoading(false))
  }, [userId, isAuthenticated])

  // ── Load game history ──────────────────────────────────────────────────────
  useEffect(() => {
    if (tab !== 'history' || !isOwnProfile || !isAuthenticated) return
    authFetch(`${BASE}/profile.php?action=history&page=${histPage}`)
      .then(r => r.json())
      .then(data => { if (data.ok) setHistory(data) })
  }, [tab, histPage, isAuthenticated])

  if (!isAuthenticated && !propUserId) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', gap: 20, padding: 24 }}>
        <div style={{ fontSize: 64 }}>👤</div>
        <h2 style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: T.text }}>Sign in to view your profile</h2>
        <p style={{ color: T.textMuted, fontSize: 16 }}>Track your progress, streaks, and achievements.</p>
        <button onClick={onOpenAuth} style={{ ...buttonStyle(T, 'primary'), padding: '13px 32px', fontSize: 16 }}>
          Sign In / Register
        </button>
      </div>
    )
  }

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', color: T.textMuted }}>Loading profile…</div>
  }

  if (!profile) return <div style={{ padding: 40, textAlign: 'center', color: T.textMuted }}>Profile not found.</div>

  const { user, achievements, recent_games, global_rank } = profile

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px 64px' }}>

      {/* ── Profile header ─────────────────────────────────────────────── */}
      <div style={{
        ...cardStyle(T, { accent: true, radius: 20, padding: '28px 28px' }),
        display:    'flex', gap: 22, alignItems: 'flex-start',
        marginBottom: 24, flexWrap: 'wrap',
      }}>
        {/* Avatar */}
        <div style={{
          width:          72, height: 72, borderRadius: 20, flexShrink: 0,
          background:     `linear-gradient(135deg, ${user.avatar_color}, ${user.avatar_color}88)`,
          display:        'flex', alignItems: 'center', justifyContent: 'center',
          fontSize:       26, fontWeight: 900, color: '#fff',
          fontFamily:     'Outfit, sans-serif',
          boxShadow:      `0 4px 16px ${user.avatar_color}44`,
        }}>
          {user.avatar_initials}
        </div>

        {/* Info */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: T.text }}>
              {user.username}
            </h1>
            {global_rank && (
              <span style={{ ...pillStyle(T), fontSize: 12 }}>#{global_rank} Global</span>
            )}
            {user.current_streak > 0 && (
              <span style={{ ...pillStyle(T, '#f97316'), fontSize: 12 }}>🔥 {user.current_streak} streak</span>
            )}
          </div>
          {user.bio && <p style={{ color: T.textMuted, fontSize: 14, marginTop: 6, lineHeight: 1.5 }}>{user.bio}</p>}
          <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
            {user.country && <span style={{ fontSize: 13, color: T.textMuted }}>📍 {[user.city, user.country].filter(Boolean).join(', ')}</span>}
            <span style={{ fontSize: 13, color: T.textMuted }}>📅 Joined {new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</span>
          </div>
        </div>

        {/* Rating + edit */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: T.accentLight, fontFamily: 'Outfit, sans-serif' }}>
            {user.rating ?? 1000}
          </div>
          <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 10 }}>Rating</div>
          {isOwnProfile && (
            <button onClick={() => setEditOpen(true)} style={{ ...buttonStyle(T, 'default'), padding: '8px 16px', fontSize: 13 }}>
              ✏️ Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* ── Quick stats ────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Games Won',   value: user.games_won    ?? 0  },
          { label: 'Best Time',   value: user.best_time ? formatTime(user.best_time) : '—' },
          { label: 'Streak Best', value: user.longest_streak ?? 0  },
          { label: 'Rating',      value: user.rating ?? 1000        },
        ].map(s => (
          <div key={s.label} style={{ ...cardStyle(T), textAlign: 'center', padding: '16px 12px' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.accentLight, fontFamily: 'Outfit, sans-serif' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 24,
        background: T.card, borderRadius: 14, padding: 6, border: `1px solid ${T.border}`,
        overflowX: 'auto',
      }}>
        {[
          { id: 'stats',    label: '📊 Stats'     },
          ...(isOwnProfile ? [{ id: 'calendar', label: '📅 Calendar' }] : []),
          { id: 'achievements', label: '🏆 Achievements' },
          { id: 'history',  label: '🎮 History'   },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex:       '0 0 auto',
            padding:    '9px 18px',
            borderRadius: 10,
            fontSize:   14, fontWeight: 600, fontFamily: 'Outfit, sans-serif',
            background: tab === t.id ? T.accent : 'transparent',
            color:      tab === t.id ? '#fff'   : T.textMuted,
            border:     'none', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── Tab: Stats ─────────────────────────────────────────────────── */}
      {tab === 'stats' && (
        <div>
          {/* Per-difficulty wins */}
          <div style={{ ...cardStyle(T), marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: T.text }}>Wins by Difficulty</h3>
            {Object.entries(DIFFICULTIES).map(([key, d]) => {
              const count = user[`wins_${key}`] ?? 0
              const total = (user.games_won ?? 1) || 1
              return (
                <div key={key} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 13, color: T.textMuted }}>{d.emoji} {d.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{count}</span>
                  </div>
                  <div style={{ background: T.surface, borderRadius: 100, height: 6, overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.round((count / total) * 100)}%`, height: '100%',
                      background: d.color, borderRadius: 100, transition: 'width 1s ease',
                      minWidth: count > 0 ? 8 : 0,
                    }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Recent games */}
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: T.text }}>Recent Games</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(recent_games ?? []).slice(0, 5).map((g, i) => (
              <GameHistoryRow key={i} game={g} T={T} />
            ))}
            {!recent_games?.length && <p style={{ color: T.textMuted, fontSize: 14 }}>No games played yet.</p>}
          </div>
        </div>
      )}

      {/* ── Tab: Calendar ──────────────────────────────────────────────── */}
      {tab === 'calendar' && calendar && (
        <div style={{ ...cardStyle(T) }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: T.text }}>Activity — Last 12 Months</h3>
          <ActivityCalendar
            calendar={calendar.calendar}
            currentStreak={calendar.current_streak}
            longestStreak={calendar.longest_streak}
            T={T}
          />
          <div style={{ marginTop: 16, fontSize: 13, color: T.textMuted }}>
            Active days: <strong style={{ color: T.text }}>{calendar.total_active_days}</strong>
          </div>
        </div>
      )}

      {/* ── Tab: Achievements ──────────────────────────────────────────── */}
      {tab === 'achievements' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {(achievements ?? []).length === 0
            ? <p style={{ color: T.textMuted, fontSize: 14 }}>No achievements yet. Start playing!</p>
            : achievements.map(a => (
              <div key={a.id} style={{ ...cardStyle(T, { accent: true }), display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ fontSize: 30, flexShrink: 0 }}>{a.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{a.title}</div>
                  <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{a.description}</div>
                  <div style={{ fontSize: 11, color: T.success, marginTop: 4, fontWeight: 600 }}>
                    ✓ {new Date(a.unlocked_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* ── Tab: History ───────────────────────────────────────────────── */}
      {tab === 'history' && (
        <div>
          {!isOwnProfile && <p style={{ color: T.textMuted }}>Game history is private.</p>}
          {isOwnProfile && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {history?.scores?.map((g, i) => (
                  <GameHistoryRow key={i} game={g} T={T} />
                ))}
                {!history && <p style={{ color: T.textMuted, fontSize: 14 }}>Loading…</p>}
              </div>
              {history && history.total > 20 && (
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button
                    disabled={histPage <= 1}
                    onClick={() => setHistPage(p => p - 1)}
                    style={{ ...buttonStyle(T, 'default'), opacity: histPage <= 1 ? 0.4 : 1 }}
                  >← Prev</button>
                  <span style={{ padding: '11px 16px', color: T.textMuted, fontSize: 14 }}>
                    {histPage} / {Math.ceil(history.total / 20)}
                  </span>
                  <button
                    disabled={histPage >= Math.ceil(history.total / 20)}
                    onClick={() => setHistPage(p => p + 1)}
                    style={{ ...buttonStyle(T, 'default'), opacity: histPage >= Math.ceil(history.total / 20) ? 0.4 : 1 }}
                  >Next →</button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Edit profile modal ──────────────────────────────────────────── */}
      {editOpen && (
        <EditProfileModal T={T} user={me} onClose={() => setEditOpen(false)}
          authFetch={authFetch}
          onSaved={(patch) => {
            updateLocalUser(patch)
            setProfile(p => p ? { ...p, user: { ...p.user, ...patch } } : p)
            setEditOpen(false)
          }}
        />
      )}
    </div>
  )
}

// ─── Game history row ─────────────────────────────────────────────────────────
function GameHistoryRow({ game, T }) {
  const diff = DIFFICULTIES[game.difficulty] ?? { emoji: '?', color: T.textMuted }
  return (
    <div style={{
      ...cardStyle(T),
      display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
    }}>
      <span style={{ fontSize: 20 }}>{diff.emoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.text, textTransform: 'capitalize' }}>
          {game.difficulty}{game.is_daily ? ' · Daily' : ''}
        </div>
        <div style={{ fontSize: 12, color: T.textMuted }}>
          {new Date(game.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontWeight: 700, color: T.accentLight, fontSize: 15 }}>
          {game.time_formatted ?? formatTime(game.completion_time)}
        </div>
        <div style={{ fontSize: 12, color: game.mistakes === 0 ? T.success : T.textMuted }}>
          {game.mistakes === 0 ? '✨ Perfect' : `${game.mistakes} err`}
        </div>
      </div>
    </div>
  )
}

// ─── Edit profile modal ───────────────────────────────────────────────────────
function EditProfileModal({ T, user, onClose, authFetch, onSaved }) {
  const [username, setUsername] = useState(user?.username ?? '')
  const [bio,      setBio]      = useState(user?.bio      ?? '')
  const [country,  setCountry]  = useState(user?.country  ?? '')
  const [city,     setCity]     = useState(user?.city     ?? '')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const BASE = import.meta.env.VITE_API_URL ?? '/backend/api'

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 14,
    fontFamily: 'Outfit, sans-serif', background: T.surface, color: T.text,
    border: `1.5px solid ${T.border}`, outline: 'none', boxSizing: 'border-box',
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authFetch(`${BASE}/profile.php?action=update`, {
        method: 'PUT',
        body: JSON.stringify({ username, bio, country, city }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error ?? 'Update failed')
      onSaved({ username, bio, country, city, avatar_initials: username.charAt(0).toUpperCase() + username.slice(-1).toUpperCase() })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: T.overlay, backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        ...cardStyle(T, { accent: true, radius: 20, padding: '32px 28px' }),
        maxWidth: 420, width: '100%',
        boxShadow: `0 24px 80px #00000055`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: T.text, fontFamily: 'Outfit, sans-serif' }}>Edit Profile</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.textMuted, cursor: 'pointer', fontSize: 22 }}>×</button>
        </div>
        {error && <div style={{ background: T.dangerDim, border: `1px solid ${T.danger}44`, borderRadius: 10, padding: '9px 14px', color: T.danger, fontSize: 14, marginBottom: 16 }}>{error}</div>}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Username', value: username, set: setUsername, placeholder: 'coolplayer42' },
            { label: 'Bio',      value: bio,      set: setBio,      placeholder: 'About you (max 160 chars)', maxLength: 160 },
            { label: 'Country',  value: country,  set: setCountry,  placeholder: 'Kazakhstan' },
            { label: 'City',     value: city,     set: setCity,     placeholder: 'Almaty' },
          ].map(f => (
            <div key={f.label}>
              <label style={{ fontSize: 13, color: T.textMuted, fontWeight: 600, display: 'block', marginBottom: 5 }}>{f.label}</label>
              {f.label === 'Bio' ? (
                <textarea value={f.value} onChange={e => f.set(e.target.value)} maxLength={f.maxLength ?? 255}
                  placeholder={f.placeholder} rows={3}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }}
                  onFocus={e => e.target.style.borderColor = T.accent}
                  onBlur={e => e.target.style.borderColor = T.border}
                />
              ) : (
                <input type="text" value={f.value} onChange={e => f.set(e.target.value)}
                  placeholder={f.placeholder} maxLength={f.maxLength ?? 64}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = T.accent}
                  onBlur={e => e.target.style.borderColor = T.border}
                />
              )}
            </div>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="submit" disabled={loading} style={{ ...buttonStyle(T, 'primary'), flex: 1, padding: '12px', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
            <button type="button" onClick={onClose} style={{ ...buttonStyle(T, 'default'), padding: '12px 20px' }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}