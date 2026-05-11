import { useEffect, useRef, useMemo } from 'react'
import SudokuBoard from '../components/SudokuBoard.jsx'
import { getConflicts, isSolved, formatTime, cloneBoard, clearRelatedNotes } from '../lib/sudoku.js'
import { buttonStyle, pillStyle, DIFFICULTIES } from '../styles/theme.js'
import { saveDailyState } from "../lib/storage.js"

// ─── DailyPage ────────────────────────────────────────────────────────────────

export default function DailyPage({ T, gs, setGs, onComplete }) {
  const timerRef = useRef(null)

  useEffect(() => {
    if (!gs || gs.completed) return
    timerRef.current = setInterval(() => {
      setGs(g => {
        const next = { ...g, timer: g.timer + 1 }
        return next
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [gs?.completed])

  useEffect(() => {
    if (!gs || gs.completed) return
  
    const t = setTimeout(() => {
      saveDailyState(gs)
    }, 300)
  
    return () => clearTimeout(t)
  }, [gs])

  const handleCellClick = (r, c) => setGs(g => ({ ...g, selected: [r, c] }))

  const handleNumber = (num) => {
    setGs(g => {
      if (!g) return g
      if (!g.selected) return g
  
      const [r, c] = g.selected
  
      if (!g.board || !g.solution || !g.puzzle) return g
  
      // нельзя менять фиксированные клетки
      if (g.puzzle[r]?.[c]) return g
  
      const board = cloneBoard(g.board)
      board[r][c] = board[r][c] === num ? 0 : num
  
      const notes = clearRelatedNotes(g.notes, r, c, num)
  
      let errors = g.errors || 0
      if (num && g.solution?.[r]?.[c] !== num) {
        errors++
      }
  
      const completed = isSolved(board, g.solution)
  
      if (completed && timerRef.current) {
        clearInterval(timerRef.current)
      }
  
      const next = {
        ...g,
        board,
        notes,
        errors,
        completed
      }
  
      saveDailyState(next)
      return next
    })
  }

  const handleErase = () => {
    setGs(g => {
      if (!g.selected) return g
      const [r, c] = g.selected
      if (g.puzzle[r][c]) return g
      const board = cloneBoard(g.board)
      board[r][c] = 0
      const notes = g.notes.map(row => row.map(s => new Set(s)))
      notes[r][c].clear()
      return { ...g, board, notes }
    })
  }

  useEffect(() => {
    if (!gs?.completed) return
  
    onComplete?.()
  }, [gs?.completed, onComplete])

  const conflicts = useMemo(() => {
    if (!gs?.board) return new Set()
    return getConflicts(gs.board)
  }, [gs?.board])

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  if (!gs) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', color: T.textMuted }}>
        Loading daily challenge...
      </div>
    )
  }

  const diff = DIFFICULTIES[gs.difficulty]

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: T.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
          Daily Challenge
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: T.text, marginBottom: 10 }}>
          {today}
        </h1>
        <span style={{ ...pillStyle(T, diff.color), textTransform: 'capitalize' }}>
          {diff.emoji} {diff.label}
        </span>
      </div>

      {/* Timer + errors */}
      <div style={{
        width: '100%', maxWidth: 560,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 16,
      }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: T.accentLight, fontFamily: 'Outfit, sans-serif', letterSpacing: 1 }}>
          {formatTime(gs.timer)}
        </div>
        <div style={{ fontSize: 14, color: T.textMuted }}>
          Errors: <span style={{ color: gs.errors > 0 ? T.danger : T.success, fontWeight: 700 }}>{gs.errors}</span>
        </div>
      </div>

      {/* Board */}
      <SudokuBoard
        board={gs.board} puzzle={gs.puzzle} solution={gs.solution}
        notes={gs.notes} selected={gs.selected} hintInfo={null}
        conflicts={conflicts} T={T} onCellClick={handleCellClick}
      />

      {/* Controls (only if not completed) */}
      {!gs.completed && (
        <div style={{ width: '100%', maxWidth: 560, marginTop: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 7, marginBottom: 12 }}>
            {[1,2,3,4,5,6,7,8,9].map(n => (
              <button key={n} onClick={() => handleNumber(n)} style={{
                height: 50, borderRadius: 11, fontSize: 21, fontWeight: 700,
                background: T.card, color: T.text, border: `1.5px solid ${T.border}`,
                cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
              }}>{n}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setGs(g => ({ ...g, noteMode: !g.noteMode }))}
              style={{ ...buttonStyle(T, gs.noteMode ? 'active' : 'default'), padding: '10px 18px', fontSize: 14 }}
            >
              ✏️ Notes {gs.noteMode ? 'ON' : 'OFF'}
            </button>
            <button onClick={handleErase} style={{ ...buttonStyle(T, 'default'), padding: '10px 18px', fontSize: 14 }}>
              ⌫ Erase
            </button>
          </div>
        </div>
      )}

      {/* Completion card */}
      {gs.completed && (
        <div style={{
          marginTop: 28, background: T.card,
          border: `1px solid ${T.accent}55`, borderRadius: 20,
          padding: '32px 28px', textAlign: 'center', maxWidth: 500, width: '100%',
          animation: 'fadeIn 0.4s ease',
        }}>
          <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
          <div style={{ fontSize: 52, marginBottom: 14 }}>🏆</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, fontFamily: 'Outfit, sans-serif', color: T.text }}>
            Daily Completed!
          </h2>
          <p style={{ color: T.textMuted, marginBottom: 16 }}>
            Time: <strong style={{ color: T.accentLight }}>{formatTime(gs.timer)}</strong> &nbsp;·&nbsp; Errors: <strong style={{ color: gs.errors === 0 ? T.success : T.warning }}>{gs.errors}</strong>
          </p>
          <p style={{ fontSize: 14, color: T.textFaint }}>Come back tomorrow for a new challenge.</p>
        </div>
      )}

      {/* Leaderboard */}
      <div style={{ width: '100%', maxWidth: 560, marginTop: 44 }}>
        <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 18, fontFamily: 'Outfit, sans-serif', color: T.text }}>
          Today's Rankings
        </h3>
        <LeaderboardList T={T} entries={[]} />
      </div>
    </div>
  )
}

