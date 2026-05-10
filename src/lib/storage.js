const GAME_KEY = 'neuroku_game_state'
const DAILY_KEY = 'neuroku_daily_state'
const STATS_KEY = 'neuroku_stats'

// ─── Game state ─────────────────────────────
export function saveGameState(state) {
  localStorage.setItem(GAME_KEY, JSON.stringify(state))
}

export function loadGameState() {
  const raw = localStorage.getItem(GAME_KEY)
  return raw ? JSON.parse(raw) : null
}

export function clearGameState() {
  localStorage.removeItem(GAME_KEY)
}

// ─── Daily ──────────────────────────────────
export function saveDailyState(state) {
  localStorage.setItem(DAILY_KEY, JSON.stringify(state))
}

export function loadDailyState(date) {
  const raw = localStorage.getItem(DAILY_KEY)
  if (!raw) return null

  const state = JSON.parse(raw)
  return state?.date === date ? state : null
}

// ─── Stats ──────────────────────────────────
export function loadStats() {
  const raw = localStorage.getItem(STATS_KEY)
  return raw ? JSON.parse(raw) : {
    gamesPlayed: 0,
    wins: 0,
    bestTime: null,
    totalTime: 0,
    streak: 0,
    longestStreak: 0,
    mistakes: 0,
    lastPlayedDate: null,
    byDifficulty: { easy: 0, medium: 0, hard: 0, expert: 0 },
  }
}

export function saveStats(stats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats))
}

export function updateStatsOnWin(stats, payload) {
  const today = new Date().toISOString().slice(0, 10)

  const streak =
    stats.lastPlayedDate === today
      ? stats.streak
      : stats.lastPlayedDate === new Date(Date.now() - 86400000).toISOString().slice(0,10)
        ? stats.streak + 1
        : 1

  const updated = {
    ...stats,
    gamesPlayed: stats.gamesPlayed + 1,
    wins: stats.wins + 1,
    bestTime: stats.bestTime === null ? payload.time : Math.min(stats.bestTime, payload.time),
    totalTime: stats.totalTime + payload.time,
    mistakes: stats.mistakes + payload.mistakes,
    streak,
    longestStreak: Math.max(stats.longestStreak, streak),
    lastPlayedDate: today,
    byDifficulty: {
      ...stats.byDifficulty,
      [payload.difficulty]: (stats.byDifficulty[payload.difficulty] ?? 0) + 1,
    }
  }

  saveStats(updated)
  return updated
} 