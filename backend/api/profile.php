<?php
// ─── Neuroku — Profile API ────────────────────────────────────────────────────
// GET  /api/profile.php?user_id=X         — public profile
// GET  /api/profile.php?action=me         — own full profile (auth)
// PUT  /api/profile.php?action=update     — update own profile (auth)
// GET  /api/profile.php?action=calendar   — activity calendar heatmap (auth)
// GET  /api/profile.php?action=history    — game history (auth)

declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/jwt.php';
require_once __DIR__ . '/../utils/helpers.php';

init_request();

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

match (true) {
    $method === 'GET'  && isset($_GET['user_id']) => handle_public_profile((int)$_GET['user_id']),
    $method === 'GET'  && $action === 'me'        => handle_me(),
    $method === 'PUT'  && $action === 'update'    => handle_update(),
    $method === 'GET'  && $action === 'calendar'  => handle_calendar(),
    $method === 'GET'  && $action === 'history'   => handle_history(),
    default => fail('Unknown action', 404),
};

// ─── Public profile ───────────────────────────────────────────────────────────
function handle_public_profile(int $userId): never
{
    $user = DB::row(
        'SELECT
           u.id, u.username, u.avatar_color, u.avatar_initials, u.bio, u.country, u.city,
           u.created_at,
           s.games_played, s.games_won, s.best_time, s.best_time_difficulty,
           s.current_streak, s.longest_streak, s.rating,
           s.wins_easy, s.wins_medium, s.wins_hard, s.wins_expert
         FROM users u
         LEFT JOIN user_stats s ON s.user_id = u.id
         WHERE u.id = ?',
        [$userId]
    );

    if (!$user) fail('User not found', 404);

    $achievements = DB::rows(
        'SELECT a.id, a.title, a.description, a.icon, a.category, ua.unlocked_at
         FROM user_achievements ua
         JOIN achievements a ON a.id = ua.achievement_id
         WHERE ua.user_id = ?
         ORDER BY ua.unlocked_at DESC',
        [$userId]
    );

    // Recent scores (last 10)
    $recentScores = DB::rows(
        'SELECT difficulty, completion_time, mistakes, is_daily, completed_at
         FROM scores
         WHERE user_id = ?
         ORDER BY completed_at DESC
         LIMIT 10',
        [$userId]
    );

    // Rating rank
    $rankRow = DB::row(
        'SELECT COUNT(*) + 1 AS `rank`
         FROM user_stats
         WHERE rating > (SELECT rating FROM user_stats WHERE user_id = ?)',
        [$userId]
    );

    ok([
        'user'         => $user,
        'achievements' => $achievements,
        'recent_games' => $recentScores,
        'global_rank'  => $rankRow ? (int)$rankRow['rank'] : null,
    ]);
}

// ─── Own full profile (authenticated) ────────────────────────────────────────
function handle_me(): never
{
    $payload = require_auth();
    $userId  = (int)$payload['sub'];
    handle_public_profile($userId); // same data, but includes email
}

