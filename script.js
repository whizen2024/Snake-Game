/* Simple Snake Game – Beginner Friendly (No Arrow Functions, No Array Methods) */

var GRID = 18;
var board = document.getElementById('board');
var scoreBox = document.getElementById('scoreBox');
var highScoreEl = document.getElementById('highScore');
var startBtn = document.getElementById('startBtn');
var pauseBtn = document.getElementById('pauseBtn');
var restartBtn = document.getElementById('restartBtn');
var muteBtn = document.getElementById('muteBtn');
var fsBtn = document.getElementById('fsBtn');
var difficultySel = document.getElementById('difficulty');

var overlayStart = document.getElementById('overlayStart');
var overlayStartBtn = document.getElementById('overlayStartBtn');
var playerNameInput = document.getElementById('playerName');
var overlayGameOver = document.getElementById('overlayGameOver');
var finalScore = document.getElementById('finalScore');
var tryAgainBtn = document.getElementById('tryAgainBtn');
var goHomeBtn = document.getElementById('goHomeBtn');

var foodSound = new Audio('assets/food.mp3');
var gameOverSound = new Audio('assets/gameover.mp3');
var moveSound = new Audio('assets/move.mp3');
var musicSound = new Audio('assets/music.mp3');
musicSound.loop = true;

var score = 0;
var hiscore = parseInt(localStorage.getItem("snake_hiscore") || "0");
var speed = 6;

var snakeX = 9;   // snake head X
var snakeY = 9;   // snake head Y
var foodX = 5;    // food X position
var foodY = 5;    // food Y position
var tailX = [];   // stores each tail X
var tailY = [];   // stores each tail Y
var tailLength = 0;

var dirX = 0;     // movement direction X
var dirY = 0;     // movement direction Y

var lastPaint = 0;
var running = false;
var paused = false;
var musicMuted = false;

/* Difficulty levels */
var DIFFICULTY = {
  easy: { speed: 5 },
  medium: { speed: 7 },
  hard: { speed: 10 }
};

/* Random number between a and b */
function rand(a, b) {
  return Math.floor(a + Math.random() * (b - a + 1));
}

/* Play sounds safely */
function playSound(s) {
  if (!musicMuted) {
    try {
      s.currentTime = 0;
      s.play();
    } catch (e) { }
  }
}

/* Reset the whole game */
function resetGame() {
  snakeX = 9;
  snakeY = 9;
  dirX = 0;
  dirY = 0;
  tailX = [];
  tailY = [];
  tailLength = 0;
  score = 0;
  speed = DIFFICULTY[difficultySel.value].speed;
  spawnFood();
  updateScore();
  render();
  running = false;
  paused = false;
}

/* Spawn food at a random empty place */
function spawnFood() {
  foodX = rand(1, GRID);
  foodY = rand(1, GRID);
}

/* Check for game over conditions */
function checkCollision() {
  if (snakeX < 1 || snakeX > GRID || snakeY < 1 || snakeY > GRID) {
    return true;
  }
  // Check if snake bites itself
  for (var i = 0; i < tailLength; i++) {
    if (tailX[i] === snakeX && tailY[i] === snakeY) {
      return true;
    }
  }
  return false;
}

/* Game Over */
function gameOver() {
  playSound(gameOverSound);
  running = false;
  if (score > hiscore) {
    hiscore = score;
    localStorage.setItem("snake_hiscore", hiscore);
  }
  finalScore.textContent = "Score: " + score;
  highScoreEl.textContent = "HighScore: " + hiscore;
  overlayGameOver.classList.remove("hidden");
}

/* Update score display */
function updateScore() {
  scoreBox.textContent = "Score: " + score;
  highScoreEl.textContent = "HighScore: " + hiscore;
}

/* Main game logic */
function gameEngine() {
  if (dirX === 0 && dirY === 0) { render(); return; }

  // Move tail (each block follows the one before it)
  for (var i = tailLength; i > 0; i--) {
    tailX[i] = tailX[i - 1];
    tailY[i] = tailY[i - 1];
  }
  tailX[0] = snakeX;
  tailY[0] = snakeY;

  // Move head
  snakeX += dirX;
  snakeY += dirY;

  // Check if game over
  if (checkCollision()) {
    gameOver();
    return;
  }

  // Check if snake eats food
  if (snakeX === foodX && snakeY === foodY) {
    playSound(foodSound);
    score++;
    tailLength++;
    spawnFood();
    if (score % 5 === 0) speed++;
    updateScore();
  }

  render();
}

