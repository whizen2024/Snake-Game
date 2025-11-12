/* Multi-food Snake with themes, difficulty & fullscreen.
   - Multiple foods on board: each food has a point value (1/2/3)
   - Difficulty affects base speed and number of foods
   - Theme select (4 extra themes), fullscreen toggle, responsive controls
   - No false Game Over when eating (correct ordering)
   - Highscore saved to localStorage
*/

/* ---- CONFIG ---- */
const GRID = 18;
const BOARD = document.getElementById('board');
const SCORE_BOX = document.getElementById('scoreBox');
const HIGH = document.getElementById('highScore');

const START_BTN = document.getElementById('startBtn');
const PAUSE_BTN = document.getElementById('pauseBtn');
const RESTART_BTN = document.getElementById('restartBtn');
const MUTE_BTN = document.getElementById('muteBtn');
const DIFF_SELECT = document.getElementById('difficulty');
const THEME_SELECT = document.getElementById('themeSelect');
const FS_BTN = document.getElementById('fsBtn');

const OVERLAY_START = document.getElementById('overlayStart');
const OVERLAY_START_BTN = document.getElementById('overlayStartBtn');
const PLAYER_NAME = document.getElementById('playerName');

const OVERLAY_GO = document.getElementById('overlayGameOver');
const FINAL_SCORE = document.getElementById('finalScore');
const TRY_AGAIN = document.getElementById('tryAgainBtn');
const GO_HOME = document.getElementById('goHomeBtn');

const MOBILE_BTNS = document.querySelectorAll('.mbtn');
const APP_ROOT = document.getElementById('appRoot');

/* Sounds (optional) */
const foodSound = new Audio('assets/food.mp3'); // optional
const gameOverSound = new Audio('assets/gameover.mp3');
const moveSound = new Audio('assets/move.mp3');
const musicSound = new Audio('assets/music.mp3'); musicSound.loop = true;

/* Game state */
let speed = 6;                // frames/sec
let foods = [];               // array of {x,y,value,id}
let snake = [{x:9,y:9}];      // array of segments
let inputDir = {x:0,y:0};
let lastPaint = 0;
let running = false;
let paused = false;
let musicMuted = false;
let playerName = '';

/* Highscore */
const HKEY = 'snake_multi_hiscore';
let hiscore = parseInt(localStorage.getItem(HKEY) || '0', 10);
HIGH.innerText = `High: ${hiscore}`;

/* Difficulty presets */
const DIFFICULTY = {
  easy:   {speed: 5, foods: 2},
  medium: {speed: 7, foods: 3},
  hard:   {speed: 10, foods: 4}
};

/* Utility */
const rand = (a,b)=> Math.floor(a + Math.random()*(b-a+1));
const uid = ()=> Math.random().toString(36).slice(2,9);
function play(s){ if(musicMuted) return; try{ s.currentTime = 0; s.play(); }catch(e){} }

/* --- spawn/maintain foods --- */
function spawnFoodInstance(value){
  // find an empty cell not on snake nor other foods
  let attempts = 0;
  while(attempts++ < 500){
    const x = rand(1, GRID);
    const y = rand(1, GRID);
    const onSnake = snake.some(seg => seg.x===x && seg.y===y);
    const onFood = foods.some(f => f.x===x && f.y===y);
    if(!onSnake && !onFood) {
      const id = uid();
      foods.push({x,y,value,id});
      return;
    }
  }
  // fallback
}

/* spawn initial foods according to difficulty */
function setupFoods(count){
  foods = [];
  // pick values weighted: more 1s, fewer 3s
  for(let i=0;i<count;i++){
    const r = Math.random();
    const v = r < 0.6 ? 1 : (r < 0.9 ? 2 : 3);
    spawnFoodInstance(v);
  }
}

/* remove a food by id */
function removeFoodById(id){
  foods = foods.filter(f => f.id !== id);
}

/* --- Reset & start --- */
function applyDifficulty(){
  const preset = DIFFICULTY[DIFF_SELECT.value] || DIFFICULTY.medium;
  speed = preset.speed;
  setupFoods(preset.foods);
  render();
}

