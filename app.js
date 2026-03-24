const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let game = {
  running:false,
  score:0,
  speed:6,
  lives:3
};

let player = {
  x:100,
  y:300,
  w:50,
  h:50,
  vy:0,
  jump:-15,
  gravity:0.8
};

let obstacles = [];
let coins = [];

// START
function startGame(){
  document.getElementById("menu").style.display="none";
  game.running=true;
  game.score=0;
  game.lives=3;
  obstacles=[];
  coins=[];
}

// JUMP
window.onclick = ()=>{
  if(player.y >= canvas.height-100){
    player.vy = player.jump;
  }
};

// LOOP
function loop(){
  requestAnimationFrame(loop);
  if(!game.running)return;

  update();
  draw();
}
loop();

// UPDATE
function update(){

  player.vy += player.gravity;
  player.y += player.vy;

  if(player.y > canvas.height-100){
    player.y = canvas.height-100;
    player.vy = 0;
  }

  // spawn obstacles
  if(Math.random()<0.02){
    obstacles.push({
      x:canvas.width,
      y:canvas.height-100,
      w:40,
      h:40
    });
  }

  // spawn coins
  if(Math.random()<0.03){
    coins.push({
      x:canvas.width,
      y:Math.random()*300+100,
      r:15
    });
  }

  // move obstacles
  obstacles.forEach((o,i)=>{
    o.x -= game.speed;

    if(collide(player,o)){
      game.lives--;
      obstacles.splice(i,1);
      if(game.lives<=0){
        game.running=false;
        alert("انتهت اللعبة 😢");
        location.reload();
      }
    }
  });

  // coins
  coins.forEach((c,i)=>{
    c.x -= game.speed;

    if(dist(player.x,player.y,c.x,c.y)<50){
      game.score+=5;
      coins.splice(i,1);
    }
  });

  game.score++;

  document.getElementById("score").innerText=game.score;
  document.getElementById("lives").innerText=game.lives;
}

// DRAW
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // player
  ctx.fillStyle="yellow";
  ctx.fillRect(player.x,player.y,player.w,player.h);

  // obstacles
  ctx.fillStyle="red";
  obstacles.forEach(o=>{
    ctx.fillRect(o.x,o.y,o.w,o.h);
  });

  // coins
  ctx.fillStyle="lime";
  coins.forEach(c=>{
    ctx.beginPath();
    ctx.arc(c.x,c.y,c.r,0,Math.PI*2);
    ctx.fill();
  });
}

// HELPERS
function collide(a,b){
  return a.x<b.x+b.w &&
         a.x+a.w>b.x &&
         a.y<b.y+b.h &&
         a.y+a.h>b.y;
}

function dist(x1,y1,x2,y2){
  return Math.hypot(x1-x2,y1-y2);
}
