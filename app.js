import {
  db,
  ref,
  get,
  set,
  update,
  query,
  orderByChild,
  limitToLast
} from "./firebase.js";

const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  tg.setHeaderColor("#12051f");
  tg.setBackgroundColor("#12051f");
}

const DEFAULT_CONFIG = {
  appTitle: "أبو جنة × فوريو",
  appSubtitle: "لف واربح طاقة ونقاط وجوائز",
  channelUrl: "https://t.me/yourchannel",
  shareText: "تعال العب عجلة أبو جنة × فوريو واربح نقاط 🎰🔥",
  dailySpins: 5,
  referralBonus: 50,
  gifts: [
    { title: "⚡ باقة طاقة", cost: 250 },
    { title: "🍟 جبس أبو جنة", cost: 500 },
    { title: "👑 هدية VIP", cost: 1000 }
  ]
};

const wheelCanvas = document.getElementById("wheelCanvas");
const ctx = wheelCanvas.getContext("2d");

const coinsValue = document.getElementById("coinsValue");
const spinsValue = document.getElementById("spinsValue");
const rankValue = document.getElementById("rankValue");
const referralsValue = document.getElementById("referralsValue");
const resultBox = document.getElementById("resultBox");
const dailyResetText = document.getElementById("dailyResetText");
const leaderboardList = document.getElementById("leaderboardList");
const giftsList = document.getElementById("giftsList");
const userNameEl = document.getElementById("userName");
const userIdText = document.getElementById("userIdText");
const myReferralCode = document.getElementById("myReferralCode");
const appTitleEl = document.getElementById("appTitle");
const appSubtitleEl = document.getElementById("appSubtitle");
const winOverlay = document.getElementById("winOverlay");
const winText = document.getElementById("winText");

const rewards = [
  { label: "10", value: 10, color: "#ff4b7d", textColor: "#ffffff" },
  { label: "20", value: 20, color: "#ffd54a", textColor: "#111111" },
  { label: "50", value: 50, color: "#8b5cf6", textColor: "#ffffff" },
  { label: "100", value: 100, color: "#00d4ff", textColor: "#111111" },
  { label: "200", value: 200, color: "#34d399", textColor: "#111111" },
  { label: "500", value: 500, color: "#ff7a00", textColor: "#111111" },
  { label: "30", value: 30, color: "#ff4b7d", textColor: "#ffffff" },
  { label: "70", value: 70, color: "#ffd54a", textColor: "#111111" }
];

let rotation = 0;
let isSpinning = false;
let config = { ...DEFAULT_CONFIG };
let userData = null;

const initDataUser = tg?.initDataUnsafe?.user || null;
const startParam = tg?.initDataUnsafe?.start_param || "";

const userId = initDataUser?.id ? String(initDataUser.id) : "guest_" + randomId(8);
const userName = [initDataUser?.first_name, initDataUser?.last_name].filter(Boolean).join(" ") || "زائر";
const username = initDataUser?.username || "";
const referralCode = userId;

function randomId(length = 6) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function todayKey() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
}

function getRankByCoins(coins) {
  if (coins >= 5000) return "أسطورة";
  if (coins >= 2500) return "VIP ذهبي";
  if (coins >= 1000) return "محترف";
  if (coins >= 300) return "متقدم";
  return "مبتدئ";
}

function createStars() {
  const starsBox = document.getElementById("bgStars");
  for (let i = 0; i < 50; i++) {
    const star = document.createElement("div");
    star.className = "star";
    star.style.left = Math.random() * 100 + "%";
    star.style.top = Math.random() * 100 + "%";
    star.style.animationDelay = (Math.random() * 2.5).toFixed(2) + "s";
    star.style.opacity = (0.2 + Math.random() * 0.8).toFixed(2);
    starsBox.appendChild(star);
  }
}

function formatTimeUntilTomorrow() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setHours(24, 0, 0, 0);
  const diff = tomorrow - now;

  const hrs = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);

  return `${hrs}س ${mins}د ${secs}ث`;
}

