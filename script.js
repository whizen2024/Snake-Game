/* Final Advanced Snake - MultiFood, Difficulty, Fullscreen, Responsive */

const GRID = 18;
const board = document.getElementById('board');
const scoreBox = document.getElementById('scoreBox');
const highScoreEl = document.getElementById('highScore');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const restartBtn = document.getElementById('restartBtn');
const muteBtn = document.getElementById('muteBtn');
const fsBtn = document.getElementById('fsBtn');
const difficultySel = document.getElementById('difficulty');

const overlayStart = document.getElementById('overlayStart');
const overlayStartBtn = document.getElementById('overlayStartBtn');
const playerNameInput = document.getElementById('playerName');
const overlayGameOver = document.getElementById('overlayGameOver');
const finalScore = document.getElementById('finalScore');
const tryAgainBtn = document.getElementById('tryAgainBtn');
const goHomeBtn = document.getElementById('goHomeBtn');

const foodSound = new Audio('assets/food.mp3');
const gameOverSound = new Audio('assets/gameover.mp3');
const moveSound = new Audio('assets/move.mp3');
const musicSound = new Audio('assets/music.mp3'); musicSound.loop = true;

let speed = 6, score = 0, hiscore = parseInt(localStorage.getItem("snake_hiscore")||"0");
let snake = [{x:9,y:9}];
let foods = [];
let inputDir = {x:0,y:0};
let lastPaint = 0;
let running = false, paused = false, musicMuted = false;

const DIFFICULTY = {
  easy:{speed:5,foods:2},
  medium:{speed:7,foods:3},
  hard:{speed:10,foods:4}
};

/* UTILITIES */
const rand=(a,b)=>Math.floor(a+Math.random()*(b-a+1));
function play(s){if(!musicMuted){try{s.currentTime=0;s.play();}catch(e){}}}

/* FOOD LOGIC */
function spawnFood(val){
  let tries=0;
  while(tries++<300){
    const x=rand(1,GRID), y=rand(1,GRID);
    if(!snake.some(s=>s.x===x&&s.y===y)&&!foods.some(f=>f.x===x&&f.y===y)){
      foods.push({x,y,val});
      return;
    }
  }
}
function setupFoods(){
  foods=[];
  const preset=DIFFICULTY[difficultySel.value];
  for(let i=0;i<preset.foods;i++){
    const r=Math.random();
    const v=r<0.6?1:(r<0.9?2:3);
    spawnFood(v);
  }
}

/* GAME RESET */
function resetGame(){
  inputDir={x:0,y:0};
  snake=[{x:9,y:9}];
  score=0;
  speed=DIFFICULTY[difficultySel.value].speed;
  setupFoods();
  updateScore();
  render();
  running=false;paused=false;
}

/* GAME ENGINE */
function gameOver(){
  play(gameOverSound);
  running=false;
  if(score>hiscore){
    hiscore=score;
    localStorage.setItem("snake_hiscore",hiscore);
  }
  finalScore.textContent=`Score: ${score}`;
  highScoreEl.textContent=`High: ${hiscore}`;
  overlayGameOver.classList.remove("hidden");
}

function updateScore(){scoreBox.textContent=`Score: ${score}`;highScoreEl.textContent=`High: ${hiscore}`;}

function willCollide(newHead){
  if(newHead.x<1||newHead.x>GRID||newHead.y<1||newHead.y>GRID)return true;
  if(snake.some(s=>s.x===newHead.x&&s.y===newHead.y))return true;
  return false;
}

function gameEngine(){
  if(inputDir.x===0&&inputDir.y===0){render();return;}

  const newHead={x:snake[0].x+inputDir.x,y:snake[0].y+inputDir.y};
  if(willCollide(newHead)){gameOver();return;}

  snake.unshift(newHead);

  const eaten=foods.find(f=>f.x===newHead.x&&f.y===newHead.y);
  if(eaten){
    play(foodSound);
    score+=eaten.val;
    foods=foods.filter(f=>!(f.x===eaten.x&&f.y===eaten.y));
    spawnFood(eaten.val);
    if(score%5===0)speed++;
    updateScore();
  }else snake.pop();

  render();
}

