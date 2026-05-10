import { useEffect, useState } from 'react'
import { formatTime } from '../lib/sudoku.js'
import { buttonStyle } from '../styles/theme.js'

// ─── Confetti particle ────────────────────────────────────────────────────────
function Confetti() {
  const [particles] = useState(() => {
    const colors = ['#7c6af7','#a89af9','#4ade80','#fbbf24','#f87171','#60a5fa','#f472b6','#34d399']
    return Array.from({ length: 90 }, (_, i) => ({
      id:    i,
      x:     Math.random() * 100,
      size:  5 + Math.random() * 9,
      color: colors[Math.floor(Math.random() * colors.length)],
      round: Math.random() > 0.5,
      dur:   2.2 + Math.random() * 2,
      delay: Math.random() * 1.4,
      drift: (Math.random() - 0.5) * 80,
    }))
  })

  return (
    <>
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg);    opacity: 1; }
          100% { transform: translateY(110vh) rotate(600deg); opacity: 0; }
        }
      `}</style>
      {particles.map(p => (
        <div key={p.id} style={{
          position:   'fixed',
          top:        '-20px',
          left:       `${p.x}%`,
          zIndex:     9998,
          width:      `${p.size}px`,
          height:     `${p.size}px`,
          background: p.color,
          borderRadius: p.round ? '50%' : '2px',
          animation:  `confettiFall ${p.dur}s ${p.delay}s ease-in forwards`,
          pointerEvents: 'none',
        }} />
      ))}
    </>
  )
}

// ─── VictoryModal ─────────────────────────────────────────────────────────────
export default function VictoryModal({ T, gs, stats, onClose, onNewGame, onNewDifficulty }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Slight delay so the animation feels intentional
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  const avgTime = stats.gamesPlayed > 0
    ? Math.round(stats.totalTime / stats.gamesPlayed)
    : gs.timer

  const isPersonalBest = stats.bestTime !== null && gs.timer <= stats.bestTime

  return (
    <>
      <Confetti />
      <div style={{
        position:       'fixed',
        inset:          0,
        zIndex:         200,
        background:     T.overlay,
        backdropFilter: 'blur(6px)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        24,
        opacity:        visible ? 1 : 0,
        transition:     'opacity 0.3s ease',
      }}>
        <div style={{
          background:   T.surface,
          border:       `1px solid ${T.accent}55`,
          borderRadius: 24,
          padding:      '40px 36px',
          maxWidth:     460,
          width:        '100%',
          textAlign:    'center',
          boxShadow:    `0 24px 80px ${T.accent}44, 0 4px 16px #00000055`,
          transform:    visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.96)',
          transition:   'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}>
          {/* Trophy + title */}
          <div style={{ fontSize: 64, marginBottom: 12, lineHeight: 1 }}>
            {gs.errors === 0 ? '💎' : gs.errors <= 2 ? '🏆' : '🎉'}
          </div>
          <h2 style={{
            fontSize:      32,
            fontWeight:    800,
            marginBottom:  6,
            fontFamily:    'Outfit, sans-serif',
            color:         T.text,
          }}>
            {gs.errors === 0 ? 'Flawless!' : 'Puzzle Solved!'}
          </h2>
          <p style={{ color: T.textMuted, marginBottom: 28, fontSize: 15 }}>
            {gs.errors === 0
              ? 'Zero mistakes — your brain is firing on all cylinders.'
              : `Great work! You solved it in ${formatTime(gs.timer)}.`}
          </p>

          {/* Personal best badge */}
          {isPersonalBest && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 14px', borderRadius: 100, marginBottom: 20,
              background: `${T.warning}22`, color: T.warning,
              border: `1px solid ${T.warning}44`, fontSize: 13, fontWeight: 700,
            }}>
              ⚡ New Personal Best!
            </div>
          )}

          {/* Stats row */}
          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap:                 12,
            marginBottom:        28,
          }}>
            {[
              { label: 'Time',   value: formatTime(gs.timer),     icon: '⏱️' },
              { label: 'Errors', value: gs.errors,                icon: gs.errors === 0 ? '✨' : '❌' },
              { label: 'Average', value: formatTime(avgTime), icon: '📊' },
              { label: 'Streak', value: `${stats.streak}🔥`,      icon: '' },
            ].map(s => (
              <div key={s.label} style={{
                background:   T.card,
                border:       `1px solid ${T.border}`,
                borderRadius: 12,
                padding:      '14px 8px',
              }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: T.accentLight, fontFamily: 'Outfit, sans-serif' }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Difficulty buttons */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={onNewGame} style={{
              ...buttonStyle(T, 'primary'),
              padding: '13px 28px', fontSize: 15,
            }}>
              ▶ Play Again
            </button>
            <button onClick={onClose} style={{
              ...buttonStyle(T, 'default'),
              padding: '13px 20px', fontSize: 15,
            }}>
              View Board
            </button>
          </div>

          {/* Quick difficulty select */}
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${T.border}` }}>
            <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 10 }}>Try a different challenge:</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {['easy', 'medium', 'hard', 'expert'].map(d => (
                <button
                  key={d}
                  onClick={() => onNewDifficulty(d)}
                  style={{
                    padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    background: d === gs.difficulty ? T.accentDim : T.card,
                    color:      d === gs.difficulty ? T.accentLight : T.textMuted,
                    border:     `1px solid ${d === gs.difficulty ? T.accent + '55' : T.border}`,
                    cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                    textTransform: 'capitalize',
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}