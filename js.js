// CONFIG / PUZZLES
const puzzles = [
  { img: "img1.jpg", options: ["Museo", "Moderni toimistohotelli", "Lukio", "Kauppakoulu"], correct: 3 },
  { img: "img2.jpg", options: ["Satunnaisia numeroita", "Salainen viesti tulevaisuudesta", "Binäärikoodi", "Tietokoneen aamupäivän ajatukset"], correct: 2 },
  { img: "img3.jpg", options: ["Ihmisiä hienoissa huppareissa", "Salaliittoteoreetikoiden kokous", "Kyberturvatiimi", "Opiskelijat pelkäämässä virusta"], correct: 2 },
  { img: "img4.jpg", options: ["Myrkyllisiä marjoja", "Maapähkinät", "Kaunis käsi", "Käsittelemättömät kahvipavut"], correct: 3 },
  { img: "img5.jpg", options: ["business angel", "67", "merkonomi ala", "labubu "], correct: 0 },
  { img: "img6.jpg", options: ["Syreeni", "Mustikkapiirakka", "Saturnus", "Kaunis talo"], correct: 0 },
  { img: "img7.jpg", options: ["Suunnitelma maailmanvalloituksesta", "Tiimi, joka unohti miksi he kokoontuivat", "Opiskelijan tiimityö", "Kokous, joka olisi voinut olla sähköposti"], correct: 2 },
  { img: "img8.jpg", options: ["Liiketoimintasuunnitelma", "Romaanin luonnos", "Opiskelijan ostoslista", "Monimutkainen sudoku"], correct: 0 },
  { img: "img9.jpg", options: ["Sadepilvi, joka sataa dataa", "Pilvipalvelu", "Salainen supertietokone", "Kannettava tietokone leijumassa pilvien keskellä taivaalla"], correct: 1 },
  { img: "img10.jpg", options: ["Poika tekee verkko-ostoksia", "E-urheilija", "Raahe eSports Academy", "Hienot kuulokkeet"], correct: 2 }
];

// UI Elements
const siteHeader = document.getElementById('siteHeader');
const mainMenu = document.getElementById('mainMenu');
const playBtn = document.getElementById('playBtn');
const viewLeaderboardBtn = document.getElementById('viewLeaderboard');
const gameLayout = document.getElementById('gameLayout');
const gridOverlay = document.getElementById('gridOverlay');
const progressBadge = document.getElementById('progressBadge');
const revealedBadge = document.getElementById('revealedBadge');
const scoreBadge = document.getElementById('scoreBadge');
const choicesRow = document.getElementById('choicesRow');
const endSection = document.getElementById('endSection');
const finalScoreText = document.getElementById('finalScoreText');
const leaderboardFull = document.getElementById('leaderboardFull');
const leaderboardBody = document.getElementById('leaderboardBody');
const backFromLeaderboard = document.getElementById('backFromLeaderboard');

const MAX_REVEALS = 3;
const TRANS_MS = 520;

// GAME STATE
let currentIndex = 0;
let revealedCount = 0;
let score = 0;
let tileElements = [];
let roundLocked = false;

// UTILITY
function hideElement(el) {
  if (!el) return;
  el.style.transition = `opacity ${TRANS_MS}ms ease`;
  el.style.opacity = 0;
  setTimeout(() => {
    if (el.style.display !== "none") el.style.display = 'none';
  }, TRANS_MS);
}

function showElement(el, display = 'block') {
  if (!el) return;
  el.style.display = display;
  requestAnimationFrame(() => {
    el.style.transition = `opacity ${TRANS_MS}ms ease`;
    el.style.opacity = 1;
  });
}

// GRID & PUZZLES 
function buildGrid() {
  gridOverlay.innerHTML = '';
  tileElements = [];
  for (let i = 0; i < 16; i++) {
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.tabIndex = 0;

    const inner = document.createElement('div');
    inner.className = 'tile-inner';

    const front = document.createElement('div');
    front.className = 'tile-face tile-front';
    const coverInner = document.createElement('div');
    coverInner.className = 'cover-inner';
    front.appendChild(coverInner);

    const back = document.createElement('div');
    back.className = 'tile-face tile-back';

    inner.appendChild(front);
    inner.appendChild(back);
    tile.appendChild(inner);

    tile.addEventListener('click', () => onTileClick(tile));
    tile.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onTileClick(tile);
      }
    });

    gridOverlay.appendChild(tile);
    tileElements.push(tile);
  }
}