function render(){
  board.innerHTML="";
  foods.forEach(f=>{
    const e=document.createElement("div");
    e.style.gridRowStart=f.y;
    e.style.gridColumnStart=f.x;
    e.className=f.val===1?"food-small":f.val===2?"food-mid":"food-big";
    board.appendChild(e);
  });
  snake.forEach((s,i)=>{
    const e=document.createElement("div");
    e.style.gridRowStart=s.y;
    e.style.gridColumnStart=s.x;
    e.className=i===0?"head":"snake";
    board.appendChild(e);
  });
}

/* MAIN LOOP */
function loop(ts){
  if(!running)return;
  if(paused){lastPaint=ts;requestAnimationFrame(loop);return;}
  requestAnimationFrame(loop);
  if((ts-lastPaint)/1000<1/speed)return;
  lastPaint=ts;
  gameEngine();
}

/* EVENTS */
startBtn.onclick=()=>overlayStart.classList.remove("hidden");
overlayStartBtn.onclick=()=>{
  resetGame();
  overlayStart.classList.add("hidden");
  running=true;
  try{if(!musicMuted)musicSound.play();}catch(e){}
  requestAnimationFrame(loop);
};

pauseBtn.onclick=()=>{
  if(!running)return;
  paused=!paused;
  pauseBtn.textContent=paused?"Resume":"Pause";
};

restartBtn.onclick=()=>{
  resetGame();running=true;requestAnimationFrame(loop);
};

muteBtn.onclick=()=>{
  musicMuted=!musicMuted;
  muteBtn.textContent=musicMuted?"Unmute":"Mute";
  if(musicMuted)musicSound.pause();else try{musicSound.play();}catch(e){}
};

fsBtn.onclick=async()=>{
  if(!document.fullscreenElement){
    await document.documentElement.requestFullscreen();
    fsBtn.textContent="Exit FS";
  }else{
    await document.exitFullscreen();
    fsBtn.textContent="Fullscreen";
  }
};

difficultySel.onchange=resetGame;

tryAgainBtn.onclick=()=>{
  overlayGameOver.classList.add("hidden");
  resetGame();running=true;requestAnimationFrame(loop);
};
goHomeBtn.onclick=()=>{
  overlayGameOver.classList.add("hidden");
  overlayStart.classList.remove("hidden");
};

/* KEYBOARD */
window.addEventListener("keydown",e=>{
  if(!running&&["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)){
    overlayStart.classList.add("hidden");running=true;requestAnimationFrame(loop);
  }
  switch(e.key){
    case"ArrowUp":if(inputDir.y!==1)inputDir={x:0,y:-1};break;
    case"ArrowDown":if(inputDir.y!==-1)inputDir={x:0,y:1};break;
    case"ArrowLeft":if(inputDir.x!==1)inputDir={x:-1,y:0};break;
    case"ArrowRight":if(inputDir.x!==-1)inputDir={x:1,y:0};break;
    case"p":case"P":pauseBtn.click();break;
  }
  play(moveSound);
});

/* MOBILE BUTTONS */
document.querySelectorAll(".mbtn").forEach(b=>{
  b.addEventListener("click",()=>{
    const d=b.dataset.dir;
    if(d==="up"&&inputDir.y!==1)inputDir={x:0,y:-1};
    if(d==="down"&&inputDir.y!==-1)inputDir={x:0,y:1};
    if(d==="left"&&inputDir.x!==1)inputDir={x:-1,y:0};
    if(d==="right"&&inputDir.x!==-1)inputDir={x:1,y:0};
    play(moveSound);
  });
});

/* SWIPE */
let sx=0,sy=0;
board.addEventListener("touchstart",e=>{
  const t=e.touches[0];sx=t.clientX;sy=t.clientY;
},{passive:true});
board.addEventListener("touchend",e=>{
  const t=e.changedTouches[0];
  const dx=t.clientX-sx,dy=t.clientY-sy;
  if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>20){
    if(dx>0&&inputDir.x!==-1)inputDir={x:1,y:0};
    else if(dx<0&&inputDir.x!==1)inputDir={x:-1,y:0};
  }else if(Math.abs(dy)>20){
    if(dy>0&&inputDir.y!==-1)inputDir={x:0,y:1};
    else if(dy<0&&inputDir.y!==1)inputDir={x:0,y:-1};
  }
  play(moveSound);
},{passive:true});

/* INIT */
highScoreEl.textContent=`High: ${hiscore}`;
resetGame();
render();
