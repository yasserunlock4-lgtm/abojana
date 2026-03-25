import { db, ref, get, set } from './firebase.js';

const tg = window.Telegram.WebApp;
tg.expand();

const userId = tg.initDataUnsafe?.user?.id || "test";

let coins = 0;
let spins = 5;

const coinEl = document.getElementById("coins");
const spinEl = document.getElementById("spins");
const result = document.getElementById("result");

const wheel = document.getElementById("wheel");
const ctx = wheel.getContext("2d");

const rewards = [10,20,50,100,200,500];

function drawWheel(){
  const arc = Math.PI * 2 / rewards.length;
  rewards.forEach((r,i)=>{
    ctx.beginPath();
    ctx.fillStyle = i % 2 ? "#ff4b7d" : "#ffd54a";
    ctx.moveTo(160,160);
    ctx.arc(160,160,150,i*arc,(i+1)*arc);
    ctx.fill();

    ctx.fillStyle = "#000";
    ctx.font = "16px sans-serif";
    ctx.fillText(r,140 + Math.cos(i*arc)*80,140 + Math.sin(i*arc)*80);
  });
}

drawWheel();

// تحميل البيانات
async function load(){
  const snap = await get(ref(db,"users/"+userId));
  if(snap.exists()){
    coins = snap.val().coins || 0;
    spins = snap.val().spins || 5;
  }
  updateUI();
}

function updateUI(){
  coinEl.innerText = coins;
  spinEl.innerText = spins;
}

// حفظ
async function save(){
  await set(ref(db,"users/"+userId),{
    coins,spins
  });
}

// زر الاشتراك
document.getElementById("joinBtn").onclick = async ()=>{
  const snap = await get(ref(db,"config/channel"));
  const link = snap.val();
  window.open(link,"_blank");
};

// دوران
document.getElementById("spinBtn").onclick = ()=>{
  if(spins <= 0){
    result.innerText = "❌ انتهت المحاولات";
    return;
  }

  spins--;

  const reward = rewards[Math.floor(Math.random()*rewards.length)];
  coins += reward;

  result.innerText = "🔥 ربحت "+reward+" نقطة";

  tg.HapticFeedback.impactOccurred("heavy");

  save();
  updateUI();
};

load();
