/* Final game JS — uses shared functions for desktop/header and mobile menu controls.
   Make sure this script is loaded after DOM (it is, since it's at bottom of HTML).
*/

document.addEventListener('DOMContentLoaded', ()=>{

  /* DOM refs */
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
  const overlayGameOver = document.getElementById('overlayGameOver');
  const finalScore = document.getElementById('finalScore');
  const tryAgainBtn = document.getElementById('tryAgainBtn');
  const goHomeBtn = document.getElementById('goHomeBtn');

  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');

  const mobileControls = document.querySelectorAll('.mbtn');

  /* sounds (optional) */
  const foodSound = new Audio('assets/food.mp3');
  const gameOverSound = new Audio('assets/gameover.mp3');
  const moveSound = new Audio('assets/move.mp3');
  const musicSound = new Audio('assets/music.mp3'); musicSound.loop = true;

  /* state */
  let speed = 6, score = 0;
  let hiscore = parseInt(localStorage.getItem("snake_hiscore") || "0", 10);
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

  highScoreEl.textContent = `High: ${hiscore}`;
  scoreBox.textContent = `Score: ${score}`;

  /* utils */
  const rand=(a,b)=>Math.floor(a + Math.random()*(b-a+1));
  const play = (s)=>{ if(!musicMuted){ try{ s.currentTime = 0; s.play(); }catch(e){} } };

  function spawnFood(val){
    let tries = 0;
    while(tries++ < 500){
      const x = rand(1, GRID), y = rand(1, GRID);
      const onSnake = snake.some(s => s.x === x && s.y === y);
      const onFood = foods.some(f => f.x === x && f.y === y);
      if(!onSnake && !onFood){ foods.push({x,y,val}); return; }
    }
  }

  function setupFoods(){
    foods = [];
    const preset = DIFFICULTY[difficultySel.value] || DIFFICULTY.medium;
    for(let i=0;i<preset.foods;i++){
      const r = Math.random(), v = r < 0.6 ? 1 : (r < 0.9 ? 2 : 3);
      spawnFood(v);
    }
  }

  /* game control functions (exposed to buttons) */
  function resetGame(){
    inputDir = {x:0,y:0};
    snake = [{x:9,y:9}];
    score = 0;
    speed = DIFFICULTY[difficultySel.value].speed;
    setupFoods();
    updateScore();
    render();
    running = false;
    paused = false;
  }

  function startGame(){
    // called by Start button / overlay start
    // attempt to start audio (user gesture)
    try{ if(!musicMuted) musicSound.play(); } catch(e){}
    resetGame();
    overlayStart.classList.add('hidden');
    overlayGameOver.classList.add('hidden');
    running = true;
    lastPaint = 0;
    requestAnimationFrame(loop);
  }

  function pauseToggle(){
    if(!running) return;
    paused = !paused;
    pauseBtn.textContent = paused ? 'Resume' : 'Pause';
  }

  function restartGame(){
    resetGame();
    running = true;
    lastPaint = 0;
    requestAnimationFrame(loop);
  }

  function toggleMute(){
    musicMuted = !musicMuted;
    muteBtn.textContent = musicMuted ? 'Unmute' : 'Mute';
    if(musicMuted) musicSound.pause(); else try{ musicSound.play(); }catch(e){}
  }

  async function toggleFullscreen(){
    try{
      if(!document.fullscreenElement) { await document.documentElement.requestFullscreen(); fsBtn.textContent = 'Exit FS'; }
      else { await document.exitFullscreen(); fsBtn.textContent = 'Fullscreen'; }
    }catch(e){}
  }

  /* expose these for mobile menu buttons to call */
  window.gameControls = { startGame, pauseToggle, restartGame, toggleMute, toggleFullscreen };

  /* game logic */
  function willCollide(newHead){
    if(newHead.x < 1 || newHead.x > GRID || newHead.y < 1 || newHead.y > GRID) return true;
    if(snake.some(s => s.x === newHead.x && s.y === newHead.y)) return true;
    return false;
  }

  function gameEngine(){
    if(inputDir.x === 0 && inputDir.y === 0){ render(); return; }

    const newHead = { x: snake[0].x + inputDir.x, y: snake[0].y + inputDir.y };

    if(willCollide(newHead)){
      // game over
      play(gameOverSound);
      running = false;
      if(score > hiscore){ hiscore = score; localStorage.setItem("snake_hiscore", String(hiscore)); }
      finalScore.textContent = `Score: ${score}`;
      highScoreEl.textContent = `High: ${hiscore}`;
      overlayGameOver.classList.remove('hidden');
      return;
    }

    // move
    snake.unshift(newHead);
    const eaten = foods.find(f => f.x === newHead.x && f.y === newHead.y);
    if(eaten){
      play(foodSound);
      score += eaten.val;
      foods = foods.filter(f => f.id !== eaten.id && !(f.x === eaten.x && f.y === eaten.y));
      // spawn a replacement of same value
      spawnFood(eaten.val);
      if(score % 5 === 0) speed = Math.min(20, speed + 0.5);
      updateScore();
    } else {
      snake.pop();
    }

    render();
  }

  function updateScore(){ scoreBox.textContent = `Score: ${score}`; highScoreEl.textContent = `High: ${hiscore}`; }

  function render(){
    board.innerHTML = '';
    // render foods
    foods.forEach(f=>{
      const el = document.createElement('div');
      el.style.gridRowStart = f.y;
      el.style.gridColumnStart = f.x;
      el.className = (f.val === 1 ? 'food-small' : (f.val === 2 ? 'food-mid' : 'food-big'));
      board.appendChild(el);
    });
    // render snake
    snake.forEach((s,i)=>{
      const el = document.createElement('div');
      el.style.gridRowStart = s.y;
      el.style.gridColumnStart = s.x;
      el.className = (i === 0 ? 'head' : 'snake');
      board.appendChild(el);
    });
  }

  function loop(ts){
    if(!running) return;
    if(paused){ lastPaint = ts; requestAnimationFrame(loop); return; }
    requestAnimationFrame(loop);
    if((ts - lastPaint)/1000 < 1/speed) return;
    lastPaint = ts;
    gameEngine();
  }

  /* keyboard & swipe */
  window.addEventListener('keydown', (e)=>{
    if(!running && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){
      // start if not running
      startGame();
    }
    if(e.key === 'p' || e.key === 'P'){ pauseToggle(); return; }
    switch(e.key){
      case 'ArrowUp': if(inputDir.y !== 1) inputDir = {x:0,y:-1}; break;
      case 'ArrowDown': if(inputDir.y !== -1) inputDir = {x:0,y:1}; break;
      case 'ArrowLeft': if(inputDir.x !== 1) inputDir = {x:-1,y:0}; break;
      case 'ArrowRight': if(inputDir.x !== -1) inputDir = {x:1,y:0}; break;
    }
    play(moveSound);
  });

  /* mobile on-screen buttons */
  mobileControls.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const dir = btn.dataset.dir;
      if(dir === 'up' && inputDir.y !== 1) inputDir = {x:0,y:-1};
      if(dir === 'down' && inputDir.y !== -1) inputDir = {x:0,y:1};
      if(dir === 'left' && inputDir.x !== 1) inputDir = {x:-1,y:0};
      if(dir === 'right' && inputDir.x !== -1) inputDir = {x:1,y:0};
      play(moveSound);
    });
  });

  /* swipe */
  let sx=0, sy=0;
  board.addEventListener('touchstart', e=>{ const t = e.touches[0]; sx = t.clientX; sy = t.clientY; }, {passive:true});
  board.addEventListener('touchend', e=>{
    const t = e.changedTouches[0];
    const dx = t.clientX - sx, dy = t.clientY - sy;
    if(Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 20){
      if(dx > 0 && inputDir.x !== -1) inputDir = {x:1,y:0};
      if(dx < 0 && inputDir.x !== 1) inputDir = {x:-1,y:0};
    } else if(Math.abs(dy) > 20){
      if(dy > 0 && inputDir.y !== -1) inputDir = {x:0,y:1};
      if(dy < 0 && inputDir.y !== 1) inputDir = {x:0,y:-1};
    }
    play(moveSound);
  }, {passive:true});

  /* menu & header button bindings (use central functions) */
  startBtn.addEventListener('click', ()=> overlayStart.classList.toggle('hidden'));
  overlayStartBtn.addEventListener('click', startGame);
  pauseBtn.addEventListener('click', pauseToggle);
  restartBtn.addEventListener('click', restartGame);
  muteBtn.addEventListener('click', toggleMute);
  fsBtn.addEventListener('click', toggleFullscreen);
  difficultySel.addEventListener('change', ()=> { speed = DIFFICULTY[difficultySel.value].speed; setupFoods(); render(); });

  tryAgainBtn.addEventListener('click', ()=>{ overlayGameOver.classList.add('hidden'); restartGame(); });
  goHomeBtn.addEventListener('click', ()=>{ overlayGameOver.classList.add('hidden'); overlayStart.classList.remove('hidden'); });

  /* Hamburger mobile menu: populate controls that call the shared functions */
  hamburger.addEventListener('click', ()=>{
    if(mobileMenu.classList.contains('show')){ mobileMenu.classList.remove('show'); mobileMenu.setAttribute('aria-hidden','true'); return; }
    // build menu content (recreate each time to keep it simple)
    mobileMenu.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:8px;">
        <button id="mStart" class="btn primary">Start</button>
        <button id="mPause" class="btn">${paused ? 'Resume' : 'Pause'}</button>
        <button id="mRestart" class="btn">Restart</button>
        <button id="mMute" class="btn">${musicMuted ? 'Unmute' : 'Mute'}</button>
        <label style="font-weight:700">Difficulty:
          <select id="mDiff">
            <option value="easy">Easy</option>
            <option value="medium" selected>Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>
        <button id="mFS" class="btn">Fullscreen</button>
      </div>
    `;
    mobileMenu.classList.add('show'); mobileMenu.setAttribute('aria-hidden','false');

    // wire them to the same functions
    document.getElementById('mStart').addEventListener('click', ()=>{ startGame(); mobileMenu.classList.remove('show'); });
    document.getElementById('mPause').addEventListener('click', ()=>{ pauseToggle(); mobileMenu.classList.remove('show'); });
    document.getElementById('mRestart').addEventListener('click', ()=>{ restartGame(); mobileMenu.classList.remove('show'); });
    document.getElementById('mMute').addEventListener('click', ()=>{ toggleMute(); mobileMenu.classList.remove('show'); });
    document.getElementById('mFS').addEventListener('click', ()=>{ toggleFullscreen(); mobileMenu.classList.remove('show'); });
    const mDiff = document.getElementById('mDiff');
    mDiff.value = difficultySel.value;
    mDiff.addEventListener('change', ()=>{
      difficultySel.value = mDiff.value;
      speed = DIFFICULTY[difficultySel.value].speed;
      setupFoods();
      mobileMenu.classList.remove('show');
    });
  });

  /* click outside to close mobile menu */
  document.addEventListener('click', (e)=>{
    if(!mobileMenu.classList.contains('show')) return;
    if(hamburger.contains(e.target)) return;
    if(mobileMenu.contains(e.target)) return;
    mobileMenu.classList.remove('show'); mobileMenu.setAttribute('aria-hidden','true');
  });

  /* init */
  setupFoods();
  resetGame();
  render();

}); // DOMContentLoaded end
