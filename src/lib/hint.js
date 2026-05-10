// ─── Neuroku AI Hint Engine ───────────────────────────────────────────────────
// Generates move suggestions with human-readable reasoning.
// Implements real Sudoku solving techniques in priority order.

// ─── Candidate calculation ────────────────────────────────────────────────────

// Return the set of valid candidates for an empty cell
function getCandidates(board, row, col) {
    if (board[row][col] !== 0) return new Set()
    const used = new Set()
    for (let i = 0; i < 9; i++) {
      if (board[row][i]) used.add(board[row][i])
      if (board[i][col]) used.add(board[i][col])
      const br = 3 * Math.floor(row / 3) + Math.floor(i / 3)
      const bc = 3 * Math.floor(col / 3) + (i % 3)
      if (board[br][bc]) used.add(board[br][bc])
    }
    const candidates = new Set()
    for (let n = 1; n <= 9; n++) {
      if (!used.has(n)) candidates.add(n)
    }
    return candidates
  }
  
  // Build a full candidate map for the whole board
  function buildCandidateMap(board) {
    const map = []
    for (let r = 0; r < 9; r++) {
      map.push([])
      for (let c = 0; c < 9; c++) {
        map[r].push(getCandidates(board, r, c))
      }
    }
    return map
  }
  
  // ─── Technique: Naked Single ─────────────────────────────────────────────────
  // A cell has only one candidate — trivially forced.
  
  function findNakedSingle(board, puzzle) {
    const map = buildCandidateMap(board)
    const results = []
  
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (puzzle[r][c] || board[r][c]) continue
        const cands = map[r][c]
        if (cands.size === 1) {
          const val = [...cands][0]
          const rowFilled = board[r].filter(v => v).sort().join(', ') || 'nothing yet'
          const colFilled = board.map(row => row[c]).filter(v => v).sort().join(', ') || 'nothing yet'
          results.push({
            r, c, val,
            technique: 'Naked Single',
            confidence: 'certain',
            explanation:
              `Cell (row ${r + 1}, column ${c + 1}) has only one possible candidate. ` +
              `Row ${r + 1} already contains [${rowFilled}], and column ${c + 1} contains [${colFilled}]. ` +
              `After eliminating all numbers used in this cell's row, column, and 3×3 box, ` +
              `only ${val} remains. This technique is called a Naked Single.`,
          })
        }
      }
    }
    return results
  }
  
  // ─── Technique: Hidden Single ─────────────────────────────────────────────────
  // A candidate appears in only one cell within a row, column, or box.
  
  function findHiddenSingle(board, puzzle) {
    const map = buildCandidateMap(board)
    const results = []
  
    // Check rows
    for (let r = 0; r < 9; r++) {
      for (let num = 1; num <= 9; num++) {
        const cells = []
        for (let c = 0; c < 9; c++) {
          if (!puzzle[r][c] && !board[r][c] && map[r][c].has(num)) cells.push(c)
        }
        if (cells.length === 1) {
          const c = cells[0]
          results.push({
            r, c, val: num,
            technique: 'Hidden Single (Row)',
            confidence: 'certain',
            explanation:
              `In row ${r + 1}, the number ${num} can only go in column ${c + 1}. ` +
              `Even though cell (${r + 1}, ${c + 1}) might seem to have other candidates, ` +
              `every other empty cell in this row is blocked from containing ${num} by its column or box constraints. ` +
              `This is called a Hidden Single.`,
          })
        }
      }
    }
  
    // Check columns
    for (let c = 0; c < 9; c++) {
      for (let num = 1; num <= 9; num++) {
        const cells = []
        for (let r = 0; r < 9; r++) {
          if (!puzzle[r][c] && !board[r][c] && map[r][c].has(num)) cells.push(r)
        }
        if (cells.length === 1) {
          const r = cells[0]
          results.push({
            r, c, val: num,
            technique: 'Hidden Single (Column)',
            confidence: 'certain',
            explanation:
              `In column ${c + 1}, the number ${num} can only be placed in row ${r + 1}. ` +
              `All other empty cells in this column are prevented from holding ${num} ` +
              `by their row or 3×3 box constraints. This is a Hidden Single.`,
          })
        }
      }
    }
  
    // Check boxes
    for (let br = 0; br < 3; br++) {
      for (let bc = 0; bc < 3; bc++) {
        for (let num = 1; num <= 9; num++) {
          const cells = []
          for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
              const r = br * 3 + i, c = bc * 3 + j
              if (!puzzle[r][c] && !board[r][c] && map[r][c].has(num)) cells.push([r, c])
            }
          }
          if (cells.length === 1) {
            const [r, c] = cells[0]
            results.push({
              r, c, val: num,
              technique: 'Hidden Single (Box)',
              confidence: 'certain',
              explanation:
                `In the 3×3 box containing row ${r + 1} and column ${c + 1}, ` +
                `${num} can only be placed in cell (${r + 1}, ${c + 1}). ` +
                `All other cells in this box are either filled or cannot hold ${num} ` +
                `due to their row and column constraints. This is a Hidden Single.`,
            })
          }
        }
      }
    }
  
    return results
  }
  
  // ─── Fallback: Guided random (for very hard puzzles) ─────────────────────────
  
  function findGuidedRandom(board, solution, puzzle) {
    const empties = []
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (!puzzle[r][c] && !board[r][c]) empties.push([r, c])
      }
    }
    if (!empties.length) return null
  
    const [r, c] = empties[Math.floor(Math.random() * empties.length)]
    const val     = solution[r][c]
    const cands   = getCandidates(board, r, c)
  
    return {
      r, c, val,
      technique: 'Elimination',
      confidence: 'guided',
      explanation:
        `Cell (row ${r + 1}, column ${c + 1}) is a good place to focus. ` +
        `It has ${cands.size} candidate${cands.size !== 1 ? 's' : ''}: [${[...cands].join(', ')}]. ` +
        `By cross-referencing the rows, columns, and boxes that intersect this cell, ` +
        `the correct value is ${val}. Try working through the eliminations yourself!`,
    }
  }
  
  // ─── Main hint function ───────────────────────────────────────────────────────
  // Returns the best available hint, prioritizing easier techniques first.
  
  export function generateHint(board, solution, puzzle) {
    // Try naked singles first (most obvious)
    const naked = findNakedSingle(board, puzzle)
    if (naked.length > 0) {
      return naked[Math.floor(Math.random() * Math.min(naked.length, 3))]
    }
  
    // Try hidden singles
    const hidden = findHiddenSingle(board, puzzle)
    if (hidden.length > 0) {
      return hidden[Math.floor(Math.random() * Math.min(hidden.length, 3))]
    }
  
    // Fallback for hard/expert puzzles
    return findGuidedRandom(board, solution, puzzle)
  }
  
  // ─── Hint metadata ────────────────────────────────────────────────────────────
  
  export const HINT_LABELS = {
    'Naked Single':           { icon: '🎯', color: '#4ade80' },
    'Hidden Single (Row)':    { icon: '👁️', color: '#60a5fa' },
    'Hidden Single (Column)': { icon: '👁️', color: '#60a5fa' },
    'Hidden Single (Box)':    { icon: '📦', color: '#a78bfa' },
    'Elimination':            { icon: '💡', color: '#fbbf24' },
  }
  
  export const MAX_HINTS = 3