// ─── Reusable ranked list ─────────────────────────────────────────────────────

export function LeaderboardList({ T, entries, highlightRank }) {
  const medals = ['🥇','🥈','🥉']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {entries.map((p, i) => (
        <div
          key={p.rank}
          style={{
            background:   T.card,
            border:       `1px solid ${i < 3 ? T.accent + '55' : p.rank === highlightRank ? T.accent + '88' : T.border}`,
            borderRadius: 14,
            padding:      '14px 18px',
            display:      'flex',
            alignItems:   'center',
            gap:          14,
            transition:   'border-color 0.2s',
          }}
        >
          {/* Rank */}
          <div style={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            background: i === 0 ? 'linear-gradient(135deg,#ffd700,#ffa500)'
                      : i === 1 ? 'linear-gradient(135deg,#c0c0c0,#a8a8a8)'
                      : i === 2 ? 'linear-gradient(135deg,#cd7f32,#a0522d)'
                      : T.surface,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: i < 3 ? 18 : 14, fontWeight: 700,
            color: i < 3 ? '#fff' : T.textMuted,
          }}>
            {i < 3 ? medals[i] : p.rank}
          </div>

          {/* Avatar */}
          <div style={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${T.accentDim}, transparent)`,
            border: `1.5px solid ${T.accent}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: T.accentLight,
          }}>
            {p.avatar}
          </div>

          {/* Name + streak */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: T.text, fontFamily: 'Outfit, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {p.name}
            </div>
            <div style={{ color: T.textMuted, fontSize: 12, marginTop: 1 }}>
              🔥 {p.streak} day streak
            </div>
          </div>

          {/* Time + mistakes */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: T.accentLight, fontFamily: 'Outfit, sans-serif' }}>
              {formatTime(p.time)}
            </div>
            <div style={{
              fontSize: 12, marginTop: 1,
              color: p.mistakes === 0 ? T.success : T.textMuted,
            }}>
              {p.mistakes === 0 ? '✨ Perfect' : `${p.mistakes} error${p.mistakes > 1 ? 's' : ''}`}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}