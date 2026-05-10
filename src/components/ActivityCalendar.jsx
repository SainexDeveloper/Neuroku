import { useMemo } from 'react'

// ─── ActivityCalendar ─────────────────────────────────────────────────────────
// Shows a GitHub-style contribution heatmap of daily puzzle activity.
// Props:
//   calendar  [{activity_date, games_played, games_won, daily_done}]
//   T         theme object

export default function ActivityCalendar({ calendar = [], T, currentStreak = 0, longestStreak = 0 }) {
  const { weeks, monthLabels } = useMemo(() => buildCalendarGrid(calendar), [calendar])

  const getColor = (day) => {
    if (!day || !day.games_played) return T.cellBg
    const intensity = Math.min(day.games_played, 4)
    const alpha = [0.25, 0.45, 0.65, 0.85, 1][intensity]
    const base = day.daily_done ? T.success : T.accent
    return hexWithAlpha(base, alpha)
  }

  const cellSize  = 13
  const cellGap   = 3
  const cellStep  = cellSize + cellGap

  return (
    <div>
      {/* Streak banner */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <StreakBadge T={T} value={currentStreak} label="Current Streak" icon="🔥" />
        <StreakBadge T={T} value={longestStreak} label="Longest Streak" icon="🏆" />
      </div>

      {/* Heatmap */}
      <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
        <div style={{ position: 'relative', minWidth: weeks.length * cellStep }}>

          {/* Month labels */}
          <div style={{ display: 'flex', marginBottom: 4, paddingLeft: 0 }}>
            {monthLabels.map((ml, i) => (
              <div key={i} style={{
                position:   'absolute',
                left:       ml.weekIndex * cellStep,
                fontSize:   11,
                color:      T.textMuted,
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 500,
              }}>
                {ml.label}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div style={{ display: 'flex', gap: cellGap, marginTop: 18 }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: cellGap }}>
                {week.map((day, di) => {
                  if (!day) return <div key={di} style={{ width: cellSize, height: cellSize }} />
                  const isToday = day.activity_date === new Date().toISOString().slice(0, 10)
                  return (
                    <div
                      key={di}
                      title={formatTooltip(day)}
                      style={{
                        width:        cellSize,
                        height:       cellSize,
                        borderRadius: 3,
                        background:   getColor(day),
                        border:       isToday ? `1.5px solid ${T.accent}` : '1px solid transparent',
                        cursor:       'default',
                        transition:   'transform 0.1s',
                        flexShrink:   0,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.4)' }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
        <span style={{ fontSize: 12, color: T.textMuted }}>Less</span>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} style={{
            width:        cellSize, height: cellSize, borderRadius: 3,
            background:   i === 0 ? T.cellBg : hexWithAlpha(T.accent, [0.25, 0.45, 0.65, 0.85, 1][i]),
          }} />
        ))}
        <span style={{ fontSize: 12, color: T.textMuted }}>More</span>
        <span style={{ fontSize: 12, color: T.textMuted, marginLeft: 8 }}>
          <span style={{
            display: 'inline-block', width: cellSize, height: cellSize,
            borderRadius: 3, background: hexWithAlpha(T.success, 0.8),
            verticalAlign: 'middle', marginRight: 4,
          }}/>
          Daily challenge
        </span>
      </div>
    </div>
  )
}

// ─── Streak badge ─────────────────────────────────────────────────────────────
function StreakBadge({ T, value, label, icon }) {
  return (
    <div style={{
      background:   T.card,
      border:       `1px solid ${T.border}`,
      borderRadius: 12,
      padding:      '12px 18px',
      display:      'flex',
      alignItems:   'center',
      gap:          10,
    }}>
      <span style={{ fontSize: 24 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: T.accentLight, fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{label}</div>
      </div>
    </div>
  )
}

// ─── Build 52-week grid ───────────────────────────────────────────────────────
function buildCalendarGrid(calendar) {
  // Index by date
  const byDate = {}
  for (const d of calendar) byDate[d.activity_date] = d

  // Start from 52 weeks ago, aligned to Sunday
  const today    = new Date()
  const endDate  = new Date(today)
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - 52 * 7)
  // Align to Sunday
  startDate.setDate(startDate.getDate() - startDate.getDay())

  const weeks       = []
  const monthLabels = []
  let lastMonth     = -1
  let cursor        = new Date(startDate)
  let weekIndex     = 0

  while (cursor <= endDate) {
    const week = []
    for (let d = 0; d < 7; d++) {
      if (cursor > endDate) { week.push(null); cursor.setDate(cursor.getDate() + 1); continue }
      const dateStr = cursor.toISOString().slice(0, 10)
      const month   = cursor.getMonth()

      if (d === 0 && month !== lastMonth) {
        monthLabels.push({
          label:     cursor.toLocaleDateString('en-US', { month: 'short' }),
          weekIndex,
        })
        lastMonth = month
      }

      week.push(byDate[dateStr] ?? { activity_date: dateStr, games_played: 0, games_won: 0, daily_done: 0 })
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
    weekIndex++
  }

  return { weeks, monthLabels }
}

// ─── Tooltip text ─────────────────────────────────────────────────────────────
function formatTooltip(day) {
  const d     = new Date(day.activity_date + 'T12:00:00')
  const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  if (!day.games_played) return `${label}: No activity`
  const parts = [`${label}: ${day.games_played} game${day.games_played > 1 ? 's' : ''}`]
  if (day.daily_done) parts.push('✅ Daily done')
  return parts.join(' · ')
}

// ─── Hex with alpha ───────────────────────────────────────────────────────────
function hexWithAlpha(hex, alpha) {
  // hex = '#rrggbb', alpha = 0..1
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}