<?php
include "../config/db.php";

$result = $conn->query("
  SELECT user, time, errors
  FROM scores
  ORDER BY time ASC
  LIMIT 10
");

$data = [];
while ($row = $result->fetch_assoc()) {
  $data[] = $row;
}

echo json_encode($data);
?>