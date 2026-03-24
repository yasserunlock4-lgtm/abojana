(function(){

const TELEGRAM_LINK   = "https://t.me/SS34SS4";
const YOUTUBE_URL     = "https://www.youtube.com/@YOUR_CHANNEL";
const INSTAGRAM_URL   = "https://www.instagram.com/YOUR_ACCOUNT";
const WIN_TARGET      = 20;
const MAX_LIVES       = 6;

// Canvas
const wrapper = document.getElementById("w");
const canvas  = document.getElementById("gameCanvas");
const ctx     = canvas.getContext("2d");

let W=0,H=0;
function resizeCanvas(){
  W=wrapper.clientWidth;
  H=wrapper.clientHeight;
  canvas.width=W;
  canvas.height=H;
}
resizeCanvas();
window.addEventListener("resize",resizeCanvas);

// Game State
const game={
  running:false,
  over:false,
  score:0,
  speed:5,
  gravity:0.8,
  obstacles:[],
};

const player={
  x:80,
  y:200,
  w:50,
  h:50,
  vy:0,
  jumpPower:-12,
  onGround:true
};

// Jump
function jump(){
  if(!game.running)return;

  if(player.onGround){
    player.vy=player.jumpPower;
    player.onGround=false;
  }
}

// Start Game
function resetGame(){
  game.running=true;
  game.over=false;
  game.score=0;
  game.obstacles=[];
  player.y=200;
  player.vy=0;

  document.getElementById("scoreValue").textContent=0;
}

// Update
function update(){
  if(!game.running)return;

  player.vy+=game.gravity;
  player.y+=player.vy;

  if(player.y>H-100){
    player.y=H-100;
    player.vy=0;
    player.onGround=true;
  }

  // obstacles
  if(Math.random()<0.02){
    game.obstacles.push({x:W,y:H-100,w:40,h:40});
  }

  for(let i=game.obstacles.length-1;i>=0;i--){
    let o=game.obstacles[i];
    o.x-=game.speed;

    // collision
    if(
      player.x < o.x+o.w &&
      player.x+player.w > o.x &&
      player.y < o.y+o.h &&
      player.y+player.h > o.y
    ){
      game.running=false;
      game.over=true;
      document.getElementById("gameOverScreen").classList.remove("hidden");
    }

    if(o.x< -50){
      game.obstacles.splice(i,1);
      game.score++;
      document.getElementById("scoreValue").textContent=game.score;
    }
  }
}

// Draw
function render(){
  ctx.clearRect(0,0,W,H);

  // player
  ctx.fillStyle="yellow";
  ctx.fillRect(player.x,player.y,player.w,player.h);

  // obstacles
  ctx.fillStyle="red";
  game.obstacles.forEach(o=>{
    ctx.fillRect(o.x,o.y,o.w,o.h);
  });
}

// Loop (مصلح)
function loop(){
  requestAnimationFrame(loop);
  update();
  render();
}
loop();

// Controls
document.getElementById("tapZone").addEventListener("click",jump);

window.addEventListener("keydown",(e)=>{
  if(e.code==="Space") jump();
});

// Buttons
document.getElementById("startBtn").addEventListener("click",()=>{
  resetGame();
});

document.getElementById("restartBtn").addEventListener("click",()=>{
  resetGame();
});

document.getElementById("playAgainBtn").addEventListener("click",()=>{
  resetGame();
});

document.getElementById("homeBtn").addEventListener("click",()=>{
  location.reload();
});

})();