/* Draw board */
function render() {
  board.innerHTML = "";

  // Draw food
  var f = document.createElement("div");
  f.style.gridRowStart = foodY;
  f.style.gridColumnStart = foodX;
  f.className = "food-small";
  board.appendChild(f);

  // Draw tail
  for (var i = 0; i < tailLength; i++) {
    var t = document.createElement("div");
    t.style.gridRowStart = tailY[i];
    t.style.gridColumnStart = tailX[i];
    t.className = "snake";
    board.appendChild(t);
  }

  // Draw head
  var h = document.createElement("div");
  h.style.gridRowStart = snakeY;
  h.style.gridColumnStart = snakeX;
  h.className = "head";
  board.appendChild(h);
}

/* Loop (repeats) */
function loop(timestamp) {
  if (!running) return;
  if (paused) { lastPaint = timestamp; requestAnimationFrame(loop); return; }

  requestAnimationFrame(loop);
  if ((timestamp - lastPaint) / 1000 < 1 / speed) return;
  lastPaint = timestamp;
  gameEngine();
}

/* BUTTON EVENTS */
startBtn.onclick = function () {
  overlayStart.classList.remove("hidden");
};

overlayStartBtn.onclick = function () {
  resetGame();
  overlayStart.classList.add("hidden");
  running = true;
  try { if (!musicMuted) musicSound.play(); } catch (e) { }
  requestAnimationFrame(loop);
};

pauseBtn.onclick = function () {
  if (!running) return;
  paused = !paused;
  pauseBtn.textContent = paused ? "Resume" : "Pause";
};

restartBtn.onclick = function () {
  resetGame();
  running = true;
  requestAnimationFrame(loop);
};

muteBtn.onclick = function () {
  musicMuted = !musicMuted;
  muteBtn.textContent = musicMuted ? "Unmute" : "Mute";
  if (musicMuted) musicSound.pause(); else { try { musicSound.play(); } catch (e) { } }
};

fsBtn.onclick = function () {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    fsBtn.textContent = "Exit FS";
  } else {
    document.exitFullscreen();
    fsBtn.textContent = "Fullscreen";
  }
};

difficultySel.onchange = resetGame;

tryAgainBtn.onclick = function () {
  overlayGameOver.classList.add("hidden");
  resetGame();
  running = true;
  requestAnimationFrame(loop);
};

goHomeBtn.onclick = function () {
  overlayGameOver.classList.add("hidden");
  overlayStart.classList.remove("hidden");
};

/* KEYBOARD MOVEMENT */
window.addEventListener("keydown", function (e) {
  if (!running && (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight")) {
    overlayStart.classList.add("hidden");
    running = true;
    requestAnimationFrame(loop);
  }
  if (e.key === "ArrowUp" && dirY !== 1) { dirX = 0; dirY = -1; }
  else if (e.key === "ArrowDown" && dirY !== -1) { dirX = 0; dirY = 1; }
  else if (e.key === "ArrowLeft" && dirX !== 1) { dirX = -1; dirY = 0; }
  else if (e.key === "ArrowRight" && dirX !== -1) { dirX = 1; dirY = 0; }
  else if (e.key === "p" || e.key === "P") { pauseBtn.click(); }

  playSound(moveSound);
});

/* SWIPE CONTROL (Mobile) */
var sx = 0, sy = 0;
board.addEventListener("touchstart", function (e) {
  var t = e.touches[0];
  sx = t.clientX; sy = t.clientY;
}, { passive: true });

board.addEventListener("touchend", function (e) {
  var t = e.changedTouches[0];
  var dx = t.clientX - sx;
  var dy = t.clientY - sy;
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 20) {
    if (dx > 0 && dirX !== -1) { dirX = 1; dirY = 0; }
    else if (dx < 0 && dirX !== 1) { dirX = -1; dirY = 0; }
  } else if (Math.abs(dy) > 20) {
    if (dy > 0 && dirY !== -1) { dirX = 0; dirY = 1; }
    else if (dy < 0 && dirY !== 1) { dirX = 0; dirY = -1; }
  }
  playSound(moveSound);
}, { passive: true });

/* INIT */
highScoreEl.textContent = "HighScore: " + hiscore;
resetGame();
render();
