// ─── Neuroku API Client ───────────────────────────────────────────────────────
// Wraps all backend calls. Falls back to localStorage when offline.
// Base URL is read from the VITE_API_URL env var (set in .env).

const BASE_URL = import.meta.env.VITE_API_URL ?? '/backend/api'

// ─── Request helper ───────────────────────────────────────────────────────────

async function request(endpoint, options = {}) {
  const { method = 'GET', body, token } = options

  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  try {
    const res = await fetch(`${BASE_URL}/${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }))
      throw new Error(err.message ?? `Request failed: ${res.status}`)
    }

    return await res.json()
  } catch (err) {
    // In development without a backend, log and rethrow
    console.warn(`[Neuroku API] ${endpoint} failed:`, err.message)
    throw err
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function loginWithGoogle(idToken) {
  return request('login.php', {
    method: 'POST',
    body: { provider: 'google', id_token: idToken },
  })
}

export async function loginWithEmail(email, password) {
  return request('login.php', {
    method: 'POST',
    body: { provider: 'email', email, password },
  })
}

// ─── Daily challenge ──────────────────────────────────────────────────────────

export async function fetchDailyChallenge(date) {
  try {
    return await request(`get_daily.php?date=${date}`)
  } catch {
    // Offline fallback: generate locally
    const { getDailyPuzzle } = await import('./sudoku.js')
    return getDailyPuzzle()
  }
}

// ─── Puzzle generation ────────────────────────────────────────────────────────

export async function fetchPuzzle(difficulty) {
  try {
    return await request(`generate.php?difficulty=${difficulty}`)
  } catch {
    const { generateSudoku } = await import('./sudoku.js')
    return generateSudoku(difficulty)
  }
}

// ─── Scores ───────────────────────────────────────────────────────────────────

export async function saveScore({ userId, puzzleId, completionTime, mistakes, difficulty, token }) {
  try {
    return await request('save_score.php', {
      method: 'POST',
      token,
      body: { user_id: userId, puzzle_id: puzzleId, completion_time: completionTime, mistakes, difficulty },
    })
  } catch {
    // Store locally for sync when back online
    const pending = JSON.parse(localStorage.getItem('neuroku_pending_scores') ?? '[]')
    pending.push({ userId, puzzleId, completionTime, mistakes, difficulty, savedAt: Date.now() })
    localStorage.setItem('neuroku_pending_scores', JSON.stringify(pending))
    return { ok: false, queued: true }
  }
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export async function fetchLeaderboard({ type = 'daily', date, limit = 50 } = {}) {
  try {
    const params = new URLSearchParams({ type, limit })
    if (date) params.set('date', date)
    return await request(`get_leaderboard.php?${params}`)
  } catch {
    // Return mock data offline
    return { entries: MOCK_LEADERBOARD, source: 'mock' }
  }
}

// ─── Game state persistence (localStorage) ────────────────────────────────────

const SAVE_KEY = 'neuroku_game_state'
const DAILY_KEY = 'neuroku_daily_state'

export function saveGameState(state) {
  try {
    // Serialize Sets inside notes to arrays
    const serializable = {
      ...state,
      notes: state.notes.map(row => row.map(s => [...s])),
      savedAt: Date.now(),
    }
    localStorage.setItem(SAVE_KEY, JSON.stringify(serializable))
  } catch (e) {
    console.warn('[Neuroku] Could not save game state:', e)
  }
}

export function loadGameState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const state = JSON.parse(raw)
    // Restore Sets
    state.notes = state.notes.map(row => row.map(arr => new Set(arr)))
    return state
  } catch {
    return null
  }
}

export function clearGameState() {
  localStorage.removeItem(SAVE_KEY)
}

export function saveDailyState(state) {
  try {
    const serializable = {
      ...state,
      notes: state.notes.map(row => row.map(s => [...s])),
    }
    localStorage.setItem(DAILY_KEY, JSON.stringify(serializable))
  } catch (e) {
    console.warn('[Neuroku] Could not save daily state:', e)
  }
}

export function loadDailyState(date) {
  try {
    const raw = localStorage.getItem(DAILY_KEY)
    if (!raw) return null
    const state = JSON.parse(raw)
    // Only restore if it's for today
    if (state.date !== date) return null
    state.notes = state.notes.map(row => row.map(arr => new Set(arr)))
    return state
  } catch {
    return null
  }
}

// ─── Stats persistence ────────────────────────────────────────────────────────

const STATS_KEY = 'neuroku_stats'

export const DEFAULT_STATS = {
  gamesPlayed:   0,
  wins:          0,
  bestTime:      null,
  totalTime:     0,
  streak:        0,
  longestStreak: 0,
  mistakes:      0,
  lastPlayedDate: null,
  byDifficulty:  { easy: 0, medium: 0, hard: 0, expert: 0 },
}

export function loadStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY)
    return raw ? { ...DEFAULT_STATS, ...JSON.parse(raw) } : { ...DEFAULT_STATS }
  } catch {
    return { ...DEFAULT_STATS }
  }
}

export function saveStats(stats) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats))
  } catch (e) {
    console.warn('[Neuroku] Could not save stats:', e)
  }
}

export function updateStatsOnWin(stats, { time, mistakes, difficulty }) {
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  let streak = stats.streak
  if (stats.lastPlayedDate === yesterday) streak += 1
  else if (stats.lastPlayedDate !== today) streak = 1

  const updated = {
    ...stats,
    gamesPlayed:   stats.gamesPlayed + 1,
    wins:          stats.wins + 1,
    bestTime:      stats.bestTime === null ? time : Math.min(stats.bestTime, time),
    totalTime:     stats.totalTime + time,
    mistakes:      stats.mistakes + mistakes,
    streak,
    longestStreak: Math.max(stats.longestStreak, streak),
    lastPlayedDate: today,
    byDifficulty: {
      ...stats.byDifficulty,
      [difficulty]: (stats.byDifficulty[difficulty] ?? 0) + 1,
    },
  }
  saveStats(updated)
  return updated
}

// ─── Mock leaderboard (offline fallback) ─────────────────────────────────────

export const MOCK_LEADERBOARD = [
  { rank: 1,  name: 'NeuralNinja',   time: 252,  mistakes: 0, streak: 47, avatar: 'NN' },
  { rank: 2,  name: 'SudoKuKing',    time: 298,  mistakes: 1, streak: 32, avatar: 'SK' },
  { rank: 3,  name: 'BrainStorm',    time: 321,  mistakes: 0, streak: 28, avatar: 'BS' },
  { rank: 4,  name: 'PuzzleMaster',  time: 363,  mistakes: 2, streak: 19, avatar: 'PM' },
  { rank: 5,  name: 'GridWizard',    time: 404,  mistakes: 1, streak: 15, avatar: 'GW' },
  { rank: 6,  name: 'MindBender',    time: 435,  mistakes: 3, streak: 11, avatar: 'MB' },
  { rank: 7,  name: 'ThinkFast',     time: 472,  mistakes: 2, streak: 8,  avatar: 'TF' },
  { rank: 8,  name: 'Logical_LK',    time: 510,  mistakes: 4, streak: 5,  avatar: 'LL' },
  { rank: 9,  name: 'CalmCalc',      time: 548,  mistakes: 1, streak: 3,  avatar: 'CC' },
  { rank: 10, name: 'ZenSolver',     time: 591,  mistakes: 2, streak: 2,  avatar: 'ZS' },
]