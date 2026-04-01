const BOT_TOKEN  = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL;

async function callTelegram(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

module.exports = async (req, res) => {
  res.status(200).json({ ok: true });
  if (req.method !== "POST" || !req.body) return;

  const msg = req.body.message;
  if (!msg) return;

  const chatId = msg.chat.id;
  const text   = msg.text || "";
  const user   = msg.from;
  const name   = user.first_name || "صديقي";

  if (text.startsWith("/start")) {
    await callTelegram("sendMessage", {
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
  }
};
