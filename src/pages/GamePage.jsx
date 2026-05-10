import { useEffect, useRef, useCallback, useMemo } from 'react'
import SudokuBoard from '../components/SudokuBoard.jsx'
import VictoryModal from '../components/VictoryModal.jsx'
import { getConflicts, isSolved, digitCounts, formatTime, cloneBoard, clearRelatedNotes } from '../lib/sudoku.js'
import { generateHint, HINT_LABELS, MAX_HINTS } from '../lib/hint.js'
import { buttonStyle, pillStyle, DIFFICULTIES } from '../styles/theme.js'
import { saveGameState } from "../lib/storage.js"

// ─── GamePage ────────────────────────────────────────────────────────────────

export default function GamePage({ gs, setGs, T, showVictory, setShowVictory, stats, startGame, notify }) {
  const timerRef = useRef(null)

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (gs.completed) return
    timerRef.current = setInterval(() => {
      setGs(g => {
        const next = { ...g, timer: g.timer + 1 }
        saveGameState(next)
        return next
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [gs.completed])

  // ── Cell click ─────────────────────────────────────────────────────────────
  const handleCellClick = useCallback((r, c) => {
    setGs(g => ({ ...g, selected: [r, c], hintInfo: null }))
  }, [])

  // ── Number input ───────────────────────────────────────────────────────────
  const handleNumber = useCallback((num) => {
    setGs(g => {
      if (!g.selected || g.completed) return g
      const [r, c] = g.selected
      if (g.puzzle[r][c]) return g  // given cell, immutable

      if (g.noteMode) {
        const notes = g.notes.map(row => row.map(s => new Set(s)))
        if (notes[r][c].has(num)) notes[r][c].delete(num)
        else notes[r][c].add(num)
        return { ...g, notes }
      }

      const board = cloneBoard(g.board)
      board[r][c] = board[r][c] === num ? 0 : num

      const notes  = clearRelatedNotes(g.notes, r, c, num)
      let errors   = g.errors
      if (num && g.solution[r][c] !== num) errors++

      const completed = isSolved(board, g.solution)

      if (completed) {
        clearInterval(timerRef.current)

        setTimeout(() => {
          setShowVictory(true)
        }, 400)
      }

      return {
        ...g,
        board,
        notes,
        errors,
        completed,
        hintInfo: null,
      }
    })
  }, [])

  // ── Erase ──────────────────────────────────────────────────────────────────
  const handleErase = useCallback(() => {
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
  }, [])

  // ── Hint ───────────────────────────────────────────────────────────────────
  const handleHint = useCallback(() => {
    setGs(g => {
      if (g.hintsUsed >= MAX_HINTS) {
        notify('No hints remaining!', 'error')
        return g
      }
      const hint = generateHint(g.board, g.solution, g.puzzle)
      if (!hint) { notify('Board is complete!', 'success'); return g }
      notify(`Hint ${g.hintsUsed + 1}/${MAX_HINTS} — ${hint.technique}`, 'info')
      return { ...g, hintInfo: hint, hintsUsed: g.hintsUsed + 1, selected: [hint.r, hint.c] }
    })
  }, [notify])

  // ── Apply hint ─────────────────────────────────────────────────────────────
  const applyHint = useCallback(() => {
    setGs(g => {
      if (!g.hintInfo) return g
      const { r, c, val } = g.hintInfo
      const board = cloneBoard(g.board)
      board[r][c] = val
      const notes     = clearRelatedNotes(g.notes, r, c, val)
      const completed = isSolved(board, g.solution)

      if (completed) {
        clearInterval(timerRef.current)

        setTimeout(() => {
          setShowVictory(true)
        }, 400)
      }
      return { ...g, board, notes, hintInfo: null, completed, selected: [r, c] }
    })
  }, [])

  // ── Keyboard handler ───────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (gs.completed) return
      const num = parseInt(e.key)
      if (num >= 1 && num <= 9) { handleNumber(num); return }
      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') { handleErase(); return }
      if (e.key === 'n' || e.key === 'N') { setGs(g => ({ ...g, noteMode: !g.noteMode })); return }
      if (!gs.selected) return
      const [r, c] = gs.selected
      const moves = { ArrowUp: [-1,0], ArrowDown: [1,0], ArrowLeft: [0,-1], ArrowRight: [0,1] }
      if (moves[e.key]) {
        const [dr, dc] = moves[e.key]
        const nr = Math.max(0, Math.min(8, r + dr))
        const nc = Math.max(0, Math.min(8, c + dc))
        setGs(g => ({ ...g, selected: [nr, nc] }))
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [gs.selected, gs.completed, gs.noteMode])

  // ── Derived state ──────────────────────────────────────────────────────────
  const conflicts = useMemo(() => getConflicts(gs.board), [gs.board])
  const counts    = useMemo(() => digitCounts(gs.board),  [gs.board])
  const diff      = DIFFICULTIES[gs.difficulty]
  const hintsLeft = MAX_HINTS - gs.hintsUsed

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      {/* ── Game header ──────────────────────────────────────────────────── */}
      <div style={{
        width: '100%', maxWidth: 560,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ ...pillStyle(T, diff.color), textTransform: 'capitalize' }}>
            {diff.emoji} {diff.label}
          </span>
          {gs.noteMode && (
            <span style={{ ...pillStyle(T, '#60a5fa'), fontSize: 12 }}>✏️ Notes</span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 24, fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: 1, color: T.accentLight,
              fontFamily: 'Outfit, sans-serif',
            }}>
              {formatTime(gs.timer)}
            </div>
            <div style={{ fontSize: 10, color: T.textMuted, letterSpacing: '0.1em' }}>TIME</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 24, fontWeight: 700,
              color: gs.errors > 3 ? T.danger : gs.errors > 0 ? T.warning : T.success,
              fontFamily: 'Outfit, sans-serif',
            }}>
              {gs.errors}
            </div>
            <div style={{ fontSize: 10, color: T.textMuted, letterSpacing: '0.1em' }}>ERRORS</div>
          </div>
        </div>
      </div>

      {/* ── Board ────────────────────────────────────────────────────────── */}
      <SudokuBoard
        board={gs.board} puzzle={gs.puzzle} solution={gs.solution}
        notes={gs.notes} selected={gs.selected} hintInfo={gs.hintInfo}
        conflicts={conflicts} T={T} onCellClick={handleCellClick}
      />

      {/* ── Controls ─────────────────────────────────────────────────────── */}
      <div style={{ width: '100%', maxWidth: 560, marginTop: 22 }}>

        {/* Number pad */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 7, marginBottom: 14 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => {
            const done = counts[n] >= 9
            return (
              <button
                key={n}
                onClick={() => handleNumber(n)}
                disabled={done}
                aria-label={`Place ${n}`}
                style={{
                  height:      52,
                  borderRadius: 11,
                  fontSize:    22,
                  fontWeight:  700,
                  fontFamily:  'Outfit, sans-serif',
                  background:  T.card,
                  color:       done ? T.textFaint : T.text,
                  border:      `1.5px solid ${T.border}`,
                  cursor:      done ? 'not-allowed' : 'pointer',
                  transition:  'all 0.12s',
                  opacity:     done ? 0.35 : 1,
                  position:    'relative',
                }}
              >
                {n}
                {!done && (
                  <span style={{
                    position: 'absolute', bottom: 3, right: 4,
                    fontSize: 9, color: T.textMuted, fontWeight: 400,
                  }}>
                    {9 - counts[n]}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Action row */}
        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => setGs(g => ({ ...g, noteMode: !g.noteMode }))}
            style={{
              ...buttonStyle(T, gs.noteMode ? 'active' : 'default'),
              padding: '11px 18px', fontSize: 14,
            }}
          >
            ✏️ Notes {gs.noteMode ? 'ON' : 'OFF'}
          </button>

          <button onClick={handleErase} style={{ ...buttonStyle(T, 'default'), padding: '11px 18px', fontSize: 14 }}>
            ⌫ Erase
          </button>

          <button
            onClick={handleHint}
            disabled={hintsLeft === 0}
            style={{
              ...buttonStyle(T, hintsLeft > 0 ? 'default' : 'ghost'),
              padding: '11px 18px', fontSize: 14,
              opacity: hintsLeft === 0 ? 0.4 : 1,
            }}
          >
            💡 Hint ({hintsLeft}/{MAX_HINTS})
          </button>

          <button
            onClick={() => { clearInterval(timerRef.current); startGame(gs.difficulty) }}
            style={{ ...buttonStyle(T, 'ghost'), padding: '11px 16px', fontSize: 14 }}
          >
            🔄 New
          </button>
        </div>
      </div>

      {/* ── Hint panel ───────────────────────────────────────────────────── */}
      {gs.hintInfo && (
        <div style={{
          width: '100%', maxWidth: 560, marginTop: 18,
          background:   T.card,
          border:       `1px solid ${T.accent}55`,
          borderRadius: 16,
          padding:      '18px 20px',
          animation:    'fadeInUp 0.3s ease',
        }}>
          <style>{`@keyframes fadeInUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }`}</style>

          {/* Technique badge */}
          {(() => {
            const meta = HINT_LABELS[gs.hintInfo.technique] ?? { icon: '💡', color: T.accent }
            return (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <span style={{
                  ...pillStyle(T, meta.color), fontSize: 12,
                }}>
                  {meta.icon} {gs.hintInfo.technique}
                </span>
                <button
                  onClick={() => setGs(g => ({ ...g, hintInfo: null }))}
                  style={{ background: 'none', border: 'none', color: T.textMuted, cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 0 }}
                >×</button>
              </div>
            )
          })()}

          <p style={{ fontSize: 14, color: T.text, lineHeight: 1.7, marginBottom: 14 }}>
            {gs.hintInfo.explanation}
          </p>

          <button onClick={applyHint} style={{ ...buttonStyle(T, 'primary'), padding: '9px 18px', fontSize: 13 }}>
            Apply move →
          </button>
        </div>
      )}

      {/* ── Victory modal ─────────────────────────────────────────────────── */}
      {showVictory && (
        <VictoryModal
          T={T} gs={gs} stats={stats}
          onClose={() => setShowVictory(false)}
          onNewGame={() => { setShowVictory(false); startGame(gs.difficulty) }}
          onNewDifficulty={(d) => { setShowVictory(false); startGame(d) }}
        />
      )}
    </div>
  )
}