// ─── Update profile ───────────────────────────────────────────────────────────
function handle_update(): never
{
    $payload = require_auth();
    $userId  = (int)$payload['sub'];
    $data    = get_json();

    $allowed = [];

    if (isset($data['username'])) {
        $username = sanitize_string($data['username'], 32);
        if (!preg_match('/^[a-zA-Z0-9_]{3,32}$/', $username)) {
            fail('Username must be 3–32 chars, letters/digits/underscores only');
        }
        $existing = DB::row('SELECT id FROM users WHERE username = ? AND id != ?', [$username, $userId]);
        if ($existing) fail('Username already taken', 409);
        $allowed['username'] = $username;

        // Update avatar initials too
        $allowed['avatar_initials'] = strtoupper(substr($username, 0, 1))
                                    . strtoupper(substr($username, -1));
    }

    if (isset($data['bio'])) {
        $allowed['bio'] = sanitize_string($data['bio'], 160);
    }
    if (isset($data['country'])) {
        $allowed['country'] = sanitize_string($data['country'], 64);
    }
    if (isset($data['city'])) {
        $allowed['city'] = sanitize_string($data['city'], 64);
    }
    if (isset($data['avatar_color'])) {
        $color = $data['avatar_color'];
        if (preg_match('/^#[0-9a-fA-F]{6}$/', $color)) {
            $allowed['avatar_color'] = $color;
        }
    }

    // Password change
    if (isset($data['new_password']) && isset($data['current_password'])) {
        $row = DB::row('SELECT password_hash FROM users WHERE id = ?', [$userId]);
        if (!password_verify($data['current_password'], $row['password_hash'])) {
            fail('Current password is incorrect', 401);
        }
        if (strlen($data['new_password']) < 8) {
            fail('New password must be at least 8 characters');
        }
        $allowed['password_hash'] = password_hash($data['new_password'], PASSWORD_BCRYPT, ['cost' => BCRYPT_COST]);
    }

    if (empty($allowed)) fail('Nothing to update');

    $sets   = implode(', ', array_map(fn($k) => "$k = ?", array_keys($allowed)));
    $values = array_values($allowed);
    $values[] = $userId;

    DB::execute("UPDATE users SET $sets WHERE id = ?", $values);

    ok(['message' => 'Profile updated', 'updated' => array_keys($allowed)]);
}

// ─── Activity calendar heatmap ────────────────────────────────────────────────
// Returns 365 days of activity for the heatmap.
function handle_calendar(): never
{
    $payload  = require_auth();
    $userId   = (int)$payload['sub'];
    $months   = max(1, min(24, (int)($_GET['months'] ?? 12)));

    $since = date('Y-m-d', strtotime("-{$months} months"));

    $rows = DB::rows(
        'SELECT
           activity_date,
           games_played,
           games_won,
           best_time,
           daily_done
         FROM activity_calendar
         WHERE user_id = ? AND activity_date >= ?
         ORDER BY activity_date ASC',
        [$userId, $since]
    );

    // Build a map for quick lookup
    $map = [];
    foreach ($rows as $r) {
        $map[$r['activity_date']] = $r;
    }

    // Fill every day in range (null = inactive)
    $calendar = [];
    $cursor   = new DateTime($since);
    $end      = new DateTime('today');

    while ($cursor <= $end) {
        $d = $cursor->format('Y-m-d');
        $calendar[] = $map[$d] ?? ['activity_date' => $d, 'games_played' => 0, 'games_won' => 0, 'best_time' => null, 'daily_done' => 0];
        $cursor->modify('+1 day');
    }

    // Streak stats
    $stats = DB::row(
        'SELECT current_streak, longest_streak, last_played_date FROM user_stats WHERE user_id = ?',
        [$userId]
    );

    ok([
        'calendar'       => $calendar,
        'current_streak' => (int)($stats['current_streak'] ?? 0),
        'longest_streak' => (int)($stats['longest_streak'] ?? 0),
        'last_played'    => $stats['last_played_date'] ?? null,
        'total_active_days' => count($rows),
    ]);
}

// ─── Game history (paginated) ─────────────────────────────────────────────────
function handle_history(): never
{
    $payload = require_auth();
    $userId  = (int)$payload['sub'];
    $page    = max(1, (int)($_GET['page'] ?? 1));
    $limit   = min(50, max(5, (int)($_GET['limit'] ?? 20)));
    $offset  = ($page - 1) * $limit;

    $scores = DB::rows(
        'SELECT
           id, difficulty, completion_time, mistakes, hints_used,
           is_daily, completed_at
         FROM scores
         WHERE user_id = ?
         ORDER BY completed_at DESC
         LIMIT ? OFFSET ?',
        [$userId, $limit, $offset]
    );

    $total = (int)(DB::row(
        'SELECT COUNT(*) AS cnt FROM scores WHERE user_id = ?',
        [$userId]
    )['cnt'] ?? 0);

    // Format time
    $scores = array_map(function ($s) {
        $s['time_formatted'] = sprintf('%02d:%02d',
            intdiv((int)$s['completion_time'], 60),
            (int)$s['completion_time'] % 60
        );
        return $s;
    }, $scores);

    ok(['scores' => $scores, 'total' => $total, 'page' => $page]);
}