function updateDailyResetUI() {
  dailyResetText.textContent = "إعادة اللفات بعد: " + formatTimeUntilTomorrow();
}

function showToast(message, good = true) {
  resultBox.textContent = message;
  resultBox.style.borderColor = good ? "rgba(52,211,153,.35)" : "rgba(255,91,91,.35)";
  resultBox.style.boxShadow = good
    ? "0 0 22px rgba(52,211,153,.12)"
    : "0 0 22px rgba(255,91,91,.12)";
}

function renderGifts() {
  giftsList.innerHTML = "";
  const gifts = Array.isArray(config.gifts) && config.gifts.length ? config.gifts : DEFAULT_CONFIG.gifts;
  gifts.forEach(g => {
    const item = document.createElement("div");
    item.className = "gift-item";
    item.innerHTML = `<span>${g.title}</span><b>${g.cost} نقطة</b>`;
    giftsList.appendChild(item);
  });
}

function drawWheel(currentRotation = rotation) {
  const size = wheelCanvas.width;
  const center = size / 2;
  const radius = center - 12;
  const arc = (Math.PI * 2) / rewards.length;

  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(center, center);
  ctx.rotate(currentRotation);

  for (let i = 0; i < rewards.length; i++) {
    const start = i * arc;
    const end = start + arc;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = rewards[i].color;
    ctx.fill();

    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(255,255,255,.25)";
    ctx.stroke();

    ctx.save();
    ctx.rotate(start + arc / 2);
    ctx.textAlign = "center";
    ctx.fillStyle = rewards[i].textColor;
    ctx.font = "bold 22px Tahoma";
    ctx.fillText(rewards[i].label, radius * 0.63, 8);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(0, 0, 38, 0, Math.PI * 2);
  ctx.fillStyle = "#1b1028";
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#ffd54a";
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 16px Tahoma";
  ctx.textAlign = "center";
  ctx.fillText("VIP", 0, 6);

  ctx.restore();
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function spinWheelAnimation(finalRewardIndex) {
  if (isSpinning) return;
  isSpinning = true;

  const segmentAngle = (Math.PI * 2) / rewards.length;
  const targetSegmentCenter = finalRewardIndex * segmentAngle + segmentAngle / 2;

  const pointerAngle = -Math.PI / 2;
  const extraTurns = 7 * Math.PI * 2;
  const targetRotation = extraTurns + (pointerAngle - targetSegmentCenter);

  const startRotation = rotation;
  const duration = 4800;
  const startTime = performance.now();

  showToast("🎰 جاري اللف...", true);

  function animate(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(progress);

    rotation = startRotation + (targetRotation - startRotation) * eased;
    drawWheel(rotation);

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      rotation = targetRotation % (Math.PI * 2);
      drawWheel(rotation);
      isSpinning = false;
      finalizeReward(finalRewardIndex);
    }
  }

  requestAnimationFrame(animate);
}

function spawnConfetti() {
  const colors = ["#ffd54a", "#ff4b7d", "#8b5cf6", "#00d4ff", "#34d399", "#ffffff"];
  for (let i = 0; i < 45; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti";
    piece.style.left = Math.random() * 100 + "vw";
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = (2.6 + Math.random() * 1.6).toFixed(2) + "s";
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 4500);
  }
}

async function loadConfig() {
  try {
    const snap = await get(ref(db, "config"));
    if (snap.exists()) {
      config = {
        ...DEFAULT_CONFIG,
        ...snap.val()
      };
    }
  } catch (e) {
    console.error("Config load error:", e);
  }

  appTitleEl.textContent = config.appTitle || DEFAULT_CONFIG.appTitle;
  appSubtitleEl.textContent = config.appSubtitle || DEFAULT_CONFIG.appSubtitle;
  renderGifts();
}

