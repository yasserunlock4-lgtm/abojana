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
  x:120,
  y:300,
  w:60,
  h:60,
  vy:0,
  gravity:0.9,
  jump:-16
};

let obstacles=[];
let coins=[];
let particles=[];

// START
function startGame(){
  document.getElementById("menu").style.display="none";
  game.running=true;
  game.score=0;
  game.lives=3;
  obstacles=[];
  coins=[];
}

// LOOP
function loop(){
  requestAnimationFrame(loop);
  if(!game.running) return;

  update();
  draw();
}
loop();

// JUMP
window.addEventListener("click",()=>{
  if(player.y>=canvas.height-120){
    player.vy=player.jump;
  }
});

// UPDATE
function update(){

  player.vy+=player.gravity;
  player.y+=player.vy;

  if(player.y>canvas.height-120){
    player.y=canvas.height-120;
    player.vy=0;
  }

  // زيادة السرعة
  game.speed+=0.001;

  // spawn obstacles
  if(Math.random()<0.02){
    obstacles.push({
      x:canvas.width,
      y:canvas.height-120,
      w:50,
      h:50
    });
  }

  // spawn coins
  if(Math.random()<0.03){
    coins.push({
      x:canvas.width,
      y:Math.random()*300+100,
      r:12
    });
  }

  // obstacles
  obstacles.forEach((o,i)=>{
    o.x-=game.speed;

    if(collide(player,o)){
      game.lives--;
      shake();
      obstacles.splice(i,1);

      if(game.lives<=0){
        game.running=false;
        alert("💀 انتهت اللعبة");
        location.reload();
      }
    }
  });

  // coins
  coins.forEach((c,i)=>{
    c.x-=game.speed;

    if(dist(player.x,player.y,c.x,c.y)<50){
      game.score+=10;
      createParticles(c.x,c.y);
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

  // player glow
  ctx.shadowColor="yellow";
  ctx.shadowBlur=20;
  ctx.fillStyle="yellow";
  ctx.fillRect(player.x,player.y,player.w,player.h);
  ctx.shadowBlur=0;

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

  // particles
  particles.forEach((p,i)=>{
    p.x+=p.vx;
    p.y+=p.vy;
    p.life--;

    ctx.fillStyle="gold";
    ctx.fillRect(p.x,p.y,4,4);

    if(p.life<=0) particles.splice(i,1);
  });
}

// PARTICLES
function createParticles(x,y){
  for(let i=0;i<15;i++){
    particles.push({
      x:x,
      y:y,
      vx:(Math.random()-0.5)*6,
      vy:(Math.random()-0.5)*6,
      life:30
    });
  }
}

// SHAKE
function shake(){
  canvas.style.transform="translate(5px)";
  setTimeout(()=>canvas.style.transform="translate(0)",100);
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
