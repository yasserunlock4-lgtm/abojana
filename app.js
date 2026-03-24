(function(){

// ⚙️ الإعدادات
const TELEGRAM_LINK   = "https://t.me/SS34SS4";
const YOUTUBE_URL     = "https://www.youtube.com/@YOUR_CHANNEL";
const INSTAGRAM_URL   = "https://www.instagram.com/YOUR_ACCOUNT";
const WIN_TARGET      = 20;
const MAX_LIVES       = 6;

// ─── Canvas ───
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

// ─── Game State ───
const game={
  running:false,
  score:0
};

const player={
  x:80,
  y:200,
  vy:0
};

// ─── Jump ───
function jump(){
  player.vy=-12;
}

// ─── Update ───
function update(){
  if(!game.running)return;

  player.vy+=0.8;
  player.y+=player.vy;

  if(player.y>H-100){
    player.y=H-100;
    player.vy=0;
  }
}

// ─── Draw ───
function render(){
  ctx.clearRect(0,0,W,H);

  ctx.fillStyle="yellow";
  ctx.fillRect(player.x,player.y,50,50);
}

// ─── Loop ───
function loop(){
  update();
  render();
  requestAnimationFrame(loop);
}
loop();

// ─── Controls ───
document.addEventListener("click",jump);

document.getElementById("startBtn").addEventListener("click",()=>{
  game.running=true;
});

})();
