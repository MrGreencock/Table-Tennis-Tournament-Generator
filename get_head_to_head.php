<?php
require 'db.php';

$tournamentId = $_GET['tournament_id'];

$stmt = $pdo->prepare("
    SELECT player1_id, player2_id, SUM(CASE WHEN winner = 'player1' THEN 1 ELSE 0 END) AS player1_wins, SUM(CASE WHEN winner = 'player2' THEN 1 ELSE 0 END) AS player2_wins
    FROM matches
    WHERE tournament_id = :tournamentId
    GROUP BY player1_id, player2_id
");
$stmt->execute(['tournamentId' => $tournamentId]);
$results = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(['status' => 'success', 'data' => $results]);
?>
