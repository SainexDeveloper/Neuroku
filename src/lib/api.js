import { supabase } from './supabase'

// ─────────────────────────────────────────────────────────────
// AUTH (Supabase вместо PHP)
// ─────────────────────────────────────────────────────────────

export async function loginWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data.user
}

export async function registerWithEmail(email, password, username) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username }
    }
  })

  if (error) throw error
  return data.user
}

// Google login (если включишь OAuth в Supabase)
export async function loginWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
  })

  if (error) throw error
  return data
}

// ─────────────────────────────────────────────────────────────
// DAILY CHALLENGE
// ─────────────────────────────────────────────────────────────

export async function fetchDailyChallenge(date) {
  const { data, error } = await supabase
    .from('daily_challenges')
    .select('*')
    .eq('challenge_date', date)
    .single()

  if (error) throw error

  return data
}

// ─────────────────────────────────────────────────────────────
// PUZZLE GENERATION (DB + fallback)
// ─────────────────────────────────────────────────────────────

export async function fetchPuzzle(difficulty) {
  const { data, error } = await supabase
    .from('puzzles')
    .select('*')
    .eq('difficulty', difficulty)
    .limit(1)
    .maybeSingle()

  if (!error && data) return data

  // fallback local generator
  const { generateSudoku } = await import('./sudoku.js')
  return generateSudoku(difficulty)
}

// ─────────────────────────────────────────────────────────────
// SCORES
// ─────────────────────────────────────────────────────────────

export async function saveScore({
  userId,
  puzzleId,
  dailyChallengeId,
  completionTime,
  mistakes,
  hintsUsed = 0,
  difficulty,
  isDaily = false
}) {
  const { data, error } = await supabase
    .from('scores')
    .insert({
      user_id: userId,
      puzzle_id: puzzleId ?? null,
      daily_challenge_id: dailyChallengeId ?? null,
      completion_time: completionTime,
      mistakes,
      hints_used: hintsUsed,
      difficulty,
      is_daily: isDaily,
    })

  if (error) throw error
  return data
}

// ─────────────────────────────────────────────────────────────
// LEADERBOARD
// ─────────────────────────────────────────────────────────────

export async function fetchLeaderboard(type = 'global') {
  if (type === 'global') {
    const { data, error } = await supabase
      .from('v_global_leaderboard')
      .select('*')
      .limit(50)

    if (error) throw error
    return data
  }

  const { data, error } = await supabase
    .from('v_daily_leaderboard')
    .select('*')
    .limit(50)

  if (error) throw error
  return data
}

// ─────────────────────────────────────────────────────────────
// GAME STATE (localStorage оставляем)
// ─────────────────────────────────────────────────────────────

const SAVE_KEY = 'neuroku_game_state'
const DAILY_KEY = 'neuroku_daily_state'

export function saveGameState(state) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state))
}

export function loadGameState() {
  const raw = localStorage.getItem(SAVE_KEY)
  return raw ? JSON.parse(raw) : null
}

export function clearGameState() {
  localStorage.removeItem(SAVE_KEY)
}

export function saveDailyState(state) {
  localStorage.setItem(DAILY_KEY, JSON.stringify(state))
}

export function loadDailyState(date) {
  const raw = localStorage.getItem(DAILY_KEY)
  if (!raw) return null

  const state = JSON.parse(raw)
  return state.date === date ? state : null
}

// ─────────────────────────────────────────────────────────────
// STATS (Supabase user_stats)
// ─────────────────────────────────────────────────────────────

export async function loadStats(userId) {
  const { data } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  return data
}

export async function updateStatsOnWin(userId, { time, mistakes, difficulty }) {
  const { data: stats } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .single()

  const updated = {
    games_played: stats.games_played + 1,
    games_won: stats.games_won + 1,
    total_time: stats.total_time + time,
    total_mistakes: stats.total_mistakes + mistakes,
    [`wins_${difficulty}`]: stats[`wins_${difficulty}`] + 1,
  }

  const { data, error } = await supabase
    .from('user_stats')
    .update(updated)
    .eq('user_id', userId)

  if (error) throw error
  return data
}

// ─────────────────────────────────────────────────────────────
// MOCK (убрать в prod)
// ─────────────────────────────────────────────────────────────

export const MOCK_LEADERBOARD = []