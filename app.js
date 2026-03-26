const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
}

const balanceEl = document.getElementById("balance");
const resultEl = document.getElementById("result");
const tasksEl = document.getElementById("tasks");
const spinBtn = document.getElementById("spinBtn");
const withdrawBtn = document.getElementById("withdrawBtn");

let appConfig = null;
let userId = null;
let username = "";
let fullName = "";
let userData = null;

const rewards = [10, 10, 10, 20, 20, 30, 50, 100];

function getTodayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getTelegramUser() {
  const u = tg?.initDataUnsafe?.user;
  if (u?.id) {
    return {
      id: String(u.id),
      username: u.username || "",
      fullName: [u.first_name, u.last_name].filter(Boolean).join(" ")
    };
  }

  // وضع تجريبي لو فتحته من المتصفح خارج تيليجرام
  return {
    id: "demo_" + Math.floor(Math.random() * 999999),
    username: "demo_user",
    fullName: "زائر تجريبي"
  };
}

async function loadConfig() {
  const snap = await window.get(window.ref(window.db, "config"));
  if (!snap.exists()) {
    throw new Error("لم يتم العثور على config في Firebase");
  }
  appConfig = snap.val();

  document.title = appConfig.appTitle || "أبو جنة × فوريو";

  const imgs = document.querySelectorAll(".images img");
  if (imgs[0] && appConfig.images?.abojana) imgs[0].src = appConfig.images.abojana;
  if (imgs[1] && appConfig.images?.foryou) imgs[1].src = appConfig.images.foryou;
}

async function loadUser() {
  const tgUser = getTelegramUser();
  userId = tgUser.id;
  username = tgUser.username;
  fullName = tgUser.fullName;

  const userRef = window.ref(window.db, `users/${userId}`);
  const snap = await window.get(userRef);

  const today = getTodayKey();
  const defaultSpins = Number(appConfig.dailySpins || 5);

  if (snap.exists()) {
    userData = snap.val();

    if (userData.lastSpinDate !== today) {
      userData.spinsLeft = defaultSpins;
      userData.lastSpinDate = today;
    }
  } else {
    userData = {
      userId,
      username,
      fullName,
      balance: 0,
      spinsLeft: defaultSpins,
      lastSpinDate: today,
      joinedStartTasks: false,
      joinedUnlockTasks: false,
      createdAt: Date.now()
    };
  }

  await saveUser();
  renderAll();
}

async function saveUser() {
  await window.set(window.ref(window.db, `users/${userId}`), userData);
}

function renderAll() {
  balanceEl.textContent = Number(userData.balance || 0);

  const canWithdraw = Number(userData.balance || 0) >= Number(appConfig.minWithdraw || 100000);
  withdrawBtn.style.display = canWithdraw ? "inline-block" : "none";

  renderTasks();

  if ((userData.spinsLeft || 0) <= 0) {
    spinBtn.textContent = "خلصت لفات اليوم";
    spinBtn.disabled = true;
    spinBtn.style.opacity = "0.6";
  } else {
    spinBtn.textContent = `🎰 لف العجلة (${userData.spinsLeft} متبقي)`;
    spinBtn.disabled = false;
    spinBtn.style.opacity = "1";
  }
}

function channelListHtml(title, channels, buttonText, actionName) {
  const links = channels.map((ch, i) => {
    return `
      <a href="${ch.url}" target="_blank" class="task-link">
        ${i + 1}. ${ch.title}
      </a>
    `;
  }).join("");

  return `
    <div class="task-box">
      <h3>${title}</h3>
      ${links}
      <button id="${actionName}" class="task-btn">${buttonText}</button>
    </div>
  `;
}

function renderTasks() {
  tasksEl.innerHTML = "";

  if (!userData.joinedStartTasks) {
    tasksEl.innerHTML = channelListHtml(
      "اشترك أولاً بالقناتين حتى يبدأ اللعب",
      appConfig.startChannels || [],
      "✅ أكملت الاشتراك",
      "confirmStartTasks"
    );

    document.getElementById("confirmStartTasks")?.addEventListener("click", async () => {
      userData.joinedStartTasks = true;
      await saveUser();
      renderAll();
    });

    spinBtn.disabled = true;
    spinBtn.style.opacity = "0.6";
    return;
  }

  const unlockAt = Number(appConfig.unlockChannelsAt || 500);
  if (Number(userData.balance || 0) >= unlockAt && !userData.joinedUnlockTasks) {
    tasksEl.innerHTML = channelListHtml(
      "وصلت 500 دينار. اشترك بالقنوات الإضافية حتى تكمل اللعب",
      appConfig.unlockChannels || [],
      "✅ أكملت الاشتراك بالقنوات",
      "confirmUnlockTasks"
    );

    document.getElementById("confirmUnlockTasks")?.addEventListener("click", async () => {
      userData.joinedUnlockTasks = true;
      await saveUser();
      renderAll();
    });

    spinBtn.disabled = true;
    spinBtn.style.opacity = "0.6";
    return;
  }

  spinBtn.disabled = (userData.spinsLeft || 0) <= 0;
  spinBtn.style.opacity = spinBtn.disabled ? "0.6" : "1";
}

function getRandomReward() {
  const index = Math.floor(Math.random() * rewards.length);
  return rewards[index];
}

async function spinWheel() {
  if (!userData.joinedStartTasks) return;
  if (Number(userData.balance || 0) >= Number(appConfig.unlockChannelsAt || 500) && !userData.joinedUnlockTasks) return;
  if ((userData.spinsLeft || 0) <= 0) return;

  spinBtn.disabled = true;
  resultEl.textContent = "جاري اللف...";

  setTimeout(async () => {
    const reward = getRandomReward();

    userData.balance = Number(userData.balance || 0) + reward;
    userData.spinsLeft = Number(userData.spinsLeft || 0) - 1;
    userData.lastWin = reward;
    userData.updatedAt = Date.now();

    resultEl.textContent = `🎉 ربحت ${reward} دينار`;

    await saveUser();
    renderAll();
  }, 1200);
}

async function requestWithdraw() {
  const minWithdraw = Number(appConfig.minWithdraw || 100000);
  if (Number(userData.balance || 0) < minWithdraw) return;

  const requestId = `${userId}_${Date.now()}`;
  const payload = {
    requestId,
    userId,
    username,
    fullName,
    balance: Number(userData.balance || 0),
    status: "pending",
    createdAt: Date.now()
  };

  await window.set(window.ref(window.db, `withdrawRequests/${requestId}`), payload);

  const owner = appConfig.ownerUsername || "YOUR_TELEGRAM_USERNAME";
  const text =
    `مرحباً، لدي طلب سحب.%0A` +
    `الاسم: ${encodeURIComponent(fullName || "-")}%0A` +
    `اليوزر: @${encodeURIComponent(username || "بدون_يوزر")}%0A` +
    `ID: ${encodeURIComponent(userId)}%0A` +
    `الرصيد: ${encodeURIComponent(String(userData.balance))} دينار`;

  const url = `https://t.me/${owner}?text=${text}`;
  window.open(url, "_blank");
}

spinBtn.addEventListener("click", spinWheel);
withdrawBtn.addEventListener("click", requestWithdraw);

(async function init() {
  try {
    await loadConfig();
    await loadUser();
  } catch (err) {
    console.error(err);
    resultEl.textContent = "حدث خطأ في تحميل البيانات من Firebase";
  }
})();
