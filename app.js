let tg = window.Telegram?.WebApp;
if(tg){ tg.ready(); tg.expand(); }

let userId = tg?.initDataUnsafe?.user?.id || "user_" + Math.random();

let balance = 0;
let spins = 5;

const rewards = [10,20,30,50,100];

async function loadUser(){
  try{
    let snap = await get(ref(db,"users/"+userId));

    if(snap.exists()){
      let data = snap.val();
      balance = data.balance || 0;
      spins = data.spins || 5;
    }else{
      showStartTasks();
    }

    updateUI();
  }catch(e){
    console.log("Firebase error",e);
  }
}

function updateUI(){
  document.getElementById("balance").innerText = balance;

  if(balance >= 100000){
    document.getElementById("withdrawBtn").style.display="block";
  }
}

function saveUser(){
  set(ref(db,"users/"+userId),{
    balance,
    spins
  });
}

document.getElementById("spinBtn").onclick = function(){

  if(spins <= 0){
    alert("خلصت لفات اليوم");
    return;
  }

  spins--;

  let win = rewards[Math.floor(Math.random()*rewards.length)];
  balance += win;

  document.getElementById("result").innerText =
    "🔥 ربحت " + win + " دينار";

  if(balance >= 500){
    showTasks();
  }

  saveUser();
  updateUI();
};

document.getElementById("withdrawBtn").onclick = function(){
  window.open("https://t.me/YOUR_USERNAME");
};

function showStartTasks(){
  document.getElementById("tasks").innerHTML = `
  <h3>اشترك أولاً</h3>
  <a href="https://t.me/channel1">قناة 1</a><br>
  <a href="https://t.me/channel2">قناة 2</a>
  `;
}

function showTasks(){
  document.getElementById("tasks").innerHTML = `
  <h3>اشترك حتى تكمل</h3>
  <a href="#">قناة 1</a><br>
  <a href="#">قناة 2</a><br>
  <a href="#">قناة 3</a><br>
  <a href="#">قناة 4</a><br>
  <a href="#">قناة 5</a><br>
  <a href="#">قناة 6</a><br>
  <a href="#">قناة 7</a><br>
  <a href="#">قناة 8</a><br>
  <a href="#">قناة 9</a><br>
  <a href="#">قناة 10</a>
  `;
}

loadUser();
