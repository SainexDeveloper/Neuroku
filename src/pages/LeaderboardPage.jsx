import { useState } from 'react'
import { LeaderboardList } from './DailyPage.jsx'
import { MOCK_LEADERBOARD } from '../lib/api.js'
import { formatTime } from '../lib/sudoku.js'

const TABS = [
  { id: 'daily',  label: '📅 Daily'  },
  { id: 'weekly', label: '📆 Weekly' },
  { id: 'global', label: '🌍 All-Time' },
]

// Vary the mock data slightly per tab for realism
function getEntries(tab) {
  if (tab === 'daily')  return MOCK_LEADERBOARD
  if (tab === 'weekly') return MOCK_LEADERBOARD.map((e, i) => ({ ...e, streak: e.streak + i, time: e.time + i * 12 }))
  return MOCK_LEADERBOARD.map((e, i) => ({ ...e, streak: e.streak * 3 + i * 2, time: e.time - i * 3 }))
}

export default function LeaderboardPage({ T }) {
  const [tab, setTab] = useState('daily')
  const entries = getEntries(tab)

  const topThree = entries.slice(0, 3)

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 64px' }}>
      <h1 style={{ fontSize: 34, fontWeight: 900, marginBottom: 6, fontFamily: 'Outfit, sans-serif', color: T.text }}>
        Leaderboard
      </h1>
      <p style={{ color: T.textMuted, marginBottom: 28, fontSize: 16 }}>
        Top solvers from around the world.
      </p>

      {/* Tabs */}
      <div style={{
        display:        'flex',
        gap:            6,
        marginBottom:   32,
        background:     T.card,
        borderRadius:   14,
        padding:        6,
        border:         `1px solid ${T.border}`,
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex:        1,
              padding:     '10px 0',
              borderRadius: 10,
              fontSize:    14,
              fontWeight:  600,
              fontFamily:  'Outfit, sans-serif',
              background:  tab === t.id ? T.accent : 'transparent',
              color:       tab === t.id ? '#fff' : T.textMuted,
              border:      'none',
              cursor:      'pointer',
              transition:  'all 0.2s ease',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Podium (top 3) */}
      <div style={{
        display:         'flex',
        justifyContent:  'center',
        alignItems:      'flex-end',
        gap:             16,
        marginBottom:    36,
        padding:         '0 8px',
      }}>
        {/* 2nd */}
        <PodiumCard T={T} player={topThree[1]} place={2} height={100} />
        {/* 1st */}
        <PodiumCard T={T} player={topThree[0]} place={1} height={130} />
        {/* 3rd */}
        <PodiumCard T={T} player={topThree[2]} place={3} height={80} />
      </div>

      {/* Full list */}
      <LeaderboardList T={T} entries={entries} highlightRank={null} />

      {/* Footer note */}
      <p style={{ textAlign: 'center', marginTop: 28, fontSize: 13, color: T.textFaint }}>
        Rankings update in real-time. Daily rankings reset at midnight UTC.
      </p>
    </div>
  )
}

function PodiumCard({ T, player, place, height }) {
  if (!player) return null

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