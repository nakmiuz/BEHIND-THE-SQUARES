/* ================== CONFIG / PUZZLES ==================
   Put img1.jpg ... img10.jpg and logo.png.jpg next to this index.html
   Replace each puzzle options & correct index with real data.
*/
const puzzles = [
  { img: "img1.jpg", options: ["Option A","Option B","Option C","Option D"], correct: 0 },
  { img: "img2.jpg", options: ["Option A","Option B","Option C","Option D"], correct: 0 },
  { img: "img3.jpg", options: ["Option A","Option B","Option C","Option D"], correct: 0 },
  { img: "img4.jpg", options: ["Option A","Option B","Option C","Option D"], correct: 0 },
  { img: "img5.jpg", options: ["Option A","Option B","Option C","Option D"], correct: 0 },
  { img: "img6.jpg", options: ["Option A","Option B","Option C","Option D"], correct: 0 },
  { img: "img7.jpg", options: ["Option A","Option B","Option C","Option D"], correct: 0 },
  { img: "img8.jpg", options: ["Option A","Option B","Option C","Option D"], correct: 0 },
  { img: "img9.jpg", options: ["Option A","Option B","Option C","Option D"], correct: 0 },
  { img: "img10.jpg", options: ["Option A","Option B","Option C","Option D"], correct: 0 }
];


// localStorage leaderboard key
const LB_KEY = 'whatsbehind_leaderboard_v1';


/* UI elements */
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
const yesSave = document.getElementById('yesSave');
const noSave = document.getElementById('noSave');


const leaderboardFull = document.getElementById('leaderboardFull');
const leaderboardBody = document.getElementById('leaderboardBody');
const backFromLeaderboard = document.getElementById('backFromLeaderboard');


const playAgainFromLB = document.getElementById('backFromLeaderboard'); // same


/* State */
let currentIndex = 0;     // 0..9
let revealedCount = 0;    // 0..3 per puzzle
let score = 0;            // 0..10
const MAX_REVEALS = 3;
let tileElements = [];    // DOM tiles
let roundLocked = false;  // once user picks an option, lock the round to prevent further tile clicks


/* Transition helpers matching tile flip duration (520ms) */
const TRANS_MS = 520;


/* UI show/hide helpers */
function hideElement(el){ if(!el) return; el.style.transition = `opacity ${TRANS_MS}ms ease`; el.style.opacity = 0; setTimeout(()=> { if(el.style.display!=="none") el.style.display = 'none'; }, TRANS_MS); }
function showElement(el, display='block'){ if(!el) return; el.style.display = display; requestAnimationFrame(()=> { el.style.transition = `opacity ${TRANS_MS}ms ease`; el.style.opacity = 1; }); }


/* MAIN menu / gameplay / leaderboard flows */
function showMainMenu(){
  // show header + main menu, hide everything else
  siteHeader.style.display = ''; siteHeader.style.opacity = 1;
  mainMenu.style.display = 'flex'; mainMenu.style.opacity = 1;
  hideElement(gameLayout);
  hideElement(leaderboardFull);
  document.querySelectorAll('.end-screen').forEach(s => hideElement(s));
}


function showGameScreen(){
  // show header + layout, hide menu and leaderboard
  siteHeader.style.display = ''; siteHeader.style.opacity = 1;
  hideElement(mainMenu);
  hideElement(leaderboardFull);
  showElement(gameLayout, 'flex');
  // show right column choices or badges (end screens are hidden)
  document.querySelectorAll('.end-screen').forEach(s => hideElement(s));
}


function showStandaloneLeaderboard(){
  // HIDE ALL including header and main menu -> show only leaderboardFull
  // hide header
  siteHeader.style.display = 'none';
  mainMenu.style.display = 'none';
  hideElement(gameLayout);
  // show leaderboard full-screen
  leaderboardBody.innerHTML = ''; renderLeaderboard();
  leaderboardFull.style.display = 'flex'; leaderboardFull.style.opacity = 0;
  requestAnimationFrame(()=> { leaderboardFull.style.transition = `opacity ${TRANS_MS}ms ease`; leaderboardFull.style.opacity = 1; });
}


