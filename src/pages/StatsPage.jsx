import { formatTime } from '../lib/sudoku.js'
import { cardStyle } from '../styles/theme.js'

const ACHIEVEMENTS = [
  { id: 'first_win',   icon: '🏆', title: 'First Victory',   desc: 'Complete your first puzzle',          threshold: (s) => s.wins >= 1 },
  { id: 'no_mistakes', icon: '💎', title: 'Flawless',        desc: 'Solve a puzzle with zero mistakes',   threshold: (s) => s.wins >= 1 },
  { id: 'streak3',     icon: '🔥', title: 'On Fire',         desc: '3-day streak',                        threshold: (s) => s.longestStreak >= 3 },
  { id: 'streak7',     icon: '⚡', title: 'Week Warrior',    desc: '7-day streak',                        threshold: (s) => s.longestStreak >= 7 },
  { id: 'streak30',    icon: '🌟', title: 'Monthly Master',  desc: '30-day streak',                       threshold: (s) => s.longestStreak >= 30 },
  { id: 'speed_3min',  icon: '🚀', title: 'Speed Demon',     desc: 'Solve in under 3 minutes',            threshold: (s) => s.bestTime !== null && s.bestTime < 180 },
  { id: 'played10',    icon: '🧩', title: 'Dedicated',       desc: '10 games played',                     threshold: (s) => s.gamesPlayed >= 10 },
  { id: 'played50',    icon: '🧠', title: 'Brain Athlete',   desc: '50 games played',                     threshold: (s) => s.gamesPlayed >= 50 },
  { id: 'expert_win',  icon: '💀', title: 'Expert Mind',     desc: 'Complete an Expert puzzle',           threshold: (s) => (s.byDifficulty?.expert ?? 0) >= 1 },
  { id: 'all_diff',    icon: '🎯', title: 'Completionist',   desc: 'Win on all 4 difficulties',           threshold: (s) => Object.values(s.byDifficulty ?? {}).every(v => v >= 1) },
  { id: 'win10',       icon: '🏅', title: 'Ten Wins',        desc: '10 puzzles completed',                threshold: (s) => s.wins >= 10 },
  { id: 'win100',      icon: '👑', title: 'Centurion',       desc: '100 puzzles completed',               threshold: (s) => s.wins >= 100 },
]

