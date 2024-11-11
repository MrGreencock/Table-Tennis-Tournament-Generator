let startedMatches = [];
let headToHeadData = [];

function startMatch(match_id) {
    const matchElement = document.querySelector(`.match-item[data-match-id="${match_id}"]`);
    const startButton = matchElement.querySelector('.start-button');
    const inputFields = matchElement.querySelector('.input-fields');

    // Ellenőrizzük, hogy az inputFields elem létezik-e
    if (inputFields) {
        startButton.style.display = 'none';  // Elrejtjük az indító gombot
        inputFields.style.display = 'block'; // Megjelenítjük az input mezőket
        matchElement.classList.add('active'); // Aktív állapot piros háttérrel

        // AJAX kéréssel elküldjük a státusz frissítést a szerverre
        fetch('update_results.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `start_match=true&match_id=${match_id}&tournament_id=${tournament_id}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                console.log('Meccs státusza sikeresen frissítve.');
                loadMatchesAndScores(tournament_id); // Meccsek újratöltése
            } else {
                console.error('Hiba történt a meccs indításakor:', data.message);
            }
        })
        .catch(error => console.error('Hiba a meccs indításakor:', error));
    } else {
        console.error('Nem található az input mező a match-item-ben.');
    }
}

function loadHeadToHeadData(tournamentId) {
    return fetch(`get_head_to_head.php?tournament_id=${tournamentId}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                headToHeadData = data.data;
                console.log("Head-to-head data loaded:", headToHeadData); // Ellenőrzéshez
            } else {
                console.error("Failed to load head-to-head data:", data.message);
            }
        })
        .catch(error => console.error("Error fetching head-to-head data:", error));
}


function prioritizeFreeMatches() {
    const matchItems = document.querySelectorAll('.match-item');
    let playedCount = {};  // Objektum a játékosok által játszott meccsek számának követésére
    let inProgressMatches = [];
    let freeMatches = [];
    let notReadyMatches = [];
    let completedMatches = [];
    let totalCompletedMatches = 0;  // Teljesen befejezett meccsek száma

    // Számoljuk meg, hogy minden játékos hány meccset játszott már
    matchItems.forEach(match => {
        const backgroundColor = window.getComputedStyle(match).backgroundColor;
        const player1 = match.getAttribute('data-player1');
        const player2 = match.getAttribute('data-player2');

        if (backgroundColor === 'rgb(255, 0, 0)') {  // Piros háttér - folyamatban lévő meccs
            inProgressMatches.push(match);  // Folyamatban lévő meccsek mentése
        }

        if (backgroundColor === 'rgb(0, 128, 0)') { // Zöld háttér - befejezett meccs
            playedCount[player1] = (playedCount[player1] || 0) + 1;
            playedCount[player2] = (playedCount[player2] || 0) + 1;
            completedMatches.push(match);  // Befejezett meccsek mentése
            totalCompletedMatches++;  // Növeljük a teljes befejezett meccsek számát
        }
    });

    // Ha még nem játszottak egy meccset sem, ne változtassunk semmit
    if (totalCompletedMatches === 0) {
        console.log('Első fordulóban nem változik a sorrend.');
        return;  // Az első fordulóban nincs szükség a sorrend módosítására
    }

    // Szabad meccsek kiszűrése, ahol mindkét játékos nem játszik folyamatban lévő meccset
    matchItems.forEach(match => {
        const backgroundColor = window.getComputedStyle(match).backgroundColor;
        const player1 = match.getAttribute('data-player1');
        const player2 = match.getAttribute('data-player2');

        if (backgroundColor !== 'rgb(255, 0, 0)' && backgroundColor !== 'rgb(0, 128, 0)') { // Szabad és nem befejezett meccsek
            if (!inProgressMatches.find(m => m.getAttribute('data-player1') === player1 || m.getAttribute('data-player2') === player1 ||
                m.getAttribute('data-player1') === player2 || m.getAttribute('data-player2') === player2)) {
                // Ha egyik játékos sem játszik folyamatban lévő meccset
                freeMatches.push(match);
                match.style.backgroundColor = 'yellow';  // Szabad meccsek sárga háttérrel
            } else {
                // Az egyik vagy mindkét játékos játszik, nem szabad
                notReadyMatches.push(match);
            }
        }
    });

    const matchList = document.getElementById('matchList');

    // Folyamatban lévő meccsek előre helyezése
    inProgressMatches.forEach(match => {
        matchList.insertBefore(match, matchList.firstChild);
    });

    // Szabad meccsek (ahol mindkét játékos szabad) következnek
    freeMatches.forEach(match => {
        matchList.insertBefore(match, matchList.firstChild);
    });

    // Nem szabad meccsek (ahol legalább egy játékos játszik) következnek
    notReadyMatches.forEach(match => {
        matchList.appendChild(match);
    });

    // Végül a befejezett meccsek kerülnek a lista végére
    completedMatches.forEach(match => {
        matchList.appendChild(match);
    });

    console.log('Készen álló szabad meccsek előre helyezve, befejezett meccsek hátrasorolva.');
}


function submitResult(match_id) {
    const player1Score = document.querySelector(`input.player1Score[data-match-id="${match_id}"]`).value;
    const player2Score = document.querySelector(`input.player2Score[data-match-id="${match_id}"]`).value;

    console.log(`Beküldés: match_id=${match_id}, player1_score=${player1Score}, player2_score=${player2Score}`);

    fetch('update_results.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `match_id=${match_id}&player1_score=${player1Score}&player2_score=${player2Score}&status=2`
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            console.log('Eredmény sikeresen frissítve.');

            // Head-to-head adatok újratöltése a legfrissebb eredményekhez
            loadHeadToHeadData(tournament_id).then(() => {
                loadMatchesAndScores(tournament_id);  // Meccsek és eredmények újratöltése
            });
        } else {
            console.error('Hiba történt az eredmény frissítésekor:', data.message);
            alert('Hiba történt: ' + data.message);
        }
    })
    .catch(error => console.error('Fetch hiba:', error));
}




function displayMatches(matches) {
    document.getElementById("tournamentSetup").style.display = 'none';
    const matchList = document.getElementById('matchList');
    const matchesSection = document.getElementById('matchesSection');
    matchList.innerHTML = '';  

    // Ellenőrizzük, hogy van-e befejezett meccs
    const hasCompletedMatches = matches.some(match => match.status === 2);

    // Ha nincs befejezett meccs, az első forduló van, tehát ID szerint rendezzük
    if (!hasCompletedMatches) {
        matches.sort((a, b) => a.id - b.id);  // Első fordulóban ID alapján rendezés
    }

    if (matches.length > 0) {
        matchesSection.style.display = 'block';  

        matches.forEach(match => {
            const matchElement = document.createElement('div');
            matchElement.classList.add('match-item');
            matchElement.setAttribute('data-match-id', match.id);
            matchElement.setAttribute('data-player1', match.player1);
            matchElement.setAttribute('data-player2', match.player2);

            if (match.status === 0) {
                // Meccs még nem kezdődött el
                matchElement.innerHTML = `
                    <h3>${match.player1} vs ${match.player2}</h3>
                    <button class="start-button" onclick="startMatch(${match.id})">Meccs indítása</button>
                    <div class="input-fields" style="display: none;">
                        <input type="number" class="player1Score" data-match-id="${match.id}" placeholder="${match.player1} pontszáma" min="0">
                        <input type="number" class="player2Score" data-match-id="${match.id}" placeholder="${match.player2} pontszáma" min="0">
                        <button onclick="submitResult(${match.id})">Eredmény rögzítése</button>
                    </div>
                `;
            } else if (match.status === 1) {
                // Meccs elindult, de még nem fejeződött be
                matchElement.innerHTML = `
                    <h3>${match.player1} vs ${match.player2}</h3>
                    <div class="input-fields" style="display: block;">
                        <input type="number" class="player1Score" data-match-id="${match.id}" placeholder="${match.player1} pontszáma" min="0">
                        <input type="number" class="player2Score" data-match-id="${match.id}" placeholder="${match.player2} pontszáma" min="0">
                        <button onclick="submitResult(${match.id})">Eredmény rögzítése</button>
                    </div>
                `;
                matchElement.style.backgroundColor = 'red';  // Folyamatban lévő meccsek piros háttérrel
            } else if (match.status === 2) {
                matchElement.innerHTML = `
                    <h3>${match.player1} vs ${match.player2} - Eredmény: ${match.player1_score} - ${match.player2_score}</h3>
                    <button class="start-button" onclick="startMatch(${match.id})">Eredmény módosítása</button>
                    <div class="input-fields" style="display: none;">
                        <input type="number" class="player1Score" data-match-id="${match.id}" placeholder="${match.player1} pontszáma" min="0">
                        <input type="number" class="player2Score" data-match-id="${match.id}" placeholder="${match.player2} pontszáma" min="0">
                        <button onclick="submitResult(${match.id})">Eredmény rögzítése</button>
                    </div>
                `;
                matchElement.style.backgroundColor = 'green';  // Befejezett meccsek zöld színnel
            }

            matchList.appendChild(matchElement);  
        });

        // Csak akkor rendezzük újra a meccseket prioritás szerint, ha van befejezett meccs
        if (hasCompletedMatches) {
            prioritizeFreeMatches();  
        }
    } else {
        matchesSection.style.display = 'none'; 
    }
}

function displayScores(scores) {
    console.log("displayScores függvény fut, adatok:", scores);
    const scoreTableBody = document.getElementById('scoreTableBody');
    const scoreSection = document.getElementById('scoreSection');

    if (!scoreTableBody) {
        console.error("A scoreTableBody elem nem található.");
        return;
    }

    scoreTableBody.innerHTML = '';  

    if (scores.length > 0) {
        scoreSection.style.display = 'block';
        scores.forEach(score => console.log(score.id)); 
        // Rendezzük a scores tömböt a pontok, az egymás elleni eredmények, majd a szettkülönbség alapján
        scores.sort((a, b) => {
            const aPoints = parseInt(a.points) || 0;
            const bPoints = parseInt(b.points) || 0;

            if (aPoints !== bPoints) return bPoints - aPoints;

            // Egymás elleni eredmények összehasonlítása az ID-k alapján
            const headToHeadResult = getHeadToHeadResult(a.id, b.id);
            if (headToHeadResult !== 0) return headToHeadResult;

            // Szettkülönbség összehasonlítása, ha az előzők alapján egyenlő
            const aSetDiff = parseInt(a.setDifference) || 0;
            const bSetDiff = parseInt(b.setDifference) || 0;
            return bSetDiff - aSetDiff;
        });

        // A rendezett scores tömb feltöltése a táblába
        scores.forEach(score => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${score.name}</td>
                <td>${score.wins || 0}</td>
                <td>${score.losses || 0}</td>
                <td>${score.setsWon || 0}</td>
                <td>${score.setsLost || 0}</td>
                <td>${score.setDifference || 0}</td>
                <td>${score.points || 0}</td>
            `;
            scoreTableBody.appendChild(row);
        });
    } else {
        scoreSection.style.display = 'none';  
    }
}



