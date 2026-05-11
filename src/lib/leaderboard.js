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

export async function fetchDailyLeaderboard(date) {

  const { data } = await supabase

    .from("scores")

    .select(`

      completion_time,

      mistakes,

      profiles(username, avatar_initials)

    `)

    .eq("is_daily", true)

    .eq("daily_date", date)

    .order("completion_time", { ascending: true })

    .limit(50)

  return (data || []).map((r, i) => ({

    rank: i + 1,

    name: r.profiles?.username,

    time: r.completion_time,

    mistakes: r.mistakes,

    avatar: r.profiles?.avatar_initials

  }))

}