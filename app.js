import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* =========================
   1) Firebase config
   بدّل القيم بمعلومات مشروعك
========================= */
const firebaseConfig = {
  apiKey: "PUT_YOUR_API_KEY",
  authDomain: "PUT_YOUR_AUTH_DOMAIN",
  projectId: "PUT_YOUR_PROJECT_ID",
  storageBucket: "PUT_YOUR_STORAGE_BUCKET",
  messagingSenderId: "PUT_YOUR_MESSAGING_SENDER_ID",
  appId: "PUT_YOUR_APP_ID"
};

const BOT_USERNAME = "YourBotUsername"; // بدون @
const MIN_WITHDRAW_IQD = 100000;
const DAILY_REWARD_POINTS = 250;
const DAILY_HIT_REWARD = 1000;
const DAILY_HIT_LOSS_PERCENT = 0.5;
const BOX_ENERGY_COST = 15;
const MAX_ENERGY = 100;
const ENERGY_REGEN_PER_HOUR = 10;
const POINTS_TO_IQD_DIVISOR = 100; // كل 1000 نقطة = 10 د.ع => floor(points/100)*1? سنستخدم المعادلة أدناه

const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* =========================
   2) عناصر الصفحة
========================= */
const pointsValue = document.getElementById("pointsValue");
const balanceValue = document.getElementById("balanceValue");
const energyValue = document.getElementById("energyValue");
const energyFill = document.getElementById("energyFill");
const energyHint = document.getElementById("energyHint");

const dailyRewardBtn = document.getElementById("dailyRewardBtn");
const hitBtn = document.getElementById("hitBtn");
const boxBtn = document.getElementById("boxBtn");
const referralBtn = document.getElementById("referralBtn");
const convertBtn = document.getElementById("convertBtn");
const withdrawBtn = document.getElementById("withdrawBtn");

const dailyTasksEl = document.getElementById("dailyTasks");
const tasksStatus = document.getElementById("tasksStatus");
const channelsList = document.getElementById("channelsList");
const channelsBatchLabel = document.getElementById("channelsBatchLabel");

const userIdValue = document.getElementById("userIdValue");
const userNameValue = document.getElementById("userNameValue");
const refLinkValue = document.getElementById("refLinkValue");

const toastEl = document.getElementById("toast");

/* =========================
   3) هوية المستخدم
========================= */
function getTelegramUser() {
  const u = tg?.initDataUnsafe?.user;
  if (u?.id) {
    return {
      uid: String(u.id),
      name: [u.first_name, u.last_name].filter(Boolean).join(" ") || "مستخدم تيليجرام",
      username: u.username ? `@${u.username}` : "بدون يوزر"
    };
  }

  let localUid = localStorage.getItem("local_uid");
  if (!localUid) {
    localUid = "web_" + Math.random().toString(36).slice(2, 12);
    localStorage.setItem("local_uid", localUid);
  }

  return {
    uid: localUid,
    name: "زائر ويب",
    username: "بدون يوزر"
  };
}

const currentUser = getTelegramUser();
const userRef = doc(db, "users", currentUser.uid);
const configRef = doc(db, "app_config", "main");

/* =========================
   4) الحالة المحلية
========================= */
let state = {
  uid: currentUser.uid,
  name: currentUser.name,
  username: currentUser.username,
  points: 0,
  balanceIQD: 0,
  energy: MAX_ENERGY,
  lastEnergyUpdate: Date.now(),
  lastDailyRewardAt: 0,
  lastHitAt: 0,
  installAt: Date.now(),
  completedTaskIds: [],
  joinedChannelIds: [],
  referrals: 0,
  withdrawals: [],
  refClaimedFrom: [],
  channelsBatch1: [],
  channelsBatch2: [],
  dailyTasks: []
};

/* =========================
   5) أدوات مساعدة
========================= */
function now() {
  return Date.now();
}

function showToast(text) {
  toastEl.textContent = text;
  toastEl.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    toastEl.classList.remove("show");
  }, 2600);
}