function hideStandaloneLeaderboard(){
  // hide leaderboard and return to main menu
  leaderboardFull.style.transition = `opacity ${TRANS_MS}ms ease`; leaderboardFull.style.opacity = 0;
  setTimeout(()=> { leaderboardFull.style.display = 'none'; showMainMenu(); siteHeader.style.display = ''; }, TRANS_MS);
}


/* --- Build 4x4 grid of tiles --- */
function buildGrid(){
  gridOverlay.innerHTML = '';
  tileElements = [];
  for(let i=0;i<16;i++){
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.tabIndex = 0;


    const inner = document.createElement('div');
    inner.className = 'tile-inner';


    const front = document.createElement('div');
    front.className = 'tile-face tile-front';
    const coverInner = document.createElement('div');
    coverInner.className = 'cover-inner';
    coverInner.textContent = '';
    front.appendChild(coverInner);


    const back = document.createElement('div');
    back.className = 'tile-face tile-back';


    inner.appendChild(front);
    inner.appendChild(back);
    tile.appendChild(inner);


    // Click handlers
    tile.addEventListener('click', () => onTileClick(tile));
    tile.addEventListener('keydown', (e) => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTileClick(tile); } });


    gridOverlay.appendChild(tile);
    tileElements.push(tile);
  }
}


/* --- Load puzzle (set tile backgrounds, reset states) --- */
function loadPuzzle(i){
  if(i < 0) i = 0;
  if(i >= puzzles.length) i = puzzles.length - 1;
  currentIndex = i;
  const p = puzzles[currentIndex];


  // assign each tile's back to the correct portion of the image
  const backs = gridOverlay.querySelectorAll('.tile-back');
  backs.forEach((backEl, idx) => {
    const r = Math.floor(idx / 4);
    const c = idx % 4;
    backEl.style.backgroundImage = `url("${p.img}")`;
    backEl.style.backgroundSize = `400% 400%`;
    backEl.style.backgroundPosition = `${c * 25}% ${r * 25}%`;
  });


  // reset tiles
  tileElements.forEach(t => { t.classList.remove('flipped','disabled'); t.style.pointerEvents = 'auto'; });
  revealedCount = 0;
  roundLocked = false;
  // ensure choices visible for regular rounds
  if(document.getElementById('choicesRow').classList.contains('hidden')){
    document.getElementById('choicesRow').classList.remove('hidden');
    showElement(document.getElementById('choicesRow'),'flex');
  }
  renderChoices(p.options);
  updateBadges();
}


/* --- Tile click behavior --- */
function onTileClick(tile){
  if(roundLocked) return;
  if(revealedCount >= MAX_REVEALS) return;
  if(tile.classList.contains('flipped')) return;
  tile.classList.add('flipped');
  revealedCount++;
  if(revealedCount >= MAX_REVEALS){
    tileElements.forEach(t => { if(!t.classList.contains('flipped')) t.classList.add('disabled'); });
  }
  updateBadges();
}


