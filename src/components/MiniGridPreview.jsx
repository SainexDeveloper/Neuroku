// ─── MiniGridPreview ──────────────────────────────────────────────────────────
// A non-interactive decorative sudoku grid used on the landing page.

const PREVIEW_BOARD = [
    [5,3,0,0,7,0,0,0,0],
    [6,0,0,1,9,5,0,0,0],
    [0,9,8,0,0,0,0,6,0],
    [8,0,0,0,6,0,0,0,3],
    [4,0,0,8,0,3,0,0,1],
    [7,0,0,0,2,0,0,0,6],
    [0,6,0,0,0,0,2,8,0],
    [0,0,0,4,1,9,0,0,5],
    [0,0,0,0,8,0,0,7,9],
  ]
  
  // Cells that are "filled in" for visual demo (user-entered simulation)
  const DEMO_FILLED = new Set([
    '0,3','0,5','0,6','0,7','0,8',
    '1,1','1,2','1,6','1,7','1,8',
    '2,0','2,3','2,4','2,5','2,7','2,8',
  ])
  
  export default function MiniGridPreview({ T }) {
    const containerSize = Math.min(340, typeof window !== 'undefined' ? window.innerWidth - 64 : 320)
    const cs = Math.floor((containerSize - 4) / 9)
  
    return (
      <div style={{
        background:   T.card,
        border:       `1px solid ${T.border}`,
        borderRadius: 24,
        padding:      20,
        boxShadow:    `0 24px 64px ${T.accent}22, 0 4px 16px #00000033`,
      }}>
        {/* Board label */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Today's Challenge
          </span>
          <span style={{
            padding: '3px 10px', borderRadius: 100, fontSize: 12, fontWeight: 600,
            background: T.accentDim, color: T.accentLight,
          }}>Medium</span>
        </div>
  
        {/* Grid */}
        <div style={{
          display:             'grid',
          gridTemplateColumns: `repeat(9, ${cs}px)`,
          gap:                 0,
          border:              `2px solid ${T.accent}66`,
          borderRadius:        12,
          overflow:            'hidden',
          background:          T.border,
        }}>
          {PREVIEW_BOARD.flatMap((row, r) =>
            row.map((v, c) => {
              const isDemoFill = DEMO_FILLED.has(`${r},${c}`)
              const isBoxAlt   = (Math.floor(r / 3) + Math.floor(c / 3)) % 2 === 0
              const rightBorder  = (c + 1) % 3 === 0 && c !== 8
              const bottomBorder = (r + 1) % 3 === 0 && r !== 8
  
              return (
                <div key={`${r},${c}`} style={{
                  width:         cs,
                  height:        cs,
                  display:       'flex',
                  alignItems:    'center',
                  justifyContent:'center',
                  background:    isBoxAlt ? T.cellBg : T.surface,
                  borderRight:   rightBorder  ? `2px solid ${T.accent}55` : `0.5px solid ${T.border}`,
                  borderBottom:  bottomBorder ? `2px solid ${T.accent}55` : `0.5px solid ${T.border}`,
                  fontSize:      cs > 32 ? 15 : 11,
                  fontWeight:    v ? (isDemoFill ? 600 : 700) : 400,
                  fontFamily:    'Outfit, sans-serif',
                  color:         v ? (isDemoFill ? T.user : T.given) : 'transparent',
                }}>
                  {v || '·'}
                </div>
              )
            })
          )}
        </div>
  
        {/* Fake progress bar */}
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: T.textMuted }}>Progress</span>
            <span style={{ fontSize: 12, color: T.accentLight, fontWeight: 600 }}>34%</span>
          </div>
          <div style={{ background: T.surface, borderRadius: 100, height: 5, overflow: 'hidden' }}>
            <div style={{
              width: '34%', height: '100%', borderRadius: 100,
              background: `linear-gradient(90deg, ${T.accent}, ${T.accentLight})`,
            }} />
          </div>
        </div>
      </div>
    )
  }