function sameDay(ts1, ts2) {
  const a = new Date(ts1);
  const b = new Date(ts2);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function hoursBetween(a, b) {
  return Math.floor((b - a) / (1000 * 60 * 60));
}

function regenerateEnergy() {
  const current = now();
  const passedHours = hoursBetween(state.lastEnergyUpdate || current, current);
  if (passedHours > 0) {
    state.energy = Math.min(MAX_ENERGY, state.energy + passedHours * ENERGY_REGEN_PER_HOUR);
    state.lastEnergyUpdate = current;
  }
}

function formatIQD(n) {
  return `${Number(n || 0).toLocaleString("en-US")} د.ع`;
}

function buildReferralLink() {
  return `https://t.me/${BOT_USERNAME}?startapp=ref_${state.uid}`;
}

function getAvailableChannels() {
  const oneDayPassed = now() - state.installAt >= 24 * 60 * 60 * 1000;
  channelsBatchLabel.textContent = oneDayPassed ? "الدفعة 1 + 2" : "الدفعة 1";
  return oneDayPassed
    ? [...state.channelsBatch1, ...state.channelsBatch2]
    : [...state.channelsBatch1];
}

/* =========================
   6) واجهة
========================= */
function renderHeader() {
  regenerateEnergy();

  pointsValue.textContent = Number(state.points).toLocaleString("en-US");
  balanceValue.textContent = formatIQD(state.balanceIQD);
  energyValue.textContent = `${state.energy}/${MAX_ENERGY}`;
  energyFill.style.width = `${Math.max(0, Math.min(100, (state.energy / MAX_ENERGY) * 100))}%`;
  energyHint.textContent = `تتجدد ${ENERGY_REGEN_PER_HOUR} طاقة كل ساعة`;

  userIdValue.textContent = state.uid;
  userNameValue.textContent = `${state.name} - ${state.username}`;
  refLinkValue.textContent = buildReferralLink();
}

function renderTasks() {
  dailyTasksEl.innerHTML = "";
  let done = 0;

  state.dailyTasks.forEach(task => {
    const completed = state.completedTaskIds.includes(task.id);
    if (completed) done++;

    const item = document.createElement("div");
    item.className = "item";

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.innerHTML = `
      <b>${task.title}</b>
      <small>${task.rewardPoints} نقطة</small>
    `;

    const btn = document.createElement("button");
    btn.textContent = completed ? "تم الإنجاز" : "نفّذ المهمة";
    btn.className = completed ? "done-btn" : "";
    btn.disabled = completed;

    btn.onclick = async () => {
      if (completed) return;

      if (task.type === "open_link" && task.url) {
        if (tg?.openTelegramLink && task.url.startsWith("https://t.me/")) {
          tg.openTelegramLink(task.url);
        } else {
          window.open(task.url, "_blank");
        }
      }

      state.points += task.rewardPoints;
      state.completedTaskIds.push(task.id);

      await saveUser();
      renderAll();
      showToast(`تمت إضافة ${task.rewardPoints} نقطة`);
    };

    item.appendChild(meta);
    item.appendChild(btn);
    dailyTasksEl.appendChild(item);
  });

  tasksStatus.textContent = `${done}/${state.dailyTasks.length}`;
}

function renderChannels() {
  channelsList.innerHTML = "";
  const channels = getAvailableChannels();

  if (!channels.length) {
    channelsList.innerHTML = `<div class="item"><div class="meta"><b>لا توجد قنوات حالياً</b><small>أضفها من Firebase</small></div></div>`;
    return;
  }

  channels.forEach(ch => {
    const joined = state.joinedChannelIds.includes(ch.id);

    const item = document.createElement("div");
    item.className = "item";

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.innerHTML = `
      <b>${ch.title}</b>
      <small>${joined ? "تمت الإضافة سابقاً" : `المكافأة: ${ch.rewardPoints} نقطة`}</small>
    `;

    const btn = document.createElement(joined ? "button" : "a");
    btn.textContent = joined ? "تم" : "اشترك";
    btn.className = joined ? "done-btn" : "";
    if (!joined) {
      btn.href = ch.url;
      btn.target = "_blank";
      btn.rel = "noopener noreferrer";
    } else {
      btn.disabled = true;
    }

    btn.onclick = async (e) => {
      if (joined) return;
      // نعطيه اشتراك يدوي بسيط بعد الضغط
      setTimeout(async () => {
        if (!state.joinedChannelIds.includes(ch.id)) {
          state.joinedChannelIds.push(ch.id);
          state.points += Number(ch.rewardPoints || 0);
          await saveUser();
          renderAll();
          showToast(`تمت إضافة ${ch.rewardPoints} نقطة من ${ch.title}`);
        }
      }, 1500);
    };

    item.appendChild(meta);
    item.appendChild(btn);
    channelsList.appendChild(item);
  });
}

function renderAll() {
  renderHeader();
  renderTasks();
  renderChannels();
}

/* =========================
   7) Firestore
========================= */
async function ensureUser() {
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    await setDoc(userRef, {
      uid: state.uid,
      name: state.name,
      username: state.username,
      points: 0,
      balanceIQD: 0,
      energy: MAX_ENERGY,
      lastEnergyUpdate: now(),
      lastDailyRewardAt: 0,
      lastHitAt: 0,
      installAt: now(),
      completedTaskIds: [],
      joinedChannelIds: [],
      referrals: 0,
      withdrawals: [],
      refClaimedFrom: []
    });
  }

  const fresh = await getDoc(userRef);
  const data = fresh.data();
  state = { ...state, ...data };
}

