<?php
$host = "localhost";
$db = "neuroku";
$user = "root";
$pass = "";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
  die("DB connection failed");
}
?>