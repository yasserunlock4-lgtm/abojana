// api/webhook.js - Vercel Serverless Function
// ضع هذا الملف في مجلد /api داخل مشروعك

const admin = require("firebase-admin");

// ═══════════════════════════════════════════
//  إعداد Firebase Admin (مرة واحدة فقط)
// ═══════════════════════════════════════════
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:     process.env.FIREBASE_PROJECT_ID,
      clientEmail:   process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:    process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

const db = admin.database();

// ═══════════════════════════════════════════
//  إعدادات البوت - ضعها في Vercel Environment Variables
// ═══════════════════════════════════════════
const BOT_TOKEN  = process.env.BOT_TOKEN;       // توكن البوت من BotFather
const WEBAPP_URL = process.env.WEBAPP_URL;       // رابط WebApp مثل: https://yourapp.vercel.app

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ═══════════════════════════════════════════
//  إرسال طلب لـ Telegram API
// ═══════════════════════════════════════════
async function callTelegram(method, body) {
  const res = await fetch(`${TELEGRAM_API}/${method}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  return res.json();
}

// ═══════════════════════════════════════════
//  حفظ بيانات المستخدم في Firebase
// ═══════════════════════════════════════════
async function saveUser(user, chatId) {
  const userData = {
    chatId:     chatId,
    userId:     user.id,
    firstName:  user.first_name  || "",
    lastName:   user.last_name   || "",
    username:   user.username    || "",
    joinedAt:   Date.now(),
    lastSeen:   Date.now(),
  };

  // حفظ في users/{userId}
  await db.ref(`users/${user.id}`).set(userData);

  // حفظ chatId منفصلاً للبث السريع
  await db.ref(`chat_ids/${user.id}`).set(chatId);

  console.log(`✅ User saved: ${user.first_name} (${user.id})`);
}

// ═══════════════════════════════════════════
//  إرسال رسالة الترحيب
// ═══════════════════════════════════════════
async function sendWelcome(chatId, user) {
  const name = user.first_name || "صديقي";

  // رسالة الترحيب مع صورة (اختياري - احذف sendPhoto وابقي sendMessage فقط إن لم تكن لديك صورة)
  await callTelegram("sendPhoto", {
    chat_id:   chatId,
    photo:     "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgTBazeVEgw9pcAZP8TFQc1ZSTHhyphenhyphenZlao4Zrm5Z6Tx6JV0SPpfrDRGvunQdV27G0Ycd5gRrcz-BpkKruD973N1EF8C5LjJSFjPVyFagOPlIMI7foiiDOqb9Fn4H81KJJBe6Hykvb0AZcRoDpc9y5tmv51CZfiGvZJ9Ktq8GuCD36swUtDXBg2bwxdDCx8lX/s960/%D8%AA%D8%B5%D9%85%D9%8A%D9%85%20%D8%A8%D8%AF%D9%88%D9%86%20%D8%B9%D9%86%D9%88%D8%A7%D9%86%20%2840%29.png",
    caption:
`🎰 أهلاً وسهلاً ${name}! 🎉

مرحباً بك في بوت *أبو جنة* 🎡

🌟 *ما الذي يمكنك فعله هنا؟*
🎡 لف عجلة الحظ وربح جوائز يومياً
💰 اجمع الأرباح وقم بسحبها
🎁 أكمل المهام واحصل على مكافآت إضافية
📅 محاولات مجانية كل يوم!

👇 اضغط على الزر أدناه للبدء:`,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[
        {
          text: "🎡 افتح عجلة الحظ",
          web_app: { url: WEBAPP_URL },
        }
      ]]
    }
  });
}

// ═══════════════════════════════════════════
//  معالج الـ Webhook الرئيسي
// ═══════════════════════════════════════════
module.exports = async (req, res) => {
  // الرد فوراً بـ 200 لمنع Telegram من إعادة المحاولة
  res.status(200).json({ ok: true });

  if (req.method !== "POST" || !req.body) return;

  const update = req.body;

  try {
    // ── رسائل عادية ──
    if (update.message) {
      const msg    = update.message;
      const chatId = msg.chat.id;
      const user   = msg.from;
      const text   = msg.text || "";

      // تحديث آخر ظهور في Firebase
      await db.ref(`users/${user.id}/lastSeen`).set(Date.now());

      // أمر /start
      if (text.startsWith("/start")) {
        await saveUser(user, chatId);
        await sendWelcome(chatId, user);
        return;
      }

      // أمر /balance - عرض الرصيد (اختياري)
      if (text === "/balance") {
        await callTelegram("sendMessage", {
          chat_id:    chatId,
          text:       "💰 لعرض رصيدك، افتح عجلة الحظ:",
          reply_markup: {
            inline_keyboard: [[
              { text: "🎡 افتح العجلة", web_app: { url: WEBAPP_URL } }
            ]]
          }
        });
        return;
      }
    }

  } catch (err) {
    console.error("Webhook error:", err);
  }
};
