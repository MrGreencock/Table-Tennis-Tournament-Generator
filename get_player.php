<?php
require 'db.php';

try {
    // Lekérjük az összes játékost
    $stmt = $pdo->prepare('SELECT id, name FROM players');
    $stmt->execute();
    $players = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Visszaadjuk a játékosokat JSON formátumban
    echo json_encode(['status' => 'success', 'players' => $players]);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
