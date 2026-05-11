import { useState, useEffect } from 'react'
import { LeaderboardList } from './DailyPage.jsx'
import { formatTime } from '../lib/sudoku.js'
import { fetchLeaderboard } from '../lib/storage.js'

const TABS = [
  { id: 'daily',  label: '📅 Daily'  },
  { id: 'weekly', label: '📆 Weekly' },
  { id: 'global', label: '🌍 All-Time' },
]

export default async function LeaderboardPage({ T }) {
  const [tab, setTab] = useState('daily')
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  const topThree = entries.slice(0, 3)
  const today = new Date().toISOString().slice(0, 10)

  const { data } = await supabase
    .from('daily_results')
    .select('*')
    .eq('date', today)
    .order('time', { ascending: true })
    .limit(50)

  useEffect(() => {
    let active = true
    setLoading(true)

    fetchLeaderboard(tab).then(data => {
      if (!active) return
      setEntries(data || [])
      setLoading(false)
    })

    return () => { active = false }
  }, [tab])
  

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 64px' }}>

      <h1 style={{ fontSize: 34, fontWeight: 900, marginBottom: 6, fontFamily: 'Outfit, sans-serif', color: T.text }}>
        Leaderboard
      </h1>

      <p style={{ color: T.textMuted, marginBottom: 28 }}>
        Top solvers from around the world.
      </p>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: 6,
        marginBottom: 32,
        background: T.card,
        borderRadius: 14,
        padding: 6,
        border: `1px solid ${T.border}`,
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: 10,
              fontWeight: 600,
              background: tab === t.id ? T.accent : 'transparent',
              color: tab === t.id ? '#fff' : T.textMuted,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* LOADING FIX */}
      {loading ? (
        <div style={{ color: T.textMuted }}>Loading leaderboard...</div>
      ) : (
        <>
          {/* Podium SAFE */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 36 }}>
            <PodiumCard T={T} player={topThree[1]} place={2} height={100} />
            <PodiumCard T={T} player={topThree[0]} place={1} height={130} />
            <PodiumCard T={T} player={topThree[2]} place={3} height={80} />
          </div>

          <LeaderboardList T={T} entries={entries} />
        </>
      )}
    </div>
  )
}

function PodiumCard({ T, player, place, height }) {
  if (!player) return <div style={{ opacity: 0.3 }}>—</div>

  const medals  = { 1: '🥇', 2: '🥈', 3: '🥉' }
  const bgColors = {
    1: `linear-gradient(180deg, #ffd70022, transparent)`,
    2: `linear-gradient(180deg, #c0c0c022, transparent)`,
    3: `linear-gradient(180deg, #cd7f3222, transparent)`,
  }
  const borderColors = { 1: '#ffd70066', 2: '#c0c0c044', 3: '#cd7f3244' }

  return (
    <div style={{
      flex:          1,
      maxWidth:      180,
      minWidth:      0,
      display:       'flex',
      flexDirection: 'column',
      alignItems:    'center',
      gap:           8,
    }}>
      {/* Avatar */}
      <div style={{
        width:         52, height: 52, borderRadius: '50%',
        background:    `linear-gradient(135deg, ${T.accent}55, ${T.accentLight}33)`,
        border:        `2px solid ${T.accent}66`,
        display:       'flex', alignItems: 'center', justifyContent: 'center',
        fontSize:      15, fontWeight: 800, color: T.accentLight,
        fontFamily:    'Outfit, sans-serif',
      }}>
        {player.avatar}
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: T.text, textAlign: 'center', fontFamily: 'Outfit, sans-serif', lineHeight: 1.2 }}>
        {player.name}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.accentLight }}>{formatTime(player.time)}</div>

      {/* Podium block */}
      <div style={{
        width:        '100%',
        height:       height,
        background:   bgColors[place],
        border:       `1px solid ${borderColors[place]}`,
        borderRadius: '10px 10px 0 0',
        display:      'flex',
        flexDirection:'column',
        alignItems:   'center',
        justifyContent:'flex-start',
        paddingTop:   12,
        fontSize:     28,
      }}>
        {medals[place]}
        <span style={{ fontSize: 14, fontWeight: 700, color: T.textMuted, marginTop: 4 }}>#{place}</span>
      </div>
    </div>
  )
}