async function loadConfig() {
  const snap = await getDoc(configRef);

  if (!snap.exists()) {
    // بيانات افتراضية إذا ما موجودة بعد
    state.dailyTasks = [
      { id: "task_1", title: "زيارة قناة أبو جنة", rewardPoints: 100, type: "open_link", url: "https://t.me/yourchannel1" },
      { id: "task_2", title: "زيارة قناة فوريو", rewardPoints: 100, type: "open_link", url: "https://t.me/yourchannel2" },
      { id: "task_3", title: "مشاركة البوت", rewardPoints: 150, type: "share" }
    ];

    state.channelsBatch1 = [
      { id: "ch1", title: "قناة 1", url: "https://t.me/yourchannel1", rewardPoints: 120 },
      { id: "ch2", title: "قناة 2", url: "https://t.me/yourchannel2", rewardPoints: 120 },
      { id: "ch3", title: "قناة 3", url: "https://t.me/yourchannel3", rewardPoints: 120 },
      { id: "ch4", title: "قناة 4", url: "https://t.me/yourchannel4", rewardPoints: 120 }
    ];

    state.channelsBatch2 = [
      { id: "ch5", title: "قناة 5", url: "https://t.me/yourchannel5", rewardPoints: 180 },
      { id: "ch6", title: "قناة 6", url: "https://t.me/yourchannel6", rewardPoints: 180 },
      { id: "ch7", title: "قناة 7", url: "https://t.me/yourchannel7", rewardPoints: 180 },
      { id: "ch8", title: "قناة 8", url: "https://t.me/yourchannel8", rewardPoints: 180 }
    ];

    return;
  }

  const cfg = snap.data();
  state.dailyTasks = Array.isArray(cfg.dailyTasks) ? cfg.dailyTasks : [];
  state.channelsBatch1 = Array.isArray(cfg.channelsBatch1) ? cfg.channelsBatch1 : [];
  state.channelsBatch2 = Array.isArray(cfg.channelsBatch2) ? cfg.channelsBatch2 : [];
}

async function saveUser() {
  regenerateEnergy();

  await setDoc(userRef, {
    uid: state.uid,
    name: state.name,
    username: state.username,
    points: state.points,
    balanceIQD: state.balanceIQD,
    energy: state.energy,
    lastEnergyUpdate: state.lastEnergyUpdate,
    lastDailyRewardAt: state.lastDailyRewardAt,
    lastHitAt: state.lastHitAt,
    installAt: state.installAt,
    completedTaskIds: state.completedTaskIds,
    joinedChannelIds: state.joinedChannelIds,
    referrals: state.referrals,
    withdrawals: state.withdrawals || [],
    refClaimedFrom: state.refClaimedFrom || []
  }, { merge: true });
}

/* =========================
   8) الإحالة
========================= */
async function applyReferralFromStartParam() {
  try {
    const startParam = tg?.initDataUnsafe?.start_param || "";
    if (!startParam.startsWith("ref_")) return;

    const inviterUid = startParam.replace("ref_", "");
    if (!inviterUid || inviterUid === state.uid) return;
    if (state.refClaimedFrom.includes(inviterUid)) return;

    const inviterRef = doc(db, "users", inviterUid);
    const inviterSnap = await getDoc(inviterRef);
    if (inviterSnap.exists()) {
      await updateDoc(inviterRef, {
        points: increment(500),
        referrals: increment(1)
      });

      state.refClaimedFrom.push(inviterUid);
      await saveUser();
    }
  } catch (e) {
    console.error("Referral apply error", e);
  }
}

