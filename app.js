const firebaseConfig = {
  apiKey: "AIzaSyDiCrZhKVpkYE3HUeeDkAo7xA9I88uZ1i0",
  authDomain: "abojana-3f0c2.firebaseapp.com",
  databaseURL: "https://abojana-3f0c2-default-rtdb.firebaseio.com",
  projectId: "abojana-3f0c2",
  storageBucket: "abojana-3f0c2.firebasestorage.app",
  messagingSenderId: "819681544560",
  appId: "1:819681544560:web:be2249a51d0c79ee21a7b5",
  measurementId: "G-23EYSF1BE0"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const tg = window.Telegram?.WebApp;
if (tg) {
  tg.expand();
  tg.ready();
}

const els = {
  subscribeSection: document.getElementById("subscribeSection"),
  mainContent: document.getElementById("mainContent"),
  channelLink: document.getElementById("channelLink"),
  subscribeDoneBtn: document.getElementById("subscribeDoneBtn"),
  pointsValue: document.getElementById("pointsValue"),
  spinsLeftValue: document.getElementById("spinsLeftValue"),
  playerName: document.getElementById("playerName"),
  spinBtn: document.getElementById("spinBtn"),
  shareBtn: document.getElementById("shareBtn"),
  tasksList: document.getElementById("tasksList"),
  giftsList: document.getElementById("giftsList"),
  leaderboardList: document.getElementById("leaderboardList"),
  toast: document.getElementById("toast"),
  resultModal: document.getElementById("resultModal"),
  modalTitle: document.getElementById("modalTitle"),
  modalText: document.getElementById("modalText"),
  closeModalBtn: document.getElementById("closeModalBtn"),
  wheel: document.getElementById("wheel")
};

const wheelRewards = [
  { label: "20", value: 20 },
  { label: "40", value: 40 },
  { label: "60", value: 60 },
  { label: "80", value: 80 },
  { label: "100", value: 100 },
  { label: "150", value: 150 },
  { label: "200", value: 200 },
  { label: "300", value: 300 }
];

let appConfig = {
  appTitle: "أبو جنة × فوريو",
  channelUrl: "https://t.me/yourchannel",
  shareText: "تعال العب عجلة أبو جنة × فوريو واربح نقاط 🎰🔥",
  dailySpins: 5
};

let tasks = {};
let gifts = {};
let currentRotation = 0;
let isSpinning = false;
let user = null;
let uid = null;

function getBaghdadDayKey() {
  const now = new Date();
  const baghdad = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Baghdad",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(now);
  return baghdad;
}

function generateUID() {
  return "u_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function getTelegramUser() {
  const tgUser = tg?.initDataUnsafe?.user;
  if (tgUser) {
    return {
      id: "tg_" + tgUser.id,
      name: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ") || tgUser.username || "لاعب",
      username: tgUser.username || ""
    };
  }

  const savedName = localStorage.getItem("abojana_name") || "زائر";
  return {
    id: localStorage.getItem("abojana_uid") || generateUID(),
    name: savedName,
    username: ""
  };
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.remove("hidden");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    els.toast.classList.add("hidden");
  }, 2600);
}

function showModal(title, text) {
  els.modalTitle.textContent = title;
  els.modalText.textContent = text;
  els.resultModal.classList.remove("hidden");
}

function closeModal() {
  els.resultModal.classList.add("hidden");
}

function vibrate(ms = 40) {
  if (navigator.vibrate) navigator.vibrate(ms);
  if (tg?.HapticFeedback) {
    try {
      tg.HapticFeedback.impactOccurred("medium");
    } catch (_) {}
  }
}

function updateHeader() {
  els.pointsValue.textContent = user.points || 0;
  els.spinsLeftValue.textContent = user.spinsLeft || 0;
  els.playerName.textContent = user.name || "لاعب";
}

function ensureDailyReset(data) {
  const todayKey = getBaghdadDayKey();
  if (data.lastSpinDate !== todayKey) {
    data.lastSpinDate = todayKey;
    data.spinsLeft = Number(appConfig.dailySpins || 5);
  }
  return data;
}

function saveUser() {
  return db.ref("users/" + uid).set(user);
}

async function initUser() {
  const tgUser = getTelegramUser();
  uid = tgUser.id;
  localStorage.setItem("abojana_uid", uid);
  localStorage.setItem("abojana_name", tgUser.name);

  const snap = await db.ref("users/" + uid).once("value");
  const old = snap.val() || {};

  user = ensureDailyReset({
    id: uid,
    name: old.name || tgUser.name || "لاعب",
    username: old.username || tgUser.username || "",
    points: Number(old.points || 0),
    spinsLeft: Number(old.spinsLeft ?? appConfig.dailySpins ?? 5),
    lastSpinDate: old.lastSpinDate || getBaghdadDayKey(),
    subscribed: Boolean(old.subscribed || false),
    completedTasks: old.completedTasks || {},
    claimedTasks: old.claimedTasks || {},
    redeemedGifts: old.redeemedGifts || {},
    joinedAt: old.joinedAt || Date.now(),
    updatedAt: Date.now()
  });

  await saveUser();
  updateHeader();
  renderAccess();
}

