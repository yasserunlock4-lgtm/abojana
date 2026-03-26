let userId = "user_" + Math.floor(Math.random() * 1000000);
let balance = 0;
let spins = 5;

const rewards = [10,20,30,50,100];

async function loadUser(){
  const snapshot = await get(ref(db, "users/" + userId));
  if(snapshot.exists()){
    const data = snapshot.val();
    balance = data.balance || 0;
    spins = data.spins || 5;
  } else {
    saveUser();
    showStartTasks();
  }
  updateUI();
}

function saveUser(){
  set(ref(db, "users/" + userId), {
    balance: balance,
    spins: spins
  });
}

function updateUI(){
  document.getElementById("balance").innerText = balance;
}

document.getElementById("spinBtn").onclick = function(){

  if(spins <= 0){
    alert("خلصت المحاولات اليوم");
    return;
  }

  spins--;

  let reward = rewards[Math.floor(Math.random()*rewards.length)];
  balance += reward;

  document.getElementById("result").innerText =
    "ربحت " + reward + " دينار 🔥";

  if(balance >= 500){
    showTasks();
  }

  if(balance >= 100000){
    document.getElementById("withdrawBtn").style.display = "block";
  }

  saveUser();
  updateUI();
};

document.getElementById("withdrawBtn").onclick = function(){
  window.open("https://t.me/YOUR_USERNAME");
};

function showStartTasks(){
  document.getElementById("tasks").innerHTML = `
    <h3>🚀 اشترك أولاً</h3>
    <a href="https://t.me/channel1">قناة 1</a><br>
    <a href="https://t.me/channel2">قناة 2</a>
  `;
}

function showTasks(){
  document.getElementById("tasks").innerHTML = `
    <h3>🔥 اشترك حتى تكمل</h3>
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
