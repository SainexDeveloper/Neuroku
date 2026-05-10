import { useState, useEffect, useCallback, useRef } from 'react'
import Nav from './components/Nav.jsx'
import HomePage from './pages/HomePage.jsx'
import GamePage from './pages/GamePage.jsx'
import DailyPage from './pages/DailyPage.jsx'
import StatsPage from './pages/StatsPage.jsx'
import AuthModal from './components/AuthModal.jsx'
import { useRequireAuth } from './components/useRequireAuth.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import { useAuth } from './context/AuthContext.jsx'
import LeaderboardPage from './pages/LeaderboardPage.jsx'
import { THEMES, UNLOCKABLE_THEMES } from './styles/theme.js'
import './App.css'
import { generateSudoku, getDailyPuzzle, createNotes } from './lib/sudoku.js'
import {
  loadGameState, saveGameState, clearGameState,
  loadDailyState, saveDailyState,
  loadStats, updateStatsOnWin,
} from './lib/api.js'

// ─── Initial game state factory ───────────────────────────────────────────────
function makeGameState(puzzle, solution, difficulty) {
  return {
    puzzle, solution, difficulty,
    board:      puzzle.map(r => [...r]),
    notes:      createNotes(),
    selected:   null,
    noteMode:   false,
    errors:     0,
    timer:      0,
    completed:  false,
    hintsUsed:  0,
    hintInfo:   null,
  }
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  // ── Theme ──────────────────────────────────────────────────────────────────
  const [themeName, setThemeName] = useState(() =>
    localStorage.getItem('neuroku_theme') ?? 'dark'
  )
  const baseTheme = THEMES[themeName] ?? THEMES.dark
  const unlockable = UNLOCKABLE_THEMES[themeName]
  const T = unlockable ? { ...baseTheme, ...unlockable } : baseTheme
  const { user } = useAuth()


  useEffect(() => {
    localStorage.setItem('neuroku_theme', themeName)
  }, [themeName])

  // ── Page routing ───────────────────────────────────────────────────────────
  const [page, setPage] = useState('home')
  const [showAuth, setShowAuth] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)

  const requireAuth = useCallback((action) => {
    if (!user) {
      setPendingAction(() => action)
      setShowAuth(true)
      return
    }
  
    action()
  }, [user])

  useEffect(() => {
    if (user && pendingAction) {
      pendingAction()
      setPendingAction(null)
    }
  }, [user, pendingAction])

  // ── Game state ────────────────────────────────────────────────────────────
  
  const [gameState, setGameState] = useState(() => {
    const saved = loadGameState()
    return saved && !saved.completed ? saved : null
  })
  const [dailyState, setDailyState] = useState(() => {
    const today = new Date().toISOString().slice(0, 10)
    return loadDailyState(today)
  })
  const [showVictory, setShowVictory] = useState(false)

  // ── Stats ──────────────────────────────────────────────────────────────────
  const [stats, setStats] = useState(() => loadStats())

  // ── Notification queue ─────────────────────────────────────────────────────
  const [notification, setNotification] = useState(null)

  const notify = useCallback((msg, type = 'info') => {
    setNotification({ msg, type, id: Date.now() })
  }, [])

  useEffect(() => {
    if (!notification) return
    const t = setTimeout(() => setNotification(null), 3200)
    return () => clearTimeout(t)
  }, [notification?.id])

  // ── Start a new free game ──────────────────────────────────────────────────
  const startGame = useCallback((difficulty) => {
    requireAuth(() => {
      const { puzzle, solution } = generateSudoku(difficulty)
  
      const gs = makeGameState(puzzle, solution, difficulty)
      setGameState(gs)
      setPage('play')
    })
  }, [requireAuth])

  // ── Start daily challenge ──────────────────────────────────────────────────
  const startDaily = useCallback(() => {
    requireAuth(() => {
      const today = new Date().toISOString().slice(0, 10)
  
      if (!dailyState) {
        const { puzzle, solution, difficulty } = getDailyPuzzle()
  
        const gs = {
          ...makeGameState(puzzle, solution, difficulty),
          date: today
        }
  
        setDailyState(gs)
        saveDailyState(gs)
      }
  
      setPage('daily')
    })
  }, [requireAuth, dailyState])

  const handleDailyComplete = useCallback(() => {
    setStats(s => {
      const updated = updateStatsOnWin(s, {
        time: dailyState?.timer ?? 0,
        mistakes: dailyState?.errors ?? 0,
        difficulty: dailyState?.difficulty ?? 'medium',
      })
      return updated
    })
    notify('Daily challenge complete! 🎉', 'success')
  }, [dailyState, notify])

  // ── Scroll to top on page change ───────────────────────────────────────────
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [page])

  // ── Scrollbar color sync ───────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.background = T.bg
    document.body.style.color      = T.text
  }, [T.bg, T.text])

  return (
    <>

      <div style={{ minHeight: '100vh', background: T.bg, color: T.text, transition: 'background 0.3s, color 0.3s' }}>

        {/* ── Nav ─────────────────────────────────────────────────────────── */}
        <Nav
            page={page}
            setPage={setPage}
            theme={themeName}
            setTheme={setThemeName}
            T={T}
            openAuth={() => setShowAuth(true)} 
          />

        {/* ── Notification toast ────────────────────────────────────────── */}
        {notification && (
          <div style={{
            position:     'fixed',
            top:          76,
            right:        20,
            zIndex:       500,
            padding:      '11px 20px',
            borderRadius: 12,
            fontSize:     14,
            fontWeight:   600,
            fontFamily:   'Outfit, sans-serif',
            background:   notification.type === 'success' ? T.success
                        : notification.type === 'error'   ? T.danger
                        : T.accent,
            color:        '#fff',
            boxShadow:    '0 4px 20px #00000044',
            animation:    'fadeInUp 0.3s ease',
            maxWidth:     320,
          }}>
            {notification.msg}
          </div>
        )}

        {/* ── Page content ─────────────────────────────────────────────── */}
        <main style={{ paddingTop: 64 }}>

          {page === 'home' && (
            <HomePage T={T} startGame={startGame} startDaily={startDaily} />
          )}

          {page === 'play' && gameState && (
            <GamePage
              gs={gameState}
              setGs={setGameState}
              T={T}
              showVictory={showVictory}
              setShowVictory={setShowVictory}
              stats={stats}
              startGame={startGame}
              notify={notify}
            />
          )}

          {page === 'play' && !gameState && (
            <DifficultyPicker T={T} startGame={startGame} />
          )}

          {page === 'daily' && (
            <DailyPage
              T={T}
              gs={dailyState}
              setGs={setDailyState}
              notify={notify}
              onComplete={handleDailyComplete}
            />
          )}

          {page === 'stats' && (
            <StatsPage T={T} stats={stats} />
          )}

          {page === 'leaderboard' && (
            <LeaderboardPage T={T} />
          )}

          {showAuth && (
            <AuthModal
              T={T}
              onClose={() => setShowAuth(false)}
            />
          )}

          <footer style={{
            marginTop: 70,
            padding: '26px 16px',
            textAlign: 'center',
            fontSize: 13,
            color: T.textMuted,
            fontFamily: 'Outfit, sans-serif',
            borderTop: `1px solid ${T.border}`,
            background: `linear-gradient(180deg, transparent, ${T.card}55)`,
          }}>
            <div>
              Made by © 2026 <span style={{ color: T.accentLight, fontWeight: 800 }}>Shadiyar</span> — All rights reserved
            </div>
          </footer>

        </main>
      </div>
    </>
  )
}

