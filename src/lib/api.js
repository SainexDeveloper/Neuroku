import { supabase } from './supabase'

// ─── AUTH ─────────────────────────────

export async function loginWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google'
  })
}

export async function loginWithEmail(email, password) {
  return supabase.auth.signInWithPassword({
    email,
    password
  })
}

export async function logout() {
  return supabase.auth.signOut()
}

export async function getUser() {
  const { data } = await supabase.auth.getUser()
  return data?.user ?? null
}

// ─── PUZZLES ──────────────────────────

export async function fetchPuzzle(difficulty) {
  const { data, error } = await supabase
    .from('puzzles')
    .select('*')
    .eq('difficulty', difficulty)
    .limit(1)

  if (error) throw error
  return data?.[0]
}

// ─── DAILY ────────────────────────────

export async function fetchDaily(date) {
  const { data, error } = await supabase
    .rpc('get_daily', { date_input: date })

  if (error) throw error
  return data?.[0]
}

// ─── SAVE SCORE ───────────────────────

export async function saveScore(payload) {
  const { data: user } = await supabase.auth.getUser()

  const { error } = await supabase.from('scores').insert({
    user_id: user.user.id,
    puzzle_id: payload.puzzle_id,
    daily_challenge_id: payload.daily_challenge_id,
    difficulty: payload.difficulty,
    completion_time: payload.completion_time,
    mistakes: payload.mistakes,
    hints_used: payload.hints_used ?? 0,
    is_daily: payload.is_daily ?? false
  })

  if (error) throw error
  return { ok: true }
}

// ─── LEADERBOARD ──────────────────────

export async function fetchLeaderboard(type = 'daily', date) {
  let query = supabase.from('scores').select(`
    user_id,
    completion_time,
    mistakes,
    difficulty,
    completed_at
  `)

  if (type === 'daily') {
    query = query.eq('is_daily', true)
    if (date) query = query.eq('created_at', date)
  }

  const { data, error } = await query.order('completion_time', { ascending: true })

  if (error) throw error
  return data
}

// ─── PROFILE ──────────────────────────

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) throw error
  return data
}