// Az egymás elleni eredmény ellenőrzése az azonosítók alapján
function getHeadToHeadResult(playerAId, playerBId) {
    const match = headToHeadData.find(
        m => (m.player1_id == playerAId && m.player2_id == playerBId) ||
             (m.player1_id == playerBId && m.player2_id == playerAId)
    );

    console.log(`Egymás elleni eredmény keresése: ${playerAId} vs ${playerBId}`, match);

    if (match) {
        const playerAWins = (match.player1_id == playerAId) ? match.player1_wins : match.player2_wins;
        const playerBWins = (match.player1_id == playerBId) ? match.player1_wins : match.player2_wins;

        console.log(`Egymás elleni eredmény: ${playerAId} nyert: ${playerAWins}, ${playerBId} nyert: ${playerBWins}`);

        if (playerAWins > playerBWins) return -1;
        else if (playerBWins > playerAWins) return 1;
    }
    return 0;
}


function loadMatchesAndScores(tournament_id) {
    fetch(`https://dvdantikvar.hu/table_tennis/get_matches_and_scores.php?tournament_id=${tournament_id}`)
        .then(response => response.json())
        .then(data => {
            console.log("Kapott adatok:", data);  // Ellenőrizd, hogy mi jön vissza a szervertől

            if (!data.matches || !data.scores) {
                console.error("Hiba: Az adatok hiányosak vagy rosszul vannak megadva");
            } else {
                displayMatches(data.matches);
                displayScores(data.scores);  
            }
        })
        .catch(error => console.error('Hiba a meccsek és tabella betöltése közben:', error));
}



