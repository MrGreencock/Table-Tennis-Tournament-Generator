<?php
require 'db.php';

$tournament_id = $_GET['tournament_id'];

// Meccsek lekérdezése
$matchesQuery = $pdo->prepare("
    SELECT m.id, p1.name as player1, p2.name as player2, m.status, m.player1_score, m.player2_score
    FROM matches m
    JOIN players p1 ON m.player1_id = p1.id
    JOIN players p2 ON m.player2_id = p2.id
    WHERE m.tournament_id = :tournament_id
");
$matchesQuery->execute(['tournament_id' => $tournament_id]);
$matches = $matchesQuery->fetchAll(PDO::FETCH_ASSOC);

// Tabella adatok lekérdezése
$query = $pdo->prepare("
    SELECT p.name, 
           -- Győzelmek számítása mindkét játékosra
           SUM(CASE 
                   WHEN m.player1_id = p.id AND m.player1_score > m.player2_score THEN 1
                   WHEN m.player2_id = p.id AND m.player2_score > m.player1_score THEN 1
                   ELSE 0 
               END) AS wins,
           -- Vereségek számítása mindkét játékosra
           SUM(CASE 
                   WHEN m.player1_id = p.id AND m.player1_score < m.player2_score THEN 1
                   WHEN m.player2_id = p.id AND m.player2_score < m.player1_score THEN 1
                   ELSE 0 
               END) AS losses,
           -- Nyert szettek
           SUM(CASE 
                   WHEN m.player1_id = p.id THEN m.player1_score 
                   ELSE m.player2_score 
               END) AS setsWon,
           -- Vesztett szettek
           SUM(CASE 
                   WHEN m.player1_id = p.id THEN m.player2_score 
                   ELSE m.player1_score 
               END) AS setsLost,
           -- Szettkülönbség
           (SUM(CASE WHEN m.player1_id = p.id THEN m.player1_score ELSE 0 END) -
            SUM(CASE WHEN m.player1_id = p.id THEN m.player2_score ELSE 0 END)) +
           (SUM(CASE WHEN m.player2_id = p.id THEN m.player2_score ELSE 0 END) -
            SUM(CASE WHEN m.player2_id = p.id THEN m.player1_score ELSE 0 END)) AS setDifference,
           -- Pontok
           SUM(CASE 
                   WHEN (m.player1_id = p.id AND m.player1_score > m.player2_score) OR 
                        (m.player2_id = p.id AND m.player2_score > m.player1_score) 
                   THEN 2 
                   ELSE 0 
               END) AS points
    FROM players p
    LEFT JOIN matches m ON p.id IN (m.player1_id, m.player2_id)
    WHERE m.tournament_id = :tournament_id
    GROUP BY p.id
");
$query->execute(['tournament_id' => $tournament_id]);
$scores = $query->fetchAll(PDO::FETCH_ASSOC);



// Eredmények visszaküldése
echo json_encode(['matches' => $matches, 'scores' => $scores]);
?>
