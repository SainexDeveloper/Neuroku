import { supabase } from './supabase.js'

export async function checkAchievements(userId, stats) {
  const unlocked = []

  if (stats.games_won === 1) {
    unlocked.push('first_win')
  }

  if (stats.longest_streak >= 5) {
    unlocked.push('streak_5')
  }

  if (stats.best_time < 300) {
    unlocked.push('speed_runner')
  }

  for (const id of unlocked) {
    await supabase.from('user_achievements').upsert({
      user_id: userId,
      achievement_id: id,
      unlocked_at: new Date(),
    })
  }

  return unlocked
}