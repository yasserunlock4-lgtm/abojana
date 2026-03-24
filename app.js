// ================= Firebase =================
const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_ID",
};

const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ================= بيانات المستخدم =================
let user = JSON.parse(localStorage.getItem("user")) || {
  score: 0,
  best: 0,
  attempts: 3,
};

function saveUser() {
  localStorage.setItem("user", JSON.stringify(user));
}

// ================= نظام المهمات =================
const tasks = [
  { id: 1, title: "اشترك بالقناة", reward: 1 },
  { id: 2, title: "شارك اللعبة", reward: 1 },
];

function completeTask(id) {
  user.attempts += 1;
  saveUser();
  alert("🔥 حصلت على محاولة إضافية!");
}

// ================= حفظ السكور =================
function saveScore(score) {
  db.collection("players").add({
    score: score,
    date: new Date(),
  });
}

// ================= leaderboard =================
async function loadLeaderboard() {
  const snapshot = await db.collection("players")
    .orderBy("score", "desc")
    .limit(10)
    .get();

  let list = document.getElementById("leaderboardList");
  list.innerHTML = "";

  snapshot.forEach(doc => {
    let d = doc.data();
    list.innerHTML += `<div>${d.score}</div>`;
  });
}

// ================= اللعبة =================
let score = 0;

function startGame() {
  if (user.attempts <= 0) {
    alert("❌ خلصت محاولاتك! كمل مهمة حتى تلعب");
    return;
  }

  user.attempts--;
  saveUser();

  score = 0;
  console.log("Game Started");
}

// ================= الفوز =================
function winGame() {
  saveScore(score);

  if (score > user.best) {
    user.best = score;
    saveUser();
  }

  alert("🎉 فزت!");
}

// ================= تشغيل =================
window.onload = () => {
  document.getElementById("startBtn").onclick = startGame;
};