async function ensureUser() {
  const userRef = ref(db, "users/" + userId);
  const snap = await get(userRef);
  const today = todayKey();

  if (!snap.exists()) {
    userData = {
      id: userId,
      name: userName,
      username,
      coins: 0,
      spinsLeft: Number(config.dailySpins || 5),
      lastSpinDate: today,
      joinedChannel: false,
      referralCode,
      referredBy: "",
      referralsCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await set(userRef, userData);
  } else {
    userData = snap.val();
    const shouldResetDaily = userData.lastSpinDate !== today;
    if (shouldResetDaily) {
      userData.spinsLeft = Number(config.dailySpins || 5);
      userData.lastSpinDate = today;
      userData.updatedAt = Date.now();
      await update(userRef, {
        spinsLeft: userData.spinsLeft,
        lastSpinDate: userData.lastSpinDate,
        updatedAt: userData.updatedAt
      });
    }
  }

  userNameEl.textContent = userData.name || "زائر";
  userIdText.textContent = userId;
  myReferralCode.textContent = userData.referralCode || referralCode;

  await applyReferralOnce();
  updateUI();
}

async function applyReferralOnce() {
  if (!startParam) return;
  if (!userData || userData.referredBy) return;

  const code = String(startParam).trim();
  if (!code || code === userId) return;

  try {
    const ownerSnap = await get(ref(db, "users/" + code));
    if (!ownerSnap.exists()) return;

    const owner = ownerSnap.val();
    const bonus = Number(config.referralBonus || 50);

    userData.referredBy = code;
    userData.coins = Number(userData.coins || 0) + Math.floor(bonus / 2);
    userData.updatedAt = Date.now();

    await update(ref(db, "users/" + userId), {
      referredBy: code,
      coins: userData.coins,
      updatedAt: userData.updatedAt
    });

    await update(ref(db, "users/" + code), {
      coins: Number(owner.coins || 0) + bonus,
      referralsCount: Number(owner.referralsCount || 0) + 1,
      updatedAt: Date.now()
    });

    showToast(`🎁 تم تطبيق كود الإحالة، حصلت على ${Math.floor(bonus / 2)} نقطة`, true);
  } catch (e) {
    console.error("Referral error:", e);
  }
}

function updateUI() {
  const coins = Number(userData?.coins || 0);
  const spinsLeft = Number(userData?.spinsLeft || 0);
  const referralsCount = Number(userData?.referralsCount || 0);

  coinsValue.textContent = coins;
  spinsValue.textContent = spinsLeft;
  referralsValue.textContent = referralsCount;
  rankValue.textContent = getRankByCoins(coins);
}

async function refreshUserFromDB() {
  const snap = await get(ref(db, "users/" + userId));
  if (snap.exists()) {
    userData = snap.val();
    updateUI();
  }
}

async function finalizeReward(index) {
  const reward = rewards[index];

  if (!userData) return;

  const newCoins = Number(userData.coins || 0) + reward.value;
  const newSpins = Math.max(0, Number(userData.spinsLeft || 0) - 1);

  userData.coins = newCoins;
  userData.spinsLeft = newSpins;
  userData.lastSpinDate = todayKey();
  userData.updatedAt = Date.now();

  await update(ref(db, "users/" + userId), {
    coins: userData.coins,
    spinsLeft: userData.spinsLeft,
    lastSpinDate: userData.lastSpinDate,
    updatedAt: userData.updatedAt,
    name: userName,
    username
  });

  updateUI();
  showToast(`🔥 ربحت ${reward.value} نقطة!`, true);

  if (tg?.HapticFeedback) {
    tg.HapticFeedback.notificationOccurred("success");
  }

  spawnConfetti();
  openWinModal(`ربحت ${reward.value} نقطة في عجلة أبو جنة × فوريو!`);
  await renderLeaderboard();
}

function openWinModal(text) {
  winText.textContent = text;
  winOverlay.classList.remove("hidden");
}

function closeWinModal() {
  winOverlay.classList.add("hidden");
}

async function renderLeaderboard() {
  leaderboardList.innerHTML = `<div class="leaderboard-empty">جاري التحميل...</div>`;

  try {
    const q = query(ref(db, "users"), orderByChild("coins"), limitToLast(10));
    const snap = await get(q);

    if (!snap.exists()) {
      leaderboardList.innerHTML = `<div class="leaderboard-empty">لا يوجد لاعبين بعد</div>`;
      return;
    }

    const arr = [];
    snap.forEach(child => {
      arr.push(child.val());
    });

    arr.sort((a, b) => Number(b.coins || 0) - Number(a.coins || 0));

    leaderboardList.innerHTML = "";
    arr.forEach((item, idx) => {
      const row = document.createElement("div");
      row.className = "leader-item";
      row.innerHTML = `
        <div>
          <div class="leader-name">${idx + 1}. ${escapeHtml(item.name || "لاعب")}</div>
          <small>${getRankByCoins(Number(item.coins || 0))}</small>
        </div>
        <div class="leader-score">${Number(item.coins || 0)} 💰</div>
      `;
      leaderboardList.appendChild(row);
    });
  } catch (e) {
    console.error("Leaderboard error:", e);
    leaderboardList.innerHTML = `<div class="leaderboard-empty">تعذر تحميل المتصدرين</div>`;
  }
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getReferralLink() {
  const appUrl = window.location.origin + window.location.pathname;
  return `${appUrl}?tgWebAppStartParam=${encodeURIComponent(referralCode)}`;
}

async function joinChannel() {
  const channel = config.channelUrl || DEFAULT_CONFIG.channelUrl;
  if (tg?.openTelegramLink) {
    tg.openTelegramLink(channel);
  } else {
    window.open(channel, "_blank");
  }
}

async function verifyJoin() {
  if (!userData) return;
  userData.joinedChannel = true;
  userData.updatedAt = Date.now();

  await update(ref(db, "users/" + userId), {
    joinedChannel: true,
    updatedAt: userData.updatedAt
  });

  showToast("✅ تم تأكيد الاشتراك بنجاح", true);
  if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred("light");
}

async function onSpinClick() {
  if (isSpinning) return;
  if (!userData) return;

  if (!userData.joinedChannel) {
    showToast("❌ لازم تشترك بالقناة أولاً", false);
    if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred("error");
    return;
  }

  if (Number(userData.spinsLeft || 0) <= 0) {
    showToast("⛔ انتهت لفات اليوم، ارجع غدًا", false);
    if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred("error");
    return;
  }

  const selectedIndex = Math.floor(Math.random() * rewards.length);
  spinWheelAnimation(selectedIndex);
}

function onShareClick() {
  const text = config.shareText || DEFAULT_CONFIG.shareText;
  const link = getReferralLink();

  if (tg?.openTelegramLink) {
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
    tg.openTelegramLink(shareUrl);
  } else {
    navigator.clipboard.writeText(`${text}\n${link}`).then(() => {
      showToast("📤 تم نسخ رسالة المشاركة", true);
    }).catch(() => {
      showToast("📤 انسخ الرابط وشاركه يدويًا", true);
    });
  }
}

function onCopyReferralClick() {
  const link = getReferralLink();
  navigator.clipboard.writeText(link).then(() => {
    showToast("📎 تم نسخ رابط الإحالة", true);
  }).catch(() => {
    showToast("تعذر نسخ الرابط", false);
  });
}

function bindEvents() {
  document.getElementById("joinBtn").addEventListener("click", joinChannel);
  document.getElementById("verifyJoinBtn").addEventListener("click", verifyJoin);
  document.getElementById("spinBtn").addEventListener("click", onSpinClick);
  document.getElementById("shareBtn").addEventListener("click", onShareClick);
  document.getElementById("copyReferralBtn").addEventListener("click", onCopyReferralClick);
  document.getElementById("closeWinBtn").addEventListener("click", closeWinModal);

  winOverlay.addEventListener("click", (e) => {
    if (e.target === winOverlay) closeWinModal();
  });
}

async function startApp() {
  createStars();
  bindEvents();
  drawWheel();
  await loadConfig();
  await ensureUser();
  await renderLeaderboard();
  updateDailyResetUI();
  setInterval(updateDailyResetUI, 1000);
}

startApp().catch(err => {
  console.error("Start app error:", err);
  showToast("حدث خطأ أثناء تشغيل التطبيق", false);
});
