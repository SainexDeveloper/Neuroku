<?php
// ─── Neuroku — Core Utilities ─────────────────────────────────────────────────
// Shared helpers used across all API endpoints.

declare(strict_types=1);

// ─── CORS + JSON headers ──────────────────────────────────────────────────────
function init_request(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
    $allowed = [APP_URL, 'http://localhost:5173', 'http://localhost:3000'];

    if (in_array($origin, $allowed, true) || APP_ENV === 'development') {
        header("Access-Control-Allow-Origin: $origin");
    }
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Content-Type: application/json; charset=utf-8');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

// ─── JSON response helpers ────────────────────────────────────────────────────
function ok(array $data = [], int $code = 200): never
{
    http_response_code($code);
    echo json_encode(['ok' => true, ...$data], JSON_UNESCAPED_UNICODE);
    exit;
}

function fail(string $message, int $code = 400, array $extra = []): never
{
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $message, ...$extra], JSON_UNESCAPED_UNICODE);
    exit;
}

// ─── Auth middleware ──────────────────────────────────────────────────────────
function require_auth(): array
{
    try {
        return JWT::fromRequest();
    } catch (\RuntimeException $e) {
        fail($e->getMessage(), 401);
    }
}

function optional_auth(): ?array
{
    try {
        return JWT::fromRequest();
    } catch (\RuntimeException) {
        return null;
    }
}

// ─── Input helpers ────────────────────────────────────────────────────────────
function get_json(): array
{
    $raw = file_get_contents('php://input');
    if (empty($raw)) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function require_fields(array $data, array $fields): void
{
    foreach ($fields as $f) {
        if (!isset($data[$f]) || (is_string($data[$f]) && trim($data[$f]) === '')) {
            fail("Missing required field: $f");
        }
    }
}

function sanitize_string(string $s, int $max = 255): string
{
    return mb_substr(trim(strip_tags($s)), 0, $max);
}

// ─── Sudoku generator (PHP port) ─────────────────────────────────────────────
function shuffle_array(array $arr): array
{
    shuffle($arr);
    return $arr;
}

function generate_solved_grid(): array
{
    $canonical = [
        [5,3,4,6,7,8,9,1,2],[6,7,2,1,9,5,3,4,8],[1,9,8,3,4,2,5,6,7],
        [8,5,9,7,6,1,4,2,3],[4,2,6,8,5,3,7,9,1],[7,1,3,9,2,4,8,5,6],
        [9,6,1,5,3,7,2,8,4],[2,8,7,4,1,9,6,3,5],[3,4,5,2,8,6,1,7,9],
    ];

    $bands  = shuffle_array([0, 1, 2]);
    $stacks = shuffle_array([0, 1, 2]);
    $digits = shuffle_array([1, 2, 3, 4, 5, 6, 7, 8, 9]);

    $grid = [];
    for ($r = 0; $r < 9; $r++) {
        $grid[$r] = [];
        for ($c = 0; $c < 9; $c++) {
            $br = $bands[intdiv($r, 3)] * 3 + ($r % 3);
            $bc = $stacks[intdiv($c, 3)] * 3 + ($c % 3);
            $grid[$r][$c] = $digits[$canonical[$br][$bc] - 1];
        }
    }
    return $grid;
}

function create_puzzle(array $solution, int $removals): array
{
    $puzzle = $solution;
    $cells  = shuffle_array(range(0, 80));
    $removed = 0;

    foreach ($cells as $idx) {
        if ($removed >= $removals) break;
        $r = intdiv($idx, 9);
        $c = $idx % 9;
        $puzzle[$r][$c] = 0;
        $removed++;
    }
    return $puzzle;
}

function generate_sudoku(string $difficulty = 'medium'): array
{
    $removals = match ($difficulty) {
        'easy'   => 36,
        'medium' => 46,
        'hard'   => 52,
        'expert' => 58,
        default  => 46,
    };

    $solution = generate_solved_grid();
    $puzzle   = create_puzzle($solution, $removals);

    return ['puzzle' => $puzzle, 'solution' => $solution];
}

// ─── Rating calculation (simplified Elo) ─────────────────────────────────────
// Reward fast, mistake-free completions with rating gains.
function calculate_rating_delta(
    int $currentRating,
    string $difficulty,
    int $timeSeconds,
    int $mistakes,
    bool $isDaily
): int {
    // Base reward by difficulty
    $base = match ($difficulty) {
        'easy'   =>  8,
        'medium' => 16,
        'hard'   => 28,
        'expert' => 45,
        default  => 16,
    };

    // Time bonus: faster = more points (benchmark per difficulty)
    $benchmarks = ['easy' => 300, 'medium' => 480, 'hard' => 720, 'expert' => 1200];
    $benchmark  = $benchmarks[$difficulty] ?? 480;
    $timeFactor = max(0.5, min(2.0, $benchmark / max($timeSeconds, 30)));

    // Mistake penalty
    $mistakeFactor = max(0.2, 1.0 - ($mistakes * 0.15));

    // Daily bonus
    $dailyBonus = $isDaily ? 5 : 0;

    $delta = (int) round($base * $timeFactor * $mistakeFactor) + $dailyBonus;

    // Rating floor: never drop below 800
    if ($currentRating <= 800 && $delta < 0) return 0;

    return max(1, $delta); // always at least +1 for a completion
}

// ─── Streak update ────────────────────────────────────────────────────────────
function update_streak(array $stats, string $today): array
{
    $yesterday = date('Y-m-d', strtotime('-1 day', strtotime($today)));

    $streak = $stats['current_streak'] ?? 0;

    if ($stats['last_played_date'] === $yesterday) {
        $streak += 1;
    } elseif ($stats['last_played_date'] !== $today) {
        $streak = 1;
    }
    // If last_played_date === today, keep streak as-is (multiple games same day)

    return [
        'current_streak' => $streak,
        'longest_streak' => max($stats['longest_streak'] ?? 0, $streak),
    ];
}

// ─── Achievement checker ──────────────────────────────────────────────────────
// Returns list of newly unlocked achievement IDs.
function check_achievements(array $stats, array $alreadyUnlocked): array
{
    $new = [];

    $check = function (string $id, bool $condition) use ($stats, $alreadyUnlocked, &$new): void {
        if ($condition && !in_array($id, $alreadyUnlocked, true)) {
            $new[] = $id;
        }
    };

    $check('first_win',   $stats['games_won'] >= 1);
    $check('plays_10',    $stats['games_played'] >= 10);
    $check('plays_50',    $stats['games_played'] >= 50);
    $check('plays_100',   $stats['games_played'] >= 100);
    $check('streak_3',    $stats['current_streak'] >= 3);
    $check('streak_7',    $stats['current_streak'] >= 7);
    $check('streak_30',   $stats['current_streak'] >= 30);
    $check('speed_3min',  isset($stats['best_time']) && $stats['best_time'] <= 180);
    $check('speed_2min',  isset($stats['best_time']) && $stats['best_time'] <= 120);
    $check('expert_win',  ($stats['wins_expert'] ?? 0) >= 1);
    $check('rating_1200', ($stats['rating'] ?? 1000) >= 1200);
    $check('rating_1500', ($stats['rating'] ?? 1000) >= 1500);
    $check('rating_2000', ($stats['rating'] ?? 1000) >= 2000);

    $allDiff = ($stats['wins_easy']   ?? 0) >= 1
            && ($stats['wins_medium'] ?? 0) >= 1
            && ($stats['wins_hard']   ?? 0) >= 1
            && ($stats['wins_expert'] ?? 0) >= 1;
    $check('all_diff', $allDiff);

    return $new;
}