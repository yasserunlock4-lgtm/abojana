(function(){
  // ══════════════════════════════════════
  // ⚙️ الإعدادات — غيّر الروابط هنا
  // ══════════════════════════════════════
  const TELEGRAM_LINK   = "https://t.me/SS34SS4";
  const YOUTUBE_URL     = "https://www.youtube.com/@YOUR_CHANNEL";   // ← رابط يوتيوب
  const INSTAGRAM_URL   = "https://www.instagram.com/YOUR_ACCOUNT";  // ← رابط انستقرام
  const WIN_TARGET      = 20;
  const MAX_LIVES       = 6;
  // ══════════════════════════════════════

  // مهمات اليومية
  const MISSIONS_DEF = [
    { id:"yt",    icon:"▶️", title:"اشترك في قناة اليوتيوب",   reward:"❤️ حياة + نقاط أكثر",  btnClass:"go-yt",    btnLabel:"اشترك",  action:"youtube" },
    { id:"ig",    icon:"📸", title:"تابع حساب الإنستقرام",     reward:"❤️ حياة + نقاط أكثر",  btnClass:"go-ig",    btnLabel:"تابع",   action:"instagram" },
    { id:"tg",    icon:"📲", title:"انضم لقناة تلقرام",        reward:"❤️ حياة + نقاط أكثر",  btnClass:"go-tg",    btnLabel:"انضم",   action:"telegram" },
    { id:"play",  icon:"🎮", title:"العب 3 جولات اليوم",       reward:"❤️ حياة + نقاط مضاعفة", btnClass:"go-play",  btnLabel:"العب",   action:"play" },
    { id:"share", icon:"🔗", title:"شارك اللعبة مع صديق",     reward:"❤️ حياة + نقاط أكثر",  btnClass:"go-share", btnLabel:"شارك",   action:"share" },
  ];

  // ─── Canvas ───
  const wrapper = document.getElementById("w");
  const canvas  = document.getElementById("gameCanvas");
  const ctx     = canvas.getContext("2d");
  let W=0,H=0;
  const DPR=Math.max(1,Math.min(2,window.devicePixelRatio||1));
  function resizeCanvas(){ W=wrapper.clientWidth; H=wrapper.clientHeight; canvas.width=Math.floor(W*DPR); canvas.height=Math.floor(H*DPR); canvas.style.width=W+"px"; canvas.style.height=H+"px"; ctx.setTransform(DPR,0,0,DPR,0,0); }
  resizeCanvas();
  window.addEventListener("resize",resizeCanvas);
  const groundH=()=>Math.max(70,H*0.14);

  // ─── Toast ───
  let toastTimer;
  function showToast(msg){ const t=document.getElementById("toast"); t.textContent=msg; t.classList.add("show"); clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove("show"),2800); }

  // ─── Date key ───
  function getTodayKey(){ const d=new Date(); return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate(); }

  // ─── Lives ───
  function getLivesData(){ let d=JSON.parse(localStorage.getItem("abuJannaV2Lives")||"{}"); const today=getTodayKey(); if(d.date!==today){ d={date:today,lives:3}; localStorage.setItem("abuJannaV2Lives",JSON.stringify(d)); } return d; }
  function canPlay(){ return getLivesData().lives>0; }
  function useLife(){ const d=getLivesData(); d.lives=Math.max(0,d.lives-1); localStorage.setItem("abuJannaV2Lives",JSON.stringify(d)); refreshLivesUI(); }
  function addLife(n=1){ const d=getLivesData(); d.lives=Math.min(MAX_LIVES,d.lives+n); localStorage.setItem("abuJannaV2Lives",JSON.stringify(d)); refreshLivesUI(); }
  function refreshLivesUI(){
    const lives=getLivesData().lives;
    // HUD
    document.getElementById("livesHUD").textContent="❤️".repeat(lives)+"🖤".repeat(Math.max(0,3-Math.min(3,lives)));
    // rows
    ["startLivesRow","missionsLivesRow"].forEach(id=>{
      const el=document.getElementById(id); if(!el)return;
      el.innerHTML="";
      for(let i=0;i<MAX_LIVES;i++){ const h=document.createElement("span"); h.className="life-heart"+(i>=lives?" empty":""); h.textContent="❤️"; el.appendChild(h); }
    });
  }
  refreshLivesUI();

  // ─── Missions ───
  function getMissionsData(){ let d=JSON.parse(localStorage.getItem("abuJannaV2Missions")||"{}"); const today=getTodayKey(); if(d.date!==today){ d={date:today,yt:false,ig:false,tg:false,play:0,share:false}; localStorage.setItem("abuJannaV2Missions",JSON.stringify(d)); } return d; }
  function saveMissions(d){ localStorage.setItem("abuJannaV2Missions",JSON.stringify(d)); }
  function completedCount(){ const d=getMissionsData(); return [d.yt,d.ig,d.tg,d.share,d.play>=3].filter(Boolean).length; }
  function getBonusMultiplier(){ return completedCount()>=3?2:1; }

  function markMission(id){
    const d=getMissionsData();
    if(id==="yt"    && !d.yt)   { d.yt=true;   saveMissions(d); addLife(1); showToast("✅ مهمة يوتيوب مكتملة! +حياة 💖"); }
    if(id==="ig"    && !d.ig)   { d.ig=true;   saveMissions(d); addLife(1); showToast("✅ مهمة إنستقرام مكتملة! +حياة 💖"); }
    if(id==="tg"    && !d.tg)   { d.tg=true;   saveMissions(d); addLife(1); showToast("✅ مهمة تلقرام مكتملة! +حياة 💖"); }
    if(id==="share" && !d.share){ d.share=true; saveMissions(d); addLife(1); showToast("✅ مهمة المشاركة مكتملة! +حياة 💖"); }
    if(id==="play"  && d.play<3){ const before=d.play<3; d.play=Math.min(3,d.play+1); saveMissions(d); if(d.play>=3&&before){ addLife(1); showToast("✅ لعبت 3 جولات! +حياة 💖"); } }
    if(completedCount()>=3) showToast("⚡ رائع! نقاطك مضاعفة ×2 في الجولة القادمة! 🔥");
    renderMissions();
    refreshLivesUI();
    updateMultiplierBadge();
  }

  function updateMultiplierBadge(){
    const m=getBonusMultiplier();
    const el=document.getElementById("multiplierBadge");
    if(m>=2){ el.classList.remove("hidden"); }
    else    { el.classList.add("hidden"); }
  }

  function renderMissions(){
    const d=getMissionsData();
    const list=document.getElementById("missionsList");
    list.innerHTML="";
    MISSIONS_DEF.forEach(m=>{
      let done=false;
      if(m.id==="yt")    done=d.yt;
      if(m.id==="ig")    done=d.ig;
      if(m.id==="tg")    done=d.tg;
      if(m.id==="play")  done=d.play>=3;
      if(m.id==="share") done=d.share;

      const div=document.createElement("div"); div.className="mission-item";
      const progress=m.id==="play"?` (${Math.min(d.play,3)}/3)`:"";
      div.innerHTML=`
        <div class="mission-icon">${m.icon}</div>
        <div class="mission-info">
          <div class="mission-title">${m.title}</div>
          <div class="mission-reward"><span>${m.reward}</span>${progress}</div>
        </div>
        ${done
          ?`<button class="mission-btn completed">✅ مكتمل</button>`
          :`<button class="mission-btn ${m.btnClass}" data-action="${m.action}" data-id="${m.id}">${m.btnLabel}${progress}</button>`
        }
      `;
      list.appendChild(div);
    });

    // bonus note
    const bonusNote=document.getElementById("bonusNote");
    bonusNote.style.display=completedCount()>=3?"block":"none";

    // attach events
    list.querySelectorAll("button[data-action]").forEach(btn=>{
      btn.addEventListener("click",()=>{
        const action=btn.dataset.action, id=btn.dataset.id;
        if(action==="youtube")   { window.open(YOUTUBE_URL,"_blank");   markMission(id); }
        if(action==="instagram") { window.open(INSTAGRAM_URL,"_blank"); markMission(id); }
        if(action==="telegram")  { window.open(TELEGRAM_LINK,"_blank"); markMission(id); }
        if(action==="play")      { hideAllMenus(); document.getElementById("startScreen").classList.remove("hidden"); }
        if(action==="share"){
          const txt=`🔥 العب لعبة أبو جنة × فوريو وجرّب تكسر ركمي! ${TELEGRAM_LINK}`;
          navigator.clipboard.writeText(txt).catch(()=>{});
          markMission(id); showToast("تم نسخ رابط اللعبة ✅");
        }
      });
    });
  }

  // ─── Best ───
  let best=+localStorage.getItem("abuJannaV2Best")||0;
  document.getElementById("bestValue").textContent=best;
  document.getElementById("goalValue").textContent=WIN_TARGET;
  document.getElementById("startGoalTarget").textContent=WIN_TARGET;

  // ─── Leaderboard ───
  function saveLeaderboard(score){ let b=JSON.parse(localStorage.getItem("abuJannaV2Board")||"[]"); b.push({name:"لاعب",score,time:new Date().toLocaleDateString("ar")}); b.sort((a,c)=>c.score-a.score); b=b.slice(0,10); localStorage.setItem("abuJannaV2Board",JSON.stringify(b)); }
  function renderLeaderboard(){ const b=JSON.parse(localStorage.getItem("abuJannaV2Board")||"[]"); const medals=["🥇","🥈","🥉"]; const el=document.getElementById("leaderboardList"); if(!b.length){ el.innerHTML='<div class="leader-item"><span>لا توجد نتائج بعد</span><span>—</span></div>'; return; } el.innerHTML=b.map((item,i)=>`<div class="leader-item ${i<3?"rank-"+(i+1):""}"><span>${medals[i]||"#"+(i+1)} ${item.name}</span><span>${item.score} نقطة</span></div>`).join(""); }

  // ─── Game State ───
  const game={running:false,over:false,started:false,won:false,score:0,speed:5.8,gravity:0.8,spawnTimer:0,pickupTimer:0,bgOffset:0,particles:[],obstacles:[],pickups:[],flashes:[],multiplier:1};
  const player={x:80,y:0,w:70,h:92,vy:0,jumpPower:-14.5,onGround:true};

  function updateGoalUI(score){ document.getElementById("startGoalNow").textContent=score; document.getElementById("startGoalFill").style.width=Math.min(100,(score/WIN_TARGET)*100)+"%"; }
  function hideAllMenus(){ ["startScreen","gameOverScreen","winScreen","boardScreen","missionsScreen"].forEach(id=>document.getElementById(id).classList.add("hidden")); }
  function goHome(){ game.running=false; game.over=false; hideAllMenus(); document.getElementById("startScreen").classList.remove("hidden"); updateGoalUI(0); refreshLivesUI(); render(); }

  function resetGame(){
    if(!canPlay()){ showToast("❤️ ليس لديك أرواح! أكمل مهمة للحصول على حياة."); hideAllMenus(); document.getElementById("missionsScreen").classList.remove("hidden"); renderMissions(); return; }
    useLife();
    markMission("play");
    game.multiplier=getBonusMultiplier();
    game.running=true; game.over=false; game.started=true; game.won=false;
    game.score=0; game.speed=5.8; game.spawnTimer=0; game.pickupTimer=0; game.bgOffset=0;
    game.particles=[]; game.obstacles=[]; game.pickups=[]; game.flashes=[];
    player.w=Math.min(74,W*0.17); player.h=player.w*1.35;
    player.x=80; player.y=H-groundH()-player.h; player.vy=0; player.onGround=true;
    document.getElementById("scoreValue").textContent="0"; updateGoalUI(0); hideAllMenus();
    updateMultiplierBadge();
    jump();
  }

  // ─── Jump ───
  function jump(){ if(!game.running)return; if(player.onGround){ player.vy=player.jumpPower; player.onGround=false; makeDust(player.x+player.w*0.3,player.y+player.h,8,"#ffffff"); beep(220,0.05,"square"); } else{ player.vy-=1.6; } }

  // ─── End / Win ───
  function endGame(){
    if(game.over)return; game.running=false; game.over=true;
    if(game.score>best){ best=game.score; localStorage.setItem("abuJannaV2Best",best); document.getElementById("bestValue").textContent=best; }
    saveLeaderboard(game.score);
    const mult=game.multiplier>1?` (×${game.multiplier} مضاعف)`:"";
    document.getElementById("finalText").textContent="جبت "+game.score+" نقطة"+mult;
    document.getElementById("gameOverScreen").classList.remove("hidden");
    beep(120,0.12,"sawtooth"); setTimeout(()=>beep(80,0.14,"triangle"),80);
  }
  function winGame(){
    if(game.over)return; game.running=false; game.over=true;
    if(game.score>best){ best=game.score; localStorage.setItem("abuJannaV2Best",best); document.getElementById("bestValue").textContent=best; }
    saveLeaderboard(game.score);
    const mult=game.multiplier>1?` (النقاط كانت مضاعفة ×${game.multiplier} 🔥)`:"";
    document.getElementById("winText").textContent="وصلت إلى "+game.score+" نقطة وفزت"+mult+" 🔥";
    document.getElementById("winScreen").classList.remove("hidden");
    beep(620,0.08,"triangle"); setTimeout(()=>beep(760,0.08,"triangle"),90); setTimeout(()=>beep(920,0.10,"triangle"),180);
  }

  // ─── Helpers ───
  function rand(a,b){ return Math.random()*(b-a)+a; }
  function rectsCollide(a,b){ return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y; }
  function roundRect(x,y,w,h,r,fill){ if(w<2*r)r=w/2; if(h<2*r)r=h/2; ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); if(fill)ctx.fill(); }
  function makeDust(x,y,n,color){ for(let i=0;i<n;i++) game.particles.push({x,y,vx:rand(-2.5,2.5),vy:rand(-3.5,-0.4),r:rand(2,5),a:1,color}); }
  function flashText(text,x,y,color){ game.flashes.push({text,x,y,a:1,vy:-0.55,color}); }

  // ─── Audio ───
  let audioCtx; function beep(freq,time,type){ try{ audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)(); const o=audioCtx.createOscillator(),g=audioCtx.createGain(); o.type=type; o.frequency.value=freq; g.gain.value=0.03; o.connect(g); g.connect(audioCtx.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0001,audioCtx.currentTime+time); o.stop(audioCtx.currentTime+time); }catch(e){} }

  // ─── Spawn ───
  function spawnObstacle(){ const type=Math.random()<0.5?"bag":"barrier"; const scale=rand(0.9,1.15); let o={type,x:W+30,w:type==="bag"?58*scale:74*scale,h:type==="bag"?66*scale:54*scale}; o.y=H-groundH()-o.h+(type==="barrier"?8:0); game.obstacles.push(o); }
  function spawnPickup(){ const size=rand(36,46); const minY=H-groundH()-player.h-80,maxY=H-groundH()-40; game.pickups.push({x:W+20,y:rand(minY,maxY),w:size,h:size*1.9,bob:rand(0,Math.PI*2)}); }

  // ─── Update ───
  function update(){
    if(!game.running)return;
    game.bgOffset+=game.speed*0.6; game.speed+=0.0015;
    player.vy+=game.gravity; player.y+=player.vy;
    const floorY=H-groundH()-player.h;
    if(player.y>=floorY){ if(!player.onGround&&player.vy>4) makeDust(player.x+player.w*0.5,H-groundH(),8,"#ffd54a"); player.y=floorY; player.vy=0; player.onGround=true; }
    game.spawnTimer++; game.pickupTimer++;
    const rate=Math.max(52,90-Math.floor(game.score*0.7));
    if(game.spawnTimer>=rate){ spawnObstacle(); game.spawnTimer=0; }
    if(game.pickupTimer>=65){ spawnPickup(); game.pickupTimer=0; }
    for(let i=game.obstacles.length-1;i>=0;i--){ const o=game.obstacles[i]; o.x-=game.speed; const hp={x:player.x+10,y:player.y+8,w:player.w-20,h:player.h-10}; const ho={x:o.x+6,y:o.y+6,w:o.w-12,h:o.h-10}; if(rectsCollide(hp,ho)){ makeDust(player.x+player.w*0.5,player.y+player.h*0.5,16,"#ff5b5b"); endGame(); } if(o.x+o.w<-40)game.obstacles.splice(i,1); }
    for(let i=game.pickups.length-1;i>=0;i--){
      const p=game.pickups[i]; p.x-=game.speed*1.02; p.bob+=0.08;
      const hp={x:player.x+10,y:player.y+8,w:player.w-20,h:player.h-10};
      const hpu={x:p.x+4,y:p.y+4,w:p.w-8,h:p.h-8};
      if(rectsCollide(hp,hpu)){
        const pts=game.multiplier;
        game.score+=pts; document.getElementById("scoreValue").textContent=game.score; updateGoalUI(game.score);
        makeDust(p.x+p.w/2,p.y+p.h/2,12,"#34d399");
        const flashColor=game.multiplier>=2?"#a855f7":"#34d399";
        flashText(game.multiplier>=2?`+${pts} ⚡`:`+${pts}`,p.x,p.y,flashColor);
        beep(520,0.05,"triangle");
        game.pickups.splice(i,1);
        if(game.score>=WIN_TARGET) winGame();
        continue;
      }
      if(p.x+p.w<-40) game.pickups.splice(i,1);
    }
    for(let i=game.particles.length-1;i>=0;i--){ const p=game.particles[i]; p.x+=p.vx; p.y+=p.vy; p.vy+=0.12; p.a-=0.03; if(p.a<=0)game.particles.splice(i,1); }
    for(let i=game.flashes.length-1;i>=0;i--){ const f=game.flashes[i]; f.y+=f.vy; f.a-=0.02; if(f.a<=0)game.flashes.splice(i,1); }
  }

  // ─── Draw Background ───
  function drawBackground(){
    for(let i=0;i<16;i++){ const x=((i*170)-(game.bgOffset*(0.15+i*0.005)))%(W+200); const y=40+(i*37)%(H*0.55); ctx.beginPath(); ctx.fillStyle="rgba(255,255,255,.08)"; ctx.arc(x,y,(i%3)+1.5,0,Math.PI*2); ctx.fill(); }
    for(let i=0;i<8;i++){ const bx=((i*220)-game.bgOffset*0.35)%(W+260)-120; const bw=70+(i%3)*26,bh=100+(i*23%160); const by=H-groundH()-bh; const g=ctx.createLinearGradient(bx,by,bx,by+bh); g.addColorStop(0,"rgba(255,255,255,.06)"); g.addColorStop(1,"rgba(255,255,255,.02)"); ctx.fillStyle=g; roundRect(bx,by,bw,bh,8,true); }
    const gy=H-groundH(); const grd=ctx.createLinearGradient(0,gy,0,H); grd.addColorStop(0,"#4b2a18"); grd.addColorStop(1,"#25160e"); ctx.fillStyle=grd; ctx.fillRect(0,gy,W,groundH());
    for(let i=0;i<Math.ceil(W/45)+3;i++){ const x=(i*45-(game.bgOffset*1.2)%45)-10; ctx.fillStyle="rgba(255,255,255,.06)"; ctx.fillRect(x,gy+groundH()*0.66,24,4); }
  }

  // ─── Draw Player (أبو جنة) ───
  function drawPlayer(){
    const x=player.x,y=player.y,w=player.w,h=player.h;
    const t=game.bgOffset*0.18;
    const ls=player.onGround?Math.sin(t)*0.38:0;
    const as=player.onGround?Math.sin(t+Math.PI)*0.3:0;
    // aura if multiplier active
    if(game.multiplier>=2){
      ctx.save();
      const aura=ctx.createRadialGradient(x+w/2,y+h/2,5,x+w/2,y+h/2,w*1.1);
      aura.addColorStop(0,"rgba(168,85,247,.25)"); aura.addColorStop(1,"rgba(168,85,247,0)");
      ctx.fillStyle=aura; ctx.beginPath(); ctx.ellipse(x+w/2,y+h/2,w*1.1,h*0.7,0,0,Math.PI*2); ctx.fill(); ctx.restore();
    }
    ctx.beginPath(); ctx.fillStyle="rgba(0,0,0,.25)"; ctx.ellipse(x+w/2,H-groundH()+7,w*0.3,8,0,0,Math.PI*2); ctx.fill();
    // back leg
    ctx.save(); ctx.translate(x+w*0.54,y+h*0.54); ctx.rotate(-ls); ctx.fillStyle="#0a1020"; roundRect(-w*0.09,0,w*0.18,h*0.26,w*0.05,true); ctx.fillStyle="#1a1a2e"; roundRect(-w*0.12,h*0.25,w*0.24,h*0.1,w*0.04,true); ctx.restore();
    // back arm
    ctx.save(); ctx.translate(x+w*0.68,y+h*0.3); ctx.rotate(as+0.35); ctx.fillStyle="#c8905a"; roundRect(-w*0.07,0,w*0.14,h*0.24,w*0.05,true); ctx.restore();
    // body
    ctx.fillStyle="#101827"; roundRect(x+w*0.2,y+h*0.27,w*0.6,h*0.3,w*0.08,true);
    ctx.fillStyle="#ffb703"; roundRect(x+w*0.24,y+h*0.3,w*0.52,h*0.24,w*0.07,true);
    ctx.fillStyle="#231200"; ctx.font=`bold ${Math.max(9,w*0.1)}px Tahoma`; ctx.textAlign="center";
    ctx.fillText("AJ",x+w*0.5,y+h*0.47);
    // front leg
    ctx.save(); ctx.translate(x+w*0.42,y+h*0.54); ctx.rotate(ls); ctx.fillStyle="#101827"; roundRect(-w*0.09,0,w*0.18,h*0.26,w*0.05,true); ctx.fillStyle="#333"; roundRect(-w*0.12,h*0.25,w*0.24,h*0.1,w*0.04,true); ctx.restore();
    // front arm
    ctx.save(); ctx.translate(x+w*0.28,y+h*0.3); ctx.rotate(-as-0.35); ctx.fillStyle="#f3c89d"; roundRect(-w*0.07,0,w*0.14,h*0.24,w*0.05,true); ctx.restore();
    // head
    ctx.fillStyle="#f3c89d"; ctx.beginPath(); ctx.arc(x+w*0.5,y+h*0.18,w*0.19,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#2a1b12"; ctx.beginPath(); ctx.arc(x+w*0.5,y+h*0.15,w*0.2,Math.PI,0); ctx.fill();
    ctx.fillStyle="#111"; ctx.beginPath(); ctx.arc(x+w*0.45,y+h*0.19,2,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x+w*0.56,y+h*0.19,2,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle="#2a1b12"; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(x+w*0.5,y+h*0.22,w*0.06,0.1,Math.PI-0.1); ctx.stroke();
  }

  // ─── Draw Foury Can ───
  function drawPickup(p){
    const x=p.x, y=p.y+Math.sin(p.bob)*5, w=p.w, h=p.h;
    // purple aura if multiplier
    const glowColor=game.multiplier>=2?"rgba(168,85,247,.35)":"rgba(52,211,153,.28)";
    const glow=ctx.createRadialGradient(x+w/2,y+h/2,2,x+w/2,y+h/2,w*1.3);
    glow.addColorStop(0,glowColor); glow.addColorStop(1,"rgba(52,211,153,0)");
    ctx.fillStyle=glow; ctx.beginPath(); ctx.arc(x+w/2,y+h/2,w*1.3,0,Math.PI*2); ctx.fill();
    // can body
    const bg=ctx.createLinearGradient(x,y,x+w,y); bg.addColorStop(0,"#1aad74"); bg.addColorStop(0.5,"#22d68f"); bg.addColorStop(1,"#1aad74");
    ctx.fillStyle=bg; roundRect(x,y,w,h,w*0.2,true);
    // top/bottom
    ctx.fillStyle="#0e7a53"; ctx.fillRect(x+w*0.05,y,w*0.9,h*0.08); ctx.fillRect(x+w*0.05,y+h*0.92,w*0.9,h*0.08);
    // label
    ctx.fillStyle="rgba(255,255,255,.18)"; roundRect(x+w*0.1,y+h*0.14,w*0.8,h*0.62,w*0.1,true);
    ctx.fillStyle="#fff"; ctx.font=`bold ${Math.max(8,w*0.28)}px Tahoma`; ctx.textAlign="center";
    ctx.fillText("4U",x+w/2,y+h*0.52);
    ctx.fillStyle="rgba(255,255,255,.7)"; ctx.font=`${Math.max(6,w*0.18)}px Tahoma`;
    ctx.fillText("FOURY",x+w/2,y+h*0.67);
    // shine
    ctx.fillStyle="rgba(255,255,255,.15)"; roundRect(x+w*0.15,y+h*0.12,w*0.2,h*0.6,w*0.08,true);
    // multiplier star
    if(game.multiplier>=2){ ctx.font=`${Math.max(10,w*0.35)}px Tahoma`; ctx.fillText("⚡",x+w/2,y-6); }
  }

  // ─── Draw Obstacle ───
  function drawObstacle(o){
    const x=o.x,y=o.y,w=o.w,h=o.h;
    ctx.beginPath(); ctx.fillStyle="rgba(0,0,0,.22)"; ctx.ellipse(x+w/2,H-groundH()+7,w*0.34,8,0,0,Math.PI*2); ctx.fill();
    if(o.type==="bag"){
      const g=ctx.createLinearGradient(x,y,x,y+h); g.addColorStop(0,"#f5f1e6"); g.addColorStop(1,"#d8cdb8");
      ctx.fillStyle=g; roundRect(x,y,w,h,10,true);
      ctx.fillStyle="#7d5d2f"; ctx.font=`bold ${Math.max(10,w*0.17)}px Tahoma`; ctx.textAlign="center";
      ctx.fillText("جبس",x+w/2,y+h*0.42); ctx.fillText("🚫",x+w/2,y+h*0.68);
      ctx.strokeStyle="rgba(90,60,20,.25)"; ctx.lineWidth=2; ctx.strokeRect(x+6,y+6,w-12,h-12);
    } else {
      ctx.fillStyle="#ff4b7d"; roundRect(x,y+h*0.2,w,h*0.8,10,true);
      ctx.fillStyle="#ffd54a";
      for(let i=0;i<4;i++){ ctx.save(); ctx.translate(x+10+i*(w/4),y+h*0.62); ctx.rotate(-0.55); ctx.fillRect(0,0,10,h*0.55); ctx.restore(); }
    }
  }

  // ─── Render ───
  function drawParticles(){ for(const p of game.particles){ ctx.globalAlpha=p.a; ctx.beginPath(); ctx.fillStyle=p.color; ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill(); } ctx.globalAlpha=1; }
  function drawFlashes(){ for(const f of game.flashes){ ctx.globalAlpha=f.a; ctx.fillStyle=f.color; ctx.font="bold 19px Tahoma"; ctx.textAlign="center"; ctx.fillText(f.text,f.x,f.y); } ctx.globalAlpha=1; }
  function drawHint(){ if(!game.started||!game.running)return; ctx.save(); ctx.globalAlpha=.13; ctx.fillStyle="#fff"; ctx.font="bold 13px Tahoma"; ctx.textAlign="center"; ctx.fillText("اضغط للقفز",W/2,34); ctx.restore(); }
  function render(){ ctx.clearRect(0,0,W,H); drawBackground(); for(const p of game.pickups) drawPickup(p); for(const o of game.obstacles) drawObstacle(o); drawPlayer(); drawParticles(); drawFlashes(); drawHint(); }

  // ─── Loop ───
  let lastTime=0; const FRAME_TIME=1000/60;
  function loop(ts){ requestAnimationFrame(loop); const dt=Math.min(ts-lastTime,50); if(dt<FRAME_TIME*0.8)return; lastTime=ts; update(); render(); }
  requestAnimationFrame(loop);

  // ─── Input ───
  function handleTap(){ if(!game.started)return; if(game.running)jump(); }
  let lastTapTime=0;
  document.getElementById("tapZone").addEventListener("touchstart",(e)=>{ e.preventDefault(); const now=Date.now(); if(now-lastTapTime<120)return; lastTapTime=now; handleTap(); },{passive:false});
  document.getElementById("tapZone").addEventListener("mousedown",(e)=>{ e.preventDefault(); handleTap(); });
  window.addEventListener("keydown",(e)=>{ if((e.code==="Space"||e.code==="ArrowUp")&&game.running){ e.preventDefault(); handleTap(); } });

  // ─── Buttons ───
  document.getElementById("startBtn").addEventListener("click",()=>resetGame());
  document.getElementById("restartBtn").addEventListener("click",()=>resetGame());
  document.getElementById("playAgainBtn").addEventListener("click",()=>resetGame());
  document.getElementById("playFromMissionsBtn").addEventListener("click",()=>resetGame());

  document.getElementById("missionsBtn").addEventListener("click",()=>{ renderMissions(); refreshLivesUI(); hideAllMenus(); document.getElementById("missionsScreen").classList.remove("hidden"); });
  document.getElementById("missionsLoseBtn").addEventListener("click",()=>{ renderMissions(); refreshLivesUI(); hideAllMenus(); document.getElementById("missionsScreen").classList.remove("hidden"); });
  document.getElementById("closeMissionsBtn").addEventListener("click",goHome);

  document.getElementById("howBtn").addEventListener("click",()=>{ showToast("اضغط الشاشة للقفز، اجمع علب فوريو، وتجنب العوائق. أكمل المهمات للحصول على نقاط مضاعفة! 🔥"); });

  document.getElementById("shareBtn").addEventListener("click",async()=>{ const t="جبت "+game.score+" نقطة بلعبة أبو جنة × فوريو 🔥 جرّب تكسر ركمي!"; try{ await navigator.clipboard.writeText(t); showToast("تم نسخ النتيجة ✅"); }catch(e){ alert(t); } });
  document.getElementById("shareWinBtn").addEventListener("click",async()=>{ const t="🏆 فزت بلعبة أبو جنة × فوريو وجبت "+game.score+" نقطة 🔥"; try{ await navigator.clipboard.writeText(t); showToast("تم نسخ الرسالة ✅"); }catch(e){} });

  ["openChannelBtn","openChannelLoseBtn"].forEach(id=>document.getElementById(id)?.addEventListener("click",()=>window.open(TELEGRAM_LINK,"_blank")));
  document.getElementById("sendWinTelegramBtn").addEventListener("click",()=>{ const t=`🏆 فزت بلعبة أبو جنة × فوريو وجبت ${game.score} نقطة! 🔥`; window.open(`https://t.me/SS34SS4?text=${encodeURIComponent(t)}`,"_blank"); });

  ["ytLoseBtn","ytWinBtn"].forEach(id=>document.getElementById(id)?.addEventListener("click",()=>window.open(YOUTUBE_URL,"_blank")));
  ["igLoseBtn","igWinBtn"].forEach(id=>document.getElementById(id)?.addEventListener("click",()=>window.open(INSTAGRAM_URL,"_blank")));

  document.getElementById("homeBtn").addEventListener("click",goHome);
  document.getElementById("homeWinBtn").addEventListener("click",goHome);

  document.getElementById("showBoardBtn").addEventListener("click",()=>{ renderLeaderboard(); hideAllMenus(); document.getElementById("boardScreen").classList.remove("hidden"); });
  document.getElementById("closeBoardBtn").addEventListener("click",goHome);

  // init
  renderMissions(); updateMultiplierBadge(); updateGoalUI(0); render();
})();