function resetGame(){
  inputDir = {x:0,y:0};
  snake = [{x: Math.ceil(GRID/2), y: Math.ceil(GRID/2)}];
  applyDifficulty();
  running = false;
  paused = false;
  updateScore(0);
  OVERLAY_GO.classList.add('hidden');
  render();
}

/* --- Game logic (careful order) --- */
function gameOver(){
  play(gameOverSound);
  running = false;
  // update hiscore
  if(currentScore > hiscore){
    hiscore = currentScore;
    localStorage.setItem(HKEY, String(hiscore));
    HIGH.innerText = `High: ${hiscore}`;
  }
  FINAL_SCORE.innerText = `Score: ${currentScore}`;
  OVERLAY_GO.classList.remove('hidden');
}

/* score state */
let currentScore = 0;
function updateScore(v){
  currentScore = v;
  SCORE_BOX.innerText = `Score: ${currentScore}`;
}

/* collision check for new head position */
function willCollide(newHead){
  // wall collision
  if(newHead.x < 1 || newHead.x > GRID || newHead.y < 1 || newHead.y > GRID) return true;
  // self collision
  if(snake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) return true;
  return false;
}

/* main engine: compute new head, check collisions, then insert and eat logic */
function gameEngine(){
  // no movement yet
  if(inputDir.x === 0 && inputDir.y === 0){
    render();
    return;
  }

  // compute new head
  const head = {...snake[0]};
  const newHead = { x: head.x + inputDir.x, y: head.y + inputDir.y };

  // collision check BEFORE mutating snake array
  if(willCollide(newHead)){
    gameOver();
    return;
  }

  // insert new head
  snake.unshift(newHead);

  // check if ate any food
  const ateFood = foods.find(f => f.x === newHead.x && f.y === newHead.y);
  if(ateFood){
    play(foodSound);
    updateScore(currentScore + ateFood.value);
    removeFoodById(ateFood.id);
    // spawn one replacement to keep number constant per difficulty
    spawnFoodInstance(ateFood.value);
    // optionally speed up every 5 points
    if(currentScore % 5 === 0) speed = Math.min(20, speed + 0.5);
  } else {
    // normal move: remove tail
    snake.pop();
  }

  render();
}

/* render board */
function render(){
  BOARD.innerHTML = '';
  // foods
  foods.forEach(f=>{
    const el = document.createElement('div');
    el.style.gridRowStart = f.y;
    el.style.gridColumnStart = f.x;
    if(f.value === 1) el.className = 'food-small';
    else if(f.value === 2) el.className = 'food-mid';
    else el.className = 'food-big';
    BOARD.appendChild(el);
  });

  // snake
  snake.forEach((s,i)=>{
    const el = document.createElement('div');
    el.style.gridRowStart = s.y;
    el.style.gridColumnStart = s.x;
    el.className = (i===0) ? 'head' : 'snake';
    BOARD.appendChild(el);
  });
}

/* animation loop */
function loop(ts){
  if(!running) return;
  if(paused){ lastPaint = ts; requestAnimationFrame(loop); return; }
  requestAnimationFrame(loop);
  if((ts - lastPaint)/1000 < 1/speed) return;
  lastPaint = ts;
  gameEngine();
}

/* --- Controls & events --- */
START_BTN.addEventListener('click', ()=> OVERLAY_START.classList.remove('hidden'));
OVERLAY_START_BTN.addEventListener('click', ()=>{
  playerName = (PLAYER_NAME.value || 'Player').trim();
  resetGame();
  running = true;
  lastPaint = 0;
  try{ if(!musicMuted) musicSound.play(); } catch(e){}
  requestAnimationFrame(loop);
  OVERLAY_START.classList.add('hidden');
});
PAUSE_BTN.addEventListener('click', ()=>{
  if(!running) return;
  paused = !paused;
  PAUSE_BTN.textContent = paused ? 'Resume' : 'Pause';
});
RESTART_BTN.addEventListener('click', ()=>{
  resetGame();
  running = true;
  lastPaint = 0;
  try{ if(!musicMuted) musicSound.play(); } catch(e){}
  requestAnimationFrame(loop);
});
MUTE_BTN.addEventListener('click', ()=>{
  musicMuted = !musicMuted;
  MUTE_BTN.textContent = musicMuted ? 'Unmute' : 'Mute';
  if(musicMuted) musicSound.pause(); else try{ musicSound.play(); }catch(e){}
});

