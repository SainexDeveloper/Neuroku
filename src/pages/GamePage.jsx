import { useEffect, useRef, useCallback, useMemo } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

import SudokuBoard from '../components/SudokuBoard.jsx'
import VictoryModal from '../components/VictoryModal.jsx'

import {
  getConflicts,
  isSolved,
  digitCounts,
  formatTime,
  cloneBoard,
  clearRelatedNotes,
} from '../lib/sudoku.js'

import {
  generateHint,
  HINT_LABELS,
  MAX_HINTS,
} from '../lib/hint.js'

import { buttonStyle, pillStyle, DIFFICULTIES } from '../styles/theme.js'

import {
  saveGameState,
  updateStatsOnWin,
} from '../lib/storage.js'

export default function GamePage({
  gs,
  setGs,
  T,
  showVictory,
  setShowVictory,
  stats,
  setStats, // 👈 ВАЖНО (добавь в родителе)
  startGame,
  notify,
}) {
  const timerRef = useRef(null)
  const { user } = useAuth()

  // ─────────────────────────────
  // TIMER
  // ─────────────────────────────
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

  // ─────────────────────────────
  // WIN HANDLER (🔥 FIX HERE)
  // ─────────────────────────────
  const handleWin = useCallback(async () => {
    const payload = {
      time: gs.timer,
      mistakes: gs.errors,
      difficulty: gs.difficulty,
    }

    try {
      const updated = await updateStatsOnWin(
        stats,
        payload,
        user?.id
      )

      // 🔥 обновляем UI stats
      setStats(updated)
    } catch (e) {
      console.error('Stats update failed:', e)
    }
  }, [gs.timer, gs.errors, gs.difficulty, stats, user, setStats])

  // ─────────────────────────────
  // CELL CLICK
  // ─────────────────────────────
  const handleCellClick = useCallback((r, c) => {
    setGs(g => ({ ...g, selected: [r, c], hintInfo: null }))
  }, [])

  // ─────────────────────────────
  // NUMBER INPUT
  // ─────────────────────────────
  const handleNumber = useCallback((num) => {
    setGs(g => {
      if (!g.selected || g.completed) return g

      const [r, c] = g.selected
      if (g.puzzle[r][c]) return g

      if (g.noteMode) {
        const notes = g.notes.map(row => row.map(s => new Set(s)))
        if (notes[r][c].has(num)) notes[r][c].delete(num)
        else notes[r][c].add(num)

        return { ...g, notes }
      }

      const board = cloneBoard(g.board)
      board[r][c] = board[r][c] === num ? 0 : num

      const notes = clearRelatedNotes(g.notes, r, c, num)

      let errors = g.errors
      if (num && g.solution[r][c] !== num) errors++

      const completed = isSolved(board, g.solution)

      if (completed) {
        clearInterval(timerRef.current)

        // 🔥 SAVE STATS BEFORE MODAL
        handleWin()

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
  }, [handleWin])

  // ─────────────────────────────
  // ERASE
  // ─────────────────────────────
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

  // ─────────────────────────────
  // HINT
  // ─────────────────────────────
  const handleHint = useCallback(() => {
    setGs(g => {
      if (g.hintsUsed >= MAX_HINTS) {
        notify('No hints remaining!', 'error')
        return g
      }

      const hint = generateHint(g.board, g.solution, g.puzzle)
      if (!hint) {
        notify('Board is complete!', 'success')
        return g
      }

      notify(`Hint ${g.hintsUsed + 1}/${MAX_HINTS}`, 'info')

      return {
        ...g,
        hintInfo: hint,
        hintsUsed: g.hintsUsed + 1,
        selected: [hint.r, hint.c],
      }
    })
  }, [notify])

  // ─────────────────────────────
  // APPLY HINT
  // ─────────────────────────────
  const applyHint = useCallback(() => {
    setGs(g => {
      if (!g.hintInfo) return g

      const { r, c, val } = g.hintInfo

      const board = cloneBoard(g.board)
      board[r][c] = val

      const notes = clearRelatedNotes(g.notes, r, c, val)

      const completed = isSolved(board, g.solution)

      if (completed) {
        clearInterval(timerRef.current)
        handleWin()

        setTimeout(() => {
          setShowVictory(true)
        }, 400)
      }

      return {
        ...g,
        board,
        notes,
        hintInfo: null,
        completed,
        selected: [r, c],
      }
    })
  }, [handleWin])

  // ─────────────────────────────
  // KEYBOARD
  // ─────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (gs.completed) return

      const num = parseInt(e.key)
      if (num >= 1 && num <= 9) return handleNumber(num)

      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0')
        return handleErase()

      if (e.key === 'n' || e.key === 'N')
        return setGs(g => ({ ...g, noteMode: !g.noteMode }))
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [gs.completed, handleNumber, handleErase])

  // ─────────────────────────────
  // DERIVED
  // ─────────────────────────────
  const conflicts = useMemo(() => getConflicts(gs.board), [gs.board])
  const counts = useMemo(() => digitCounts(gs.board), [gs.board])
  const diff = DIFFICULTIES[gs.difficulty]
  const hintsLeft = MAX_HINTS - gs.hintsUsed

  // ─────────────────────────────
  // UI
  // ─────────────────────────────
  return (
    <div style={{
      maxWidth: 960,
      margin: '0 auto',
      padding: '24px 16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>

      <SudokuBoard
        board={gs.board}
        puzzle={gs.puzzle}
        solution={gs.solution}
        notes={gs.notes}
        selected={gs.selected}
        hintInfo={gs.hintInfo}
        conflicts={conflicts}
        T={T}
        onCellClick={handleCellClick}
      />

      <div style={{ marginTop: 20 }}>
        <button onClick={handleErase}>Erase</button>
        <button onClick={handleHint}>Hint</button>
      </div>

      {showVictory && (
        <VictoryModal
          T={T}
          gs={gs}
          stats={stats}
          onClose={() => setShowVictory(false)}
          onNewGame={() => {
            setShowVictory(false)
            startGame(gs.difficulty)
          }}
        />
      )}
    </div>
  )
}