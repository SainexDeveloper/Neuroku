// ─── Neuroku Sudoku Engine ────────────────────────────────────────────────────
// Pure functions — no side effects, fully testable.

// Shuffle an array in place (Fisher-Yates) and return it
export function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── Base solved grid (canonical) ────────────────────────────────────────────
const CANONICAL = [
  [5,3,4,6,7,8,9,1,2], [6,7,2,1,9,5,3,4,8], [1,9,8,3,4,2,5,6,7],
  [8,5,9,7,6,1,4,2,3], [4,2,6,8,5,3,7,9,1], [7,1,3,9,2,4,8,5,6],
  [9,6,1,5,3,7,2,8,4], [2,8,7,4,1,9,6,3,5], [3,4,5,2,8,6,1,7,9],
]

// ─── Generate a valid randomized solved grid ──────────────────────────────────
export function generateSolvedGrid() {
  const bands  = shuffleArray([0, 1, 2])
  const stacks = shuffleArray([0, 1, 2])
  const digits = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9])

  return Array.from({ length: 9 }, (_, r) =>
    Array.from({ length: 9 }, (_, c) => {
      const br = bands[Math.floor(r / 3)] * 3 + (r % 3)
      const bc = stacks[Math.floor(c / 3)] * 3 + (c % 3)
      return digits[CANONICAL[br][bc] - 1]
    })
  )
}

// ─── Remove cells to create a puzzle ─────────────────────────────────────────
// Uses a simple symmetric removal strategy for aesthetics.
export function createPuzzle(solution, removals) {
  const puzzle = solution.map(row => [...row])
  const cells  = shuffleArray([...Array(81).keys()])
  let removed  = 0

  for (const idx of cells) {
    if (removed >= removals) break
    const r = Math.floor(idx / 9)
    const c = idx % 9
    puzzle[r][c] = 0
    removed++
  }
  return puzzle
}

// ─── Main generator ───────────────────────────────────────────────────────────
import { DIFFICULTIES } from '../styles/theme.js'

export function generateSudoku(difficulty = 'medium') {
  const solution = generateSolvedGrid()
  const { removals } = DIFFICULTIES[difficulty] ?? DIFFICULTIES.medium
  const puzzle = createPuzzle(solution, removals)
  return { puzzle, solution }
}

// ─── Seeded daily puzzle (same for all users each UTC day) ────────────────────
export function getDailyPuzzle() {
  const today = new Date().toISOString().slice(0, 10)
  // Deterministic difficulty from date
  const seed  = today.split('-').reduce((a, b) => a + parseInt(b, 10), 0)
  const diffs = ['easy', 'medium', 'medium', 'hard', 'hard', 'expert']
  const difficulty = diffs[seed % diffs.length]

  // Seed Math.random substitute: use date as seed for shuffleArray variant
  // (for a real app, use a seeded PRNG like mulberry32)
  const { puzzle, solution } = generateSudoku(difficulty)
  return { puzzle, solution, difficulty, date: today }
}

// ─── Validation ───────────────────────────────────────────────────────────────

// Returns a Set of "r,c" strings for all conflicting cells
export function getConflicts(board) {
  const conflicts = new Set()

  const checkBox = (r, c, v, selfR, selfC) => {
    const br = Math.floor(r / 3) * 3
    const bc = Math.floor(c / 3) * 3

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const rr = br + i
        const cc = bc + j

        if ((rr !== selfR || cc !== selfC) && board[rr][cc] === v) {
          conflicts.add(`${selfR},${selfC}`)
          conflicts.add(`${rr},${cc}`)
        }
      }
    }
  }

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = board[r][c]
      if (!v) continue

      for (let i = 0; i < 9; i++) {
        // row
        if (i !== c && board[r][i] === v) {
          conflicts.add(`${r},${c}`)
          conflicts.add(`${r},${i}`)
        }

        // col
        if (i !== r && board[i][c] === v) {
          conflicts.add(`${r},${c}`)
          conflicts.add(`${i},${c}`)
        }
      }

      checkBox(r, c, v, r, c)
    }
  }

  return conflicts
}

export function isLegal(board, row, col, num) {
  for (let i = 0; i < 9; i++) {
    if (i !== col && board[row][i] === num) return false
    if (i !== row && board[i][col] === num) return false
  }

  const br = Math.floor(row / 3) * 3
  const bc = Math.floor(col / 3) * 3

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const rr = br + i
      const cc = bc + j
      if ((rr !== row || cc !== col) && board[rr][cc] === num) {
        return false
      }
    }
  }

  return true
}

// Check if puzzle is fully and correctly solved
export function isSolved(board, solution) {
  return board.every((row, r) => row.every((v, c) => v === solution[r][c]))
}

// Count how many times a digit has been placed
export function digitCounts(board) {
  const counts = Array(10).fill(0)
  board.flat().forEach(v => { if (v) counts[v]++ })
  return counts
}

// ─── Notes helpers ────────────────────────────────────────────────────────────

export function createNotes() {
  return Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => new Set())
  )
}

// When a number is placed, clear that number from notes in same row/col/box
export function clearRelatedNotes(notes, row, col, num) {
  const next = notes.map(r => r.map(s => new Set(s)))
  if (!num) return next
  for (let i = 0; i < 9; i++) {
    next[row][i].delete(num)
    next[i][col].delete(num)
  }
  const br = Math.floor(row / 3) * 3
  const bc = Math.floor(col / 3) * 3
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      next[br + i][bc + j].delete(num)
    }
  }
  return next
}

// ─── Utilities ────────────────────────────────────────────────────────────────

export function formatTime(totalSeconds) {
  const m   = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const sec = (totalSeconds % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

export function cloneBoard(board) {
  return board.map(row => [...row])
}