<?php
header("Content-Type: application/json");

$date = date("Y-m-d");

echo json_encode([
  "date" => $date,
  "puzzle" => [],
  "difficulty" => "medium"
]);
?>