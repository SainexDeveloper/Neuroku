import { useMemo } from 'react'

// ─── SudokuBoard ──────────────────────────────────────────────────────────────
// Props:
//   board       2D number array (0 = empty)
//   puzzle      original givens
//   solution    full solution for wrong-check coloring
//   notes       2D array of Sets
//   selected    [row, col] | null
//   hintInfo    { r, c, val } | null
//   conflicts   Set of "r,c" strings
//   T           theme object
//   onCellClick (r, c) => void

export default function SudokuBoard({
  board, puzzle, solution, notes,
  selected, hintInfo, conflicts, T,
  onCellClick,
}) {
  const [sel_r, sel_c] = selected ?? [-1, -1]
  const selVal = selected ? board[sel_r][sel_c] : 0

  // Compute board size responsively
  const size = Math.min(500, typeof window !== 'undefined' ? window.innerWidth - 32 : 480)
  const cs   = Math.floor((size - 4) / 9)  // cell size

  const cells = useMemo(() => {
    return board.flatMap((row, r) =>
      row.map((v, c) => {
        const isSelected    = r === sel_r && c === sel_c
        const isGiven       = puzzle[r][c] !== 0
        const isSameNum     = selVal > 0 && v === selVal && !isSelected
        const isConflict    = conflicts.has(`${r},${c}`)
        const isHint        = hintInfo?.r === r && hintInfo?.c === c
        const isWrong       = v > 0 && !isGiven && v !== solution[r][c]
        const isHighlight   = selected !== null && !isSelected && (
          r === sel_r ||
          c === sel_c ||
          (Math.floor(r / 3) === Math.floor(sel_r / 3) &&
           Math.floor(c / 3) === Math.floor(sel_c / 3))
        )
        const cellNotes     = notes[r][c]

        // Cell background
        let bg = T.cellBg
        if (isSelected)      bg = T.cellSelected
        else if (isConflict) bg = T.cellConflict
        else if (isSameNum)  bg = T.cellSameNum
        else if (isHighlight) bg = T.cellHighlight
        if (isHint)          bg = `${T.accent}28`

        // Right/bottom borders for box dividers
        const rightBorder  = (c + 1) % 3 === 0 && c !== 8
        const bottomBorder = (r + 1) % 3 === 0 && r !== 8

        return { r, c, v, isGiven, isSelected, isSameNum, isConflict,
                 isHint, isWrong, isHighlight, cellNotes, bg,
                 rightBorder, bottomBorder }
      })
    )
  }, [board, selected, conflicts, hintInfo, notes, sel_r, sel_c, selVal, T, puzzle, solution])

  const fontSize = cs > 50 ? 22 : cs > 38 ? 18 : 14
  const noteSize = cs > 48 ? 9  : cs > 36 ? 7.5 : 6

  return (
    <div
      role="grid"
      aria-label="Sudoku board"
      style={{
        display:          'grid',
        gridTemplateColumns: `repeat(9, ${cs}px)`,
        gap:              0,
        background:       T.border,
        border:           `2.5px solid ${T.accent}77`,
        borderRadius:     16,
        overflow:         'hidden',
        boxShadow:        `0 8px 48px ${T.accent}22, 0 2px 8px #00000033`,
        flexShrink:       0,
      }}
    >
      {cells.map(({ r, c, v, isGiven, isSelected, isWrong, isHint, cellNotes, bg, rightBorder, bottomBorder }) => (
        <div
          key={`${r},${c}`}
          role="gridcell"
          aria-label={`Row ${r + 1}, column ${c + 1}${v ? `, value ${v}` : ', empty'}`}
          onClick={() => onCellClick(r, c)}
          style={{
            width:         cs,
            height:        cs,
            display:       'flex',
            alignItems:    'center',
            justifyContent:'center',
            background:    bg,
            cursor:        'pointer',
            position:      'relative',
            borderRight:   rightBorder  ? `2px solid ${T.accent}66` : `0.5px solid ${T.border}`,
            borderBottom:  bottomBorder ? `2px solid ${T.accent}66` : `0.5px solid ${T.border}`,
            outline:       isSelected   ? `2px solid ${T.accent}` : 'none',
            outlineOffset: '-1px',
            transition:    'background 0.12s ease',
            userSelect:    'none',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {v > 0 ? (
            <span style={{
              fontSize,
              fontWeight: isGiven ? 700 : 600,
              fontFamily: 'Outfit, sans-serif',
              color:      isGiven ? T.given : isWrong ? T.wrong : T.user,
              textShadow: isSelected ? `0 0 14px ${T.accent}99` : 'none',
              lineHeight: 1,
              transition: 'color 0.15s',
            }}>
              {v}
            </span>
          ) : cellNotes.size > 0 ? (
            <div style={{
              display:              'grid',
              gridTemplateColumns:  'repeat(3, 1fr)',
              width:                '90%',
              height:               '90%',
              gap:                  0,
            }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                <span key={n} style={{
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  fontSize:       noteSize,
                  fontWeight:     600,
                  fontFamily:     'Outfit, sans-serif',
                  color:          cellNotes.has(n) ? T.notes : 'transparent',
                  lineHeight:     1,
                }}>
                  {n}
                </span>
              ))}
            </div>
          ) : (
            isHint && (
              <span style={{ fontSize: fontSize * 0.7, color: T.accent, opacity: 0.5 }}>?</span>
            )
          )}
        </div>
      ))}
    </div>
  )
}