/* =========================
   9) الأزرار الرئيسية
========================= */
dailyRewardBtn.onclick = async () => {
  if (sameDay(state.lastDailyRewardAt, now())) {
    showToast("استلمت الهدية اليومية اليوم");
    return;
  }

  state.points += DAILY_REWARD_POINTS;
  state.lastDailyRewardAt = now();

  await saveUser();
  renderAll();
  showToast(`تمت إضافة ${DAILY_REWARD_POINTS} نقطة`);
};

hitBtn.onclick = async () => {
  if (sameDay(state.lastHitAt, now())) {
    showToast("ضربة أبو جنة متاحة مرة يومياً فقط");
    return;
  }

  state.lastHitAt = now();

  const win = Math.random() < 0.6;
  if (win) {
    state.points += DAILY_HIT_REWARD;
    showToast(`🔥 ضربة ناجحة: +${DAILY_HIT_REWARD} نقطة`);
  } else {
    const loss = Math.floor(state.points * DAILY_HIT_LOSS_PERCENT);
    state.points = Math.max(0, state.points - loss);
    showToast(`😅 ضربة عكسية: -${loss} نقطة`);
  }

  await saveUser();
  renderAll();
};

boxBtn.onclick = async () => {
  regenerateEnergy();

  if (state.energy < BOX_ENERGY_COST) {
    showToast(`تحتاج ${BOX_ENERGY_COST} طاقة لفتح الصندوق`);
    renderAll();
    return;
  }

  state.energy -= BOX_ENERGY_COST;
  state.lastEnergyUpdate = now();

  const roll = Math.random();
  let reward = 0;

  if (roll < 0.50) reward = 100;
  else if (roll < 0.75) reward = 250;
  else if (roll < 0.92) reward = 500;
  else reward = 1000;

  state.points += reward;

  await saveUser();
  renderAll();
  showToast(`🎁 ربحت ${reward} نقطة`);
};

referralBtn.onclick = async () => {
  const link = buildReferralLink();
  const text = `🔥 رابط دعوة أبو جنة × فوريو\n\n${link}\n\nلازم تشارك البوت بأكثر من مكان حتى تحصل على مكافأة.`;

  if (tg?.openTelegramLink) {
    tg.openTelegramLink(
      `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent("لازم تشارك البوت بأكثر من مكان حتى تحصل على مكافأة 🔥")}`
    );
  } else {
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent("لازم تشارك البوت بأكثر من مكان حتى تحصل على مكافأة 🔥")}`,
      "_blank"
    );
  }

  try {
    await navigator.clipboard.writeText(text);
    showToast("تم فتح المشاركة ونسخ الرابط");
  } catch {
    showToast("تم فتح واجهة المشاركة");
  }
};

convertBtn.onclick = async () => {
  // كل 1000 نقطة = 10 د.ع
  const units = Math.floor(state.points / 1000);
  if (units <= 0) {
    showToast("تحتاج 1000 نقطة على الأقل للتحويل");
    return;
  }

  const earnedIQD = units * 10;
  state.points -= units * 1000;
  state.balanceIQD += earnedIQD;

  await saveUser();
  renderAll();
  showToast(`تم تحويل ${units * 1000} نقطة إلى ${earnedIQD} د.ع`);
};

withdrawBtn.onclick = async () => {
  if (state.balanceIQD < MIN_WITHDRAW_IQD) {
    showToast(`الحد الأدنى للسحب هو ${formatIQD(MIN_WITHDRAW_IQD)}`);
    return;
  }

  const req = {
    amountIQD: state.balanceIQD,
    createdAt: now(),
    status: "pending"
  };

  state.withdrawals = Array.isArray(state.withdrawals) ? state.withdrawals : [];
  state.withdrawals.push(req);
  state.balanceIQD = 0;

  await saveUser();
  renderAll();
  showToast("تم إرسال طلب السحب. المراجعة خلال 24 ساعة");
};

/* =========================
   10) بدء التشغيل
========================= */
async function init() {
  try {
    await ensureUser();
    await loadConfig();
    await applyReferralFromStartParam();
    renderAll();
  } catch (e) {
    console.error(e);
    showToast("تحقق من إعدادات Firebase");
  }
}

init();
