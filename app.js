const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ===== UI =====
const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const winScreen = document.getElementById("winScreen");

const scoreEl = document.getElementById("scoreValue");
const bestEl = document.getElementById("bestValue");

// ===== بيانات =====
let gameRunning = false;
let score = 0;
let best = localStorage.getItem("best") || 0;

bestEl.innerText = best;

// ===== اللاعب =====
let player = {
  x: 100,
  y: 200,
  size: 30,
  velocity: 0,
  gravity: 0.6,
  jump: -10
};

// ===== العوائق =====
let obstacles = [];

// ===== بدء =====
function startGame(){
  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  winScreen.classList.add("hidden");

  score = 0;
  scoreEl.innerText = score;

  player.y = 200;
  player.velocity = 0;

  obstacles = [];
  gameRunning = true;

  loop();
}

document.getElementById("startBtn").onclick = startGame;
document.getElementById("restartBtn").onclick = startGame;

// ===== قفز =====
document.addEventListener("click", ()=>{
  if(!gameRunning) return;
  player.velocity = player.jump;
});

// ===== عوائق =====
function createObstacle(){
  obstacles.push({
    x: canvas.width,
    width: 40,
    height: Math.random()*200+50
  });
}

// ===== تحديث =====
function update(){
  player.velocity += player.gravity;
  player.y += player.velocity;

  if(player.y > canvas.height-player.size){
    gameOver();
  }

  obstacles.forEach(o=>{
    o.x -= 5;

    if(
      player.x < o.x + o.width &&
      player.x + player.size > o.x &&
      player.y + player.size > canvas.height - o.height
    ){
      gameOver();
    }
  });

  if(obstacles.length && obstacles[0].x < -50){
    obstacles.shift();
    score++;
    scoreEl.innerText = score;

    if(score >= 20){
      winGame();
    }
  }
}

// ===== رسم =====
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  ctx.fillStyle="yellow";
  ctx.fillRect(player.x,player.y,player.size,player.size);

  ctx.fillStyle="red";
  obstacles.forEach(o=>{
    ctx.fillRect(o.x,canvas.height-o.height,o.width,o.height);
  });
}

// ===== لوب =====
function loop(){
  if(!gameRunning) return;

  if(Math.random()<0.02) createObstacle();

  update();
  draw();

  requestAnimationFrame(loop);
}

// ===== خسارة =====
function gameOver(){
  gameRunning=false;

  if(score>best){
    best=score;
    localStorage.setItem("best",best);
    bestEl.innerText=best;
  }

  gameOverScreen.classList.remove("hidden");
}

// ===== فوز =====
function winGame(){
  gameRunning=false;
  winScreen.classList.remove("hidden");
}
