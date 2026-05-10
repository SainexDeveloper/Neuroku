import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import ActivityCalendar from '../components/ActivityCalendar.jsx'
import { formatTime } from '../lib/sudoku.js'
import { cardStyle, buttonStyle, pillStyle, DIFFICULTIES } from '../styles/theme.js'

export default function ProfilePage({ T, userId: propUserId, onOpenAuth }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('stats')
  const [editOpen, setEditOpen] = useState(false)

  const [user, setUser] = useState(null)

  // get auth user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })
  }, [])

  const userId = propUserId ?? user?.id
  const isOwn = userId === user?.id

  // ── load profile ─────────────────────────────
  useEffect(() => {
    if (!userId) return

    const load = async () => {
      setLoading(true)

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (!error) setProfile(data)
      setLoading(false)
    }

    load()
  }, [userId])

  // ── update profile ───────────────────────────
  const updateProfile = async (patch) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', user.id)
      .select()
      .single()

    if (!error) {
      setProfile(data)
      setEditOpen(false)
    }
  }

  if (!user && !propUserId) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <h2>Sign in required</h2>
        <button onClick={onOpenAuth}>Login</button>
      </div>
    )
  }

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>
  if (!profile) return <div>Profile not found</div>

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: 24 }}>

      {/* Header */}
      <div style={cardStyle(T)}>
        <h1>{profile.username}</h1>
        <p>{profile.bio}</p>
        <p>{profile.city}, {profile.country}</p>
        <button onClick={() => setEditOpen(true)}>
          Edit
        </button>
      </div>

      {/* Stats */}
      <div style={cardStyle(T)}>
        <div>Rating: {profile.rating}</div>
        <div>Games won: {profile.games_won}</div>
        <div>Streak: {profile.current_streak}</div>
      </div>

      {/* Edit */}
      {editOpen && (
        <EditModal
          T={T}
          profile={profile}
          onClose={() => setEditOpen(false)}
          onSave={updateProfile}
        />
      )}
    </div>
  )
}

// ─── Edit Modal ─────────────────────────────
function EditModal({ T, profile, onClose, onSave }) {
  const [username, setUsername] = useState(profile.username || '')
  const [bio, setBio] = useState(profile.bio || '')
  const [country, setCountry] = useState(profile.country || '')
  const [city, setCity] = useState(profile.city || '')

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0008' }}>
      <div style={cardStyle(T)}>
        <h3>Edit Profile</h3>

        <input value={username} onChange={e => setUsername(e.target.value)} />
        <input value={bio} onChange={e => setBio(e.target.value)} />
        <input value={country} onChange={e => setCountry(e.target.value)} />
        <input value={city} onChange={e => setCity(e.target.value)} />

        <button onClick={() => onSave({ username, bio, country, city })}>
          Save
        </button>

        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  )
}