/* Difficulty change */
DIFF_SELECT.addEventListener('change', ()=>{
  const preset = DIFFICULTY[DIFF_SELECT.value] || DIFFICULTY.medium;
  speed = preset.speed;
  setupFoods(preset.foods);
  render();
});

/* Theme change */
THEME_SELECT.addEventListener('change', e=>{
  APP_ROOT.dataset.theme = e.target.value;
});

/* Fullscreen */
FS_BTN.addEventListener('click', async ()=>{
  const el = document.documentElement;
  if(!document.fullscreenElement){
    try{ await el.requestFullscreen(); FS_BTN.textContent = 'Exit FS'; } catch(e){}
  } else {
    try{ await document.exitFullscreen(); FS_BTN.textContent = 'Fullscreen'; } catch(e){}
  }
});

/* Keyboard movement */
window.addEventListener('keydown', e=>{
  if(!running && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
    // start if not running
    OVERLAY_START.classList.add('hidden');
    running = true;
    requestAnimationFrame(loop);
  }
  if(e.key === 'p' || e.key === 'P') { PAUSE_BTN.click(); return; }
  if(e.key === 'ArrowUp'){ if(inputDir.y !== 1) inputDir = {x:0,y:-1}; play(moveSound); }
  if(e.key === 'ArrowDown'){ if(inputDir.y !== -1) inputDir = {x:0,y:1}; play(moveSound); }
  if(e.key === 'ArrowLeft'){ if(inputDir.x !== 1) inputDir = {x:-1,y:0}; play(moveSound); }
  if(e.key === 'ArrowRight'){ if(inputDir.x !== -1) inputDir = {x:1,y:0}; play(moveSound); }
});

/* Mobile buttons */
MOBILE_BTNS.forEach(b=>{
  b.addEventListener('click', ()=> {
    const dir = b.dataset.dir;
    setDirFromString(dir);
  });
});

/* swipe detection */
let tx=0, ty=0;
BOARD.addEventListener('touchstart', e=>{ const t = e.touches[0]; tx=t.clientX; ty=t.clientY; }, {passive:true});
BOARD.addEventListener('touchend', e=>{
  const t = e.changedTouches[0];
  const dx = t.clientX - tx, dy = t.clientY - ty;
  if(Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 20){
    if(dx>0) setDirFromString('right'); else setDirFromString('left');
  } else if(Math.abs(dy) > 20){
    if(dy>0) setDirFromString('down'); else setDirFromString('up');
  }
}, {passive:true});

function setDirFromString(dir){
  if(dir === 'up' && inputDir.y !== 1) inputDir = {x:0,y:-1};
  if(dir === 'down' && inputDir.y !== -1) inputDir = {x:0,y:1};
  if(dir === 'left' && inputDir.x !== 1) inputDir = {x:-1,y:0};
  if(dir === 'right' && inputDir.x !== -1) inputDir = {x:1,y:0};
  play(moveSound);
}

/* game over overlays */
TRY_AGAIN.addEventListener('click', ()=>{
  OVERLAY_GO.classList.add('hidden');
  resetGame();
  running = true;
  requestAnimationFrame(loop);
});
GO_HOME.addEventListener('click', ()=>{
  OVERLAY_GO.classList.add('hidden');
  OVERLAY_START.classList.remove('hidden');
});

/* initialize */
(function init(){
  // set difficulty preset
  DIFF_SELECT.value = 'medium';
  applyDifficulty();
  resetGame();
  render();
})();

/* applyDifficulty helper used on init and diff change */
function applyDifficulty(){
  const preset = DIFFICULTY[DIFF_SELECT.value] || DIFFICULTY.medium;
  speed = preset.speed;
  setupFoods(preset.foods);
}

/* expose for console debugging if needed */
window.Snake = { resetGame, spawnFoodInstance, setDirFromString };
