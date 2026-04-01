// api/broadcast.js - إرسال رسائل جماعية لجميع المستخدمين
// الوصول: POST /api/broadcast مع header: x-admin-key

const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

const db         = admin.database();
const BOT_TOKEN  = process.env.BOT_TOKEN;
const ADMIN_KEY  = process.env.ADMIN_SECRET_KEY; // مفتاح سري تضعه في Vercel Env
const WEBAPP_URL = process.env.WEBAPP_URL;

async function sendMessage(chatId, text, button = null) {
  const body = {
    chat_id:    chatId,
    text:       text,
    parse_mode: "Markdown",
  };

  if (button) {
    body.reply_markup = {
      inline_keyboard: [[
        button.isWebApp
          ? { text: button.label, web_app: { url: button.url } }
          : { text: button.label, url: button.url }
      ]]
    };
  }

  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  return res.json();
}

module.exports = async (req, res) => {
  // التحقق من المفتاح السري
  const key = req.headers["x-admin-key"];
  if (key !== ADMIN_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, buttonLabel, buttonUrl, isWebApp } = req.body;

  if (!message) {
    return res.status(400).json({ error: "message is required" });
  }

  try {
    // جلب جميع chat_ids من Firebase
    const snap = await db.ref("chat_ids").get();
    if (!snap.exists()) {
      return res.json({ sent: 0, message: "No users found" });
    }

    const chatIds = Object.values(snap.val());
    let sent = 0, failed = 0;

    const button = buttonLabel && buttonUrl
      ? { label: buttonLabel, url: buttonUrl, isWebApp: !!isWebApp }
      : null;

    // إرسال دفعات (لتفادي حد الـ rate limit)
    for (let i = 0; i < chatIds.length; i++) {
      try {
        await sendMessage(chatIds[i], message, button);
        sent++;
      } catch {
        failed++;
      }
      // تأخير 50ms بين كل رسالة
      if (i % 20 === 19) await new Promise(r => setTimeout(r, 1000));
    }

    return res.json({ success: true, sent, failed, total: chatIds.length });

  } catch (err) {
    console.error("Broadcast error:", err);
    return res.status(500).json({ error: err.message });
  }
};