export default function StatsPage({ T, stats }) {
  const winRate = stats.gamesPlayed > 0
    ? Math.round((stats.wins / stats.gamesPlayed) * 100)
    : 0

  const avgTime = stats.wins > 0
    ? Math.round(stats.totalTime / stats.wins)
    : 0

  const unlockedCount = ACHIEVEMENTS.filter(a => a.threshold(stats)).length

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px 64px' }}>
      <h1 style={{ fontSize: 34, fontWeight: 900, marginBottom: 6, fontFamily: 'Outfit, sans-serif', color: T.text }}>
        Your Stats
      </h1>
      <p style={{ color: T.textMuted, marginBottom: 36, fontSize: 16 }}>
        Track your brain training progress over time.
      </p>

      {/* ── Streak hero ─────────────────────────────────────────────────── */}
      <div style={{
        background:   `linear-gradient(135deg, ${T.accent}20, ${T.accentLight}0d)`,
        border:       `1px solid ${T.accent}44`,
        borderRadius: 20,
        padding:      '28px 32px',
        display:      'flex',
        alignItems:   'center',
        gap:          24,
        marginBottom: 22,
        flexWrap:     'wrap',
      }}>
        <div style={{ fontSize: 64, lineHeight: 1 }}>🔥</div>
        <div>
          <div style={{ fontSize: 52, fontWeight: 900, color: T.accentLight, lineHeight: 1, fontFamily: 'Outfit, sans-serif' }}>
            {stats.streak}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginTop: 4 }}>Day Streak</div>
          <div style={{ color: T.textMuted, fontSize: 14, marginTop: 2 }}>
            Personal best: {stats.longestStreak} days
          </div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 4 }}>Achievements</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: T.accentLight, fontFamily: 'Outfit, sans-serif' }}>
            {unlockedCount}/{ACHIEVEMENTS.length}
          </div>
        </div>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap:                 14,
        marginBottom:        28,
      }}>
        {[
          { label: 'Games Played', value: stats.gamesPlayed, icon: '🎮' },
          { label: 'Games Won',    value: stats.wins,         icon: '🏆' },
          { label: 'Win Rate',     value: `${winRate}%`,      icon: '📈' },
          { label: 'Best Time',    value: stats.bestTime !== null ? formatTime(stats.bestTime) : '—', icon: '⚡' },
          { label: 'Avg Time',     value: avgTime > 0 ? formatTime(avgTime) : '—', icon: '⏱️' },
          { label: 'Total Errors', value: stats.mistakes,     icon: '❌' },
        ].map(s => (
          <div key={s.label} style={{ ...cardStyle(T), padding: '18px 16px', textAlign: 'left' }}>
            <div style={{ fontSize: 26, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: T.accentLight, fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 6 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Win rate bar ─────────────────────────────────────────────────── */}
      <div style={{ ...cardStyle(T), marginBottom: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontWeight: 600, color: T.text }}>Win Rate</span>
          <span style={{ color: T.accentLight, fontWeight: 700 }}>{winRate}%</span>
        </div>
        <div style={{ background: T.surface, borderRadius: 100, height: 8, overflow: 'hidden' }}>
          <div style={{
            width:        `${winRate}%`,
            height:       '100%',
            borderRadius: 100,
            background:   `linear-gradient(90deg, ${T.accent}, ${T.accentLight})`,
            transition:   'width 1.2s ease',
          }} />
        </div>
        <div style={{ marginTop: 10, fontSize: 13, color: T.textMuted }}>
          {stats.wins} wins out of {stats.gamesPlayed} games
        </div>
      </div>

      {/* ── By difficulty breakdown ───────────────────────────────────────── */}
      {stats.byDifficulty && (
        <div style={{ ...cardStyle(T), marginBottom: 28 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: T.text }}>Wins by Difficulty</h3>
          {Object.entries(stats.byDifficulty).map(([diff, count]) => {
            const pct = stats.wins > 0 ? Math.round((count / stats.wins) * 100) : 0
            const colors = { easy: '#4ade80', medium: '#fbbf24', hard: '#f97316', expert: '#f87171' }
            return (
              <div key={diff} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 13, color: T.textMuted, textTransform: 'capitalize' }}>{diff}</span>
                  <span style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{count}</span>
                </div>
                <div style={{ background: T.surface, borderRadius: 100, height: 6, overflow: 'hidden' }}>
                  <div style={{
                    width: `${pct}%`, height: '100%', borderRadius: 100,
                    background: colors[diff], transition: 'width 1s ease',
                    minWidth: count > 0 ? 8 : 0,
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Achievements ─────────────────────────────────────────────────── */}
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16, fontFamily: 'Outfit, sans-serif', color: T.text }}>
        Achievements
      </h2>
      <div style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
        gap:                 12,
      }}>
        {ACHIEVEMENTS.map(a => {
          const unlocked = a.threshold(stats)
          return (
            <div key={a.id} style={{
              ...cardStyle(T, { accent: unlocked }),
              display:   'flex',
              gap:       14,
              alignItems:'center',
              opacity:   unlocked ? 1 : 0.45,
              filter:    unlocked ? 'none' : 'grayscale(0.8)',
              transition:'opacity 0.2s, filter 0.2s',
            }}>
              <div style={{ fontSize: 30, flexShrink: 0 }}>{a.icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{a.title}</div>
                <div style={{ fontSize: 12, color: T.textMuted, marginTop: 3 }}>{a.desc}</div>
                {unlocked && (
                  <div style={{ fontSize: 11, color: T.success, marginTop: 4, fontWeight: 600 }}>✓ Unlocked</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}