function renderAccess() {
  if (user.subscribed) {
    els.subscribeSection.classList.add("hidden");
    els.mainContent.classList.remove("hidden");
  } else {
    els.subscribeSection.classList.remove("hidden");
    els.mainContent.classList.add("hidden");
  }
}

function listenConfig() {
  db.ref("config").on("value", snap => {
    const data = snap.val() || {};
    appConfig = {
      appTitle: data.appTitle || "أبو جنة × فوريو",
      channelUrl: data.channelUrl || "https://t.me/yourchannel",
      shareText: data.shareText || "تعال العب عجلة أبو جنة × فوريو واربح نقاط 🎰🔥",
      dailySpins: Number(data.dailySpins || 5)
    };

    document.title = appConfig.appTitle;
    els.channelLink.href = appConfig.channelUrl;

    if (user) {
      user = ensureDailyReset(user);
      updateHeader();
      saveUser();
    }
  });
}

function listenTasks() {
  db.ref("tasks").on("value", snap => {
    tasks = snap.val() || {};
    renderTasks();
  });
}

function listenGifts() {
  db.ref("gifts").on("value", snap => {
    gifts = snap.val() || {};
    renderGifts();
  });
}

function listenLeaderboard() {
  db.ref("users").orderByChild("points").limitToLast(10).on("value", snap => {
    const val = snap.val() || {};
    const arr = Object.values(val).sort((a, b) => (b.points || 0) - (a.points || 0));
    renderLeaderboard(arr);
  });
}

function renderTasks() {
  const entries = Object.entries(tasks);
  if (!entries.length) {
    els.tasksList.innerHTML = `<div class="task-card">لا توجد مهمات حالياً</div>`;
    return;
  }

  els.tasksList.innerHTML = entries.map(([taskId, task]) => {
    const completed = !!user.completedTasks?.[taskId];
    const claimed = !!user.claimedTasks?.[taskId];

    return `
      <div class="task-card">
        <div class="task-top">
          <div>
            <div class="task-title">${escapeHtml(task.title || "مهمة")}</div>
            <div class="task-desc">${escapeHtml(task.description || "نفذ المهمة لتحصل على مكافأة")}</div>
          </div>
          <div class="task-reward">+${Number(task.reward || 0)} نقطة</div>
        </div>

        <div class="task-actions">
          <a class="task-btn" href="${task.link || "#"}" target="_blank">فتح المهمة</a>
          <button class="claim-btn" data-task-id="${taskId}" ${claimed ? "disabled" : ""}>
            ${claimed ? "تم الاستلام" : completed ? "استلام المكافأة" : "تم التنفيذ"}
          </button>
        </div>
      </div>
    `;
  }).join("");

  document.querySelectorAll(".claim-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const taskId = btn.dataset.taskId;
      const task = tasks[taskId];
      if (!task) return;

      const completed = !!user.completedTasks?.[taskId];
      const claimed = !!user.claimedTasks?.[taskId];

      if (claimed) return;

      if (!completed) {
        user.completedTasks[taskId] = true;
        user.updatedAt = Date.now();
        await saveUser();
        renderTasks();
        showToast("تم تسجيل المهمة. اضغط مرة ثانية لاستلام المكافأة");
        return;
      }

      user.claimedTasks[taskId] = true;
      user.points = Number(user.points || 0) + Number(task.reward || 0);
      user.updatedAt = Date.now();
      await saveUser();
      updateHeader();
      renderTasks();
      showModal("مكافأة المهمة", `أخذت ${Number(task.reward || 0)} نقطة بنجاح ✅`);
      vibrate(70);
    });
  });
}