function loadPuzzle(i) {
  if (i < 0) i = 0;
  if (i >= puzzles.length) i = puzzles.length - 1;
  currentIndex = i;
  const p = puzzles[currentIndex];
  const backs = gridOverlay.querySelectorAll('.tile-back');

  const img = new Image();
  img.src = p.img;
  img.onload = () => {
    const tileWidth = img.width / 4;
    const tileHeight = img.height / 4;

    backs.forEach((backEl, idx) => {
      const r = Math.floor(idx / 4);
      const c = idx % 4;
      const canvas = document.createElement('canvas');
      canvas.width = tileWidth;
      canvas.height = tileHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, c * tileWidth, r * tileHeight, tileWidth, tileHeight, 0, 0, tileWidth, tileHeight);

      backEl.innerHTML = '';
      const tileImg = new Image();
      tileImg.src = canvas.toDataURL();
      tileImg.style.width = '100%';
      tileImg.style.height = '100%';
      tileImg.style.objectFit = 'cover';
      backEl.appendChild(tileImg);
    });
  };

  tileElements.forEach(t => {
    t.classList.remove('flipped', 'disabled');
    t.style.pointerEvents = 'auto';
  });

  revealedCount = 0;
  roundLocked = false;

  if (choicesRow.classList.contains('hidden')) choicesRow.classList.remove('hidden');
  showElement(choicesRow, 'flex');
  renderChoices(p.options);
  updateBadges();
}

function onTileClick(tile) {
  if (roundLocked) return;
  if (revealedCount >= MAX_REVEALS) return;
  if (tile.classList.contains('flipped')) return;

  tile.classList.add('flipped');
  revealedCount++;

  if (revealedCount >= MAX_REVEALS) {
    tileElements.forEach(t => {
      if (!t.classList.contains('flipped')) t.classList.add('disabled');
    });
  }

  updateBadges();
}

function renderChoices(options) {
  choicesRow.innerHTML = '';
  options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = opt;
    btn.disabled = false;
    btn.addEventListener('click', () => onChoiceSelected(idx, btn));
    choicesRow.appendChild(btn);
  });
}

function onChoiceSelected(selectedIdx, btn) {
  if (roundLocked) return;
  roundLocked = true;
  choicesRow.querySelectorAll('.choice-btn').forEach(b => b.disabled = true);

  const p = puzzles[currentIndex];
  const correct = (selectedIdx === p.correct);
  if (correct) score = Math.min(10, score + 1);

  setTimeout(() => alert(correct ? 'Oikein!' : 'Väärin!'), 80);
  updateBadges();

  if (currentIndex === puzzles.length - 1) {
    choicesRow.style.transition = `opacity ${TRANS_MS}ms ease`;
    choicesRow.style.opacity = 0;
    setTimeout(() => {
      choicesRow.classList.add('hidden');
      choicesRow.style.display = 'none';
      finalScoreText.textContent = `Sait ${score} / ${puzzles.length} oikein.`;
      endSection.style.display = 'block';
      endSection.style.opacity = 1;
    }, TRANS_MS);
    return;
  }

  setTimeout(() => {
    if (currentIndex < puzzles.length - 1) loadPuzzle(currentIndex + 1);
    else finishGame();
  }, TRANS_MS);
}

function updateBadges() {
  progressBadge.textContent = `Kuva: ${Math.min(currentIndex + 1, puzzles.length)} / ${puzzles.length}`;
  revealedBadge.textContent = `Paljastettu: ${revealedCount} / ${MAX_REVEALS}`;
  scoreBadge.textContent = `Pisteet: ${score}`;
}

function finishGame() {
  finalScoreText.textContent = `Sait ${score} / ${puzzles.length} oikein.`;
  endSection.style.display = 'block';
  endSection.style.opacity = 1;
}

// LEADERBOARD 
function saveResult(nickname) {
  const entry = { name: nickname, score: score, ts: Date.now() };

  firebase.database().ref('leaderboard').push(entry);

  // Reset game
  endSection.style.display = 'none';
  currentIndex = 0;
  score = 0;
  revealedCount = 0;
  roundLocked = false;
  buildGrid();
  updateBadges();

  // Show leaderboard
  renderLeaderboard();
  showStandaloneLeaderboard();
}

