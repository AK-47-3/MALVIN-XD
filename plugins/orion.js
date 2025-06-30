const axios = require("axios");
const { malvin } = require("../malvin");

const GEMINI_API_KEY = "AIzaSyDVdti41rOyMb_27uvJe-4KpLCxUiBkJWc"; // তোমার Gemini API key

// auto reply without prefix, reply like polite human with emojis & multi-bubble
malvin({
  on: "body",       // কোন prefix ছাড়াই সব মেসেজে রেসপন্স দিবে
  category: "ai",
  desc: "Auto reply like a polite human with emojis",
}, async (conn, mek, m, { from, body, reply }) => {
  try {
    if (!body || body.trim().length === 0) return; // empty message ignore করো

    // AI কে prompt - politely, emoji সহ বাংলা, multi-message format
    const prompt = `
You are a polite and friendly Bengali speaker who replies like a real person. Use simple, respectful language with natural emojis to express feelings. Your replies may come as one or more short messages (like separate chat bubbles). Avoid very casual slang but keep it warm and human. Always answer in Bengali.

User message: "${body}"

Split your response naturally into short parts if needed. Use emojis appropriately to show emotions.
    `;

    // Gemini API URL
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta2/models/chat-bison-001:generateMessage?key=${GEMINI_API_KEY}`;

    // Gemini API request body
    const requestBody = {
      prompt: {
        messages: [
          {
            author: "user",
            content: {
              text: prompt
            }
          }
        ]
      },
      temperature: 0.7,
      candidateCount: 1,
      maxOutputTokens: 300,
    };

    // Call Gemini API
    const response = await axios.post(apiUrl, requestBody);

    // Extract AI reply text
    let aiText = "";
    if (response.data && response.data.candidates && response.data.candidates.length > 0) {
      aiText = response.data.candidates[0].content.text;
    } else {
      await reply("দুঃখিত, আমি এখনো সঠিক উত্তর দিতে পারছি না। আবার চেষ্টা করুন।");
      return;
    }

    // Split reply into parts by double newline for multi-bubble effect
    const replyParts = aiText.split(/\n{2,}/);

    // Send each part as separate message (bubble)
    for (const part of replyParts) {
      if (part.trim().length > 0) {
        await conn.sendMessage(from, { text: part.trim() }, { quoted: mek });
      }
    }

  } catch (error) {
    console.error("Error in auto-reply Gemini AI:", error);
    await reply("⚠️ সমস্যার জন্য দুঃখিত, AI থেকে সঠিক উত্তর পাওয়া যায়নি।");
  }
});