let tournament_id = null; 

document.getElementById('tournamentSetup').addEventListener('submit', function(event) {
    event.preventDefault();

    const sets = document.getElementById('sets').value;
    const matches = document.getElementById('matches').value;
    const setMode = document.querySelector('input[name="setMode"]:checked').value;

    const selectedPlayers = [];
    document.querySelectorAll('input[name="players"]:checked').forEach(playerCheckbox => {
        selectedPlayers.push(playerCheckbox.value);
    });

    if (selectedPlayers.length < 2) {
        alert('Legalább 2 játékost ki kell választani a torna elindításához.');
        return;
    }

    if(selectedPlayers.length % 2 === 1) {
        selectedPlayers.push('bye');
    }

    console.log(`Beküldés: sets=${sets}, matches=${matches}, setMode=${setMode}, players=${selectedPlayers}`);

    fetch('tournament.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `sets=${sets}&matches=${matches}&setMode=${setMode}&players=${selectedPlayers.join(',')}`
    })
    .then(response => response.json())
    .then(data => {
      if (data.status === 'success') {
          tournament_id = data.tournament_id;
          loadHeadToHeadData(tournament_id).then(() => {
              loadMatchesAndScores(tournament_id);
          });
      } else {
          console.error('Hiba a torna létrehozásakor:', data.message);
          alert('Hiba történt a bajnokság létrehozásakor: ' + data.message);
      }
    })
    .catch(error => console.error('Hiba:', error));
});

document.addEventListener('DOMContentLoaded', function() {
    loadPlayers();
});

document.querySelector('form').addEventListener('submit', function(event) {
    event.preventDefault();  // Ne töltődjön újra az oldal
});

let playersList = []; 

function loadPlayers() {
    fetch('get_player.php')
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            const playersListElement = document.getElementById('playersList');
            playersListElement.innerHTML = ''; 

            // Töröljük és feltöltjük a playersList tömböt
            playersList = data.players.map(player => player.name);  // Felvesszük a játékos neveket

            data.players.forEach(player => {
                const playerElement = document.createElement('div');
                playerElement.innerHTML = `
                    <input type="checkbox" id="player${player.id}" name="players" value="${player.id}">
                    <label for="player${player.id}">${player.name}</label>
                `;
                playersListElement.appendChild(playerElement);
            });
        } else {
            alert('Hiba történt a játékosok betöltésekor: ' + data.message);
        }
    })
    .catch(error => console.error('Hiba a játékosok lekérése közben:', error));
}
