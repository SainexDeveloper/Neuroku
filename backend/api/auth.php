<?php
// ─── Neuroku — Auth API ───────────────────────────────────────────────────────
// POST /api/auth.php?action=register
// POST /api/auth.php?action=login
// POST /api/auth.php?action=refresh
// POST /api/auth.php?action=logout
// GET  /api/auth.php?action=me

declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/jwt.php';
require_once __DIR__ . '/../utils/helpers.php';

init_request();

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

match (true) {
    $action === 'register' && $method === 'POST' => handle_register(),
    $action === 'login'    && $method === 'POST' => handle_login(),
    $action === 'refresh'  && $method === 'POST' => handle_refresh(),
    $action === 'logout'   && $method === 'POST' => handle_logout(),
    $action === 'me'       && $method === 'GET'  => handle_me(),
    default => fail('Unknown action', 404),
};

// ─── Register ─────────────────────────────────────────────────────────────────
function handle_register(): never
{
    $data = get_json();
    require_fields($data, ['username', 'email', 'password']);

    $username = sanitize_string($data['username'], 32);
    $email    = strtolower(trim($data['email']));
    $password = $data['password'];

    // Validation
    if (!preg_match('/^[a-zA-Z0-9_]{3,32}$/', $username)) {
        fail('Username must be 3–32 characters: letters, digits, underscores only');
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        fail('Invalid email address');
    }
    if (strlen($password) < 8) {
        fail('Password must be at least 8 characters');
    }

    // Check uniqueness
    if (DB::row('SELECT id FROM users WHERE email = ?', [$email])) {
        fail('Email already registered', 409);
    }
    if (DB::row('SELECT id FROM users WHERE username = ?', [$username])) {
        fail('Username already taken', 409);
    }

    // Generate avatar
    $avatarInitials = strtoupper(substr($username, 0, 1))
                    . strtoupper(substr($username, -1));
    $colors = ['#7c6af7','#f87171','#60a5fa','#4ade80','#fbbf24','#f472b6','#a78bfa','#34d399'];
    $avatarColor = $colors[crc32($username) % count($colors)];

    DB::beginTransaction();
    try {
        $hash   = password_hash($password, PASSWORD_BCRYPT, ['cost' => BCRYPT_COST]);
        $userId = (int) DB::insert(
            'INSERT INTO users (username, email, password_hash, avatar_initials, avatar_color)
             VALUES (?, ?, ?, ?, ?)',
            [$username, $email, $hash, $avatarInitials, $avatarColor]
        );

        // Create stats row
        DB::execute(
            'INSERT INTO user_stats (user_id) VALUES (?)',
            [$userId]
        );

        DB::commit();
    } catch (\Throwable $e) {
        DB::rollback();
        fail('Registration failed. Please try again.', 500);
    }

    [$access, $refresh, $exp] = issue_tokens($userId, $username, 'user');

    ok([
        'access_token'  => $access,
        'refresh_token' => $refresh,
        'expires_in'    => JWT_ACCESS_TTL,
        'user'          => compact_user($userId),
    ], 201);
}

// ─── Login ────────────────────────────────────────────────────────────────────
function handle_login(): never
{
    $data = get_json();
    require_fields($data, ['email', 'password']);

    $email    = strtolower(trim($data['email']));
    $password = $data['password'];

    $user = DB::row(
        'SELECT id, username, password_hash, role FROM users WHERE email = ?',
        [$email]
    );

    if (!$user || !password_verify($password, $user['password_hash'])) {
        fail('Invalid email or password', 401);
    }

    [$access, $refresh] = issue_tokens((int)$user['id'], $user['username'], $user['role']);

    ok([
        'access_token'  => $access,
        'refresh_token' => $refresh,
        'expires_in'    => JWT_ACCESS_TTL,
        'user'          => compact_user((int)$user['id']),
    ]);
}

// ─── Refresh ──────────────────────────────────────────────────────────────────
function handle_refresh(): never
{
    $data = get_json();
    $raw  = $data['refresh_token'] ?? '';

    if (!$raw) fail('Missing refresh_token');

    try {
        $payload = JWT::decode($raw, JWT_REFRESH_SECRET);
    } catch (\RuntimeException $e) {
        fail($e->getMessage(), 401);
    }

    if (($payload['type'] ?? '') !== 'refresh') {
        fail('Invalid token type', 401);
    }

    $tokenHash = hash('sha256', $raw);
    $stored = DB::row(
        'SELECT id, user_id, revoked FROM refresh_tokens WHERE token_hash = ?',
        [$tokenHash]
    );

    if (!$stored || $stored['revoked']) {
        fail('Refresh token revoked or not found', 401);
    }

    // Rotate: revoke old, issue new
    DB::execute('UPDATE refresh_tokens SET revoked = 1 WHERE id = ?', [$stored['id']]);

    $userId = (int)$stored['user_id'];
    $user   = DB::row('SELECT username, role FROM users WHERE id = ?', [$userId]);

    [$access, $refresh] = issue_tokens($userId, $user['username'], $user['role']);

    ok([
        'access_token'  => $access,
        'refresh_token' => $refresh,
        'expires_in'    => JWT_ACCESS_TTL,
    ]);
}

// ─── Logout ───────────────────────────────────────────────────────────────────
function handle_logout(): never
{
    $data = get_json();
    $raw  = $data['refresh_token'] ?? '';

    if ($raw) {
        $hash = hash('sha256', $raw);
        DB::execute('UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?', [$hash]);
    }

    ok(['message' => 'Logged out']);
}

// ─── Me ───────────────────────────────────────────────────────────────────────
function handle_me(): never
{
    $payload = require_auth();
    $userId  = (int)$payload['sub'];

    $user = compact_user($userId);
    if (!$user) fail('User not found', 404);

    ok(['user' => $user]);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function issue_tokens(int $userId, string $username, string $role): array
{
    $access  = JWT::issueAccess($userId, $username, $role);
    $refresh = JWT::issueRefresh($userId);

    DB::execute(
        'INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip, user_agent)
         VALUES (?, ?, ?, ?, ?)',
        [
            $userId,
            hash('sha256', $refresh),
            date('Y-m-d H:i:s', time() + JWT_REFRESH_TTL),
            $_SERVER['REMOTE_ADDR'] ?? '',
            substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255),
        ]
    );

    return [$access, $refresh];
}

function compact_user(int $userId): ?array
{
    return DB::row(
        'SELECT
           u.id, u.username, u.email, u.avatar_color, u.avatar_initials,
           u.bio, u.country, u.city, u.role, u.created_at,
           s.games_played, s.games_won, s.best_time, s.best_time_difficulty,
           s.current_streak, s.longest_streak, s.rating,
           s.wins_easy, s.wins_medium, s.wins_hard, s.wins_expert,
           s.total_mistakes, s.total_hints
         FROM users u
         LEFT JOIN user_stats s ON s.user_id = u.id
         WHERE u.id = ?',
        [$userId]
    );
}