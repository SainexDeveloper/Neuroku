<?php
// ─── Neuroku — Puzzle Generator API ──────────────────────────────────────────
// GET /api/generate.php?difficulty=easy|medium|hard|expert

declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/jwt.php';
require_once __DIR__ . '/../utils/helpers.php';

init_request();
if ($_SERVER['REQUEST_METHOD'] !== 'GET') fail('Method not allowed', 405);

$difficulty = $_GET['difficulty'] ?? 'medium';
if (!in_array($difficulty, ['easy','medium','hard','expert'], true)) {
    fail('Invalid difficulty. Use: easy, medium, hard, expert');
}

$gen      = generate_sudoku($difficulty);
$puzzleId = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
    mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff),
    mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000,
    mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
);

// Optionally persist puzzle for replay/leaderboard linking
DB::execute(
    'INSERT INTO puzzles (id, difficulty, puzzle_data, solution_data) VALUES (?, ?, ?, ?)',
    [$puzzleId, $difficulty, json_encode($gen['puzzle']), json_encode($gen['solution'])]
);

ok([
    'puzzle_id'  => $puzzleId,
    'difficulty' => $difficulty,
    'puzzle'     => $gen['puzzle'],
    'solution'   => $gen['solution'],
]);