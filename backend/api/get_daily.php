<?php
// ─── Neuroku — Daily Challenge API ───────────────────────────────────────────
// GET  /api/get_daily.php?date=YYYY-MM-DD  — fetch (or create) the daily puzzle
// GET  /api/get_daily.php?action=status    — has current user completed today?

declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/jwt.php';
require_once __DIR__ . '/../utils/helpers.php';

init_request();
if ($_SERVER['REQUEST_METHOD'] !== 'GET') fail('Method not allowed', 405);

$action = $_GET['action'] ?? 'fetch';
$date   = $_GET['date']   ?? date('Y-m-d');

// Basic date validation
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
    fail('Invalid date format. Use YYYY-MM-DD');
}

$viewer   = optional_auth();
$viewerId = $viewer ? (int)$viewer['sub'] : null;

if ($action === 'status') {
    handle_status($date, $viewerId);
} else {
    handle_fetch($date, $viewerId);
}

// ─── Fetch (or auto-generate) the daily challenge ─────────────────────────────
function handle_fetch(string $date, ?int $viewerId): never
{
    $dc = DB::row(
        'SELECT id, challenge_date, difficulty, puzzle_data, solution_data
         FROM daily_challenges WHERE challenge_date = ?',
        [$date]
    );

    // Auto-generate if missing (runs once per day, idempotent)
    if (!$dc) {
        $dc = generate_and_store_daily($date);
    }

    // Has this user already completed today?
    $completed = false;
    $myScore   = null;
    if ($viewerId) {
        $myScore = DB::row(
            'SELECT completion_time, mistakes, completed_at
             FROM scores
             WHERE user_id = ? AND daily_challenge_id = ? AND is_daily = 1
             LIMIT 1',
            [$viewerId, $dc['id']]
        );
        $completed = (bool)$myScore;
    }

    // Total completions + top 3 for preview
    $completionCount = (int)(DB::row(
        'SELECT COUNT(*) AS cnt FROM scores WHERE daily_challenge_id = ? AND is_daily = 1',
        [(int)$dc['id']]
    )['cnt'] ?? 0);

    $topThree = DB::rows(
        'SELECT u.username, u.avatar_initials, u.avatar_color, sc.completion_time, sc.mistakes
         FROM scores sc
         JOIN users u ON u.id = sc.user_id
         WHERE sc.daily_challenge_id = ? AND sc.is_daily = 1
         ORDER BY sc.completion_time ASC, sc.mistakes ASC
         LIMIT 3',
        [(int)$dc['id']]
    );

    ok([
        'id'               => (int)$dc['id'],
        'date'             => $dc['challenge_date'],
        'difficulty'       => $dc['difficulty'],
        'puzzle'           => json_decode($dc['puzzle_data'], true),
        'solution'         => $completed ? json_decode($dc['solution_data'], true) : null,
        'completed'        => $completed,
        'my_score'         => $myScore,
        'completion_count' => $completionCount,
        'top_three'        => $topThree,
    ]);
}

// ─── Status: has user completed today? ───────────────────────────────────────
function handle_status(string $date, ?int $viewerId): never
{
    if (!$viewerId) ok(['completed' => false]);

    $dc = DB::row('SELECT id FROM daily_challenges WHERE challenge_date = ?', [$date]);
    if (!$dc) ok(['completed' => false]);

    $score = DB::row(
        'SELECT completion_time, mistakes FROM scores
         WHERE user_id = ? AND daily_challenge_id = ? AND is_daily = 1',
        [$viewerId, $dc['id']]
    );

    ok(['completed' => (bool)$score, 'score' => $score]);
}

// ─── Auto-generate daily ──────────────────────────────────────────────────────
function generate_and_store_daily(string $date): array
{
    // Deterministic difficulty from date seed
    $seed  = array_sum(array_map('intval', explode('-', $date)));
    $diffs = ['easy','medium','medium','hard','hard','expert'];
    $diff  = $diffs[$seed % count($diffs)];

    $gen    = generate_sudoku($diff);
    $puzzle = json_encode($gen['puzzle']);
    $sol    = json_encode($gen['solution']);

    // Use INSERT IGNORE to avoid race condition on concurrent first-hit
    DB::execute(
        'INSERT IGNORE INTO daily_challenges (challenge_date, difficulty, puzzle_data, solution_data)
         VALUES (?, ?, ?, ?)',
        [$date, $diff, $puzzle, $sol]
    );

    return DB::row(
        'SELECT id, challenge_date, difficulty, puzzle_data, solution_data
         FROM daily_challenges WHERE challenge_date = ?',
        [$date]
    );
}