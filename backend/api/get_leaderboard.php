<?php
// ─── Neuroku — Leaderboard API ────────────────────────────────────────────────
// GET /api/get_leaderboard.php?type=daily|weekly|global&date=YYYY-MM-DD&page=1&limit=50

declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/jwt.php';
require_once __DIR__ . '/../utils/helpers.php';

init_request();
if ($_SERVER['REQUEST_METHOD'] !== 'GET') fail('Method not allowed', 405);

$type  = $_GET['type']  ?? 'daily';
$date  = $_GET['date']  ?? date('Y-m-d');
$page  = max(1, (int)($_GET['page'] ?? 1));
$limit = min(100, max(10, (int)($_GET['limit'] ?? 50)));
$offset = ($page - 1) * $limit;

$viewer = optional_auth();
$viewerId = $viewer ? (int)$viewer['sub'] : null;

match ($type) {
    'daily'  => serve_daily($date, $limit, $offset, $viewerId),
    'weekly' => serve_weekly($limit, $offset, $viewerId),
    'global' => serve_global($limit, $offset, $viewerId),
    default  => fail('Invalid type. Use: daily, weekly, global'),
};

// ─── Daily leaderboard ────────────────────────────────────────────────────────
function serve_daily(string $date, int $limit, int $offset, ?int $viewerId): never
{
    $dc = DB::row('SELECT id, difficulty FROM daily_challenges WHERE challenge_date = ?', [$date]);
    if (!$dc) {
        ok(['entries' => [], 'total' => 0, 'date' => $date, 'source' => 'live']);
    }

    $dcId = (int)$dc['id'];

    $entries = DB::rows(
        'SELECT
           u.id AS user_id,
           u.username,
           u.avatar_color,
           u.avatar_initials,
           u.country,
           sc.completion_time,
           sc.mistakes,
           sc.hints_used,
           sc.completed_at,
           s.current_streak,
           RANK() OVER (ORDER BY sc.completion_time ASC, sc.mistakes ASC) AS `rank`
         FROM scores sc
         JOIN users u ON u.id = sc.user_id
         JOIN user_stats s ON s.user_id = sc.user_id
         WHERE sc.daily_challenge_id = ? AND sc.is_daily = 1
         ORDER BY sc.completion_time ASC, sc.mistakes ASC
         LIMIT ? OFFSET ?',
        [$dcId, $limit, $offset]
    );

    $total = (int)(DB::row(
        'SELECT COUNT(*) AS cnt FROM scores WHERE daily_challenge_id = ? AND is_daily = 1',
        [$dcId]
    )['cnt'] ?? 0);

    // Viewer's own rank
    $myEntry = null;
    if ($viewerId) {
        $myEntry = DB::row(
            'SELECT
               sc.completion_time, sc.mistakes,
               (SELECT COUNT(*) + 1 FROM scores s2
                WHERE s2.daily_challenge_id = ?
                  AND s2.is_daily = 1
                  AND (s2.completion_time < sc.completion_time
                   OR (s2.completion_time = sc.completion_time AND s2.mistakes < sc.mistakes))) AS `rank`
             FROM scores sc
             WHERE sc.daily_challenge_id = ? AND sc.user_id = ? AND sc.is_daily = 1
             LIMIT 1',
            [$dcId, $dcId, $viewerId]
        );
    }

    ok([
        'entries'      => array_map('format_entry', $entries),
        'total'        => $total,
        'my_entry'     => $myEntry,
        'difficulty'   => $dc['difficulty'],
        'date'         => $date,
        'source'       => 'live',
    ]);
}

// ─── Weekly leaderboard ───────────────────────────────────────────────────────
function serve_weekly(int $limit, int $offset, ?int $viewerId): never
{
    $weekStart = date('Y-m-d', strtotime('monday this week'));

    $entries = DB::rows(
        'SELECT
           u.id AS user_id,
           u.username,
           u.avatar_color,
           u.avatar_initials,
           u.country,
           COUNT(sc.id)              AS games_won,
           MIN(sc.completion_time)   AS best_time,
           SUM(sc.mistakes)          AS total_mistakes,
           s.current_streak,
           RANK() OVER (ORDER BY COUNT(sc.id) DESC, MIN(sc.completion_time) ASC) AS `rank`
         FROM scores sc
         JOIN users u ON u.id = sc.user_id
         JOIN user_stats s ON s.user_id = sc.user_id
         WHERE sc.completed_at >= ?
         GROUP BY u.id
         ORDER BY games_won DESC, best_time ASC
         LIMIT ? OFFSET ?',
        [$weekStart . ' 00:00:00', $limit, $offset]
    );

    ok([
        'entries'    => array_map('format_entry', $entries),
        'week_start' => $weekStart,
        'source'     => 'live',
    ]);
}

// ─── Global (rating-based) leaderboard ───────────────────────────────────────
function serve_global(int $limit, int $offset, ?int $viewerId): never
{
    $entries = DB::rows(
        'SELECT
           u.id AS user_id,
           u.username,
           u.avatar_color,
           u.avatar_initials,
           u.country,
           s.rating,
           s.games_won,
           s.best_time,
           s.best_time_difficulty,
           s.current_streak,
           s.longest_streak,
           ROW_NUMBER() OVER (ORDER BY s.rating DESC, s.games_won DESC) AS `rank`
         FROM user_stats s
         JOIN users u ON u.id = s.user_id
         ORDER BY s.rating DESC, s.games_won DESC
         LIMIT ? OFFSET ?',
        [$limit, $offset]
    );

    $total = (int)(DB::row('SELECT COUNT(*) AS cnt FROM user_stats')['cnt'] ?? 0);

    // Viewer's own rank
    $myRank = null;
    if ($viewerId) {
        $myRank = DB::row(
            'SELECT COUNT(*) + 1 AS `rank`
             FROM user_stats
             WHERE rating > (SELECT rating FROM user_stats WHERE user_id = ?)',
            [$viewerId]
        );
    }

    ok([
        'entries' => array_map('format_entry', $entries),
        'total'   => $total,
        'my_rank' => $myRank ? (int)$myRank['rank'] : null,
        'source'  => 'live',
    ]);
}

// ─── Entry formatter ──────────────────────────────────────────────────────────
function format_entry(array $row): array
{
    if (isset($row['completion_time'])) {
        $row['time_formatted'] = sprintf('%02d:%02d',
            intdiv((int)$row['completion_time'], 60),
            (int)$row['completion_time'] % 60
        );
    }
    return $row;
}