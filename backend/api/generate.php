<?php
header("Content-Type: application/json");

$difficulty = $_GET['difficulty'] ?? 'medium';

function generateSudoku($difficulty) {
    // можно вставить simplified PHP generator
    return [
        "puzzle" => [],
        "solution" => []
    ];
}

echo json_encode(generateSudoku($difficulty));
?>