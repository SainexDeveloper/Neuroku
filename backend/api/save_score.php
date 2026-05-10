<?php
include "../config/db.php";

$data = json_decode(file_get_contents("php://input"), true);

$user = $data["user"];
$time = $data["time"];
$errors = $data["errors"];

$stmt = $conn->prepare("INSERT INTO scores (user, time, errors) VALUES (?, ?, ?)");
$stmt->bind_param("sii", $user, $time, $errors);
$stmt->execute();

echo json_encode(["status"=>"ok"]);
?>