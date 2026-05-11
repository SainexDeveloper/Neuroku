import { useEffect, useRef, useCallback, useMemo } from 'react'
import SudokuBoard from '../components/SudokuBoard.jsx'
import VictoryModal from '../components/VictoryModal.jsx'

import {
  getConflicts,
  isSolved,
  digitCounts,
  formatTime,
  cloneBoard,
  clearRelatedNotes
} from '../lib/sudoku.js'

import {
  generateHint,
  HINT_LABELS,
  MAX_HINTS
} from '../lib/hint.js'

import {
  buttonStyle,
  pillStyle,
  DIFFICULTIES
} from '../styles/theme.js'

import {
  saveGameState,
  updateStatsOnWin
} from "../lib/storage.js"

import { useAuth } from '../context/AuthContext.jsx'

// ─────────────────────────────────────────────────────────────────────────────
// GAME PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function GamePage({
  gs,
  setGs,
  T,
  showVictory,
  setShowVictory,
  stats,
  startGame,
  notify
}) {

  const timerRef = useRef(null)
  const victoryHandledRef = useRef(false)

  const { user } = useAuth()
  const userId = user?.id ?? null

  // ─────────────────────────────────────────────────────────────────────────
  // TIMER
  // ─────────────────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────────────────
  // HANDLE GAME COMPLETE (🔥 FIX MAIN BUG HERE)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!gs.completed) return
    if (victoryHandledRef.current) return

    victoryHandledRef.current = true

    clearInterval(timerRef.current)

    const payload = {
      time: gs.timer ?? 0,
      mistakes: gs.errors ?? 0,
      difficulty: gs.difficulty ?? 'medium'
    }

    const run = async () => {
      try {
        await updateStatsOnWin(stats, payload, userId)
      } catch (e) {
        console.log('Stats update error:', e)
      }

      setTimeout(() => {
        setShowVictory(true)
      }, 400)
    }

    run()

  }, [gs.completed])

  // ─────────────────────────────────────────────────────────────────────────
  // RESET victory flag when new game starts
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    victoryHandledRef.current = false
  }, [gs.difficulty])

  // ─────────────────────────────────────────────────────────────────────────
  // CELL CLICK
  // ─────────────────────────────────────────────────────────────────────────
  const handleCellClick = useCallback((r, c) => {
    setGs(g => ({ ...g, selected: [r, c], hintInfo: null }))
  }, [])

  // ─────────────────────────────────────────────────────────────────────────
  // NUMBER INPUT
  // ─────────────────────────────────────────────────────────────────────────
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
      }

      return {
        ...g,
        board,
        notes,
        errors,
        completed,
        hintInfo: null
      }
    })
  }, [])

  // ─────────────────────────────────────────────────────────────────────────
  // ERASE
  // ─────────────────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────────────────
  // HINT
  // ─────────────────────────────────────────────────────────────────────────
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
        selected: [hint.r, hint.c]
      }
    })
  }, [notify])

  // ─────────────────────────────────────────────────────────────────────────
  // APPLY HINT
  // ─────────────────────────────────────────────────────────────────────────
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
      }

      return {
        ...g,
        board,
        notes,
        hintInfo: null,
        completed,
        selected: [r, c]
      }
    })
  }, [])

  // ─────────────────────────────────────────────────────────────────────────
  // KEYBOARD
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (gs.completed) return

      const num = parseInt(e.key)
      if (num >= 1 && num <= 9) return handleNumber(num)

      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        return handleErase()
      }

      if (e.key === 'n' || e.key === 'N') {
        setGs(g => ({ ...g, noteMode: !g.noteMode }))
        return
      }

      if (!gs.selected) return

      const [r, c] = gs.selected

      const moves = {
        ArrowUp: [-1, 0],
        ArrowDown: [1, 0],
        ArrowLeft: [0, -1],
        ArrowRight: [0, 1]
      }

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

  // ─────────────────────────────────────────────────────────────────────────
  // DERIVED
  // ─────────────────────────────────────────────────────────────────────────
  const conflicts = useMemo(() => getConflicts(gs.board), [gs.board])
  const counts = useMemo(() => digitCounts(gs.board), [gs.board])
  const diff = DIFFICULTIES[gs.difficulty]
  const hintsLeft = MAX_HINTS - gs.hintsUsed

  // ─────────────────────────────────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      <div style={{ width: '100%', maxWidth: 560, display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <span style={{ ...pillStyle(T, diff.color) }}>
          {diff.emoji} {diff.label}
        </span>

        <div style={{ color: T.accentLight }}>
          {formatTime(gs.timer)}
        </div>
      </div>

      <SudokuBoard
        board={gs.board}
        puzzle={gs.puzzle}
        solution={gs.solution}
        notes={gs.notes}
        selected={gs.selected}
        conflicts={conflicts}
        T={T}
        onCellClick={handleCellClick}
      />

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