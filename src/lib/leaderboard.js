import { supabase } from './supabase.js'

export async function getLeaderboard(limit = 50) {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .limit(limit)

  if (error) {
    console.error(error)
    return []
  }

  return data
}