/* --- Render choices --- */
function renderChoices(options){
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


/* --- Choice selected --- */
function onChoiceSelected(selectedIdx, btn){
  if(roundLocked) return;
  roundLocked = true;
  // disable all choices immediately
  choicesRow.querySelectorAll('.choice-btn').forEach(b => b.disabled = true);


  const p = puzzles[currentIndex];
  const correct = (selectedIdx === p.correct);
  if(correct){
    score = Math.min(10, score + 1);
    setTimeout(()=> alert('✅ Correct!'), 80);
  } else {
    setTimeout(()=> alert('❌ Wrong!'), 80);
  }
  updateBadges();


  // after selecting on the last puzzle: hide choices (fade out) and show prompt after transition
  if(currentIndex === puzzles.length - 1){
    // fade out choices (match TRANS_MS)
    const choicesEl = document.getElementById('choicesRow');
    choicesEl.style.transition = `opacity ${TRANS_MS}ms ease`;
    choicesEl.style.opacity = 0;
    setTimeout(()=> {
      // fully hide choices
      choicesEl.classList.add('hidden');
      choicesEl.style.display = 'none';
      // show end prompt
      finalScoreText.textContent = `You got ${score} / ${puzzles.length} correct.`;
      showEndScreen();
    }, TRANS_MS);
    return;
  }


  // normal flow: move to next puzzle after a delay (to let feedback be seen)
  setTimeout(()=> {
    if(currentIndex < puzzles.length - 1){
      loadPuzzle(currentIndex + 1);
    } else {
      finishGame();
    }
  }, TRANS_MS);
}


/* --- Update badges --- */
function updateBadges(){
  progressBadge.textContent = `Image: ${Math.min(currentIndex + 1, puzzles.length)} / ${puzzles.length}`;
  revealedBadge.textContent = `Revealed: ${revealedCount} / ${MAX_REVEALS}`;
  scoreBadge.textContent = `Score: ${score}`;
}


/* --- Finish game (fallback) --- */
function finishGame(){
  finalScoreText.textContent = `You got ${score} / ${puzzles.length} correct.`;
  showEndScreen();
}


/* --- Leaderboard localStorage helpers --- */
function readLeaderboard(){
  try{
    const raw = localStorage.getItem(LB_KEY);
    if(!raw) return [];
    return JSON.parse(raw);
  }catch(e){ return []; }
}
function writeLeaderboard(arr){
  try{ localStorage.setItem(LB_KEY, JSON.stringify(arr)); }catch(e){ console.error(e); }
}


/* --- Save & render leaderboard --- */
function saveResult(nickname){
  const list = readLeaderboard();
  list.push({ name: nickname, score: score, ts: Date.now() });
  list.sort((a,b) => (b.score - a.score) || (b.ts - a.ts));
  writeLeaderboard(list);
  renderLeaderboard();
  showStandaloneLeaderboard();
}


function renderLeaderboard(){
  leaderboardBody.innerHTML = '';
  const list = readLeaderboard();
  if(list.length === 0){
    const tr = document.createElement('tr');
    const td = document.createElement('td'); td.colSpan = 2; td.style.padding = '12px'; td.textContent = 'No entries yet';
    tr.appendChild(td); leaderboardBody.appendChild(tr); return;
  }
  list.forEach(entry => {
    const tr = document.createElement('tr');
    const n = document.createElement('td'); n.textContent = entry.name;
    const s = document.createElement('td'); s.textContent = entry.score;
    tr.appendChild(n); tr.appendChild(s); leaderboardBody.appendChild(tr);
  });
}


/* --- Buttons wiring --- */
playBtn.addEventListener('click', () => {
  currentIndex = 0; score = 0;
  buildGrid();
  showGameScreen();
  // small delay so layout is visible before loading
  setTimeout(()=> loadPuzzle(0), 80);
});


viewLeaderboardBtn.addEventListener('click', () => {
  renderLeaderboard();
  showStandaloneLeaderboard();
});


yesSave.addEventListener('click', () => {
  const nick = prompt("Enter your nickname:");
  if(!nick || !nick.trim()){ alert("Nickname can't be empty."); return; }
  saveResult(nick.trim());
});


noSave.addEventListener('click', () => {
  // after user says No on end screen, show goodbye block inside right column
  // We'll reuse endSection area to show goodbye message
  endSection.style.display = 'none';
  // show goodbye text
  const goodbye = document.getElementById('goodbyeSection') || null;
  if(goodbye){
    goodbye.style.display = 'block';
  } else {
    // create a quick goodbye block
    const gd = document.createElement('section'); gd.className = 'end-screen'; gd.id='goodbyeSection';
    gd.innerHTML = '<h3>😊 Have a great day!</h3><div style="margin-top:10px"><button id="gbBack" class="primary">Back to Menu</button></div>';
    document.querySelector('.right').appendChild(gd);
    document.getElementById('gbBack').addEventListener('click', ()=> showMainMenu());
  }
});


backFromLeaderboard.addEventListener('click', () => {
  hideStandaloneLeaderboard();
});


/* --- initialize --- */
function init(){
  buildGrid();
  showMainMenu();
  updateBadges();
}
init();


/* End of script */