function renderLeaderboard() {
  leaderboardBody.innerHTML = '';

  firebase.database().ref('leaderboard').once('value', snapshot => {
    const data = snapshot.val();
    if (!data) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 2;
      td.textContent = 'Ei merkintöjä vielä.';
      tr.appendChild(td);
      leaderboardBody.appendChild(tr);
      return;
    }

    const firebaseList = Object.values(data);

    const sorted = firebaseList.sort((a, b) => (b.score - a.score) || (a.ts - b.ts));

    sorted.forEach(entry => {
      const tr = document.createElement('tr');
      const tdName = document.createElement('td');
      tdName.textContent = entry.name;
      const tdScore = document.createElement('td');
      tdScore.textContent = entry.score;
      tr.appendChild(tdName);
      tr.appendChild(tdScore);
      leaderboardBody.appendChild(tr);
    });
  });
}

// UI FUNCTIONS 
function showMainMenu() {
  siteHeader.style.display = '';
  siteHeader.style.opacity = 1;
  mainMenu.style.display = 'flex';
  mainMenu.style.opacity = 1;
  hideElement(gameLayout);
  hideElement(leaderboardFull);
}

function showGameScreen() {
  siteHeader.style.display = '';
  siteHeader.style.opacity = 1;
  hideElement(mainMenu);
  hideElement(leaderboardFull);
  showElement(gameLayout, 'flex');
}

function showStandaloneLeaderboard() {
  siteHeader.style.display = 'none';
  mainMenu.style.display = 'none';
  hideElement(gameLayout);
  leaderboardFull.style.display = 'flex';
  leaderboardFull.style.opacity = 0;
  requestAnimationFrame(() => {
    leaderboardFull.style.transition = `opacity ${TRANS_MS}ms ease`;
    leaderboardFull.style.opacity = 1;
  });
}

function hideStandaloneLeaderboard() {
  leaderboardFull.style.transition = `opacity ${TRANS_MS}ms ease`;
  leaderboardFull.style.opacity = 0;
  setTimeout(() => {
    leaderboardFull.style.display = 'none';
    showMainMenu();
  }, TRANS_MS);
}

// END SCREEN HANDLERS 
function restoreEndSectionAndBind() {
  endSection.innerHTML = `
    <h3>Testi on valmis!</h3>
    <p id="finalScoreText"></p>
    <p>Siinä kaikki! Teit testin! Haluatko lisätä itsesi tulostaulukkoon?</p>
    <div style="display:flex; gap:10px; margin-top:8px;">
      <button id="yesSave" class="primary">Kyllä</button>
      <button id="noSave" class="primary">Ei</button>
    </div>
  `;

  const yes = document.getElementById('yesSave');
  if (yes) {
    yes.addEventListener('click', () => {
      const nick = prompt("Anna nimimerkkisi:");
      if (!nick || !nick.trim()) { alert("Nimimerkki ei voi olla tyhjä."); return; }
      saveResult(nick.trim());
    });
  }

  const no = document.getElementById('noSave');
  if (no) {
    no.addEventListener('click', () => {
      endSection.innerHTML = `
        <h3>Hyvää päivänjatkoa! 😊</h3>
        <div style="margin-top:10px">
          <button id="gbBack" class="primary">Takaisin valikkoon</button>
        </div>`;
      const gb = document.getElementById('gbBack');
      if (gb) {
        gb.addEventListener('click', () => {
          restoreEndSectionAndBind();
          endSection.style.display = 'none';
          currentIndex = 0;
          score = 0;
          revealedCount = 0;
          roundLocked = false;
          buildGrid();
          showMainMenu();
          updateBadges();
        });
      }
    });
  }
}

// EVENT BINDINGS 
playBtn.addEventListener('click', () => {
  currentIndex = 0;
  score = 0;
  buildGrid();
  showGameScreen();
  setTimeout(() => loadPuzzle(0), 80);
});

viewLeaderboardBtn.addEventListener('click', () => {
  renderLeaderboard();
  showStandaloneLeaderboard();
});

backFromLeaderboard.addEventListener('click', () => hideStandaloneLeaderboard());

// INIT
function init() {
  buildGrid();
  showMainMenu();
  updateBadges();
}
init();
restoreEndSectionAndBind();