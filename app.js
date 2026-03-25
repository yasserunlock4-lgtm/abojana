import { db, ref, get, set } from './firebase.js';

const tg = window.Telegram.WebApp;
tg.expand();

const userId = tg.initDataUnsafe?.user?.id || "test_user";

let coins = 0;

const result = document.getElementById("result");
const spinBtn = document.getElementById("spinBtn");
const joinBtn = document.getElementById("joinBtn");

// جلب النقاط
async function loadCoins() {
  const snapshot = await get(ref(db, "users/" + userId));
  if (snapshot.exists()) {
    coins = snapshot.val().coins || 0;
  }
  result.innerText = "النقاط: " + coins;
}

// حفظ النقاط
async function saveCoins() {
  await set(ref(db, "users/" + userId), {
    coins: coins
  });
}

// الاشتراك بالقناة
joinBtn.onclick = async () => {
  const snap = await get(ref(db, "config/channel"));
  const channel = snap.val();

  window.open(channel, "_blank");
};

// عجلة الحظ
spinBtn.onclick = () => {
  const reward = Math.floor(Math.random() * 100);

  coins += reward;
  result.innerText = "ربحت: " + reward + " نقطة";

  saveCoins();
};

loadCoins();
