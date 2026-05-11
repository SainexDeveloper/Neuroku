import { supabase } from './supabase.js'

// ─────────────────────────────────────────────
// KEYS (local fallback)
// ─────────────────────────────────────────────

const GAME_KEY = 'neuroku_game_state'
const DAILY_KEY = 'neuroku_daily_state'
const STATS_KEY = 'neuroku_stats'

// ─────────────────────────────────────────────
// DEFAULT STATS
// ─────────────────────────────────────────────

export const DEFAULT_STATS = {
  gamesPlayed: 0,
  wins: 0,
  bestTime: null,
  totalTime: 0,
  streak: 0,
  longestStreak: 0,
  mistakes: 0,
  lastPlayedDate: null,
  byDifficulty: {
    easy: 0,
    medium: 0,
    hard: 0,
    expert: 0,
  },
}

function safeParse(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

// ─────────────────────────────────────────────
// GAME STATE (local only)
// ─────────────────────────────────────────────

export function saveGameState(state) {
  localStorage.setItem(GAME_KEY, JSON.stringify(state))
}

export function loadGameState() {

  return safeParse(GAME_KEY, null)

}

export function clearGameState() {
  localStorage.removeItem(GAME_KEY)
}

// ─────────────────────────────────────────────
// DAILY STATE (local only)
// ─────────────────────────────────────────────

export function saveDailyState(state) {
  localStorage.setItem(DAILY_KEY, JSON.stringify(state))
}

export function loadDailyState(date) {

  const state = safeParse(DAILY_KEY, null)

  return state?.date === date ? state : null

}

// ─────────────────────────────────────────────
// LOCAL STATS (guest mode)
// ─────────────────────────────────────────────

export function loadLocalStats() {

  return safeParse(STATS_KEY, DEFAULT_STATS)

}

export function saveLocalStats(stats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats))
}

// ─────────────────────────────────────────────
// LOAD STATS (cloud + fallback)
// ─────────────────────────────────────────────

export async function loadStats(userId) {
  if (!userId) return loadLocalStats()

  const local = loadLocalStats()

  const { data, error } = await supabase
    .from('profiles')
    .select('stats')
    .eq('id', userId)
    .single()

  if (error || !data?.stats) {
    return local || DEFAULT_STATS
  }

  return {
    ...DEFAULT_STATS,
    ...local,
    ...data.stats,
  }
}

// ─────────────────────────────────────────────
// SAVE STATS (cloud + backup)
// ─────────────────────────────────────────────

export async function saveStats(stats, userId) {
  if (!userId) {
    saveLocalStats(stats)
    return
  }

  const { error } = await supabase
    .from('profiles')
    .update({ stats })
    .eq('id', userId)

  if (error) {
    console.error('Failed to save stats:', error)
  }

  // always keep local backup
  saveLocalStats(stats)
}

// ─────────────────────────────────────────────
// UPDATE STATS ON WIN (PURE FUNCTION + SAFE SAVE)
// ─────────────────────────────────────────────

export function calculateStatsOnWin(stats, payload) {
  const today = new Date().toISOString().slice(0, 10)

  const yesterday = new Date(Date.now() - 86400000)
    .toISOString()
    .slice(0, 10)

  const streak =
    stats.lastPlayedDate === today
      ? stats.streak
      : stats.lastPlayedDate === yesterday
        ? stats.streak + 1
        : 1

  return {
    ...stats,

    gamesPlayed: stats.gamesPlayed + 1,
    wins: stats.wins + 1,

    bestTime:
      stats.bestTime === null
        ? payload.time
        : Math.min(stats.bestTime, payload.time),

    totalTime: stats.totalTime + payload.time,
    mistakes: stats.mistakes + payload.mistakes,

    streak,
    longestStreak: Math.max(stats.longestStreak, streak),

    lastPlayedDate: today,

    byDifficulty: {
      ...stats.byDifficulty,
      [payload.difficulty]:
        (stats.byDifficulty?.[payload.difficulty] ?? 0) + 1,
    },
  }
}

// ─────────────────────────────────────────────
// SAFE WRAPPER (IMPORTANT FIX)
// ─────────────────────────────────────────────

export async function updateStatsOnWin(stats, payload, userId) {
  const updated = calculateStatsOnWin(stats, payload)

  await saveStats(updated, userId)

  return updated
}