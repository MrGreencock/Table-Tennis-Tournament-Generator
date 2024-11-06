<?php
require 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_POST['sets'], $_POST['matches'], $_POST['players'])) {
        echo json_encode(['status' => 'error', 'message' => 'Hiányzó paraméterek']);
        exit;
    }

    $sets = $_POST['sets'];
    $matches = $_POST['matches'];
    $set_mode = $_POST['setMode'];
    $players = explode(',', $_POST['players']);

    if (count($players) < 2) {
        echo json_encode(['status' => 'error', 'message' => 'Legalább két játékost kell kiválasztani']);
        exit;
    }

    try {
        // Torna létrehozása
        $stmt = $pdo->prepare('INSERT INTO tournaments (name, sets_to_win, matches_to_play, set_mode) VALUES (?, ?, ?, ?)');
        $stmt->execute(['Asztalitenisz Torna', $sets, $matches, $set_mode]);
        $tournament_id = $pdo->lastInsertId();

        // Round Robin első kör - minden játékos egyszer játszik mindenkivel
        $numPlayers = count($players);
        if ($numPlayers % 2 !== 0) {
            $players[] = 'bye'; // "bye" játékos hozzáadása, ha páratlan a létszám
            $numPlayers++;
        }

        // Első kör mérkőzéseinek hozzáadása
        for($max = 0; $max < $matches; $max++) {
            for ($round = 0; $round < $numPlayers - 1; $round++) {
                for ($i = 0; $i < $numPlayers / 2; $i++) {
                    $player1 = $players[$i];
                    $player2 = $players[$numPlayers - 1 - $i];

                    if ($player1 !== 'bye' && $player2 !== 'bye') { // Csak valódi meccsek hozzáadása
                        $stmt = $pdo->prepare('INSERT INTO matches (tournament_id, player1_id, player2_id) VALUES (?, ?, ?)');
                        $stmt->execute([$tournament_id, $player1, $player2]);
                    }
                }
                // Játékosok rotálása
                $lastPlayer = array_pop($players);
                array_splice($players, 1, 0, $lastPlayer);
            }
        }
        echo json_encode(['status' => 'success', 'tournament_id' => $tournament_id]);
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
}
?>
