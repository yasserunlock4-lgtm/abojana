const BOT_TOKEN  = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL;
const DB_URL     = process.env.FIREBASE_DATABASE_URL;
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
const PRIVATE_KEY  = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

// ── Firebase Token ──
async function getFirebaseToken() {
  try {
    const header  = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const now     = Math.floor(Date.now() / 1000);
    const payload = btoa(JSON.stringify({
      iss: CLIENT_EMAIL,
      sub: CLIENT_EMAIL,
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
      scope: "https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email"
    }));

    const key = await crypto.subtle.importKey(
      "pkcs8",
      pemToBuffer(PRIVATE_KEY),
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const sig = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      key,
      new TextEncoder().encode(`${header}.${payload}`)
    );

    const jwt = `${header}.${payload}.${bufferToBase64(sig)}`;

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    });

    const data = await res.json();
    return data.access_token;

  } catch (e) {
    console.error("Token error:", e);
    return null;
  }
}

function pemToBuffer(pem) {
  const b64 = pem.replace(/-----[^-]+-----/g, "").replace(/\s/g, "");
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

function bufferToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

// ── حفظ المستخدم في Firebase ──
async function saveUser(user, chatId) {
  try {
    const token = await getFirebaseToken();
    if (!token) return;

    await fetch(`${DB_URL}/users/${user.id}.json?auth=${token}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatId:    chatId,
        userId:    user.id,
        firstName: user.first_name || "",
        username:  user.username   || "",
        joinedAt:  Date.now(),
        lastSeen:  Date.now(),
      })
    });

    await fetch(`${DB_URL}/chat_ids/${user.id}.json?auth=${token}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(chatId)
    });

  } catch (e) {
    console.error("Firebase error:", e);
  }
}

// ── إرسال لتيليغرام ──
async function callTelegram(method, body) {
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    console.error("Telegram error:", e);
  }
}

// ── Webhook ──
export default async function handler(req, res) {
  try {
    // 🔥 رد سريع جداً (مهم)
    res.status(200).end();

    if (req.method !== "POST") return;

    const update = typeof req.body === "string"
      ? JSON.parse(req.body)
      : req.body;

    if (!update?.message) return;

    const msg    = update.message;
    const chatId = msg.chat.id;
    const text   = msg.text || "";
    const user   = msg.from;
    const name   = user?.first_name || "صديقي";

    if (text.startsWith("/start")) {

      // ⚡ إرسال فوري بدون انتظار
      callTelegram("sendMessage", {
        chat_id: chatId,
        text:
`🎰 أهلاً وسهلاً ${name}! 🎉

مرحباً بك في بوت *أبو جنة* 🎡

🎡 لف عجلة الحظ وربح جوائز يومياً
💰 اجمع الأرباح وقم بسحبها
🎁 أكمل المهام واحصل على مكافآت

👇 اضغط على الزر أدناه للبدء:`,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[
            { text: "🎡 افتح عجلة الحظ", web_app: { url: WEBAPP_URL } }
          ]]
        }
      });

      // 🔄 حفظ بالخلفية (بدون تأخير)
      saveUser(user, chatId).catch(console.error);
    }

  } catch (err) {
    console.error("Webhook error:", err);
  }
}