function renderGifts() {
  const entries = Object.entries(gifts);
  if (!entries.length) {
    els.giftsList.innerHTML = `<div class="gift-card">لا توجد هدايا حالياً</div>`;
    return;
  }

  els.giftsList.innerHTML = entries.map(([giftId, gift]) => {
    const cost = Number(gift.cost || 0);
    const redeemed = !!user.redeemedGifts?.[giftId];
    const canRedeem = (user.points || 0) >= cost && !redeemed;

    return `
      <div class="gift-card">
        <div class="gift-top">
          <div>
            <div class="gift-title">${escapeHtml(gift.title || "هدية")}</div>
            <div class="gift-desc">${escapeHtml(gift.description || "يمكنك استبدال هذه الهدية عند توفر النقاط الكافية")}</div>
          </div>
          <div class="gift-cost">${cost} نقطة</div>
        </div>

        <div class="gift-actions">
          <button class="redeem-btn" data-gift-id="${giftId}" ${canRedeem ? "" : "disabled"}>
            ${redeemed ? "تم الطلب" : canRedeem ? "استبدال الآن" : "نقاطك غير كافية"}
          </button>
        </div>
      </div>
    `;
  }).join("");

  document.querySelectorAll(".redeem-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const giftId = btn.dataset.giftId;
      const gift = gifts[giftId];
      if (!gift) return;

      const cost = Number(gift.cost || 0);
      if ((user.points || 0) < cost) {
        showToast("نقاطك غير كافية");
        return;
      }

      if (user.redeemedGifts?.[giftId]) {
        showToast("هذه الهدية تم طلبها سابقاً");
        return;
      }

      user.points -= cost;
      user.redeemedGifts[giftId] = {
        title: gift.title || "هدية",
        cost,
        at: Date.now()
      };
      user.updatedAt = Date.now();

      await db.ref(`orders/${uid}/${giftId}`).set({
        userId: uid,
        userName: user.name || "لاعب",
        giftTitle: gift.title || "هدية",
        cost,
        status: "pending",
        createdAt: Date.now()
      });

      await saveUser();
      updateHeader();
      renderGifts();
      showModal("تم طلب الهدية", `تم خصم ${cost} نقطة ورفع الطلب بنجاح 🎁`);
      vibrate(90);
    });
  });
}

function renderLeaderboard(users) {
  if (!users.length) {
    els.leaderboardList.innerHTML = `<div class="leader-item">لا يوجد لاعبين بعد</div>`;
    return;
  }

  els.leaderboardList.innerHTML = users.map((item, index) => `
    <div class="leader-item">
      <div class="leader-left">
        <div class="rank-badge">${index + 1}</div>
        <div>
          <div class="leader-name">${escapeHtml(item.name || "لاعب")}</div>
          <div class="task-desc">${item.username ? "@" + escapeHtml(item.username) : "عضو"}</div>
        </div>
      </div>
      <div class="leader-points">${Number(item.points || 0)} نقطة</div>
    </div>
  `).join("");
}

async function subscribeDone() {
  user.subscribed = true;
  user.updatedAt = Date.now();
  await saveUser();
  renderAccess();
  showToast("تم فتح اللعبة بنجاح 🔓");
}

function spinWheel() {
  if (isSpinning) return;
  if ((user.spinsLeft || 0) <= 0) {
    showModal("انتهت اللفات", "لقد استهلكت جميع لفات اليوم. ارجع غداً أو نفذ المهمات لجمع النقاط.");
    return;
  }

  isSpinning = true;
  els.spinBtn.disabled = true;

  const index = Math.floor(Math.random() * wheelRewards.length);
  const reward = wheelRewards[index];
  const segmentAngle = 360 / wheelRewards.length;

  const centerAngle = index * segmentAngle + (segmentAngle / 2);
  const targetAngle = 360 - centerAngle;
  const extraSpins = 360 * (5 + Math.floor(Math.random() * 3));

  currentRotation += extraSpins + targetAngle;
  els.wheel.style.transform = `rotate(${currentRotation}deg)`;

  vibrate(50);

  setTimeout(async () => {
    user.points = Number(user.points || 0) + Number(reward.value || 0);
    user.spinsLeft = Math.max(0, Number(user.spinsLeft || 0) - 1);
    user.updatedAt = Date.now();

    await saveUser();
    updateHeader();

    isSpinning = false;
    els.spinBtn.disabled = false;

    showModal("مبروك 🔥", `ربحت ${reward.value} نقطة من عجلة الحظ`);
    vibrate(120);
  }, 5600);
}

function shareGame() {
  const text = appConfig.shareText || "تعال العب عجلة أبو جنة × فوريو واربح نقاط 🎰🔥";

  if (tg?.openTelegramLink) {
    tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(location.href)}&text=${encodeURIComponent(text)}`);
    return;
  }

  if (navigator.share) {
    navigator.share({
      title: appConfig.appTitle || "أبو جنة × فوريو",
      text,
      url: location.href
    }).catch(() => {});
    return;
  }

  navigator.clipboard.writeText(location.href).then(() => {
    showToast("تم نسخ الرابط");
  }).catch(() => {
    showToast("انسخ الرابط يدويًا");
  });
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function bindEvents() {
  els.subscribeDoneBtn.addEventListener("click", subscribeDone);
  els.spinBtn.addEventListener("click", spinWheel);
  els.shareBtn.addEventListener("click", shareGame);
  els.closeModalBtn.addEventListener("click", closeModal);
  els.resultModal.addEventListener("click", (e) => {
    if (e.target === els.resultModal) closeModal();
  });
}

async function bootstrap() {
  bindEvents();
  listenConfig();
  listenTasks();
  listenGifts();
  listenLeaderboard();
  await initUser();
}

bootstrap();
