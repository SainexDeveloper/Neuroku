<?php
// ─── Neuroku — Score Submission API ──────────────────────────────────────────
// POST /api/save_score.php
// Saves a completed game, updates stats, rating, streak, calendar, achievements.

declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/jwt.php';
require_once __DIR__ . '/../utils/helpers.php';

init_request();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('Method not allowed', 405);

$payload = require_auth();
$userId  = (int)$payload['sub'];
$data    = get_json();

require_fields($data, ['difficulty', 'completion_time', 'mistakes']);

$difficulty  = $data['difficulty'];
$time        = max(1, (int)$data['completion_time']);
$mistakes    = max(0, (int)$data['mistakes']);
$hintsUsed   = max(0, (int)($data['hints_used'] ?? 0));
$isDaily     = !empty($data['is_daily']);
$dailyDate   = sanitize_string($data['daily_date'] ?? '');
$puzzleId    = sanitize_string($data['puzzle_id'] ?? '', 36);

if (!in_array($difficulty, ['easy','medium','hard','expert'], true)) {
    fail('Invalid difficulty');
}

DB::beginTransaction();

try {
    // ── 1. Find daily challenge ID if applicable ───────────────────────────
    $dailyChallengeId = null;
    if ($isDaily && $dailyDate) {
        $dc = DB::row('SELECT id FROM daily_challenges WHERE challenge_date = ?', [$dailyDate]);
        $dailyChallengeId = $dc ? (int)$dc['id'] : null;

        // Prevent duplicate daily submission
        if ($dailyChallengeId) {
            $exists = DB::row(
                'SELECT id FROM scores WHERE user_id = ? AND daily_challenge_id = ? AND is_daily = 1',
                [$userId, $dailyChallengeId]
            );
            if ($exists) {
                DB::rollback();
                fail('Daily challenge already submitted today', 409);
            }
        }
    }

    // ── 2. Insert score ───────────────────────────────────────────────────
    $scoreId = (int)DB::insert(
        'INSERT INTO scores
           (user_id, puzzle_id, daily_challenge_id, difficulty,
            completion_time, mistakes, hints_used, is_daily)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
            $userId,
            $puzzleId ?: null,
            $dailyChallengeId,
            $difficulty,
            $time,
            $mistakes,
            $hintsUsed,
            $isDaily ? 1 : 0,
        ]
    );

    // ── 3. Load current stats ─────────────────────────────────────────────
    $stats = DB::row('SELECT * FROM user_stats WHERE user_id = ?', [$userId]);
    if (!$stats) {
        DB::execute('INSERT INTO user_stats (user_id) VALUES (?)', [$userId]);
        $stats = DB::row('SELECT * FROM user_stats WHERE user_id = ?', [$userId]);
    }

    $today   = date('Y-m-d');
    $streaks = update_streak($stats, $today);

    // Best time
    $isBestTime = ($stats['best_time'] === null || $time < (int)$stats['best_time']);
    $newBestTime = $isBestTime ? $time : $stats['best_time'];
    $newBestDiff = $isBestTime ? $difficulty : $stats['best_time_difficulty'];

    // Win counters per difficulty
    $winCol  = "wins_{$difficulty}";
    $avgTime = $stats['games_won'] > 0
        ? (int)(((int)$stats['total_time'] + $time) / ($stats['games_won'] + 1))
        : $time;

    // ── 4. Rating delta ───────────────────────────────────────────────────
    $ratingDelta = calculate_rating_delta(
        (int)$stats['rating'], $difficulty, $time, $mistakes, $isDaily
    );
    $newRating = max(800, (int)$stats['rating'] + $ratingDelta);

    // ── 5. Update user_stats ──────────────────────────────────────────────
    DB::execute(
        "UPDATE user_stats SET
           games_played   = games_played + 1,
           games_won      = games_won + 1,
           total_time     = total_time + ?,
           best_time      = ?,
           best_time_difficulty = ?,
           total_mistakes = total_mistakes + ?,
           total_hints    = total_hints + ?,
           $winCol        = $winCol + 1,
           current_streak = ?,
           longest_streak = ?,
           last_played_date = ?,
           rating         = ?
         WHERE user_id = ?",
        [
            $time,
            $newBestTime,
            $newBestDiff,
            $mistakes,
            $hintsUsed,
            $streaks['current_streak'],
            $streaks['longest_streak'],
            $today,
            $newRating,
            $userId,
        ]
    );

    // ── 6. Activity calendar ───────────────────────────────────────────────
    DB::execute(
        'INSERT INTO activity_calendar
           (user_id, activity_date, games_played, games_won, best_time, daily_done)
         VALUES (?, ?, 1, 1, ?, ?)
         ON DUPLICATE KEY UPDATE
           games_played = games_played + 1,
           games_won    = games_won + 1,
           best_time    = LEAST(COALESCE(best_time, ?), ?),
           daily_done   = daily_done OR ?',
        [
            $userId, $today, $time, $isDaily ? 1 : 0,
            $time, $time,
            $isDaily ? 1 : 0,
        ]
    );

    // ── 7. Achievement check ──────────────────────────────────────────────
    $alreadyUnlocked = array_column(
        DB::rows('SELECT achievement_id FROM user_achievements WHERE user_id = ?', [$userId]),
        'achievement_id'
    );

    $updatedStats = array_merge($stats, [
        'games_played'   => $stats['games_played'] + 1,
        'games_won'      => $stats['games_won'] + 1,
        'best_time'      => $newBestTime,
        'current_streak' => $streaks['current_streak'],
        'rating'         => $newRating,
        $winCol          => ($stats[$winCol] ?? 0) + 1,
    ]);

    $newAchievements = check_achievements($updatedStats, $alreadyUnlocked);
    foreach ($newAchievements as $achId) {
        DB::execute(
            'INSERT IGNORE INTO user_achievements (user_id, achievement_id) VALUES (?, ?)',
            [$userId, $achId]
        );
    }

    // ── 8. Daily rank (if applicable) ─────────────────────────────────────
    $dailyRank = null;
    if ($dailyChallengeId) {
        $rankRow = DB::row(
            'SELECT COUNT(*) + 1 AS `rank`
             FROM scores
             WHERE daily_challenge_id = ?
               AND (completion_time < ? OR (completion_time = ? AND mistakes <= ?))
               AND user_id != ?
               AND is_daily = 1',
            [$dailyChallengeId, $time, $time, $mistakes, $userId]
        );
        $dailyRank = (int)($rankRow['rank'] ?? 1);

        // Achievement for top ranks
        if ($dailyRank <= 3)  $newAchievements[] = 'top3_daily';
        if ($dailyRank <= 10) $newAchievements[] = 'top10_daily';
        $newAchievements = array_unique($newAchievements);
        foreach (['top3_daily','top10_daily'] as $rankAch) {
            if (in_array($rankAch, $newAchievements, true) && !in_array($rankAch, $alreadyUnlocked, true)) {
                DB::execute(
                    'INSERT IGNORE INTO user_achievements (user_id, achievement_id) VALUES (?, ?)',
                    [$userId, $rankAch]
                );
            }
        }
    }

    DB::commit();

} catch (\Throwable $e) {
    DB::rollback();
    if (APP_ENV === 'development') fail($e->getMessage(), 500);
    fail('Failed to save score. Please try again.', 500);
}

ok([
    'score_id'         => $scoreId,
    'rating_delta'     => $ratingDelta,
    'new_rating'       => $newRating,
    'new_streak'       => $streaks['current_streak'],
    'daily_rank'       => $dailyRank,
    'new_achievements' => $newAchievements,
    'is_best_time'     => $isBestTime,
]);