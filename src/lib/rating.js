export function calculateRating(stats) {
    const winRate =
      stats.games_played > 0
        ? stats.games_won / stats.games_played
        : 0
  
    const speed = stats.best_time
      ? Math.max(0, 600 - stats.best_time)
      : 0
  
    const streak = stats.longest_streak || 0
  
    return Math.round(
      winRate * 1000 +
      speed * 0.5 +
      streak * 10
    )
  }