<?php
// ─── Neuroku — API Router ─────────────────────────────────────────────────────
// Handles clean URL routing when Apache mod_rewrite or Nginx is configured.
// Also serves as a health-check endpoint at GET /api/

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/utils/jwt.php';
require_once __DIR__ . '/utils/helpers.php';

init_request();

$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri    = rtrim($uri, '/');
$method = $_SERVER['REQUEST_METHOD'];

// Strip /backend/api prefix if present
$uri = preg_replace('#^(/backend)?/api#', '', $uri) ?: '/';

match (true) {
    // Health check
    $uri === '' || $uri === '/' => ok([
        'service' => 'Neuroku API',
        'version' => '1.0.0',
        'status'  => 'ok',
        'time'    => date('c'),
    ]),

    // Auth
    str_starts_with($uri, '/auth')          => require __DIR__ . '/api/auth.php',

    // Puzzle
    str_starts_with($uri, '/generate')      => require __DIR__ . '/api/generate.php',

    // Game
    str_starts_with($uri, '/save_score')    => require __DIR__ . '/api/save_score.php',

    // Daily
    str_starts_with($uri, '/daily')         => require __DIR__ . '/api/get_daily.php',

    // Leaderboard
    str_starts_with($uri, '/leaderboard')   => require __DIR__ . '/api/get_leaderboard.php',

    // Profile
    str_starts_with($uri, '/profile')       => require __DIR__ . '/api/profile.php',

    default => (function() {
        http_response_code(404);
        echo json_encode(['ok' => false, 'error' => 'Endpoint not found']);
        exit;
    })(),
};