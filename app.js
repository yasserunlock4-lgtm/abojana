import { db, ref, get, set, update } from "./firebase.js";

const tg = window.Telegram?.WebApp;
if (tg) {
  tg.expand();
}

const userId = tg?.initDataUnsafe?.user?.id || "user_" + Math.random();
const spinBtn = document.getElementById("spinBtn");
const resultBox = document.getElementById("resultBox");
const tasksBox = document.getElementById("tasksBox");
const coinsEl = document.getElementById("coinsValue");
const spinsEl = document.getElementById("spinsValue");

const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");

let coins = 0;
let spins = 5;
let isSpinning = false;
let rotation = 0;

// 🔥 اخفاء زر اللعب بالبداية
spinBtn.style.display = "none";

// 🎯 الجوائز
const rewards = [10, 20, 50, 100, 200, 500];

// رسم العجلة
function drawWheel() {
  const arc = (Math.PI * 2) / rewards.length;

  for (let i = 0; i < rewards.length; i++) {
    ctx.beginPath();
    ctx.fillStyle = i % 2 ? "#ff4b7d" : "#ffd54a";
    ctx.moveTo(180, 180);
    ctx.arc(180, 180, 160, i * arc, (i + 1) * arc);
    ctx.fill();

    ctx.fillStyle = "#000";
    ctx.font = "18px Arial";
    ctx.fillText(rewards[i], 160 + Math.cos(i * arc) * 90, 160 + Math.sin(i * arc) * 90);
  }
}

drawWheel();

// تحميل بيانات المستخدم
async function loadUser() {
  const snap = await get(ref(db, "users/" + userId));

  if (snap.exists()) {
    const data = snap.val();
    coins = data.coins || 0;
    spins = data.spins || 5;
  }

  updateUI();
}

// حفظ
async function saveUser() {
  await set(ref(db, "users/" + userId), {
    coins,
    spins
  });
}

// تحديث واجهة
function updateUI() {
  coinsEl.innerText = coins;
  spinsEl.innerText = spins;
}

// 🎡 دوران العجلة
spinBtn.onclick = () => {
  if (isSpinning) return;

  if (spins <= 0) {
    resultBox.innerText = "❌ انتهت المحاولات";
    return;
  }

  isSpinning = true;
  spins--;

  let deg = Math.floor(Math.random() * 360 + 1000);
  canvas.style.transition = "transform 4s ease-out";
  canvas.style.transform = "rotate(" + deg + "deg)";

  setTimeout(() => {
    const reward = rewards[Math.floor(Math.random() * rewards.length)];
    coins += reward;

    resultBox.innerText = "🔥 ربحت " + reward + " نقطة";

    saveUser();
    updateUI();

    isSpinning = false;
  }, 4000);
};

// ==================
// 🔥 نظام المهام
// ==================

async function loadTasks() {
  const snap = await get(ref(db, "tasks"));

  if (!snap.exists()) return;

  tasksBox.innerHTML = "";

  snap.forEach(child => {
    const task = child.val();

    const div = document.createElement("div");
    div.style.margin = "10px";
    div.style.padding = "10px";
    div.style.background = "#222";
    div.style.borderRadius = "10px";

    div.innerHTML = `
      <p>${task.title} (+${task.reward})</p>
      <button onclick="openTask('${task.link}')">فتح</button>
      <button onclick="completeTask('${child.key}', ${task.reward})">تحقق</button>
    `;

    tasksBox.appendChild(div);
  });

  checkTasks();
}

// فتح المهمة
window.openTask = function (link) {
  window.open(link, "_blank");
};

// اكمال المهمة
window.completeTask = async function (taskId, reward) {
  const taskRef = ref(db, "users/" + userId + "/tasks/" + taskId);
  const snap = await get(taskRef);

  if (snap.exists()) {
    alert("❌ نفذت المهمة سابقاً");
    return;
  }

  coins += reward;

  await set(taskRef, true);
  await saveUser();

  alert("🔥 حصلت على " + reward + " نقطة");

  updateUI();
  checkTasks();
};

// تحقق من كل المهام
async function checkTasks() {
  const userTasks = await get(ref(db, "users/" + userId + "/tasks"));
  const allTasks = await get(ref(db, "tasks"));

  if (!allTasks.exists()) return;

  const total = Object.keys(allTasks.val()).length;
  const done = userTasks.exists() ? Object.keys(userTasks.val()).length : 0;

  if (done >= total) {
    spinBtn.style.display = "block";
  }
}

// ==================
// 🚀 تشغيل التطبيق
// ==================

loadUser();
loadTasks();
