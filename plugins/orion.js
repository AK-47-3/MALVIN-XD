const axios = require("axios");
const { malvin } = require("../malvin");

const GEMINI_API_KEY = "AIzaSyDVdti41rOyMb_27uvJe-4KpLCxUiBkJWc";

malvin({
  on: "body",  // কোনো prefix ছাড়া মেসেজ পেতেই ট্রিগার হবে
  filename: __filename,
  category: "ai",
}, async (conn, mek, m, { from, body, reply, react }) => {
  try {
    const q = body?.trim();
    if (!q || q.length < 3) return; // খুব ছোট মেসেজ এড়িয়ে যাওয়া ভালো

    await react("⌛");

    const prompt = `
তুমি একজন ভদ্র, বন্ধুত্বপূর্ণ এবং আবেগঘন বাংলা ভাষাভাষী মানুষ। ব্যবহারকারীর বার্তার উত্তরে তুমি সুন্দর, মার্জিত এবং আবেগঘন ভাষায় প্রতিক্রিয়া জানাও। প্রতিটি উত্তরে প্রাসঙ্গিক ইমোজি ব্যবহার করো এবং একাধিক ছোট মেসেজে (chat bubble style) ভাগ করে পাঠাও যেন বাস্তব মানুষের মতো লাগে।

মেসেজঃ "${q}"
    `;

    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

    const response = await axios.post(apiUrl, {
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    const aiText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || null;

    if (!aiText) {
      await react("❌");
      return reply("দুঃখিত, AI থেকে কোনো উত্তর পাওয়া যায়নি। পরে আবার চেষ্টা করুন।");
    }

    const replyParts = aiText.split(/\n{2,}/);

    await react("✅");

    for (const part of replyParts) {
      if (part.trim()) {
        await conn.sendMessage(from, { text: part.trim() }, { quoted: mek });
      }
    }

  } catch (error) {
    console.error("Gemini AutoReply Error:", error?.response?.data || error.message);
    await react("❌");
    reply("সিস্টেমে কিছু সমস্যা হয়েছে। দয়া করে কিছুক্ষণ পর আবার চেষ্টা করুন।");
  }
});