// ─── Difficulty picker (shown when navigating to /play with no active game) ───
function DifficultyPicker({ T, startGame }) {
  // eslint-disable-next-line no-undef
  const { DIFFICULTIES } = require('./styles/theme.js')

  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      minHeight:      '80vh',
      padding:        '32px 24px',
      gap:            28,
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: T.text, marginBottom: 10 }}>
          Choose Difficulty
        </h2>
        <p style={{ color: T.textMuted, fontSize: 16 }}>How hard do you want to push your brain today?</p>
      </div>
      <div style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap:                 14,
        width:               '100%',
        maxWidth:            640,
      }}>
        {Object.entries(DIFFICULTIES).map(([key, d]) => (
          <button
            key={key}
            onClick={() => startGame(key)}
            style={{
              background:   T.card,
              border:       `1.5px solid ${T.border}`,
              borderRadius: 18,
              padding:      '26px 20px',
              textAlign:    'center',
              cursor:       'pointer',
              fontFamily:   'Outfit, sans-serif',
              transition:   'all 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = d.color
              e.currentTarget.style.transform   = 'translateY(-3px)'
              e.currentTarget.style.background  = `${d.color}11`
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = T.border
              e.currentTarget.style.transform   = 'translateY(0)'
              e.currentTarget.style.background  = T.card
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>{d.emoji}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 6 }}>{d.label}</div>
            <div style={{
              display:      'inline-block',
              width:        `${Math.round((d.removals / 58) * 100)}%`,
              height:       4,
              borderRadius: 100,
              background:   d.color,
              marginBottom: 8,
              minWidth:     24,
            }} />
            <div style={{ fontSize: 13, color: T.textMuted }}>
              {81 - d.removals} givens · {d.removals} to solve
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}