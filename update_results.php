<?php
require 'db.php';  // Kapcsolódás az adatbázishoz

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    // Meccs indítása
    if (isset($_POST['start_match']) && $_POST['start_match'] === 'true') {
        $match_id = $_POST['match_id'];

        // Frissítjük a meccs státuszát "elindult" (1) állapotra
        $stmt = $pdo->prepare('UPDATE matches SET status = 1 WHERE id = ?');
        $success = $stmt->execute([$match_id]);

        if ($success) {
            echo json_encode(['status' => 'success', 'message' => 'A meccs elindult']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Nem sikerült elindítani a meccset']);
        }
        exit;
    }

    // Meccs befejezése
    if (isset($_POST['match_id'], $_POST['player1_score'], $_POST['player2_score'])) {
        $match_id = $_POST['match_id'];
        $player1_score = $_POST['player1_score'];
        $player2_score = $_POST['player2_score'];

        // Ellenőrizzük, hogy a pontszámok érvényesek-e
        if (!is_numeric($player1_score) || !is_numeric($player2_score)) {
            echo json_encode(['status' => 'error', 'message' => 'Érvénytelen pontszámok']);
            exit;
        }

        // Lekérjük a meccshez tartozó torna adatait (set_mode és sets)
        $stmt = $pdo->prepare('SELECT t.set_mode, t.sets_to_win FROM tournaments t JOIN matches m ON t.id = m.tournament_id WHERE m.id = ?');
        $stmt->execute([$match_id]);
        $tournament = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$tournament) {
            echo json_encode(['status' => 'error', 'message' => 'Nem található a meccshez tartozó bajnokság']);
            exit;
        }

        $set_mode = $tournament['set_mode'];
        $required_sets = $tournament['sets_to_win'];

        $is_valid = false;

        // Nyert szettek alapján történő validálás (set_mode = 0)
        if ($set_mode == 0) {
            if (($player1_score == $required_sets && $player2_score < $required_sets) || 
                ($player2_score == $required_sets && $player1_score < $required_sets)) {
                $is_valid = true;
            }
        }

        // Lejátszott szettek alapján történő validálás (set_mode = 1)
        if ($set_mode == 1) {
            if ($player1_score + $player2_score == $required_sets) {
                $is_valid = true;
            }
        }

        if (!$is_valid) {
            echo json_encode(['status' => 'error', 'message' => 'Az eredmény nem érvényes a kiválasztott szabály alapján. Kérjük, ellenőrizze a bevitt adatokat.']);
            exit;
        }

        // Meccs eredményének és státuszának frissítése (státusz: befejezett = 2)
        $winner = null;
        if ($set_mode == 0) {
            if ($player1_score == $required_sets && $player2_score < $required_sets) {
                $winner = 'player1';
            } elseif ($player2_score == $required_sets && $player1_score < $required_sets) {
                $winner = 'player2';
            }
        } elseif ($set_mode == 1 && ($player1_score + $player2_score == $required_sets)) {
            $winner = ($player1_score > $player2_score) ? 'player1' : 'player2';
        }

        $stmt = $pdo->prepare('UPDATE matches SET player1_score = ?, player2_score = ?, winner = ?, status = 2 WHERE id = ?');
        $success = $stmt->execute([$player1_score, $player2_score, $winner, $match_id]);

        if ($success) {
            $stmt = $pdo->prepare('SELECT tournament_id FROM matches WHERE id = ?');
            $stmt->execute([$match_id]);
            $tournament = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($tournament) {
                echo json_encode(['status' => 'success', 'tournament_id' => $tournament['tournament_id']]);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Nem található bajnokság a megadott meccs ID alapján']);
            }
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Nem sikerült frissíteni az eredményt']);
        }
        exit;
    }

    echo json_encode(['status' => 'error', 'message' => 'Hibás kérés']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Érvénytelen kérés']);
}
?>
